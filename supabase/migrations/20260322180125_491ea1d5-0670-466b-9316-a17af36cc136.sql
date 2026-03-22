DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Staff can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'consultant'::app_role)
    OR auth.uid() = user_id
  );