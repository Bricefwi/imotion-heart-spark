CREATE TABLE IF NOT EXISTS public.mkt_rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'user',
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mkt_rl_lookup
  ON public.mkt_rate_limit_buckets(resource_type, identifier_type, identifier, window_start DESC);

ALTER TABLE public.mkt_rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mkt_rl_service_all"
  ON public.mkt_rate_limit_buckets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_resource_type TEXT,
  p_identifier TEXT,
  p_identifier_type TEXT DEFAULT 'user',
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := now() - make_interval(mins => p_window_minutes);
  v_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.mkt_rate_limit_buckets
  WHERE resource_type = p_resource_type
    AND identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND window_start >= v_window_start;

  IF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'count', v_count,
      'limit', p_max_requests,
      'window_minutes', p_window_minutes,
      'retry_after_seconds', p_window_minutes * 60
    );
  END IF;

  INSERT INTO public.mkt_rate_limit_buckets (resource_type, identifier, identifier_type)
  VALUES (p_resource_type, p_identifier, p_identifier_type);

  IF random() < 0.01 THEN
    DELETE FROM public.mkt_rate_limit_buckets
    WHERE window_start < now() - interval '24 hours';
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'count', v_count + 1,
    'limit', p_max_requests,
    'window_minutes', p_window_minutes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM anon;

CREATE OR REPLACE FUNCTION public.increment_free_audits_used(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET free_audits_used = COALESCE(free_audits_used, 0) + 1,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING free_audits_used INTO v_new_count;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_free_audits_used(UUID) FROM anon;