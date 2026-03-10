
-- Trigger to update total_messages and last_activity_at on new message
CREATE OR REPLACE FUNCTION public.on_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.projects
  SET total_messages = COALESCE(total_messages, 0) + 1,
      last_activity_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_message();

-- Trigger to update last_activity_at on project update
CREATE TRIGGER trg_update_project_activity
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Allow edge function (service role) to insert messages via RLS bypass
-- Messages insert policy for service role is handled via service_role key

-- Allow notifications to be inserted by service role (already no INSERT policy for authenticated, which is correct)
