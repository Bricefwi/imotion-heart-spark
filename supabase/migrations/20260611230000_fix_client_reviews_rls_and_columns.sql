-- Fix client_reviews: ensure moderation columns exist + correct RLS policy
-- The 20260322175452 migration may have created the table without reviewed_by/reviewed_at/admin_notes
-- and with a broken has_role policy (missing ::app_role cast).

-- 1. Ensure moderation columns exist
ALTER TABLE public.client_reviews
  ADD COLUMN IF NOT EXISTS admin_notes    TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_role TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_company TEXT;

-- 2. Drop all existing admin policies (both the broken and the correct one)
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.client_reviews;
DROP POLICY IF EXISTS "Admins manage reviews"         ON public.client_reviews;

-- 3. Recreate with correct ::app_role cast and explicit WITH CHECK
CREATE POLICY "Admins manage reviews"
  ON public.client_reviews FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );
