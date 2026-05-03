ALTER TABLE public.mkt_orchestrations
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

CREATE INDEX IF NOT EXISTS idx_mkt_orch_user ON public.mkt_orchestrations(user_id);
CREATE INDEX IF NOT EXISTS idx_mkt_orch_status ON public.mkt_orchestrations(status);

ALTER TABLE public.mkt_orchestrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mkt_orchestrations_read" ON public.mkt_orchestrations;
CREATE POLICY "mkt_orchestrations_read"
  ON public.mkt_orchestrations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
    OR EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = mkt_orchestrations.audit_id AND a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mkt_orchestrations_admin_write" ON public.mkt_orchestrations;
CREATE POLICY "mkt_orchestrations_admin_write"
  ON public.mkt_orchestrations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "mkt_orchestrations_service_all" ON public.mkt_orchestrations;
CREATE POLICY "mkt_orchestrations_service_all"
  ON public.mkt_orchestrations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');