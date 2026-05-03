CREATE TABLE IF NOT EXISTS public.mkt_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  provider_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mkt_email_notif_user ON public.mkt_email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mkt_email_notif_type ON public.mkt_email_notifications(notification_type);

ALTER TABLE public.mkt_email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mkt_email_notif_admin_read"
  ON public.mkt_email_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "mkt_email_notif_service_all"
  ON public.mkt_email_notifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');