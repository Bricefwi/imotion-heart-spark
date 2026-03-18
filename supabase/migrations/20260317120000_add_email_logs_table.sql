-- Email logs table for tracking all outbound emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'logged', 'bounced')),
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only admins can read email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email logs"
  ON public.email_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can see their own email logs (read only)
CREATE POLICY "Users view own email logs"
  ON public.email_logs FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- Index for efficient queries
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_id);
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);

-- Auto-update timestamp
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Database trigger: send welcome email on new user signup
CREATE OR REPLACE FUNCTION public.on_user_created_send_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a pending email log entry; actual sending is done by the edge function
  -- This is called from the application layer, not directly from the trigger
  -- to avoid blocking the signup flow
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'account_confirmation',
      'recipientId', NEW.id,
      'recipientEmail', NEW.email,
      'metadata', jsonb_build_object('name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block user creation if email fails
  RAISE WARNING 'Failed to trigger welcome email: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on auth.users for welcome email should be created
-- only if pg_net extension is available. For now, we handle it via
-- application-level calls to the send-email edge function.
