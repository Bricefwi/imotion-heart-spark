CREATE OR REPLACE FUNCTION public.merge_marketing_into_project(
  _project_id uuid,
  _audit_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER  -- respecte la RLS de l'appelant
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_audit_id uuid;
  v_external_id text;
  v_score int;
  v_summary text;
  v_recommendations jsonb;
  v_full_payload jsonb;
  v_company_name text;
  v_website_url text;
  v_existing_discovery jsonb;
  v_can_access boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF _audit_payload IS NULL OR jsonb_typeof(_audit_payload) <> 'object' THEN
    RAISE EXCEPTION 'audit_payload must be a JSON object' USING ERRCODE = '22023';
  END IF;

  -- Vérifier l'accès au projet (utilise la RLS du SELECT sur projects)
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id
      AND (
        p.client_id = v_user
        OR p.consultant_id = v_user
        OR public.has_role(v_user, 'admin'::app_role)
      )
  ) INTO v_can_access;

  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Project not found or access denied' USING ERRCODE = '42501';
  END IF;

  -- Extraire les champs du payload
  v_external_id := _audit_payload->>'external_id';
  v_score := NULLIF(_audit_payload->>'score', '')::int;
  v_summary := _audit_payload->>'summary';
  v_company_name := _audit_payload->>'company_name';
  v_website_url := _audit_payload->>'website_url';
  v_recommendations := COALESCE(_audit_payload->'recommendations', '[]'::jsonb);
  v_full_payload := COALESCE(_audit_payload->'full_payload', _audit_payload);

  -- Upsert de l'audit (par user + external_id si fourni)
  IF v_external_id IS NOT NULL THEN
    SELECT id INTO v_audit_id
    FROM public.marketing_audits
    WHERE user_id = v_user AND external_id = v_external_id
    LIMIT 1;
  END IF;

  IF v_audit_id IS NULL THEN
    INSERT INTO public.marketing_audits (
      user_id, source, status, completed_at,
      external_id, company_name, website_url,
      score, summary, recommendations, full_payload
    ) VALUES (
      v_user, 'lovelib', 'completed', now(),
      v_external_id, v_company_name, v_website_url,
      v_score, v_summary, v_recommendations, v_full_payload
    )
    RETURNING id INTO v_audit_id;
  ELSE
    UPDATE public.marketing_audits SET
      status = 'completed',
      completed_at = now(),
      company_name = COALESCE(v_company_name, company_name),
      website_url = COALESCE(v_website_url, website_url),
      score = COALESCE(v_score, score),
      summary = COALESCE(v_summary, summary),
      recommendations = v_recommendations,
      full_payload = v_full_payload,
      updated_at = now()
    WHERE id = v_audit_id;
  END IF;

  -- Merge non-destructif dans projects.discovery_data.marketing_audit
  SELECT discovery_data INTO v_existing_discovery
  FROM public.projects WHERE id = _project_id;

  UPDATE public.projects SET
    discovery_data = COALESCE(v_existing_discovery, '{}'::jsonb)
      || jsonb_build_object(
        'marketing_audit', jsonb_build_object(
          'audit_id', v_audit_id,
          'received_at', now(),
          'source', 'lovelib_sdk',
          'score', v_score,
          'summary', v_summary,
          'recommendations', v_recommendations
        )
      ),
    last_activity_at = now()
  WHERE id = _project_id;

  -- Lien audit ↔ project (idempotent)
  INSERT INTO public.audit_to_project_links (audit_id, project_id, linked_by, note)
  VALUES (v_audit_id, _project_id, v_user, 'Auto-linked via lovelib SDK')
  ON CONFLICT DO NOTHING;

  -- Journal d'activité
  INSERT INTO public.activities (user_id, project_id, action, description, metadata, importance)
  VALUES (
    v_user, _project_id, 'marketing_audit_merged',
    'Audit marketing fusionné dans le projet',
    jsonb_build_object('audit_id', v_audit_id, 'score', v_score),
    'normal'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'audit_id', v_audit_id,
    'project_id', _project_id
  );
END;
$$;

-- Index pour l'upsert par (user_id, external_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_audits_user_external
  ON public.marketing_audits(user_id, external_id)
  WHERE external_id IS NOT NULL;

-- Restreindre l'exécution aux utilisateurs authentifiés uniquement
REVOKE EXECUTE ON FUNCTION public.merge_marketing_into_project(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_marketing_into_project(uuid, jsonb) TO authenticated;