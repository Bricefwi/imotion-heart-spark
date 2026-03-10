
-- Allow admins to update editorial calendar
CREATE POLICY "Admins update calendar" ON public.blog_editorial_calendar
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete calendar entries
CREATE POLICY "Admins delete calendar" ON public.blog_editorial_calendar
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert calendar entries
CREATE POLICY "Admins insert calendar" ON public.blog_editorial_calendar
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
