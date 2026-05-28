-- Supprimer la vue qui déclenche le lint security_definer_view
DROP VIEW IF EXISTS public.v_client_job_status;

-- Fonction sécurisée équivalente, réservée aux utilisateurs connectés
CREATE OR REPLACE FUNCTION public.get_my_client_job_statuses()
RETURNS TABLE (
  id uuid,
  audit_id uuid,
  project_id uuid,
  client_status text,
  has_document boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_my_client_job_statuses() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_client_job_statuses() TO authenticated;