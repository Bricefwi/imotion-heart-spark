DROP VIEW IF EXISTS public.v_high_score_leads;

CREATE VIEW public.v_high_score_leads
WITH (security_invoker = on) AS
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