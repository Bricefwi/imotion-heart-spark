
CREATE TABLE public.mkt_marketix_campaign_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.mkt_marketix_campaigns(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_email text,
  note text,
  campaign_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mkt_marketix_audit_campaign ON public.mkt_marketix_campaign_audit(campaign_id, created_at DESC);
CREATE INDEX idx_mkt_marketix_audit_status ON public.mkt_marketix_campaign_audit(new_status, created_at DESC);

GRANT SELECT ON public.mkt_marketix_campaign_audit TO authenticated;
GRANT ALL ON public.mkt_marketix_campaign_audit TO service_role;

ALTER TABLE public.mkt_marketix_campaign_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and consultants can read campaign audit"
ON public.mkt_marketix_campaign_audit
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'consultant'::app_role)
);

CREATE POLICY "Service role manages campaign audit"
ON public.mkt_marketix_campaign_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger function: log every status change
CREATE OR REPLACE FUNCTION public.log_marketix_campaign_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  END IF;

  INSERT INTO public.mkt_marketix_campaign_audit (
    campaign_id, previous_status, new_status,
    changed_by, changed_by_email, campaign_snapshot
  ) VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status,
    v_uid,
    v_email,
    jsonb_build_object(
      'title', NEW.title,
      'objective', NEW.objective,
      'audience', NEW.audience,
      'channels', NEW.channels,
      'has_generated_content', NEW.generated_content IS NOT NULL
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_marketix_campaign_status ON public.mkt_marketix_campaigns;
CREATE TRIGGER trg_log_marketix_campaign_status
AFTER INSERT OR UPDATE OF status ON public.mkt_marketix_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.log_marketix_campaign_status_change();
