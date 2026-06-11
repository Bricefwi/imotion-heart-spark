
-- 1. MESSAGES: enforce role matches caller's actual role
DROP POLICY IF EXISTS "Members create messages" ON public.messages;

CREATE POLICY "Clients send user messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  role = 'user'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = messages.project_id AND p.client_id = auth.uid()
  )
);

CREATE POLICY "Consultants send consultant messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  role = 'consultant'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = messages.project_id
      AND (p.consultant_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- assistant/system messages only via service_role (edge functions)

-- 2. PROJECTS: block clients from overwriting privileged columns via trigger
CREATE OR REPLACE FUNCTION public.guard_projects_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_privileged boolean;
BEGIN
  -- Bypass for service_role / consultant / admin
  IF v_uid IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_is_privileged := (NEW.consultant_id = v_uid AND OLD.consultant_id = v_uid)
    OR public.has_role(v_uid, 'admin'::app_role)
    OR public.has_role(v_uid, 'super_admin'::app_role)
    OR public.has_role(v_uid, 'consultant'::app_role);

  IF v_is_privileged THEN
    RETURN NEW;
  END IF;

  -- Caller is a client: forbid changes to internal fields
  IF NEW.status            IS DISTINCT FROM OLD.status
     OR NEW.consultant_id  IS DISTINCT FROM OLD.consultant_id
     OR NEW.client_id      IS DISTINCT FROM OLD.client_id
     OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes
     OR NEW.contract_amount IS DISTINCT FROM OLD.contract_amount
     OR NEW.proposal_amount IS DISTINCT FROM OLD.proposal_amount
     OR NEW.qualification_score IS DISTINCT FROM OLD.qualification_score
     OR NEW.qualification_flags IS DISTINCT FROM OLD.qualification_flags
     OR NEW.code           IS DISTINCT FROM OLD.code
     OR NEW.current_phase  IS DISTINCT FROM OLD.current_phase
     OR NEW.overall_progress IS DISTINCT FROM OLD.overall_progress
  THEN
    RAISE EXCEPTION 'Clients cannot modify internal project fields' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_projects_client_update ON public.projects;
CREATE TRIGGER trg_guard_projects_client_update
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.guard_projects_client_update();

-- 3. ACTIVITIES: enforce project membership on insert
DROP POLICY IF EXISTS "Users create activities" ON public.activities;
CREATE POLICY "Users create activities"
ON public.activities FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = activities.project_id
        AND (p.client_id = auth.uid()
             OR p.consultant_id = auth.uid()
             OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  )
);

-- 4. DOCUMENT TEMPLATES: require authentication
DROP POLICY IF EXISTS "Anyone can read active document templates" ON public.document_templates;
CREATE POLICY "Authenticated can read active document templates"
ON public.document_templates FOR SELECT TO authenticated
USING (is_active = true);

-- 5. SUPPRESSED EMAILS: admin read
CREATE POLICY "Admins can read suppressed emails"
ON public.suppressed_emails FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- 6. STORAGE: fix broken path check (use storage.objects.name, not projects.name)
DROP POLICY IF EXISTS "Project members can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Project members can upload documents" ON storage.objects;

CREATE POLICY "Project members can read documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
    )
  )
);

CREATE POLICY "Project members can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
    )
  )
);

-- 7. REALTIME broadcast/presence: deny by default (app uses postgres_changes only)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

DROP POLICY IF EXISTS "Deny broadcast presence to clients" ON realtime.messages;
CREATE POLICY "Deny broadcast presence to clients"
ON realtime.messages AS RESTRICTIVE
FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);
