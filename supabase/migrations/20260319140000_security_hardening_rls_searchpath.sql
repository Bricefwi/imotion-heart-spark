-- Security hardening: fix consultant RLS scope, function search_path, extensions schema
-- Addresses Lovable security audit warnings

-- ============================================================
-- 1. RESTRICT CONSULTANT ACCESS TO ASSIGNED PROJECTS ONLY
-- ============================================================

-- Fix: "Consultants view projects" was too broad (any consultant saw all projects)
-- Now consultants only see projects they are assigned to (consultant_id = auth.uid())
DROP POLICY IF EXISTS "Consultants view projects" ON public.projects;
CREATE POLICY "Consultants view projects" ON public.projects
  FOR SELECT USING (
    auth.uid() = consultant_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix: "Staff manage documents" was too broad (any consultant could manage all documents)
-- Now consultants can only manage documents for their assigned projects
DROP POLICY IF EXISTS "Staff manage documents" ON public.documents;
CREATE POLICY "Staff manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND consultant_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix: "Consultants can view profiles" was too broad (any consultant saw all profiles)
-- Now consultants can only see profiles of clients in their assigned projects
DROP POLICY IF EXISTS "Consultants can view profiles" ON public.profiles;
CREATE POLICY "Consultants can view profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE consultant_id = auth.uid() AND client_id = profiles.id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix: "Users view activities" was too broad for consultants
DROP POLICY IF EXISTS "Users view activities" ON public.activities;
CREATE POLICY "Users view activities" ON public.activities
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE consultant_id = auth.uid() AND client_id = activities.user_id
    )
  );

-- Fix: project_tools - consultants should only manage tools for their assigned projects
DROP POLICY IF EXISTS "Admins and consultants can manage project tools" ON public.project_tools;
CREATE POLICY "Admins and consultants can manage project tools" ON public.project_tools
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_tools.project_id AND consultant_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_tools.project_id AND consultant_id = auth.uid()
    )
  );

-- ============================================================
-- 2. FIX FUNCTION SEARCH_PATH (mutable search path warning)
-- ============================================================

-- Fix on_user_created_send_email: SECURITY DEFINER without search_path
CREATE OR REPLACE FUNCTION public.on_user_created_send_email()
RETURNS TRIGGER AS $$
BEGIN
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
  RAISE WARNING 'Failed to trigger welcome email: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix email queue functions: add search_path
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Re-apply privilege restrictions after function recreation
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- ============================================================
-- 3. MOVE EXTENSIONS OUT OF PUBLIC SCHEMA
-- ============================================================

-- Move pgmq and supabase_vault to extensions schema if possible
-- Note: ALTER EXTENSION SET SCHEMA may not work for all extensions,
-- wrapped in exception handlers for safety
DO $$ BEGIN
  ALTER EXTENSION pgmq SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not move pgmq to extensions schema: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER EXTENSION supabase_vault SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not move supabase_vault to extensions schema: %', SQLERRM;
END $$;
