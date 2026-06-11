# Refonte orchestration multi-agents + Control Tower admin

## Verdict : réalisable et viable, sans casser la prod

On garde le contrat front actuel (le JSON Marc : `message`, `suggestions`, `extracted_data`, `phase_progress`, `ready_for_next_phase`, `consultant_alert`). On réécrit **uniquement** ce qui se passe à l'intérieur de `ai-chat` : au lieu d'un seul prompt monolithique de 1080 lignes, on a un **orchestrateur AI SDK** qui appelle des **sub-agents spécialisés** via tool calling, et chaque étape produit un **événement** persisté qui alimente le Control Tower.

Aucune migration front obligatoire. `ProjectConversation.tsx` continue de recevoir le même JSON.

---

## 1. Architecture cible

```text
                ┌─────────────────────────────────────────────┐
                │  Frontend ProjectConversation (inchangé)    │
                │  envoie {project_id, messages}              │
                │  reçoit JSON Marc                           │
                └────────────────────┬────────────────────────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────┐
        │  edge: ai-chat  (façade, contrat préservé)         │
        │  - charge contexte projet + phase                  │
        │  - appelle orchestrator.run()                      │
        │  - reformatte la sortie en JSON Marc               │
        └────────────────────┬───────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────────────┐
        │  Orchestrator (AI SDK streamText + tools)          │
        │  modèle : google/gemini-3-flash-preview            │
        │  stopWhen: stepCountIs(50)                         │
        │  décide quel sub-agent invoquer                    │
        └─┬──────┬──────┬───────┬───────┬───────┬────────────┘
          │      │      │       │       │       │
          ▼      ▼      ▼       ▼       ▼       ▼
       intake  need  scoping critic extract  consultant
       phase 1  2-3    4-5    qualité données  alert
        (tools, chaque sub-agent = generateText avec prompt court + schema Zod)

        Chaque appel sub-agent écrit dans:
        ─ agent_runs  (1 ligne par invocation, in/out/tokens/coût/latence)
        ─ project_events  (timeline horodatée, lisible par admin)
```

---

## 2. Modèle de données (3 tables neuves, RLS stricte)

### `agent_runs` — trace technique de chaque appel modèle
- `id`, `project_id`, `message_id` (nullable), `agent_name` (orchestrator|intake|need|scoping|critic|extractor|consultant_alert), `model`, `input_tokens`, `output_tokens`, `latency_ms`, `cost_estimate`, `status` (success|error|killed), `error`, `aig_run_id`, `created_at`
- RLS : lecture admin + consultant assigné ; insert service_role uniquement.

### `project_events` — timeline métier visible Control Tower
- `id`, `project_id`, `event_type` (message_in, message_out, phase_advanced, data_extracted, document_generated, consultant_alert, agent_invoked, agent_failed, manual_intervention, kill_switch), `actor` (user|agent|system|admin), `actor_id`, `payload` (jsonb), `phase`, `created_at`
- RLS : lecture admin + client/consultant du projet ; insert service_role + RPC.
- Realtime activé.

### `agent_config` — pilotage admin (modèle, prompt, kill-switch)
- `id`, `agent_name` (unique), `model`, `system_prompt`, `is_enabled` (bool, kill-switch), `temperature`, `updated_by`, `updated_at`
- RLS : lecture authenticated ; write admin/super_admin seulement.
- Seed initial : 1 ligne par agent avec le prompt actuel extrait des 1080 lignes.

---

## 3. Refonte `ai-chat` (façade + orchestrateur)

Découpage de `supabase/functions/ai-chat/index.ts` en :

```text
supabase/functions/ai-chat/
  index.ts                  ← façade HTTP, contrat JSON Marc préservé
  orchestrator.ts           ← AI SDK streamText + tool registry
  agents/
    intake.ts               ← phase 1 accueil
    need-analyzer.ts        ← phases 2-3 besoin/vision
    scoping.ts              ← phases 4-5 écosystème/contraintes
    critic.ts               ← QA réponse avant envoi
    extractor.ts            ← extraction discovery_data structurée
    consultant-alert.ts     ← détection signaux faibles → alerte admin
  tools.ts                  ← définitions AI SDK (tool, inputSchema, execute)
  events.ts                 ← helper insertProjectEvent + insertAgentRun
  formatter.ts              ← convertit sortie orchestrateur → JSON Marc
```

Règles :
- Provider unifié via `_shared/ai-gateway.ts` (déjà créé).
- Chaque sub-agent = `generateText` avec `Output.object` Zod, sortie compacte.
- L'orchestrateur lit `agent_config` en début de requête (cache 30s) pour appliquer kill-switch et modèle dynamique.
- Si un agent est désactivé, l'orchestrateur skip et l'événement `agent_skipped` est loggé.
- Toute exception sub-agent → `project_events.agent_failed` + fallback gracieux (Marc répond quand même, juste sans cette capacité).

