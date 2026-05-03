-- ============================================================
-- Migration clarivi_v2_seed.sql
-- Données de démo pour développement local — Clarivi V2
-- ============================================================

INSERT INTO public.agencies (id, name, slug, contact_email)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo Agency',
  'demo-agency',
  'demo@clarivi.io'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.agency_subscriptions (agency_id, plan, status, trial_ends_at, audits_quota)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'trial', 'trialing', now() + interval '14 days', 5
)
ON CONFLICT (agency_id) DO NOTHING;

INSERT INTO public.agency_branding (agency_id, primary_color, accent_color, consultant_persona)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '#0A0A0A', '#3B82F6', 'Marc'
)
ON CONFLICT (agency_id) DO NOTHING;

INSERT INTO public.agency_pricing_templates (agency_id, template_name, daily_rate_eur, hourly_rate_eur, is_default)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Tarifs standard', 600, 90, true
)
ON CONFLICT DO NOTHING;
