-- PV de Réception support + project tools tracking

-- Add pv_reception to document types
-- (documents.type is text, no enum constraint to change)

-- Table: project_tools - track recommended tools per project
CREATE TABLE IF NOT EXISTS public.project_tools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  -- categories: frontend, backend, hosting, cms, design, devops, analytics, ai, other
  is_recommended boolean DEFAULT true,
  justification text,
  priority text DEFAULT 'medium',
  -- priority: high, medium, low
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_project_tools_project_id ON public.project_tools(project_id);

-- RLS for project_tools
ALTER TABLE public.project_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and consultants can manage project tools"
  ON public.project_tools
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'consultant')
    )
  );

CREATE POLICY "Clients can view their project tools"
  ON public.project_tools
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_tools.project_id
      AND client_id = auth.uid()
    )
  );

-- Add pv_reception specific fields to documents table
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS reception_type text,
  -- reception_type: 'total', 'partial', 'with_reserves'
  ADD COLUMN IF NOT EXISTS reserves text[],
  ADD COLUMN IF NOT EXISTS conformity_checklist jsonb,
  ADD COLUMN IF NOT EXISTS client_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS consultant_signed_at timestamptz;
