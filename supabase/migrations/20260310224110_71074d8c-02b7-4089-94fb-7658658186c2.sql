
-- Fix search_path for functions
ALTER FUNCTION public.increment_post_views(TEXT) SET search_path = 'public';
ALTER FUNCTION public.generate_post_slug() SET search_path = 'public';

-- Move unaccent to extensions schema
DROP EXTENSION IF EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Fix permissive newsletter INSERT policy  
DROP POLICY "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email IS NOT NULL AND email != '');

-- Allow public to read own subscription
CREATE POLICY "Public read own subscription" ON public.newsletter_subscribers
  FOR SELECT USING (true);
