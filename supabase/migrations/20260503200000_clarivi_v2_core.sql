-- ============================================================
-- Migration clarivi_v2_core.sql
-- Bascule multi-tenant agence — Clarivi V2
-- ============================================================

-- 1. Table agencies (tenant principal)
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  contact_email TEXT NOT NULL,
  country TEXT DEFAULT 'FR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);

-- 2. Lien user → agency (rôles)
CREATE TABLE IF NOT EXISTS public.agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_users_user ON public.agency_users(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_agency ON public.agency_users(agency_id);

-- 3. Subscriptions Stripe
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('trial', 'starter', 'pro', 'agency', 'cancelled')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  audits_quota INT NOT NULL DEFAULT 5,
  audits_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. White-label branding
CREATE TABLE IF NOT EXISTS public.agency_branding (
  agency_id UUID PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0A0A0A',
  accent_color TEXT DEFAULT '#3B82F6',
  custom_subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  welcome_message TEXT,
  consultant_persona TEXT DEFAULT 'Marc',
  legal_company_name TEXT,
  legal_siret TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Grille tarifaire agence
CREATE TABLE IF NOT EXISTS public.agency_pricing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  daily_rate_eur INT NOT NULL DEFAULT 600,
  hourly_rate_eur INT NOT NULL DEFAULT 90,
  package_pricing JSONB DEFAULT '[]'::jsonb,
  default_margin_pct INT DEFAULT 20,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Liens d'audit (tokens pour prospects)
CREATE TABLE IF NOT EXISTS public.audit_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  prospect_email TEXT,
  prospect_name TEXT,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_links_token ON public.audit_links(token);
CREATE INDEX IF NOT EXISTS idx_audit_links_agency ON public.audit_links(agency_id);

-- 7. Audits (sessions prospect)
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  audit_link_id UUID REFERENCES public.audit_links(id) ON DELETE SET NULL,
  prospect_email TEXT,
  prospect_name TEXT,
  current_phase INT NOT NULL DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'failed')),
  discovery_data JSONB DEFAULT '{}'::jsonb,
  quality_score INT,
  lead_grade TEXT CHECK (lead_grade IN ('A', 'B', 'C', 'D')),
  llm_cost_eur NUMERIC(10,4) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audits_agency ON public.audits(agency_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);

-- 8. Messages conversationnels
CREATE TABLE IF NOT EXISTS public.audit_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_name TEXT,
  phase INT,
  confidence NUMERIC(3,2),
  tokens_in INT,
  tokens_out INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_messages_audit ON public.audit_messages(audit_id, created_at);

-- 9. Documents générés (CDC + devis)
CREATE TABLE IF NOT EXISTS public.audit_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('cdc', 'quote', 'brief', 'contract')),
  content_md TEXT NOT NULL,
  content_pdf_url TEXT,
  content_json JSONB,
  generated_by_agent TEXT NOT NULL,
  quality_score INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_documents_audit ON public.audit_documents(audit_id);

-- 10. Métriques d'usage (quotas par mois)
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  audits_started INT DEFAULT 0,
  audits_completed INT DEFAULT 0,
  llm_cost_eur NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, period_month)
);

-- Triggers updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_agencies_updated') THEN
    CREATE TRIGGER trg_agencies_updated BEFORE UPDATE ON public.agencies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subs_updated') THEN
    CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.agency_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_branding_updated') THEN
    CREATE TRIGGER trg_branding_updated BEFORE UPDATE ON public.agency_branding
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
