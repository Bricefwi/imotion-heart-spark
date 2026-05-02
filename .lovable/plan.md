
# Plan — Fusion Clarivi (BUILD) + lovelib-spyglass (MARKETING)

## 1. Constat après analyse

**Clarivi (`imotion-heart-spark`)** = Couvre le **"QUOI construire"**
- Chat IA "Marc Delaunay" 7 phases → CDC → Devis → Contrat → Build
- Cible : entrepreneurs qui savent qu'ils veulent un site/app

**lovelib-spyglass** = Couvre le **"POURQUOI / À QUI vendre"**
- Pré-audit automatique depuis URL, agent conversationnel "Alex"
- Orchestrateur multi-agent v8 (17 agents IA) → audit stratégique
- Scénarios ROI, plan 90j, KPIs, intégration Power BI / Metabase
- Veille IA, blog SEO, lead scoring B2B
- Cible : dirigeants qui veulent comprendre leur marché et performer

**Constat clé** : Les deux projets sont **complémentaires**, pas redondants. Le marketing répond à *"que dois-je faire pour vendre ?"*, Clarivi répond à *"comment je le construis ?"*.

## 2. Vision : entonnoir d'engagement commercial unifié

```text
                 ┌─────────────────────────────────────┐
                 │   imotion.fr (landing principale)   │
                 │   "De la stratégie à la livraison"  │
                 └──────────────┬──────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
    ┌──────────────────┐              ┌──────────────────┐
    │ marketing.imotion │              │  app.imotion.fr   │
    │  (lovelib)        │              │   (Clarivi)       │
    │                   │              │                   │
    │ AUDIT             │              │ CDC + DEVIS       │
    │ → Pré-audit URL   │              │ → Chat 7 phases   │
    │ → Agent Alex      │              │ → CDC pro         │
    │ → 17 agents IA    │              │ → Contrat signé   │
    │ → Plan 90j + ROI  │              │ → Livraison       │
    └────────┬──────────┘              └─────────▲────────┘
             │                                   │
             │ "Votre stratégie nécessite        │
             │  un site/app → on s'en occupe"    │
             └───────────────────────────────────┘
                  PASSERELLE COMMERCIALE
```

**Inversement** : Un client qui arrive sur Clarivi sans stratégie claire est invité vers l'audit marketing.

## 3. Architecture technique

### Option retenue : Backend partagé + 2 frontends

```text
                ┌────────────────────────────────────┐
                │     SUPABASE — npmkzqxoxobfqdqpnsgf │
                │     (backend Clarivi devient maître) │
                └────────┬───────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   ┌────▼─────────┐               ┌───────▼──────────┐
   │ app.imotion  │               │ marketing.imotion│
   │ (Clarivi)    │◄────SSO──────►│ (lovelib repointé)│
   │              │               │                  │
   │ Tables :     │               │ Tables ajoutées :│
   │ profiles     │               │ marketing_audits │
   │ user_roles   │               │ audit_agents     │
   │ projects     │               │ audit_runs       │
   │ messages     │               │ audit_reports    │
   │ documents    │               │ market_intel     │
   │ ...          │               │ ...              │
   └──────────────┘               └──────────────────┘
```

**Pourquoi Clarivi devient le maître** : Il porte déjà l'auth Lovable Cloud, les rôles `client/consultant/admin/super_admin`, les politiques RLS éprouvées, le système d'emails Brevo, les notifications, et le composant Logo IMOTION officiel.

### Tables marketing à migrer dans Clarivi (préfixées)

Pour éviter conflits avec les tables existantes de Clarivi, toutes les tables venant de lovelib seront préfixées `mkt_` :

```sql
-- Table pivot : un audit marketing
mkt_audits (
  id uuid pk,
  user_id uuid,            -- lié à profiles.id (Clarivi)
  project_id uuid,         -- lien optionnel vers projects (passerelle)
  source_url text,         -- URL du site analysé
  audit_type text,         -- 'gratuit' | 'premium'
  status text,             -- pending, running, completed
  current_phase text,      -- preaudit, conversation, orchestration, report
  conversation_summary jsonb,
  scenarios jsonb,         -- ambitieux, raisonnable, conservateur
  action_plan_90d jsonb,
  kpis jsonb,
  budget_allocation jsonb,
  risks jsonb,
  pdf_storage_path text,
  created_at, updated_at
)

-- Conversations agent Alex (équivalent de messages côté Clarivi)
mkt_conversations (audit_id, role, content, agent_name, phase, ...)

-- Runs de l'orchestrateur multi-agent v8
mkt_orchestrator_runs (audit_id, version, agents_invoked, total_tokens, status)

-- Veille concurrentielle
mkt_market_intelligence (audit_id, snapshot_data, scanned_at, ...)

-- Articles blog marketing (peuvent fusionner avec blog_posts existant via category='marketing')
```

### Edge Functions à migrer
Toutes les functions de lovelib (`audit-generate`, `conversational-agent-alex`, `orchestrate-multi-agent-v8`, `market-intelligence`, `preaudit`, `validate-company-siret`, etc.) sont copiées telles quelles dans `supabase/functions/` de Clarivi. Aucun renommage nécessaire car aucun conflit de nom avec les functions actuelles.

### SSO entre `app.` et `marketing.`
Une fois les 2 sous-domaines configurés sur le même domaine racine `imotion.fr`, le cookie de session Lovable Cloud est automatiquement partagé. **Un seul login** pour les 2 apps.

## 4. Passerelles commerciales (le cœur de la valeur)

### Passerelle A : Marketing → BUILD (le scénario principal)

