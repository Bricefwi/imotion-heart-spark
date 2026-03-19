-- Security fix: add ownership check to calculate_project_estimate
-- Prevents any authenticated user from generating estimates for projects they don't own

CREATE OR REPLACE FUNCTION public.calculate_project_estimate(p_project_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project RECORD;
  v_discovery JSONB;
  v_project_type TEXT;
  v_base_price INTEGER;
  v_options_total INTEGER := 0;
  v_complexity INTEGER := 2;
  v_duration_min INTEGER;
  v_duration_max INTEGER;
  v_selected_options JSONB := '[]'::JSONB;
  v_estimate_id UUID;
  v_maintenance_code TEXT;
  v_caller_id UUID;
BEGIN
  -- Get the caller's identity
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = p_project_id;

  IF v_project IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Authorization: caller must be the project owner, consultant, or admin
  IF v_project.client_id != v_caller_id
     AND v_project.consultant_id != v_caller_id
     AND NOT has_role(v_caller_id, 'admin'::app_role)
     AND NOT has_role(v_caller_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: insufficient permissions for this project';
  END IF;

  v_discovery := v_project.discovery_data;

  IF v_discovery->'phase_2_besoin'->>'has_ecommerce' = 'true' THEN
    v_project_type := 'ecommerce';
  ELSIF v_discovery->'phase_4_ecosysteme'->>'needs_custom_app' = 'true' THEN
    v_project_type := 'webapp';
  ELSIF v_discovery->'phase_5_contraintes'->>'budget_min' IS NOT NULL
        AND (v_discovery->'phase_5_contraintes'->>'budget_min')::INTEGER >= 25000 THEN
    v_project_type := 'plateforme';
  ELSE
    v_project_type := 'vitrine';
  END IF;

  SELECT base_price, duration_weeks_min, duration_weeks_max
  INTO v_base_price, v_duration_min, v_duration_max
  FROM pricing_config WHERE code = v_project_type;

  IF v_discovery->'phase_3_vision'->>'is_multilingual' = 'true' THEN
    v_options_total := v_options_total + 800;
    v_selected_options := v_selected_options || '[{"code": "multilingue", "name": "Site multilingue", "price": 800, "quantity": 1}]'::JSONB;
    v_duration_max := v_duration_max + 1;
  END IF;

  IF v_discovery->'phase_2_besoin'->>'needs_blog' = 'true' THEN
    v_options_total := v_options_total + 990;
    v_selected_options := v_selected_options || '[{"code": "blog", "name": "Module Blog", "price": 990, "quantity": 1}]'::JSONB;
    v_duration_max := v_duration_max + 1;
  END IF;

  IF v_discovery->'phase_4_ecosysteme'->'required_integrations' ? 'crm' THEN
    v_options_total := v_options_total + 990;
    v_selected_options := v_selected_options || '[{"code": "crm_integration", "name": "Intégration CRM", "price": 990, "quantity": 1}]'::JSONB;
    v_duration_max := v_duration_max + 1;
  END IF;

  v_complexity := 2;
  IF jsonb_array_length(COALESCE(v_discovery->'phase_4_ecosysteme'->'required_integrations', '[]'::JSONB)) > 3 THEN
    v_complexity := v_complexity + 1;
  END IF;
  IF v_discovery->'phase_5_contraintes'->>'deadline_urgent' = 'true' THEN
    v_complexity := v_complexity + 1;
  END IF;

  v_maintenance_code := CASE v_project_type
    WHEN 'vitrine' THEN 'essentiel'
    WHEN 'ecommerce' THEN 'confort'
    WHEN 'webapp' THEN 'confort'
    WHEN 'plateforme' THEN 'premium'
  END;

  INSERT INTO project_estimates (
    project_id, project_type_code, base_price, options_total, final_price,
    selected_options, duration_weeks_min, duration_weeks_max,
    recommended_maintenance_code, complexity_score, calculation_inputs, valid_until
  ) VALUES (
    p_project_id, v_project_type, v_base_price, v_options_total,
    v_base_price + v_options_total, v_selected_options, v_duration_min,
    v_duration_max, v_maintenance_code, v_complexity, v_discovery,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO v_estimate_id;

  RETURN v_estimate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
