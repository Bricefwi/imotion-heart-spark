-- =========================================================================
-- LOT 1 — Bridge Paperclip : données & sécurité
-- =========================================================================

-- 1) Aligner paperclip_jobs sur le schéma cible (table créée précédemment)
ALTER TABLE public.paperclip_jobs
  ALTER COLUMN status SET DEFAULT 'qualified',
  ALTER COLUMN job_type DROP NOT NULL;

-- Renommer input_payload -> intake_payload + relâcher contraintes
ALTER TABLE public.paperclip_jobs RENAME COLUMN input_payload TO intake_payload;
ALTER TABLE public.paperclip_jobs ALTER COLUMN intake_payload DROP NOT NULL;
ALTER TABLE public.paperclip_jobs ALTER COLUMN intake_payload DROP DEFAULT;

-- Colonnes additionnelles
ALTER TABLE public.paperclip_jobs
  ADD COLUMN IF NOT EXISTS audit_id uuid NULL,
  ADD COLUMN IF NOT EXISTS requested_service_type text NULL,
  ADD COLUMN IF NOT EXISTS lead_score integer NULL,
  ADD COLUMN IF NOT EXISTS maturity_score integer NULL,
  ADD COLUMN IF NOT EXISTS confidence_score numeric(4,3) NULL,
  ADD COLUMN IF NOT EXISTS requires_human_validation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS output_type text NULL,
  ADD COLUMN IF NOT EXISTS risk_flags jsonb NULL,
  ADD COLUMN IF NOT EXISTS cost_estimate jsonb NULL,
  ADD COLUMN IF NOT EXISTS margin_check jsonb NULL,
  ADD COLUMN IF NOT EXISTS qa_report jsonb NULL;

-- FKs (idempotent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'paperclip_jobs_user_id_fkey') THEN
    ALTER TABLE public.paperclip_jobs
      ADD CONSTRAINT paperclip_jobs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Contrainte CHECK sur status (statuts autorisés)
ALTER TABLE public.paperclip_jobs DROP CONSTRAINT IF EXISTS paperclip_jobs_status_check;
ALTER TABLE public.paperclip_jobs
  ADD CONSTRAINT paperclip_jobs_status_check CHECK (status IN (
    'draft','audit_completed','qualified','sent_to_paperclip',
    'paperclip_processing','waiting_human_validation','proposal_ready',
    'proposal_sent','accepted','rejected','failed','cancelled'
  ));

-- 2) Politiques RLS — supprimer l'accès client direct, garder admin-only + service_role
DROP POLICY IF EXISTS "Users view their own paperclip jobs" ON public.paperclip_jobs;
DROP POLICY IF EXISTS "Admins manage paperclip jobs" ON public.paperclip_jobs;

CREATE POLICY "paperclip_jobs admin all"
  ON public.paperclip_jobs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

-- (service_role bypasses RLS, pas besoin de policy explicite)

-- 3) Index paperclip_jobs
CREATE INDEX IF NOT EXISTS idx_paperclip_jobs_user_id ON public.paperclip_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_paperclip_jobs_status ON public.paperclip_jobs(status);
CREATE INDEX IF NOT EXISTS idx_paperclip_jobs_audit_id ON public.paperclip_jobs(audit_id);
CREATE INDEX IF NOT EXISTS idx_paperclip_jobs_project_id ON public.paperclip_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_paperclip_jobs_paperclip_ticket_id ON public.paperclip_jobs(paperclip_ticket_id);

-- Unique : un seul job actif par audit_id
CREATE UNIQUE INDEX IF NOT EXISTS uniq_paperclip_jobs_active_audit
  ON public.paperclip_jobs(audit_id)
  WHERE audit_id IS NOT NULL
    AND status NOT IN ('failed','cancelled','rejected');

-- =========================================================================
-- 4) paperclip_job_events
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.paperclip_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.paperclip_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status_from text NULL,
  status_to text NULL,
  source text NOT NULL DEFAULT 'system',
  payload jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.paperclip_job_events TO service_role;
