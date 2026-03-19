-- Restrict settings visibility: only admins can see all settings
-- Regular users can only see public-category settings
DROP POLICY IF EXISTS "View settings" ON public.settings;

CREATE POLICY "View public settings" ON public.settings
  FOR SELECT USING (
    category = 'public'
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );
