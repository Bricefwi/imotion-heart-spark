
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_config jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.automation_rules.conditions IS
  'Filtres optionnels combinés en ET : role, project_status[], min_phase, tag, min_amount, max_amount';
COMMENT ON COLUMN public.automation_rules.schedule_config IS
  'Planification : delay_minutes, send_window {days[], hour_start, hour_end}, frequency_cap {max, per_days}';
COMMENT ON COLUMN public.automation_rules.target_config IS
  'Cible : recipient (client|consultant|admin|custom), custom_email, cc[], bcc[]';
