CREATE TABLE IF NOT EXISTS public.mkt_company_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  siret TEXT,
  verification_type TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verification_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mkt_cv_logs_user ON public.mkt_company_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mkt_cv_logs_siret ON public.mkt_company_verification_logs(siret);

ALTER TABLE public.mkt_company_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mkt_cv_logs_admin_read"
  ON public.mkt_company_verification_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "mkt_cv_logs_service_all"
  ON public.mkt_company_verification_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');