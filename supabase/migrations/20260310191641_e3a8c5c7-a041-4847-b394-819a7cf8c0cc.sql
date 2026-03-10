
-- IMOTION Discovery Pro - Complete Schema

CREATE TYPE public.app_role AS ENUM ('client', 'consultant', 'admin', 'super_admin');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  company_role TEXT,
  company_size TEXT CHECK (company_size IN ('solo', '2-10', '11-50', '51-200', '201-500', '500+')),
  industry TEXT,
  website TEXT,
  preferences JSONB DEFAULT '{"notifications": {"email": true, "push": true, "sms": false}, "language": "fr", "timezone": "Europe/Paris", "theme": "light"}',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT
);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- User roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE (user_id, role)
);

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  slug TEXT UNIQUE,
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  consultant_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','discovery_active','discovery_paused','discovery_completed','review_pending','cdc_draft','cdc_ready','proposal_sent','negotiation','contract_pending','signed','in_progress','delivered','archived','lost')),
  current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 7),
  phase_progress JSONB DEFAULT '{"1":{"completed":false,"progress":0},"2":{"completed":false,"progress":0},"3":{"completed":false,"progress":0},"4":{"completed":false,"progress":0},"5":{"completed":false,"progress":0},"6":{"completed":false,"progress":0},"7":{"completed":false,"progress":0}}',
  overall_progress INTEGER DEFAULT 0,
  discovery_data JSONB DEFAULT '{}',
  qualification_score INTEGER CHECK (qualification_score BETWEEN 1 AND 5),
  qualification_flags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  currency TEXT DEFAULT 'EUR',
  proposal_amount INTEGER,
  contract_amount INTEGER,
  desired_deadline DATE,
  estimated_start_date DATE,
  estimated_end_date DATE,
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  total_conversation_time INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ
);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_consultant ON public.projects(consultant_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_number INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  phase_start INTEGER,
  phase_end INTEGER,
  ai_summary TEXT,
  key_insights JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  extracted_entities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  device_type TEXT,
  browser TEXT
);
CREATE INDEX idx_conversations_project ON public.conversations(project_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','consultant','system')),
  content TEXT NOT NULL,
  phase INTEGER,
  extracted_data JSONB DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive','neutral','negative','confused','frustrated')),
  intent TEXT,
  entities JSONB DEFAULT '[]',
  confidence_score FLOAT,
  perplexity_context JSONB,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  model_used TEXT
);
CREATE INDEX idx_messages_project ON public.messages(project_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cdc','proposal','contract','invoice','appendix','meeting_notes','specification','wireframe','brand_guide','upload','other')),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','review','approved','sent','signed','rejected','archived')),
  requires_signature BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES public.profiles(id),
  signature_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  version_history JSONB DEFAULT '[]'
);
CREATE INDEX idx_documents_project ON public.documents(project_id);
CREATE INDEX idx_documents_type ON public.documents(type);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message_received','project_status_changed','document_ready','signature_required','payment_received','reminder','mention','consultant_intervention','system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  link_type TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  channels TEXT[] DEFAULT '{in_app}',
  sent_via JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low','normal','high','critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activities_user ON public.activities(user_id);
CREATE INDEX idx_activities_project ON public.activities(project_id);
CREATE INDEX idx_activities_created ON public.activities(created_at DESC);

-- Templates
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cdc','proposal','contract','email','sms','notification')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);
CREATE INDEX idx_templates_type ON public.templates(type);

-- Settings
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Consultants can view profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'consultant') OR public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Projects policies
CREATE POLICY "Clients view own projects" ON public.projects FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Clients create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients update own projects" ON public.projects FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Consultants view projects" ON public.projects FOR SELECT USING (auth.uid() = consultant_id OR public.has_role(auth.uid(), 'consultant') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Consultants update projects" ON public.projects FOR UPDATE USING (auth.uid() = consultant_id OR public.has_role(auth.uid(), 'admin'));

-- Conversations policies
CREATE POLICY "Members view conversations" ON public.conversations FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (client_id = auth.uid() OR consultant_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members create conversations" ON public.conversations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (client_id = auth.uid() OR consultant_id = auth.uid())));

-- Messages policies
CREATE POLICY "Members view messages" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (client_id = auth.uid() OR consultant_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members create messages" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (client_id = auth.uid() OR consultant_id = auth.uid())));

-- Documents policies
CREATE POLICY "Members view documents" ON public.documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (client_id = auth.uid() OR consultant_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff manage documents" ON public.documents FOR ALL USING (public.has_role(auth.uid(), 'consultant') OR public.has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users view activities" ON public.activities FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'consultant') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "View active templates" ON public.templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage templates" ON public.templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Settings policies
CREATE POLICY "View settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate project code
CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS TRIGGER AS $$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  IF NEW.code IS NULL THEN
    LOOP
      new_code := 'IM-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      SELECT EXISTS(SELECT 1 FROM public.projects WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_project_code_trigger BEFORE INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.generate_project_code();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Default settings
INSERT INTO public.settings (key, value, description, category) VALUES
('company', '{"name":"IMOTION Conseil","contact":{"email":"contact@imotion.fr","website":"https://imotion.fr"},"primary_color":"#D32F2F"}', 'Company info', 'general'),
('ai_config', '{"model":"google/gemini-3-flash-preview","max_tokens":4096,"temperature":0.7}', 'AI configuration', 'ai'),
('pricing', '{"discovery":{"price":0,"label":"Découverte"},"standard":{"price":500,"label":"Standard"},"premium":{"price":null,"label":"Premium"}}', 'Pricing config', 'billing');
