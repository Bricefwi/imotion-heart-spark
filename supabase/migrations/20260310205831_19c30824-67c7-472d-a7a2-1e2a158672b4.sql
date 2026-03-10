-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- RLS: Members can upload to their project folder
CREATE POLICY "Project members can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id::text = (string_to_array(name, '/'))[1]
    AND (client_id = auth.uid() OR consultant_id = auth.uid())
  )
);

-- RLS: Members can read their project documents
CREATE POLICY "Project members can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id::text = (string_to_array(name, '/'))[1]
    AND (client_id = auth.uid() OR consultant_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS: Consultants and admins can delete documents
CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND
  (public.has_role(auth.uid(), 'consultant') OR public.has_role(auth.uid(), 'admin'))
);