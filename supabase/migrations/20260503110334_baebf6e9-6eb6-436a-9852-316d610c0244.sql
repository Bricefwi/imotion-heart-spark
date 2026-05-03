-- ============================================================
-- PHASE 1 : SCHÉMA DB UNIFIÉ — Fusion Lovelib → Clarivi
-- Toutes les tables marketing sont préfixées `mkt_`
-- ============================================================

-- ------------------------------------------------------------
-- 1) AUDITS ORCHESTRÉS (ex pre_audits Lovelib)
-- ------------------------------------------------------------
CREATE TABLE public.mkt_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  url TEXT NOT NULL,
  email TEXT,
  company_guess TEXT,
  ai_tier TEXT DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  raw_data JSONB DEFAULT '{}'::jsonb,
  enriched_data JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_audits_user ON public.mkt_audits(user_id);
CREATE INDEX idx_mkt_audits_status ON public.mkt_audits(status);
CREATE INDEX idx_mkt_audits_created ON public.mkt_audits(created_at DESC);
ALTER TABLE public.mkt_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mkt_audits_owner_all" ON public.mkt_audits
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "mkt_audits_staff_read" ON public.mkt_audits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'consultant'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "mkt_audits_anon_create" ON public.mkt_audits
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE TRIGGER trg_mkt_audits_updated BEFORE UPDATE ON public.mkt_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 2) RÉSULTATS / RAPPORTS / SOURCES / ÉTAPES D'AUDIT
-- ------------------------------------------------------------
CREATE TABLE public.mkt_audit_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  summary TEXT,
  scores JSONB DEFAULT '{}'::jsonb,
  kpis JSONB DEFAULT '{}'::jsonb,
  scenarios JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  report_md TEXT,
  report_pdf_url TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_audit_results_audit ON public.mkt_audit_results(audit_id);
ALTER TABLE public.mkt_audit_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_audit_results_read" ON public.mkt_audit_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id
            AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
                 OR public.has_role(auth.uid(), 'consultant'::app_role)))
  );
CREATE POLICY "mkt_audit_results_admin_write" ON public.mkt_audit_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.mkt_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  title TEXT,
  report_type TEXT,
  status TEXT DEFAULT 'draft',
  html TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_audit_reports_audit ON public.mkt_audit_reports(audit_id);
ALTER TABLE public.mkt_audit_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_audit_reports_read" ON public.mkt_audit_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id
            AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
                 OR public.has_role(auth.uid(), 'consultant'::app_role)))
  );
CREATE POLICY "mkt_audit_reports_admin_write" ON public.mkt_audit_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.mkt_audit_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  url TEXT,
  query TEXT,
  snippet TEXT,
  reliability NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_audit_sources_audit ON public.mkt_audit_sources(audit_id);
ALTER TABLE public.mkt_audit_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_audit_sources_read" ON public.mkt_audit_sources
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id
            AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
                 OR public.has_role(auth.uid(), 'consultant'::app_role)))
  );
CREATE POLICY "mkt_audit_sources_admin_write" ON public.mkt_audit_sources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.mkt_audit_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_audit_steps_audit ON public.mkt_audit_steps(audit_id);
ALTER TABLE public.mkt_audit_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_audit_steps_read" ON public.mkt_audit_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id
            AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
                 OR public.has_role(auth.uid(), 'consultant'::app_role)))
  );
CREATE POLICY "mkt_audit_steps_admin_write" ON public.mkt_audit_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- 3) ORCHESTRATION MULTI-AGENTS
-- ------------------------------------------------------------
CREATE TABLE public.mkt_orchestrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  current_phase TEXT,
  progress NUMERIC DEFAULT 0,
  phases JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_orch_audit ON public.mkt_orchestrations(audit_id);
ALTER TABLE public.mkt_orchestrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_orch_read" ON public.mkt_orchestrations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id
            AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
                 OR public.has_role(auth.uid(), 'consultant'::app_role)))
  );
CREATE POLICY "mkt_orch_admin_write" ON public.mkt_orchestrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_mkt_orch_updated BEFORE UPDATE ON public.mkt_orchestrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mkt_orchestration_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id UUID REFERENCES public.mkt_orchestrations(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  agents JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_orch_phases ON public.mkt_orchestration_phases(orchestration_id);
ALTER TABLE public.mkt_orchestration_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_orch_phases_read" ON public.mkt_orchestration_phases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mkt_orchestrations o
      JOIN public.mkt_audits a ON a.id = o.audit_id
      WHERE o.id = orchestration_id
        AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
             OR public.has_role(auth.uid(), 'consultant'::app_role))
    )
  );
CREATE POLICY "mkt_orch_phases_admin_write" ON public.mkt_orchestration_phases
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.mkt_orchestration_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES public.mkt_orchestration_phases(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT '{}'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC,
  duration_ms INTEGER,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_orch_results_phase ON public.mkt_orchestration_results(phase_id);
ALTER TABLE public.mkt_orchestration_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_orch_results_read" ON public.mkt_orchestration_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mkt_orchestration_phases p
      JOIN public.mkt_orchestrations o ON o.id = p.orchestration_id
      JOIN public.mkt_audits a ON a.id = o.audit_id
      WHERE p.id = phase_id
        AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)
             OR public.has_role(auth.uid(), 'consultant'::app_role))
    )
  );
CREATE POLICY "mkt_orch_results_admin_write" ON public.mkt_orchestration_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- 4) CONVERSATIONS ALEX (chat IA marketing)
-- ------------------------------------------------------------
CREATE TABLE public.mkt_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  user_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_messages_audit ON public.mkt_messages(audit_id);
CREATE INDEX idx_mkt_messages_user ON public.mkt_messages(user_id);
ALTER TABLE public.mkt_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_messages_owner_read" ON public.mkt_messages
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
  );
