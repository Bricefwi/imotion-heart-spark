
CREATE TABLE IF NOT EXISTS public.pending_audit_claims (
  jti TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  external_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_by UUID,
  claimed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_audit_claims_email
  ON public.pending_audit_claims (email)
  WHERE claimed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pending_audit_claims_expires_at
  ON public.pending_audit_claims (expires_at);

ALTER TABLE public.pending_audit_claims ENABLE ROW LEVEL SECURITY;
-- No policies: only service role + SECURITY DEFINER function can access.

CREATE OR REPLACE FUNCTION public.cleanup_pending_audit_claims()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.pending_audit_claims
  WHERE expires_at < now() AND claimed_at IS NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_pending_audit_claims() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.redeem_pending_audits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_claim record;
  v_audit_id uuid;
  v_existing_id uuid;
  v_external_id text;
  v_score int;
  v_summary text;
  v_company text;
  v_website text;
  v_recommendations jsonb;
  v_full jsonb;
  v_results jsonb := '[]'::jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('claimed', 0, 'audits', '[]'::jsonb);
  END IF;

  FOR v_claim IN
    SELECT * FROM public.pending_audit_claims
    WHERE email = v_email
      AND claimed_at IS NULL
      AND expires_at > now()
    FOR UPDATE
  LOOP
    v_external_id := v_claim.payload->>'external_id';
    v_score := NULLIF(v_claim.payload->>'score', '')::int;
    v_summary := v_claim.payload->>'summary';
    v_company := v_claim.payload->>'company_name';
    v_website := v_claim.payload->>'website_url';
    v_recommendations := COALESCE(v_claim.payload->'recommendations', '[]'::jsonb);
    v_full := COALESCE(v_claim.payload->'full_payload', v_claim.payload);

    v_existing_id := NULL;
    IF v_external_id IS NOT NULL THEN
      SELECT id INTO v_existing_id FROM public.marketing_audits
      WHERE user_id = v_user AND external_id = v_external_id LIMIT 1;
    END IF;

    IF v_existing_id IS NULL THEN
      INSERT INTO public.marketing_audits (
        user_id, source, status, completed_at,
        external_id, company_name, website_url,
        score, summary, recommendations, full_payload
      ) VALUES (
        v_user, 'lovelib', 'completed', now(),
        v_external_id, v_company, v_website,
        v_score, v_summary, v_recommendations, v_full
      ) RETURNING id INTO v_audit_id;
    ELSE
      UPDATE public.marketing_audits SET
        status = 'completed',
        completed_at = now(),
        company_name = COALESCE(v_company, company_name),
        website_url = COALESCE(v_website, website_url),
        score = COALESCE(v_score, score),
        summary = COALESCE(v_summary, summary),
        recommendations = v_recommendations,
        full_payload = v_full,
        updated_at = now()
      WHERE id = v_existing_id;
      v_audit_id := v_existing_id;
    END IF;

    -- Anti-replay: record token use (jti)
    INSERT INTO public.lovelib_token_uses (jti, user_id, audit_external_id, expires_at)
    VALUES (v_claim.jti, v_user, v_external_id, v_claim.expires_at)
    ON CONFLICT (jti) DO NOTHING;

    UPDATE public.pending_audit_claims
    SET claimed_by = v_user, claimed_at = now()
    WHERE jti = v_claim.jti;

    INSERT INTO public.activities (user_id, action, description, importance, metadata)
    VALUES (
      v_user, 'marketing_audit_claim_redeemed',
      'Audit lovelib réclamé via lien signé',
      'normal',
      jsonb_build_object('audit_id', v_audit_id, 'external_id', v_external_id, 'jti', v_claim.jti)
    );

    v_results := v_results || jsonb_build_object(
      'audit_id', v_audit_id,
      'external_id', v_external_id,
      'company_name', v_company,
      'website_url', v_website,
      'score', v_score,
      'summary', v_summary
    );
  END LOOP;

  RETURN jsonb_build_object('claimed', jsonb_array_length(v_results), 'audits', v_results);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_pending_audits() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_pending_audits() TO authenticated;
