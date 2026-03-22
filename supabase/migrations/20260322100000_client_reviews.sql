-- Migration: Client reviews system with admin moderation
-- Table for client reviews/testimonials

CREATE TABLE IF NOT EXISTS public.client_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT,
  reviewer_company TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) >= 10 AND char_length(review_text) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Authenticated users can submit reviews
CREATE POLICY "Users can create reviews"
  ON public.client_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can see their own reviews (any status)
CREATE POLICY "Users can view own reviews"
  ON public.client_reviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can see approved reviews (for landing page display)
CREATE POLICY "Anyone can view approved reviews"
  ON public.client_reviews FOR SELECT
  USING (status = 'approved');

-- Admins can manage all reviews
CREATE POLICY "Admins manage reviews"
  ON public.client_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Updated_at trigger
CREATE OR REPLACE TRIGGER set_updated_at_client_reviews
  BEFORE UPDATE ON public.client_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for efficient queries
CREATE INDEX idx_client_reviews_status ON public.client_reviews(status);
CREATE INDEX idx_client_reviews_user_id ON public.client_reviews(user_id);
