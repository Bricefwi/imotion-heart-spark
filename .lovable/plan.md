
# Plan : suppression de Paperclip + refonte multi-agents vers AI SDK

Objectif : revenir à une architecture 100% Lovable/Supabase, propre, où l'orchestrateur et ses sub-agents spécialisés tournent en Edge Functions via le **Vercel AI SDK** + **tool calling** + **Lovable AI Gateway**. Plus de double stack, plus de webhooks signés, plus de DLQ pour rien.

---

## Phase 1 — Suppression complète de Paperclip

### 1.1 Code
Supprimer :
- `supabase/functions/paperclip-intake/`
- `supabase/functions/paperclip-webhook/`
- `supabase/functions/scripts/mock-webhook.ts`
- `supabase/functions/sql/webhook_nonces_delta.sql`
- entrées `paperclip-*` dans `supabase/config.toml`

Côté `_shared/` : auditer `hmac.ts`, `nonce.ts`, `status.ts` → garder uniquement ce qui sert encore à `marketing-webhook` (HMAC + nonces restent utiles pour lovelib). Supprimer `status.ts` (spécifique Paperclip).

### 1.2 Base de données (migration destructive)
Vérifier d'abord en Live : `SELECT count(*) FROM paperclip_jobs;` etc. Si vide (cas mock), drop direct. Sinon prévenir l'utilisateur avant.

Migration :
- `DROP TABLE public.paperclip_documents CASCADE;`
- `DROP TABLE public.paperclip_job_events CASCADE;`
- `DROP TABLE public.paperclip_jobs CASCADE;`
- `DROP FUNCTION` éventuelles (`v_client_job_status`, helpers RLS Paperclip)
- Conserver `webhook_nonces` (utilisée par `marketing-webhook`)