CREATE POLICY "mkt_messages_owner_create" ON public.mkt_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ------------------------------------------------------------
-- 5) BLOG MARKETING
-- ------------------------------------------------------------
CREATE TABLE public.mkt_blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_md TEXT NOT NULL,
  cover_url TEXT,
  cover_credit TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  author_name TEXT DEFAULT 'Équipe IMOTION',
  author_role TEXT DEFAULT 'Expert marketing',
  reliability_score NUMERIC,
  chart_spec JSONB,
  sources JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_blog_published ON public.mkt_blog_articles(is_published, published_at DESC);
ALTER TABLE public.mkt_blog_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_blog_public_read" ON public.mkt_blog_articles
  FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "mkt_blog_admin_all" ON public.mkt_blog_articles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_mkt_blog_updated BEFORE UPDATE ON public.mkt_blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Slug auto-généré (réutilise le même pattern que blog_posts)
CREATE OR REPLACE FUNCTION public.generate_mkt_blog_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(extensions.unaccent(NEW.title), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_mkt_blog_slug BEFORE INSERT ON public.mkt_blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.generate_mkt_blog_slug();

CREATE TABLE public.mkt_blog_tags (
  id SERIAL PRIMARY KEY,
  tag TEXT UNIQUE NOT NULL
);
ALTER TABLE public.mkt_blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_blog_tags_public_read" ON public.mkt_blog_tags
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mkt_blog_tags_admin_write" ON public.mkt_blog_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.mkt_blog_article_tags (
  article_id UUID REFERENCES public.mkt_blog_articles(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES public.mkt_blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
ALTER TABLE public.mkt_blog_article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_blog_article_tags_public_read" ON public.mkt_blog_article_tags
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mkt_blog_article_tags_admin_write" ON public.mkt_blog_article_tags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- 6) VEILLE IA
-- ------------------------------------------------------------
CREATE TABLE public.mkt_ai_news_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  top_news JSONB DEFAULT '[]'::jsonb,
  trends JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  html_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_news_date ON public.mkt_ai_news_reports(date DESC);
ALTER TABLE public.mkt_ai_news_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_news_public_read" ON public.mkt_ai_news_reports
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mkt_news_admin_write" ON public.mkt_ai_news_reports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_mkt_news_updated BEFORE UPDATE ON public.mkt_ai_news_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 7) ENTREPRISES & MISSIONS MARKETING
-- ------------------------------------------------------------
CREATE TABLE public.mkt_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  legal_name TEXT,
  siret TEXT,
  website TEXT,
  industry TEXT,
  size TEXT,
  address TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_companies_user ON public.mkt_companies(user_id);
ALTER TABLE public.mkt_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_companies_owner_all" ON public.mkt_companies
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "mkt_companies_staff_read" ON public.mkt_companies
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'consultant'::app_role));
CREATE TRIGGER trg_mkt_companies_updated BEFORE UPDATE ON public.mkt_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mkt_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.mkt_companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  blueprint JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_missions_user ON public.mkt_missions(user_id);
ALTER TABLE public.mkt_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_missions_owner_all" ON public.mkt_missions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "mkt_missions_staff_read" ON public.mkt_missions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'consultant'::app_role));
CREATE TRIGGER trg_mkt_missions_updated BEFORE UPDATE ON public.mkt_missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 8) CHOIX STRATÉGIQUES
-- ------------------------------------------------------------
CREATE TABLE public.mkt_strategic_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.mkt_audits(id) ON DELETE CASCADE,
  user_id UUID,
  category TEXT NOT NULL,
  choice TEXT NOT NULL,
  rationale TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_strat_audit ON public.mkt_strategic_choices(audit_id);
ALTER TABLE public.mkt_strategic_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_strat_owner_all" ON public.mkt_strategic_choices
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.mkt_audits a WHERE a.id = audit_id AND a.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ------------------------------------------------------------
-- 9) FAQ MARKETING
-- ------------------------------------------------------------
CREATE TABLE public.mkt_faq_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer_html TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mkt_faq_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_faq_public_read" ON public.mkt_faq_entries
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
CREATE POLICY "mkt_faq_admin_write" ON public.mkt_faq_entries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_mkt_faq_updated BEFORE UPDATE ON public.mkt_faq_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 10) INDEX SEO
-- ------------------------------------------------------------
CREATE TABLE public.mkt_seo_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  status_code INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_crawled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mkt_seo_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_seo_admin_all" ON public.mkt_seo_index
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ------------------------------------------------------------
-- 11) GARDE-FOUS : access control + rate limits
-- ------------------------------------------------------------
CREATE TABLE public.mkt_audit_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address TEXT,
  allowed BOOLEAN NOT NULL,
  free_audits_remaining INTEGER DEFAULT 1,
  trust_score NUMERIC,
  denial_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_access_user ON public.mkt_audit_access_control(user_id);
CREATE INDEX idx_mkt_access_ip ON public.mkt_audit_access_control(ip_address);
ALTER TABLE public.mkt_audit_access_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_access_admin_read" ON public.mkt_audit_access_control
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "mkt_access_service_all" ON public.mkt_audit_access_control
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE public.mkt_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  bucket TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mkt_rate_limits_bucket ON public.mkt_rate_limits(identifier, bucket, window_start DESC);
ALTER TABLE public.mkt_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_rate_limits_service_all" ON public.mkt_rate_limits
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "mkt_rate_limits_admin_read" ON public.mkt_rate_limits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));