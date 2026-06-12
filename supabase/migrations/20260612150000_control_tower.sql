-- ─────────────────────────────────────────────────────────────────────────────
-- Control Tower — messagerie C-suite → DG (rapports, alertes, directives)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.control_tower_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist      text NOT NULL CHECK (specialist IN (
                    'daf','marketing_dir','commercial_dir','rh',
                    'juridix','dg','system'
                  )),
  direction       text NOT NULL DEFAULT 'to_dg'
                  CHECK (direction IN ('to_dg','from_dg','broadcast')),
  category        text NOT NULL DEFAULT 'report'
                  CHECK (category IN ('report','alert','directive','decision','recommendation','briefing')),
  title           text NOT NULL,
  content_markdown text NOT NULL,
  priority        text NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','critical')),
  -- Liens optionnels
  mission_id      uuid REFERENCES public.agent_missions(id) ON DELETE SET NULL,
  project_id      uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  -- KPIs extraits de la mission (stockés ici pour affichage sans re-requêter)
  kpis            jsonb,
  -- Lecture
  read_at         timestamptz,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_specialist ON public.control_tower_messages(specialist);
CREATE INDEX IF NOT EXISTS idx_ct_priority   ON public.control_tower_messages(priority);
CREATE INDEX IF NOT EXISTS idx_ct_created    ON public.control_tower_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ct_unread     ON public.control_tower_messages(read_at) WHERE read_at IS NULL;

ALTER TABLE public.control_tower_messages ENABLE ROW LEVEL SECURITY;

-- Accès réservé admin / super_admin / consultant
CREATE POLICY "admin_control_tower_all" ON public.control_tower_messages
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