---

## 4. Control Tower admin — 4 surfaces

### A. `/admin/control-tower` — vue temps réel (nouveau)
Liste live de tous les projets actifs (status ≠ archived) :
- Code projet, client, phase courante (1-7), progress %, dernier message (extrait), dernière activité, badge alerte consultant.
- Realtime sur `project_events` → la ligne clignote quand un nouvel event arrive.
- Filtres : phase, consultant assigné, projets en alerte, projets inactifs >24h.
- Tri : dernière activité desc par défaut.

### B. `/admin/projects/:id/timeline` — timeline événements (extension `ProjectDetail` existant)
- Liste verticale des `project_events` du projet, groupée par jour.
- Chaque event affiche : icône type, acteur, payload formaté, latence si agent.
- Bouton "Voir run agent" → drawer avec input/output/tokens/coût du `agent_runs` lié.

### C. `/admin/agents` — pilotage (nouveau)
- Tableau des `agent_config` : nom, modèle actif, statut (enabled/killed), dernière modif.
- Édition inline : changer le modèle (select des modèles Lovable AI), éditer le system prompt (textarea + preview), toggle kill-switch.
- Graphes : invocations/24h, latence p50/p95, taux d'erreur, coût cumulé du jour (depuis `agent_runs`).
- Bouton "Tester ce prompt" → envoi d'un message factice à l'agent isolé.

### D. Intervention manuelle sur projet (extension `ProjectDetail`)
Actions admin :
- **Forcer transition de phase** : RPC `admin_advance_phase(project_id, target_phase)` → écrit event `manual_intervention`.
- **Injecter message système** : ajoute un `messages.role='system'` qui guide Marc au prochain tour.
- **Rejouer dernier tour** : recharge le dernier user message, relance l'orchestrateur en mode dry-run, affiche le diff de réponse.
- **Réassigner consultant** : update `projects.consultant_id` + notif Brevo.
- **Kill-switch projet** : flag `projects.ai_paused = true`, `ai-chat` renvoie alors un message "Un consultant prend le relais" jusqu'à reprise.

---

## 5. Plan d'exécution (5 lots, livrables intermédiaires)

| Lot | Contenu | Durée | Risque |
|-----|---------|-------|--------|
| 1 | Migration BDD : 3 tables + RLS + realtime + seed `agent_config` | 0.5j | nul |
| 2 | Refactor `ai-chat` en orchestrator + sub-agents, sortie identique, tests unitaires sur le formatter | 3j | moyen — testé en preview avant publish |
| 3 | Page `/admin/control-tower` + realtime + filtres | 1.5j | faible |
| 4 | Page `/admin/agents` + édition prompts + métriques | 1.5j | faible |
| 5 | Timeline + interventions manuelles dans `ProjectDetail` | 1.5j | faible |

**Total : ~8 jours.** Lot 2 livré derrière feature flag `orchestrator_v2` (localStorage admin) → on bascule progressivement, rollback instantané en remettant l'ancien `ai-chat` (gardé en `ai-chat-legacy/index.ts` pendant 2 semaines).

---

## 6. Viabilité — points de vigilance

- **Coût LLM** : 5 sub-agents par tour au lieu d'1 = ~3-5× le coût. Mitigation : sub-agents critic/extractor en `gemini-2.5-flash-lite`, seul l'orchestrateur en `gemini-3-flash-preview`. Estimation +40 % de coût pour +qualité mesurable.
- **Latence** : sub-agents en parallèle via `Promise.all` quand indépendants (extractor + consultant-alert peuvent tourner pendant que l'orchestrateur stream). Objectif p95 < 4s (vs ~2s aujourd'hui).
- **Format Marc préservé** : non négociable, sinon `ProjectConversation.tsx` casse. Le `formatter.ts` est le garde-fou — tests unitaires obligatoires sur 20 cas réels extraits de la prod.
- **Rollback** : feature flag + `ai-chat-legacy` gardé 14 jours.

---

## 7. Ce qu'on NE fait pas (et pourquoi)

- Pas de refonte du front chat (`useChat` AI SDK) → casserait le contrat Marc, gain UX nul.
- Pas de DAG persisté type Paperclip avec états `queued/processing/waiting_validation` → la conversation Clarivi est synchrone par tour, pas un job long. Les `project_events` couvrent le besoin de traçabilité sans complexité de queue.
- Pas de réintroduction du tunnel agences B2B supprimé (mémoire `removals.md`).

Validation attendue avant build : OK sur l'architecture, OK sur le périmètre Control Tower (4 surfaces A/B/C/D), OK sur le plan en 5 lots.
