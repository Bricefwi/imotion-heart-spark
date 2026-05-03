# AUDIT V1 — imotion-heart-spark
> Rapport généré le 2026-05-03 — Clarivi V2 Pivot

## 1. Edge Functions existantes

| Edge Function | Statut V2 | Raison |
|---|---|---|
| `ai-chat` | **REMPLACER** | Remplacée par intake-agent, need-analyzer, scoping-agent |
| `commercial-agent` | **REMPLACER** | Remplacé par orchestrator |
| `generate-document` | **REMPLACER** | Remplacé par doc-generator + quote-builder |
| `send-cdc-email` | **REMPLACER** | Remplacé par notifier |
| `process-scheduled-cdc` | **REMPLACER** | Logique CDC → doc-generator |
| `process-sync-queue` | **REMPLACER** | Obsolète V2 |
| `auth-email-hook` | **CONSERVER** | Infrastructure auth |
| `send-email` | **CONSERVER** | Infrastructure email générique |
| `send-transactional-email` | **CONSERVER** | Infrastructure email transactionnel |
| `generate-blog-post` | **CONSERVER** | Marketing |
| `marketing-webhook` | **CONSERVER** | Marketing |
| `claim-lovelib-token` | **CONSERVER** | Intégration Lovelib existante |
| `verify-lovelib-token` | **CONSERVER** | Intégration Lovelib existante |
| `issue-bridge-token` | **CONSERVER** | Bridge SSO |
| `consume-bridge-token` | **CONSERVER** | Bridge SSO |
| `admin-bridge-secret` | **CONSERVER** | Admin SSO |
| `admin-sso-debug` | **CONSERVER** | Debug SSO |
| `process-email-queue` | **CONSERVER** | Queue email générique |

## 2. Nouvelles Edge Functions V2 (à créer)

| Edge Function | Rôle |
|---|---|
| `orchestrator` | DAG dispatcher, route vers agents |
| `intake-agent` | Phase 1 conversationnelle |
| `need-analyzer` | Phase 2 (vision + outils + features) |
| `scoping-agent` | Phase 3 (budget + délai + décideurs) |
| `critic-agent` | Validation finale + scoring |
| `doc-generator` | Génère cahier des charges |
| `quote-builder` | Génère devis chiffré |
| `extractor` | Parse entités (support) |
| `notifier` | Email agence après audit |
| `audit-link-create` | Créer lien d'audit |
| `audit-session-start` | Initialiser session prospect |
| `agency-billing-webhook` | Stripe → Supabase |

## 3. Pages front existantes

| Route | Statut V2 |
|---|---|
| `/` | **RÉÉCRIRE** → Landing B2B2B agences |
| `/tarifs` | **RÉÉCRIRE** → Plans Starter/Pro/Agency |
| `/fonctionnalites` | **RÉÉCRIRE** → Features pour agences |
| `/client/dashboard` | **REMPLACER** → `/app/dashboard` |
| `/client/projects` | **REMPLACER** → `/app/audits` |
| `/client/projects/:id` | **REMPLACER** → `/app/audits/:id` |
| Tunnel 7 phases | **REMPLACER** → `/audit/:token` (3 phases) |
| `/consultant/*` | **SUPPRIMER** → V2 = SaaS multi-tenant |
| `/admin/*` | **CONSERVER** → Admin interne |

## 4. Pages V2 à créer (P0 bloquantes)

| Route | Description |
|---|---|
| `/app/dashboard` | Dashboard agence (audits actifs, quotas) |
| `/app/audits` | Liste audits + filtres |
| `/app/audits/new` | Créer lien d'audit |
| `/app/audits/:id` | Détail audit + docs |
| `/app/branding` | White-label (logo, couleurs) |
| `/app/pricing-templates` | Grille tarifaire agence |
| `/app/billing` | Plan + Stripe |
| `/audit/:token` | Tunnel prospect (3 phases conversationnelles) |
| `/audit/:token/done` | Remerciement + récap |

## 5. Tables Supabase à créer (V2 multi-tenant)

- `agencies` — tenant principal
- `agency_users` — utilisateurs par agence
- `agency_subscriptions` — plan Stripe
- `agency_branding` — white-label
- `agency_pricing_templates` — grille tarifaire
- `audit_links` — liens d'audit tokenisés
- `audits` — sessions prospect
- `audit_messages` — historique conversationnel
- `audit_documents` — CDC + devis générés
- `usage_metrics` — compteurs quotas

## 6. Modèle économique cible

| Plan | Prix HT/mois | Audits/mois | White-label |
|---|---|---|---|
| **Free trial** | 0 € (14j, 5 audits) | 5 | Limité |
| **Starter** | 79 € | 20 | Logo + couleurs |
| **Pro** ⭐ | 199 € | 100 | Complet |
| **Agency** | 399 € | Illimité | Complet + domaine custom |
