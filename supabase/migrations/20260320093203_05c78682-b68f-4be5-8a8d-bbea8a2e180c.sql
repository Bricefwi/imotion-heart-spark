-- Restrict settings SELECT to admin-only (was open to all authenticated users)
DROP POLICY IF EXISTS "Authenticated view settings" ON public.settings;

CREATE POLICY "Admin view settings"
  ON public.settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));