### 1.3 Secrets
Supprimer : `PAPERCLIP_MOCK`, `PAPERCLIP_MOCK_ENABLED`, `PAPERCLIP_WEBHOOK_SECRET`, `PAPERCLIP_API_URL`, `PAPERCLIP_API_KEY` (s'ils existent).

### 1.4 Types
`src/integrations/supabase/types.ts` sera régénéré automatiquement après la migration.

---

## Phase 2 — Refonte des agents vers AI SDK + tool calling

### 2.1 Nouveau socle partagé
Créer `supabase/functions/_shared/ai-gateway.ts` : helper `createLovableAiGatewayProvider` (pattern officiel knowledge `ai-sdk-lovable-gateway`), utilisé par **toutes** les fonctions IA. Plus de `fetch` brut vers Anthropic ou OpenAI, plus de clé Opus directe.

Dépendances Edge Functions (via `npm:` imports Deno) :
- `npm:ai` (streamText, generateText, tool, Output, stepCountIs)
- `npm:@ai-sdk/openai-compatible`
- `npm:zod`

### 2.2 Architecture cible

```text
                    ┌──────────────────────────┐
                    │   ai-chat (front-facing) │  ← appelée depuis React
                    │   streamText + tools     │
                    └────────────┬─────────────┘
                                 │ tool calls (AI SDK loop, stepCountIs=50)
         ┌───────────────────────┼────────────────────────────┐
         ▼                       ▼                            ▼
   tool: intake            tool: need_analysis        tool: scoping
   (P1 identité +          (P2 vision + outils)       (P3 budget + délai)
    douleur)
         │                       │                            │
         └───────────┬───────────┘                            │
                     ▼                                        ▼
              tool: critic_validate ──────► tool: generate_cdc
                     │                       tool: generate_quote
                     ▼                       tool: notify_consultant
              (anti-hallu + score)
```

**Clé** : l'orchestration disparaît en tant qu'Edge Function séparée. Le **modèle lui-même** orchestre via tool calling natif (pattern recommandé par AI SDK). Un seul point d'entrée : `ai-chat`.

### 2.3 Fonctions à refondre (1 seule fonction = `ai-chat` enrichi)

`supabase/functions/ai-chat/index.ts` devient :
- `streamText({ model: gateway("google/gemini-3-pro-preview"), system: PROMPT_MARC, messages, tools, stopWhen: stepCountIs(50) })`
- `tools` = `{ extract_intake, extract_need, extract_scoping, validate_completeness, generate_cdc, generate_quote, notify_consultant, save_phase_progress }`
- Chaque tool a `inputSchema` Zod + `execute` qui fait le job (souvent un simple `update projects.discovery_data` ou un sous-appel à `generateText` avec `Output.object`).
- Persistance des messages dans `messages` à la fin du stream (pattern `chat-agent-ui-contract`).

### 2.4 Fonctions à supprimer après migration
Une fois `ai-chat` v2 stable :
- `orchestrator/`
- `intake-agent/`
- `need-analyzer/`
- `scoping-agent/`
- `critic-agent/`
- `extractor/`
- `_shared/agent-runner.ts`
- `_shared/agents/prompts.ts` → migré inline dans `ai-chat` (prompt système Marc unique + descriptions de tools)

À garder (utilitaires asynchrones légitimes, pas du conversationnel) :
- `doc-generator/`, `quote-builder/`, `notifier/` → restent comme **fallback async** déclenchables hors chat (cron, action admin manuelle). Mais le tool calling de `ai-chat` les appellera **directement** via HTTP interne (ou code partagé dans `_shared/deliverables/`).

### 2.5 Frontend
`src/lib/ai-chat.ts` + `src/pages/client/ProjectConversation.tsx` :
- Migrer vers `@ai-sdk/react` `useChat` + `DefaultChatTransport` pointant sur `/functions/v1/ai-chat`.
- Rendre `message.parts` (text + tool-invocation) au lieu de `content` plat.
- Garder `react-markdown` pour le rendu texte.
- Persistance threads : la conversation est déjà liée à `project_id` → 1 conversation par projet (pas de threads multiples), pattern "single conversation".

---

## Phase 3 — Validation

1. Tests manuels du flux 7 phases en preview (un projet complet de bout en bout).
2. Vérifier que `discovery_data` est bien rempli phase par phase.
3. Vérifier la génération CDC + devis via tool calls.
4. Vérifier les coûts Lovable AI Gateway (Gemini Pro vs Flash selon tool).
5. Supprimer les anciennes Edge Functions via `supabase--delete_edge_functions`.

---

## Détails techniques

**Modèle par défaut** : `google/gemini-3-pro-preview` pour le chat principal (raisonnement multi-tool) ; `google/gemini-3-flash-preview` pour les extractions simples dans les tools.

**stopWhen** : `stepCountIs(50)` minimum (règle AI SDK pour agents).

**Anti-hallucination** : le tool `validate_completeness` (ex critic-agent) reste obligatoire avant `generate_cdc`. Le modèle ne peut pas générer le CDC sans avoir d'abord appelé `validate_completeness` et reçu `is_valid: true`.

**Persistance** : fin du stream → insert dans `messages` (user + assistant.parts JSON).

**Streaming UI** : `toUIMessageStreamResponse` + headers CORS Supabase Edge.

**Mémoire mise à jour** : ajouter mémoire `mem://tech/architecture.md` pour acter "agents via AI SDK tool calling, plus de DAG orchestrator Edge Function" + retirer toute trace Paperclip de `mem://index.md`.

---

## Ce que tu valides avant que je code

1. Migration destructive sur les 3 tables `paperclip_*` (je vérifie d'abord qu'elles sont vides en Live).
2. Suppression définitive des Edge Functions `orchestrator`, `intake-agent`, `need-analyzer`, `scoping-agent`, `critic-agent`, `extractor` (après que `ai-chat` v2 marche).
3. Migration du frontend `ProjectConversation` vers `@ai-sdk/react` `useChat`.

Si ces 3 points sont OK, j'attaque dans cet ordre : suppression Paperclip → nouveau `ai-chat` v2 avec tools → bascule frontend → suppression anciens agents.