-- Pas de grant authenticated : pas d'accès client direct

ALTER TABLE public.paperclip_job_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paperclip_job_events admin select"
  ON public.paperclip_job_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

CREATE POLICY "paperclip_job_events admin insert"
  ON public.paperclip_job_events FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_paperclip_job_events_job_created
  ON public.paperclip_job_events(job_id, created_at);

-- =========================================================================
-- 5) paperclip_documents
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.paperclip_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.paperclip_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  title text NULL,
  storage_path text NOT NULL,
  visibility text NOT NULL DEFAULT 'admin' CHECK (visibility IN ('admin','client')),
  is_validated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.paperclip_documents TO authenticated;
GRANT ALL ON public.paperclip_documents TO service_role;

ALTER TABLE public.paperclip_documents ENABLE ROW LEVEL SECURITY;

-- Client : ne voit QUE ses documents validés et visibles client
CREATE POLICY "paperclip_documents client view validated"
  ON public.paperclip_documents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND visibility = 'client'
    AND is_validated = true
  );

-- Admin : voit / gère tout
CREATE POLICY "paperclip_documents admin all"
  ON public.paperclip_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_paperclip_documents_job_id
  ON public.paperclip_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_paperclip_documents_user_visibility_validated
  ON public.paperclip_documents(user_id, visibility, is_validated);

-- =========================================================================
-- 6) Vue client v_client_job_status
-- =========================================================================
-- View propriétaire postgres -> bypass RLS de paperclip_jobs.
-- Sécurisée via WHERE user_id = auth.uid() + colonnes filtrées.
-- failed récent (<24h) -> "Analyse en cours" ; ancien -> conseiller reprend.
DROP VIEW IF EXISTS public.v_client_job_status;
CREATE VIEW public.v_client_job_status
WITH (security_invoker = false)
AS
SELECT
  j.id,
  j.audit_id,
  j.project_id,
  CASE j.status
    WHEN 'draft'                     THEN 'Diagnostic en cours'
    WHEN 'audit_completed'           THEN 'Diagnostic terminé'
    WHEN 'qualified'                 THEN 'Analyse de votre dossier en cours'
    WHEN 'sent_to_paperclip'         THEN 'Analyse de votre dossier en cours'
    WHEN 'paperclip_processing'      THEN 'Analyse de votre dossier en cours'
    WHEN 'waiting_human_validation'  THEN 'Validation finale en cours'
    WHEN 'proposal_ready'            THEN 'Validation finale en cours'
    WHEN 'proposal_sent'             THEN 'Votre proposition est disponible'
    WHEN 'accepted'                  THEN 'Proposition acceptée'
    WHEN 'rejected'                  THEN 'Dossier clôturé'
    WHEN 'cancelled'                 THEN 'Dossier clôturé'
    WHEN 'failed'                    THEN CASE
      WHEN j.updated_at > now() - interval '24 hours'
        THEN 'Analyse de votre dossier en cours'
      ELSE 'Un conseiller reprend votre dossier'
    END
    ELSE 'Analyse de votre dossier en cours'
  END AS client_status,
  EXISTS (
    SELECT 1 FROM public.paperclip_documents d
    WHERE d.job_id = j.id
      AND d.visibility = 'client'
      AND d.is_validated = true
  ) AS has_document,
  j.updated_at
FROM public.paperclip_jobs j
WHERE j.user_id = auth.uid();

GRANT SELECT ON public.v_client_job_status TO authenticated;

-- =========================================================================
-- 7) Trigger updated_at sur paperclip_jobs (idempotent)
-- =========================================================================
DROP TRIGGER IF EXISTS trg_paperclip_jobs_updated_at ON public.paperclip_jobs;
CREATE TRIGGER trg_paperclip_jobs_updated_at
  BEFORE UPDATE ON public.paperclip_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();