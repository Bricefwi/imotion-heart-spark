-- ─────────────────────────────────────────────────────────────────────────────
-- Missions multi-agents — orchestration parallèle avec garde-fous budgétaires
-- ─────────────────────────────────────────────────────────────────────────────

-- Nouveau type de job pour les missions orchestrées
ALTER TYPE job_type ADD VALUE IF NOT EXISTS 'agent_mission';

-- Table des missions : une mission = un objectif + des vagues d'agents parallèles
CREATE TABLE IF NOT EXISTS public.agent_missions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  mission_type    text NOT NULL,                 -- project_analysis | marketing_plan | contract_review | custom
  objective       text NOT NULL,
  status          text NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','running','completed','partial','failed','budget_exceeded','cancelled')),
  -- Garde-fous budgétaires
  max_cost_eur    numeric(10,4) NOT NULL DEFAULT 1.00,
  cost_eur        numeric(10,5) NOT NULL DEFAULT 0,
  tokens_in       integer NOT NULL DEFAULT 0,
  tokens_out      integer NOT NULL DEFAULT 0,
  -- Exécution
  steps           jsonb NOT NULL DEFAULT '[]',   -- [{ step, agent, status, cost_eur, summary }]
  result          jsonb,                          -- { synthesis_markdown, quality_score, critic_verdict }
  error_message   text,
  agents_used     text[] NOT NULL DEFAULT '{}',
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_missions_project ON public.agent_missions(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_missions_status  ON public.agent_missions(status);
CREATE INDEX IF NOT EXISTS idx_agent_missions_created ON public.agent_missions(created_at DESC);

ALTER TABLE public.agent_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_agent_missions_all" ON public.agent_missions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'consultant'::app_role)
  );
