ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_siret TEXT,
  ADD COLUMN IF NOT EXISTS company_legal_name TEXT,
  ADD COLUMN IF NOT EXISTS professional_email TEXT,
  ADD COLUMN IF NOT EXISTS company_website TEXT,
  ADD COLUMN IF NOT EXISTS trust_score NUMERIC NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS max_free_audits INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS free_audits_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branding_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS firstname TEXT,
  ADD COLUMN IF NOT EXISTS lastname TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON public.profiles(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_profiles_company_siret ON public.profiles(company_siret) WHERE company_siret IS NOT NULL;