À la fin de l'audit marketing, l'agent Alex détecte des recommandations qui nécessitent un site/app :
- "Refonte du site web obligatoire pour passer à 50K visites/mois"
- "Lancement d'une plateforme e-commerce pour atteindre l'objectif ROI"
- "Création d'une web-app SaaS pour le module recommandé"

Action automatique :
1. CTA dans le rapport audit : **"Concrétiser ce projet web"**
2. Création d'un `project` dans Clarivi avec :
   - `client_id` = même user
   - `discovery_data` pré-rempli depuis `mkt_audits` (cible, marché, budget, KPIs)
   - `name` = recommandation issue de l'audit
3. Redirection vers `app.imotion.fr/client/projects/:id`
4. L'agent Marc démarre par : *"Je vois que ton audit marketing recommande [X]. Validons ensemble les éléments techniques."*

### Passerelle B : BUILD → Marketing (upsell)

Lors de la phase 2 ou 3 du chat Marc, si Marc détecte que le client n'a pas de stratégie claire (pas de cible définie, pas d'analyse concurrentielle, pas de KPIs) → suggère un audit marketing en parallèle.

Action :
1. Notification dans Clarivi : *"Avant d'aller plus loin, un audit stratégique gratuit pourrait sécuriser ton ROI"*
2. CTA → `marketing.imotion.fr/audit-gratuit?from_project=:id`
3. À la fin de l'audit, retour automatique au projet Clarivi avec données enrichies

### Passerelle C : Cross-sell post-livraison

Une fois un projet Clarivi livré (`status = completed`), trigger automatique :
- Email J+15 : *"Ton site est en ligne. Maintenant, faisons-le performer → audit marketing offert"*
- Notification in-app vers `marketing.imotion.fr`

### Passerelle D : Vue unifiée client (Dashboard "360°")

Nouvelle page dans `app.imotion.fr/client/dashboard` :
- Section **"Mes projets BUILD"** (existant)
- Section **"Mes audits MARKETING"** (nouveau, lit `mkt_audits` du même user)
- Timeline unifiée : voir l'historique audit → CDC → contrat → livraison → audit suivi

## 5. Étapes d'exécution concrètes

| # | Étape | Durée | Livrable |
|---|---|---|---|
| 1 | Audit cross-projet détaillé (lecture des 30 functions + 60 migrations) | 1 session | Inventaire complet |
| 2 | Migration SQL : créer toutes les tables `mkt_*` dans Supabase Clarivi | 1 session | Migration unique |
| 3 | Copier les 30 Edge Functions de lovelib vers `supabase/functions/` de Clarivi + adapter les imports | 2 sessions | Functions déployées |
| 4 | Repointer le frontend lovelib-spyglass vers le Supabase de Clarivi (changement env + clés) | 1 session | Front opérationnel sur backend partagé |
| 5 | Implémenter Passerelle A (audit → projet) côté lovelib | 1 session | Bouton + création de projet |
| 6 | Implémenter Passerelle B (projet → audit) côté Clarivi | 1 session | Détection Marc + CTA |
| 7 | Implémenter Passerelle D (dashboard 360°) côté Clarivi | 1 session | Section "Mes audits" |
| 8 | Configurer le domaine `imotion.fr` + sous-domaines `app.` et `marketing.` | 1 session | DNS + SSL actifs |
| 9 | Implémenter Passerelle C (cross-sell email post-livraison) | 1 session | Edge function trigger |
| 10 | Tests end-to-end du parcours complet | 1 session | Validation |

**Total estimé** : ~10 sessions de travail.

## 6. Risques & arbitrages

### Risques identifiés
1. **Volume de migrations SQL de lovelib (60 fichiers)** → certains peuvent contenir des opérations qui entrent en conflit avec le schéma Clarivi (ex: deux tables `profiles`). **Mitigation** : préfixer toutes les nouvelles tables `mkt_` et ne jamais toucher aux tables existantes de Clarivi.
2. **Coûts AI** : 17 agents orchestrés en v8 = élevé. **Mitigation** : garder l'audit gratuit en V1 light (pré-audit + Alex seul), réserver v8 au premium payant.
3. **Auth différente** : lovelib utilise `supabase.auth` direct, Clarivi utilise le wrapper `lovable.auth`. **Mitigation** : aligner sur le wrapper Lovable lors de la migration du front.
4. **Logo / branding** : lovelib a son propre logo IMOTION. **Action** : utiliser le `Logo.tsx` officiel de Clarivi sur les deux apps.

### Hors scope V1
- Fusion des deux blogs (garder 2 espaces de contenu distincts pour V1, fusion en V2)
- Migration des données utilisateurs existants de lovelib (à faire si comptes réels en prod)
- Refonte UX complète de lovelib pour matcher 100 % Clarivi (V1 = unification logo + couleurs uniquement)

## 7. Questions avant build

1. **Domaine** : `imotion.fr` est-il déjà à toi, ou faut-il l'acquérir via Lovable ?
2. **Données existantes** : Y a-t-il des utilisateurs/audits réels dans le Supabase actuel de lovelib qu'il faut préserver, ou peut-on partir sur une base vide ?
3. **Priorité passerelles** : On commence par laquelle ? Recommandation : **Passerelle A** (Marketing → BUILD) d'abord, c'est elle qui génère le plus de revenu.
4. **Stratégie audit gratuit** : On garde le freemium "audit gratuit" comme aimant à leads, ou on le rend payant directement ?

---

**Réponds à ces 4 questions et je passe en mode build pour exécuter les étapes 1 à 4 dans la première itération.**
