-- ============================================================================
-- CLARIVI V3 BOOTSTRAP — Sprint 1bis migrations (fix immutable index)
-- ============================================================================

ALTER TABLE public.pricing_maintenance
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly','annual'));

ALTER TABLE public.pricing_maintenance
  ADD COLUMN IF NOT EXISTS annual_price integer;

UPDATE public.pricing_maintenance
SET annual_price = ROUND(monthly_price * 12 * 0.85)::integer
WHERE billing_cycle = 'monthly' AND annual_price IS NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_email_verified
  ON public.projects(client_id, email_verified);

CREATE TABLE IF NOT EXISTS public.ab_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id text NOT NULL,
  variant text NOT NULL CHECK (variant IN ('A','B','C')),
  event_type text NOT NULL CHECK (event_type IN ('impression','click','conversion')),
  session_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_test_events_test ON public.ab_test_events(test_id, variant, event_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_session ON public.ab_test_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_created ON public.ab_test_events(created_at DESC);

ALTER TABLE public.ab_test_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone inserts ab events" ON public.ab_test_events
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read ab events" ON public.ab_test_events
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role)
                   OR has_role(auth.uid(), 'super_admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.cdc_pro_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cdc_id uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  amount_eur integer NOT NULL DEFAULT 290 CHECK (amount_eur = 290),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','scheduled','completed','refunded','deductible_applied','cancelled')),
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  consultant_id uuid REFERENCES public.profiles(id),
  scheduled_at timestamptz,
  completed_at timestamptz,
  refunded_at timestamptz,
  applied_to_build_estimate_id uuid REFERENCES public.project_estimates(id),
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdc_pro_user ON public.cdc_pro_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cdc_pro_project ON public.cdc_pro_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_cdc_pro_status ON public.cdc_pro_orders(status);
CREATE INDEX IF NOT EXISTS idx_cdc_pro_paid_at ON public.cdc_pro_orders(paid_at)
  WHERE status IN ('paid','completed','deductible_applied');

ALTER TABLE public.cdc_pro_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own cdc_pro_orders" ON public.cdc_pro_orders
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Consultants read assigned cdc_pro_orders" ON public.cdc_pro_orders
    FOR SELECT USING (consultant_id = auth.uid()
                   OR has_role(auth.uid(), 'consultant'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage cdc_pro_orders" ON public.cdc_pro_orders
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)
                OR has_role(auth.uid(), 'super_admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages cdc_pro_orders" ON public.cdc_pro_orders
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.tg_cdc_pro_orders_updated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cdc_pro_orders_updated ON public.cdc_pro_orders;
CREATE TRIGGER trg_cdc_pro_orders_updated
  BEFORE UPDATE ON public.cdc_pro_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_cdc_pro_orders_updated();

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}',
  page text,
  attribution_source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  dedup_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Note: dedup unique sur dedup_hash seul (date_trunc n'est pas IMMUTABLE).
-- Les déduplications fines temps-bornées doivent être faites côté applicatif.
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_dedup
  ON public.events(dedup_hash);

CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.events(session_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone inserts events" ON public.events
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins read events" ON public.events
    FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role)
                   OR has_role(auth.uid(), 'super_admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.nurturing_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cdc_id uuid REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_step integer NOT NULL DEFAULT 0 CHECK (current_step BETWEEN 0 AND 7),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','stopped_meeting','stopped_signed','stopped_unsubscribed','stopped_error')),
  last_email_sent_at timestamptz,
  next_email_due_at timestamptz NOT NULL DEFAULT (now() + interval '2 days'),
  emails_opened integer NOT NULL DEFAULT 0,
  emails_clicked integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nurturing_due
  ON public.nurturing_sequences(next_email_due_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_nurturing_user
  ON public.nurturing_sequences(user_id);

ALTER TABLE public.nurturing_sequences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users read own nurturing" ON public.nurturing_sequences
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role manages nurturing" ON public.nurturing_sequences
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage nurturing" ON public.nurturing_sequences
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;