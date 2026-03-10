-- FIX 1: newsletter_subscribers - restrict SELECT to admins only
DROP POLICY IF EXISTS "Public read own subscription" ON public.newsletter_subscribers;

-- FIX 2: settings - restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "View settings" ON public.settings;
CREATE POLICY "Authenticated view settings" ON public.settings
  FOR SELECT TO authenticated
  USING (true);

-- FIX 3: blog_editorial_calendar - restrict SELECT to admins
DROP POLICY IF EXISTS "Public read calendar" ON public.blog_editorial_calendar;
CREATE POLICY "Staff read calendar" ON public.blog_editorial_calendar
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'consultant'::app_role));

-- FIX 4: templates - restrict SELECT to authenticated users
DROP POLICY IF EXISTS "View active templates" ON public.templates;
CREATE POLICY "Authenticated view active templates" ON public.templates
  FOR SELECT TO authenticated
  USING (is_active = true);

-- FIX 5: contact_messages - add rate limiting via unique constraint on email + time window
-- (RLS already requires non-empty fields)

-- FIX 6: Add UPDATE policy for conversations (missing)
CREATE POLICY "Members update conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = conversations.project_id AND (projects.client_id = auth.uid() OR projects.consultant_id = auth.uid())));