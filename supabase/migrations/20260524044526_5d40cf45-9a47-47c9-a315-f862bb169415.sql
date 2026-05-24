-- ============================================================================
-- CLARIVI V3 BOOTSTRAP — S2bis + S3bis migrations additionnelles
-- ============================================================================
-- Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at timestamptz,
  used_from_ip text,
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token
  ON public.email_verifications(token) WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_verifications_project
  ON public.email_verifications(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verifications_expired
  ON public.email_verifications(expires_at) WHERE used_at IS NULL;

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own verification tokens" ON public.email_verifications
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages verifications" ON public.email_verifications
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.email_verifications
  WHERE expires_at < now() - interval '7 days'
    AND used_at IS NULL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE VIEW public.v_high_score_leads AS
SELECT
  p.id              AS project_id,
  p.code            AS project_code,
  p.name            AS project_name,
  p.client_id,
  pr.full_name,
  pr.email,
  pr.company_name,
  pr.company_size,
  pr.phone,
  p.qualification_score,
  p.qualification_flags,
  p.estimated_budget_min,
  p.estimated_budget_max,
  p.desired_deadline,
  p.status,
  p.completed_at,
  p.last_activity_at
FROM public.projects p
JOIN public.profiles pr ON pr.id = p.client_id
WHERE p.qualification_score >= 70
  AND p.status IN ('discovery_completed', 'cdc_ready', 'review_pending')
  AND p.consultant_id IS NULL
ORDER BY p.qualification_score DESC, p.last_activity_at DESC NULLS LAST;

CREATE INDEX IF NOT EXISTS idx_projects_status_completed
  ON public.projects(status, completed_at DESC NULLS LAST)
  WHERE status IN ('discovery_completed', 'cdc_ready');

CREATE OR REPLACE FUNCTION public.stop_nurturing_on_signed()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'signed' AND OLD.status IS DISTINCT FROM 'signed' THEN
    UPDATE public.nurturing_sequences
    SET status = 'stopped_signed', updated_at = now()
    WHERE project_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stop_nurturing_signed ON public.projects;
CREATE TRIGGER trg_stop_nurturing_signed
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.stop_nurturing_on_signed();