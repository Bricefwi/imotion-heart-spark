-- ============================================================
-- Migration clarivi_v2_rls.sql
-- RLS multi-tenant strict — Clarivi V2
-- ============================================================

-- Activer RLS sur toutes les tables V2
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- Helper : agency_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.user_agency_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT agency_id FROM public.agency_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper : rôle de l'utilisateur dans son agence
CREATE OR REPLACE FUNCTION public.user_agency_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.agency_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Policies agencies
DROP POLICY IF EXISTS "users see own agency" ON public.agencies;
CREATE POLICY "users see own agency"
ON public.agencies FOR SELECT
USING (id = public.user_agency_id());

DROP POLICY IF EXISTS "owners update agency" ON public.agencies;
CREATE POLICY "owners update agency"
ON public.agencies FOR UPDATE
USING (id = public.user_agency_id() AND public.user_agency_role() = 'owner');

-- Policies agency_users
DROP POLICY IF EXISTS "users see members of own agency" ON public.agency_users;
CREATE POLICY "users see members of own agency"
ON public.agency_users FOR SELECT
USING (agency_id = public.user_agency_id());

DROP POLICY IF EXISTS "owners manage members" ON public.agency_users;
CREATE POLICY "owners manage members"
ON public.agency_users FOR ALL
USING (agency_id = public.user_agency_id() AND public.user_agency_role() = 'owner');

-- Policies agency_subscriptions
DROP POLICY IF EXISTS "owners see subscription" ON public.agency_subscriptions;
CREATE POLICY "owners see subscription"
ON public.agency_subscriptions FOR SELECT
USING (agency_id = public.user_agency_id() AND public.user_agency_role() IN ('owner', 'admin'));

-- Policies agency_branding
DROP POLICY IF EXISTS "members read branding" ON public.agency_branding;
CREATE POLICY "members read branding"
ON public.agency_branding FOR SELECT
USING (agency_id = public.user_agency_id());

DROP POLICY IF EXISTS "admins update branding" ON public.agency_branding;
CREATE POLICY "admins update branding"
ON public.agency_branding FOR ALL
USING (agency_id = public.user_agency_id() AND public.user_agency_role() IN ('owner', 'admin'));

-- Policies agency_pricing_templates
DROP POLICY IF EXISTS "members read pricing" ON public.agency_pricing_templates;
CREATE POLICY "members read pricing"
ON public.agency_pricing_templates FOR SELECT
USING (agency_id = public.user_agency_id());

DROP POLICY IF EXISTS "admins manage pricing" ON public.agency_pricing_templates;
CREATE POLICY "admins manage pricing"
ON public.agency_pricing_templates FOR ALL
USING (agency_id = public.user_agency_id() AND public.user_agency_role() IN ('owner', 'admin'));

-- Policies audit_links
DROP POLICY IF EXISTS "members manage own audit links" ON public.audit_links;
CREATE POLICY "members manage own audit links"
ON public.audit_links FOR ALL
USING (agency_id = public.user_agency_id());

-- Policies audits
DROP POLICY IF EXISTS "members read own audits" ON public.audits;
CREATE POLICY "members read own audits"
ON public.audits FOR SELECT
USING (agency_id = public.user_agency_id());

DROP POLICY IF EXISTS "members create audits via service" ON public.audits;
CREATE POLICY "members create audits via service"
ON public.audits FOR INSERT
WITH CHECK (agency_id = public.user_agency_id());

-- IMPORTANT : les prospects ne sont PAS authentifiés.
-- L'accès anonyme passe par les Edge Functions avec service_role
-- + validation du token via audit_links.

-- Policies audit_messages (lecture agence uniquement)
DROP POLICY IF EXISTS "members read messages of own audits" ON public.audit_messages;
CREATE POLICY "members read messages of own audits"
ON public.audit_messages FOR SELECT
USING (audit_id IN (SELECT id FROM public.audits WHERE agency_id = public.user_agency_id()));

-- Policies audit_documents
DROP POLICY IF EXISTS "members read docs of own audits" ON public.audit_documents;
CREATE POLICY "members read docs of own audits"
ON public.audit_documents FOR SELECT
USING (audit_id IN (SELECT id FROM public.audits WHERE agency_id = public.user_agency_id()));

-- Policies usage_metrics
DROP POLICY IF EXISTS "owners see usage" ON public.usage_metrics;
CREATE POLICY "owners see usage"
ON public.usage_metrics FOR SELECT
USING (agency_id = public.user_agency_id() AND public.user_agency_role() IN ('owner', 'admin'));
