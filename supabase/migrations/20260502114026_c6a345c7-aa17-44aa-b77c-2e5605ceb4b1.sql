-- ============================================================
-- Marketing audits bridge (lovelib → Clarivi)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketing_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'lovelib',
  external_id text,
  website_url text,
  company_name text,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'failed')),
  summary text,
  score integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  full_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_audits_user_id
  ON public.marketing_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_audits_status
  ON public.marketing_audits(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_audits_source_external
  ON public.marketing_audits(source, external_id)
  WHERE external_id IS NOT NULL;

ALTER TABLE public.marketing_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own marketing audits"
  ON public.marketing_audits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own marketing audits"
  ON public.marketing_audits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own marketing audits"
  ON public.marketing_audits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff read all marketing audits"
  ON public.marketing_audits FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
  );

CREATE POLICY "Admins manage marketing audits"
  ON public.marketing_audits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_marketing_audits_updated_at
  BEFORE UPDATE ON public.marketing_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Liens audit ↔ projet
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_to_project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.marketing_audits(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  linked_by uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audit_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_links_audit ON public.audit_to_project_links(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_links_project ON public.audit_to_project_links(project_id);

ALTER TABLE public.audit_to_project_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read audit links"
  ON public.audit_to_project_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketing_audits a
      WHERE a.id = audit_to_project_links.audit_id
        AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = audit_to_project_links.project_id
        AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Owners create audit links"
  ON public.audit_to_project_links FOR INSERT
  TO authenticated
  WITH CHECK (
    linked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.marketing_audits a
      WHERE a.id = audit_to_project_links.audit_id
        AND a.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = audit_to_project_links.project_id
        AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
    )
  );

CREATE POLICY "Owners delete audit links"
  ON public.audit_to_project_links FOR DELETE
  TO authenticated
  USING (
    linked_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins manage audit links"
  ON public.audit_to_project_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- RPC : lier un audit à un projet (vérifs serveur strictes)
-- ============================================================

CREATE OR REPLACE FUNCTION public.link_audit_to_project(
  _audit_id uuid,
  _project_id uuid,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_link_id uuid;
  v_owns_audit boolean;
  v_owns_project boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.marketing_audits
    WHERE id = _audit_id AND user_id = v_user
  ) INTO v_owns_audit;

  IF NOT v_owns_audit THEN
    RAISE EXCEPTION 'Audit not found or not owned' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id
      AND (client_id = v_user OR consultant_id = v_user
           OR public.has_role(v_user, 'admin'::app_role))
  ) INTO v_owns_project;

  IF NOT v_owns_project THEN
    RAISE EXCEPTION 'Project not found or not accessible' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.audit_to_project_links (audit_id, project_id, linked_by, note)
  VALUES (_audit_id, _project_id, v_user, _note)
  ON CONFLICT (audit_id, project_id) DO UPDATE SET note = COALESCE(EXCLUDED.note, audit_to_project_links.note)
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_audit_to_project(uuid, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.link_audit_to_project(uuid, uuid, text) TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================

ALTER TABLE public.marketing_audits REPLICA IDENTITY FULL;
ALTER TABLE public.audit_to_project_links REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'marketing_audits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_audits;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'audit_to_project_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_to_project_links;
  END IF;
END $$;