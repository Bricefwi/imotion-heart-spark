-- 1. Table de cache d'état de l'agent (clé/valeur typée par scope)
CREATE TABLE IF NOT EXISTS public.agent_state (
  scope text NOT NULL,                      -- ex: 'orchestrator', 'cdc-worker'
  key text NOT NULL,                        -- ex: 'active_model'
  value jsonb NOT NULL DEFAULT '{}'::jsonb, -- { "model": "claude-opus-4-5", "checked_at": "..." }
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key)
);

CREATE INDEX IF NOT EXISTS idx_agent_state_expires_at
  ON public.agent_state (expires_at);

ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;

-- Lecture admin uniquement (debug). Écritures réservées au service_role.
CREATE POLICY "Admins read agent_state"
  ON public.agent_state FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role manages agent_state"
  ON public.agent_state FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Trigger updated_at
CREATE TRIGGER trg_agent_state_updated_at
  BEFORE UPDATE ON public.agent_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Lecture du modèle actif (NULL si expiré ou absent)
CREATE OR REPLACE FUNCTION public.get_active_model(_scope text DEFAULT 'orchestrator')
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (value->>'model')::text
  FROM public.agent_state
  WHERE scope = _scope
    AND key = 'active_model'
    AND expires_at > now()
  LIMIT 1;
$$;

-- 4. Écriture / refresh du modèle actif avec TTL (défaut 1h)
CREATE OR REPLACE FUNCTION public.set_active_model(
  _model text,
  _scope text DEFAULT 'orchestrator',
  _ttl_seconds integer DEFAULT 3600
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_state (scope, key, value, expires_at)
  VALUES (
    _scope,
    'active_model',
    jsonb_build_object('model', _model, 'checked_at', now()),
    now() + make_interval(secs => GREATEST(60, _ttl_seconds))
  )
  ON CONFLICT (scope, key) DO UPDATE SET
    value = EXCLUDED.value,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
END;
$$;

-- 5. Nettoyage périodique (à appeler via cron ou worker)
CREATE OR REPLACE FUNCTION public.cleanup_agent_state()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.agent_state WHERE expires_at < now() - interval '1 day';
$$;