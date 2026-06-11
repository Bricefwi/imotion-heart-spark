-- ─────────────────────────────────────────────────────────────────────────────
-- SPRINT D — Parcours client complet + CRM branché sur les jobs
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Colonnes supplémentaires sur projects ─────────────────────────────────

-- latest_job_id : référence au dernier job discovery sans FK (évite la circularité)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS latest_job_id  uuid,
  ADD COLUMN IF NOT EXISTS lead_grade     text CHECK (lead_grade IN ('A','B','C','D'));

-- ── 2. Trigger : synchroniser lead_grade job → project ───────────────────────

CREATE OR REPLACE FUNCTION public.sync_job_to_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET
      latest_job_id = NEW.id,
      lead_grade    = COALESCE(NEW.lead_grade, lead_grade)
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_job_to_project ON public.jobs;
CREATE TRIGGER trg_sync_job_to_project
  AFTER INSERT OR UPDATE OF lead_grade, status ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_to_project();

-- ── 3. RLS : clients peuvent lire les job_events de leurs propres jobs ────────

CREATE POLICY "client_job_events_read" ON public.job_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = job_events.job_id
        AND client_id = auth.uid()
    )
  );

-- ── 4. Consultants peuvent lire tous les jobs (en lecture) ───────────────────

CREATE POLICY "consultant_jobs_read" ON public.jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('consultant', 'admin')
    )
  );

CREATE POLICY "consultant_job_events_read" ON public.job_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('consultant', 'admin')
    )
  );

-- ── 5. Corriger jobs_admin_view (projects.name, pas .title) ──────────────────

CREATE OR REPLACE VIEW public.jobs_admin_view AS
SELECT
  j.id,
  j.type,
  j.status,
  j.agent_phase,
  j.lead_grade,
  j.quality_score,
  j.cost_eur,
  j.tokens_in,
  j.tokens_out,
  j.created_at,
  j.started_at,
  j.completed_at,
  j.failed_at,
  j.error_message,
  j.project_id,
  p.full_name    AS client_name,
  p.email        AS client_email,
  p.company_name,
  pr.name        AS project_name
FROM public.jobs j
LEFT JOIN public.profiles  p  ON p.id  = j.client_id
LEFT JOIN public.projects  pr ON pr.id = j.project_id;

GRANT SELECT ON public.jobs_admin_view TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
