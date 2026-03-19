
-- Fix 1: Scope consultant view on projects to only assigned projects
DROP POLICY IF EXISTS "Consultants view projects" ON public.projects;
CREATE POLICY "Consultants view assigned projects"
ON public.projects
FOR SELECT
USING (
  auth.uid() = consultant_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Scope consultant view on profiles to only profiles of their clients
DROP POLICY IF EXISTS "Consultants can view profiles" ON public.profiles;
CREATE POLICY "Consultants view client profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM projects
    WHERE projects.consultant_id = auth.uid()
    AND projects.client_id = profiles.id
  )
);

-- Fix 3: Scope staff document management to assigned projects only
DROP POLICY IF EXISTS "Staff manage documents" ON public.documents;
CREATE POLICY "Staff manage assigned documents"
ON public.documents
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'consultant'::app_role)
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id
      AND projects.consultant_id = auth.uid()
    )
  )
);
