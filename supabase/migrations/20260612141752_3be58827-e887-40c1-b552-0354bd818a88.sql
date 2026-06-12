
CREATE TABLE public.mkt_marketix_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  audit_id UUID REFERENCES public.marketing_audits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  channels TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT,
  budget_range TEXT,
  extra_brief TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_content JSONB,
  raw_response TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mkt_marketix_campaigns TO authenticated;
GRANT ALL ON public.mkt_marketix_campaigns TO service_role;

ALTER TABLE public.mkt_marketix_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and consultants can view all campaigns"
  ON public.mkt_marketix_campaigns FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Admins and consultants can insert campaigns"
  ON public.mkt_marketix_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
      OR public.has_role(auth.uid(), 'consultant'::app_role)
    )
  );

CREATE POLICY "Admins and consultants can update campaigns"
  ON public.mkt_marketix_campaigns FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Admins can delete campaigns"
  ON public.mkt_marketix_campaigns FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER update_mkt_marketix_campaigns_updated_at
  BEFORE UPDATE ON public.mkt_marketix_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mkt_marketix_campaigns_project ON public.mkt_marketix_campaigns(project_id);
CREATE INDEX idx_mkt_marketix_campaigns_audit ON public.mkt_marketix_campaigns(audit_id);
CREATE INDEX idx_mkt_marketix_campaigns_created_at ON public.mkt_marketix_campaigns(created_at DESC);
