
-- Enable unaccent extension for slug generation
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Blog posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'expression-besoin', 
    'image-identite', 
    'strategie', 
    'cas-clients', 
    'outils'
  )),
  cover_image TEXT,
  reading_time INTEGER DEFAULT 5,
  author_name TEXT DEFAULT 'Équipe IMOTION',
  author_avatar TEXT DEFAULT '',
  author_role TEXT DEFAULT 'Expert en transformation digitale',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Editorial calendar table
CREATE TABLE public.blog_editorial_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  planned_date DATE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  angle TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'generating', 'generated', 'published', 'failed')),
  generated_post_id UUID REFERENCES public.blog_posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public read published posts" ON public.blog_posts
  FOR SELECT USING (is_published = TRUE);

-- Admins manage all posts
CREATE POLICY "Admins manage posts" ON public.blog_posts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins manage calendar
CREATE POLICY "Admins manage calendar" ON public.blog_editorial_calendar
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public can read calendar
CREATE POLICY "Public read calendar" ON public.blog_editorial_calendar
  FOR SELECT USING (true);

-- Anyone can subscribe to newsletter
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Admins manage subscribers
CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to increment views
CREATE OR REPLACE FUNCTION public.increment_post_views(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.blog_posts 
  SET view_count = view_count + 1 
  WHERE slug = post_slug AND is_published = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-generating slug
CREATE OR REPLACE FUNCTION public.generate_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          unaccent(NEW.title),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    ) || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_post_slug
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.generate_post_slug();

-- Updated_at trigger for blog_posts
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
