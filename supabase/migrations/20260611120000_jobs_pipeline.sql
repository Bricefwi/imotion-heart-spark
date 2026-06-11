-- ─────────────────────────────────────────────────────────────────────────────
-- SPRINT A — Pipeline Jobs i-MOTION
-- Tables : jobs + job_events
-- Remplace l'intégration Paperclip par un pipeline natif Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- Enum : types de jobs
CREATE TYPE job_type AS ENUM (
  'discovery_audit',
  'proposal_generation',
  'cdc_generation',
  'quote_generation',
  'document_delivery'
);

-- Enum : états du pipeline
CREATE TYPE job_status AS ENUM (
  'queued',
  'processing',
  'waiting_validation',
  'ready',
  'failed',
  'cancelled'
);

-- Enum : phases agent
CREATE TYPE agent_phase AS ENUM (
  'intake',
  'need',
  'scoping',
  'critic',
  'output',
  'done'
);

-- Enum : acteurs d'événement
CREATE TYPE job_actor AS ENUM (
  'system',
  'agent',
  'admin',
  'client'
);

-- ── Table jobs ──────────────────────────────────────────────────────────────
CREATE TABLE public.jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id       uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  conversation_id  uuid,                              -- référence optionnelle conversation
  type             job_type        NOT NULL DEFAULT 'discovery_audit',
  status           job_status      NOT NULL DEFAULT 'queued',
  agent_phase      agent_phase     NOT NULL DEFAULT 'intake',
  lead_grade       text            CHECK (lead_grade IN ('A','B','C','D')),
  quality_score    integer         CHECK (quality_score BETWEEN 0 AND 100),
  payload          jsonb           NOT NULL DEFAULT '{}',
  result           jsonb,
  error_message    text,
  -- coût LLM cumulé
  cost_eur         numeric(10,5)   NOT NULL DEFAULT 0,
  tokens_in        integer         NOT NULL DEFAULT 0,
  tokens_out       integer         NOT NULL DEFAULT 0,
  -- providers utilisés
  providers_used   text[]          NOT NULL DEFAULT '{}',
  -- timestamps
  created_at       timestamptz     NOT NULL DEFAULT now(),
  started_at       timestamptz,
  completed_at     timestamptz,
  failed_at        timestamptz,
  -- meta
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── Table job_events (timeline) ─────────────────────────────────────────────
CREATE TABLE public.job_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type   text NOT NULL, -- 'phase_start' | 'phase_end' | 'agent_call' | 'error' | 'manual_override' | 'status_change'
  actor        job_actor NOT NULL DEFAULT 'system',
  phase        agent_phase,
  provider     text,          -- 'anthropic' | 'mistral' | 'gemini'
  model        text,
  tokens_in    integer DEFAULT 0,
  tokens_out   integer DEFAULT 0,
  cost_eur     numeric(10,5) DEFAULT 0,
  payload      jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Index ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_jobs_status         ON public.jobs(status);
CREATE INDEX idx_jobs_client_id      ON public.jobs(client_id);
CREATE INDEX idx_jobs_created_at     ON public.jobs(created_at DESC);
CREATE INDEX idx_job_events_job_id   ON public.job_events(job_id);
CREATE INDEX idx_job_events_created  ON public.job_events(created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Admin : accès total
CREATE POLICY "admin_jobs_all" ON public.jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_job_events_all" ON public.job_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Client : lecture de ses propres jobs (statut + grade uniquement)
CREATE POLICY "client_jobs_read" ON public.jobs
  FOR SELECT USING (client_id = auth.uid());

-- ── Trigger : mise à jour timestamps ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.jobs_timestamp_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status = 'queued' THEN
    NEW.started_at = now();
  END IF;
  IF NEW.status IN ('ready', 'failed', 'cancelled') AND NEW.completed_at IS NULL THEN
    IF NEW.status = 'failed' THEN
      NEW.failed_at = now();
    ELSE
      NEW.completed_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_timestamps
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.jobs_timestamp_trigger();

-- ── Vue admin résumée ────────────────────────────────────────────────────────
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
  p.full_name  AS client_name,
  p.email      AS client_email,
  p.company_name,
  pr.title     AS project_title
FROM public.jobs j
LEFT JOIN public.profiles  p  ON p.id  = j.client_id
LEFT JOIN public.projects  pr ON pr.id = j.project_id;

GRANT SELECT ON public.jobs_admin_view TO authenticated;
