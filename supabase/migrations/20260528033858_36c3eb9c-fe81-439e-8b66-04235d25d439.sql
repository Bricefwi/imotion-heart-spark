CREATE TABLE public.paperclip_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paperclip_ticket_id TEXT NULL,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB NULL,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paperclip_jobs_user ON public.paperclip_jobs(user_id);
CREATE INDEX idx_paperclip_jobs_project ON public.paperclip_jobs(project_id);
CREATE INDEX idx_paperclip_jobs_status ON public.paperclip_jobs(status);
CREATE INDEX idx_paperclip_jobs_ticket ON public.paperclip_jobs(paperclip_ticket_id);
CREATE INDEX idx_paperclip_jobs_created ON public.paperclip_jobs(created_at DESC);

GRANT SELECT ON public.paperclip_jobs TO authenticated;
GRANT ALL ON public.paperclip_jobs TO service_role;

ALTER TABLE public.paperclip_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own paperclip jobs"
ON public.paperclip_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins manage paperclip jobs"
ON public.paperclip_jobs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_paperclip_jobs_updated_at
BEFORE UPDATE ON public.paperclip_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();