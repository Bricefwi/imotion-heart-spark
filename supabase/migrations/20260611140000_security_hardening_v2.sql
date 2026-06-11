-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY HARDENING V2 — Correction de toutes les vulnérabilités détectées
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- CRITIQUE 1 — Storage : politique lisant projects.name au lieu de objects.name
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Project members can read documents"   ON storage.objects;
DROP POLICY IF EXISTS "Project members can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete documents"          ON storage.objects;

-- Reconstruction avec référence explicite à storage.objects.name
CREATE POLICY "Project members can read documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE id::text = (string_to_array(storage.objects.name, '/'))[1]
          AND (client_id = auth.uid() OR consultant_id = auth.uid())
      )
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Project members can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND (client_id = auth.uid() OR consultant_id = auth.uid())
    )
  );

CREATE POLICY "Staff can delete documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (
      public.has_role(auth.uid(), 'consultant')
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- CRITIQUE 2 — newsletter_subscribers : SELECT public → admin uniquement
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public read own subscription"    ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can read subscriptions"   ON public.newsletter_subscribers;

-- Seul l'admin (ou service_role via Edge Function) peut lire les emails
CREATE POLICY "Admins read subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════════════════════════════════════
-- CRITIQUE 3 — messages INSERT : injection de rôle consultant/système
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Members create messages" ON public.messages;

CREATE POLICY "Members create messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    -- L'utilisateur doit appartenir au projet
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id
        AND (client_id = auth.uid() OR consultant_id = auth.uid())
    )
    AND (
      -- Admin peut insérer n'importe quel rôle
      public.has_role(auth.uid(), 'admin')
      OR (
        -- Consultant peut insérer role 'consultant' ou 'system'
        public.has_role(auth.uid(), 'consultant')
        AND role IN ('consultant', 'system')
        AND EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND consultant_id = auth.uid())
      )
      OR (
        -- Client ne peut insérer qu'avec role 'client'
        NOT public.has_role(auth.uid(), 'consultant')
        AND NOT public.has_role(auth.uid(), 'admin')
        AND role = 'client'
        AND EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND client_id = auth.uid())
      )
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- CRITIQUE 4 — projects UPDATE : colonnes internes modifiables par les clients
-- Implémenté via trigger car RLS ne supporte pas la restriction par colonne
-- ══════════════════════════════════════════════════════════════════════════════

-- Trigger qui rejette toute tentative de modifier les champs réservés
CREATE OR REPLACE FUNCTION public.guard_client_project_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Si l'appelant est admin ou consultant, on laisse passer
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'consultant') THEN
    RETURN NEW;
  END IF;

  -- Champs interdits aux clients
  IF NEW.internal_notes    IS DISTINCT FROM OLD.internal_notes    OR
     NEW.status            IS DISTINCT FROM OLD.status            OR
     NEW.contract_amount   IS DISTINCT FROM OLD.contract_amount   OR
     NEW.consultant_id     IS DISTINCT FROM OLD.consultant_id     OR
     NEW.qualification_score IS DISTINCT FROM OLD.qualification_score
  THEN
    RAISE EXCEPTION 'Permission denied: cannot modify internal project fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_client_project_update ON public.projects;
CREATE TRIGGER trg_guard_client_project_update
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_client_project_update();

-- ══════════════════════════════════════════════════════════════════════════════
-- CRITIQUE 5 — Realtime : abonnement cross-user possible
-- Restreindre les canaux en activant RLS sur realtime.messages
-- ══════════════════════════════════════════════════════════════════════════════

-- Activer RLS sur la table Realtime Supabase (broadcast & presence)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users subscribe own topics" ON realtime.messages;
CREATE POLICY "Authenticated users subscribe own topics"
  ON realtime.messages FOR SELECT
  USING (
    -- Un utilisateur ne peut recevoir que ses propres messages ou ceux de ses projets
    auth.uid() IS NOT NULL
    AND (
      -- Messages/notifications adressés à cet utilisateur
      (extension = 'broadcast' AND (realtime.messages.filters->>'user_id')::uuid = auth.uid())
      -- Canal de projet dont l'utilisateur est membre
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE id::text = ANY(string_to_array(topic, ':'))
          AND (client_id = auth.uid() OR consultant_id = auth.uid())
      )
      -- Admin peut tout voir
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- AVERTISSEMENT 6 — document_templates : lecture publique → authentifié requis
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Anyone can read active document templates" ON public.document_templates;

CREATE POLICY "Authenticated read active document templates"
  ON public.document_templates FOR SELECT
  USING (
    is_active = TRUE
    AND auth.role() IN ('authenticated', 'service_role')
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- AVERTISSEMENT 7 — activities INSERT : pas de vérification du projet
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users create activities" ON public.activities;

CREATE POLICY "Users create activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Vérifier que le projet appartient à l'utilisateur
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = project_id
          AND (client_id = auth.uid() OR consultant_id = auth.uid())
      )
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- AVERTISSEMENT 8 — suppressed_emails : admin doit pouvoir lire
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins read suppressed emails" ON public.suppressed_emails;

CREATE POLICY "Admins read suppressed emails"
  ON public.suppressed_emails FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR public.has_role(auth.uid(), 'admin')
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- AVERTISSEMENT 10/12 — SECURITY DEFINER : révoquer EXECUTE aux rôles publics
-- pour les fonctions non destinées à être appelées directement
-- ══════════════════════════════════════════════════════════════════════════════

-- Révoquer l'accès anon aux fonctions de queue email (usage interne uniquement)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB)        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT)  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT)        FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM anon;

-- has_role est utilisée dans les politiques RLS — doit rester accessible
-- mais limiter aux rôles nécessaires
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon;
GRANT  EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated, service_role;

-- ══════════════════════════════════════════════════════════════════════════════
-- AVERTISSEMENT 14 — search_path mutable : fixer les fonctions non sécurisées
-- ══════════════════════════════════════════════════════════════════════════════

-- Corriger increment_post_views
CREATE OR REPLACE FUNCTION public.increment_post_views(post_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE slug = post_slug;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- Commentaire : actions hors migration SQL
-- ══════════════════════════════════════════════════════════════════════════════
-- AVERTISSEMENT 11 (Leaked password protection) :
--   → À activer dans Supabase Dashboard > Auth > Security > Leaked Password Protection
--
-- AVERTISSEMENT 9 (process-scheduled-cdc anon key fallback) :
--   → Corrigé dans l'Edge Function (voir supabase/functions/process-scheduled-cdc/index.ts)
--
-- AVERTISSEMENT 13 (Extensions in public) :
--   → Les extensions pg_net, unaccent sont dans le schéma 'extensions', non 'public'
--   → Vérifier via : SELECT extname, extnamespace::regnamespace FROM pg_extension;
-- ─────────────────────────────────────────────────────────────────────────────
