-- 1. agent_runs : trace technique de chaque invocation modèle
CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  agent_name text NOT NULL,
  model text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  latency_ms integer,
  cost_estimate numeric(10,6) DEFAULT 0,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','killed','skipped')),
  error text,
  aig_run_id text,
  input_preview text,
  output_preview text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_runs_project ON public.agent_runs(project_id, created_at DESC);
CREATE INDEX idx_agent_runs_agent ON public.agent_runs(agent_name, created_at DESC);
CREATE INDEX idx_agent_runs_status ON public.agent_runs(status) WHERE status <> 'success';

GRANT SELECT ON public.agent_runs TO authenticated;
GRANT ALL ON public.agent_runs TO service_role;

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all agent runs"
  ON public.agent_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

CREATE POLICY "Consultants read their project runs"
  ON public.agent_runs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = agent_runs.project_id AND p.consultant_id = auth.uid()
  ));

-- 2. project_events : timeline métier
CREATE TABLE public.project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL CHECK (actor IN ('user','agent','system','admin','consultant')),
  actor_id uuid,
  phase integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  agent_run_id uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_events_project ON public.project_events(project_id, created_at DESC);
CREATE INDEX idx_project_events_type ON public.project_events(event_type, created_at DESC);

GRANT SELECT ON public.project_events TO authenticated;
GRANT ALL ON public.project_events TO service_role;

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all events"
  ON public.project_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

CREATE POLICY "Project members read their events"
  ON public.project_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_events.project_id
      AND (p.client_id = auth.uid() OR p.consultant_id = auth.uid())
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.project_events;
ALTER TABLE public.project_events REPLICA IDENTITY FULL;

-- 3. agent_config : pilotage admin
CREATE TABLE public.agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL UNIQUE,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  system_prompt text NOT NULL DEFAULT '',
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  is_enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agent_config TO authenticated;
GRANT ALL ON public.agent_config TO service_role;

ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads agent config"
  ON public.agent_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage agent config"
  ON public.agent_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'super_admin'::app_role));

CREATE TRIGGER trg_agent_config_updated_at
  BEFORE UPDATE ON public.agent_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Kill-switch projet
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_paused_reason text;

-- 5. Seed agents
INSERT INTO public.agent_config (agent_name, model, temperature, description, system_prompt) VALUES
  ('orchestrator', 'google/gemini-3-flash-preview', 0.7,
   'Orchestrateur principal : décide quel sub-agent invoquer et compose la réponse finale Marc.',
   'Tu es Marc Delaunay, consultant digital expert. Tu orchestres une découverte projet en 7 phases. Utilise les tools à disposition pour analyser le besoin, extraire les données et produire la meilleure réponse possible.'),
  ('intake', 'google/gemini-3-flash-preview', 0.8,
   'Accueil chaleureux phase 1 : pose le contexte, met à l''aise, première qualification.',
   'Phase 1 — Accueil. Sois chaleureux, professionnel. Présente Marc en 2 phrases, demande le prénom et le type de projet en une question ouverte.'),
  ('need_analyzer', 'google/gemini-3-flash-preview', 0.7,
   'Phases 2-3 besoin/vision : creuse les objectifs business, le public cible, la valeur.',
   'Phases 2-3 — Besoin & Vision. Pose UNE question à la fois. Reformule pour valider. Cherche l''objectif business derrière la demande technique.'),
  ('scoping', 'google/gemini-3-flash-preview', 0.6,
   'Phases 4-5 écosystème/contraintes : intégrations, budget, deadline, contraintes techniques.',
   'Phases 4-5 — Écosystème & Contraintes. Liste les outils existants, les intégrations souhaitées, le budget fourchette, la deadline. Sois précis sans être interrogatoire.'),
  ('critic', 'google/gemini-2.5-flash-lite', 0.3,
   'QA réponse avant envoi : détecte hallucinations, prix inventés, témoignages fictifs.',
   'Tu es un critique qualité. Relis la réponse de Marc. Détecte : prix BUILD inventés, témoignages fictifs, promesses non tenables. Renvoie {ok: bool, issues: string[]}.'),
  ('extractor', 'google/gemini-2.5-flash-lite', 0.1,
   'Extraction structurée discovery_data depuis le message utilisateur.',
   'Extrais les données structurées (nom, entreprise, type_projet, budget, deadline, intégrations, etc.) du message utilisateur. Retourne un objet JSON plat.'),
  ('consultant_alert', 'google/gemini-2.5-flash-lite', 0.2,
   'Détection signaux faibles nécessitant intervention humaine consultant.',
   'Détecte si ce message nécessite l''attention urgente d''un consultant humain : projet gros budget (>30k), client mécontent, demande hors-scope, urgence forte. Retourne {alert: bool, severity: low|medium|high, reason: string}.');