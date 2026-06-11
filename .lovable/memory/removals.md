---
name: removals
description: Major architectural removals — do not re-suggest these systems
type: constraint
---

## Paperclip integration (removed 2026-06-11)
Backend IA externe sur Hostinger. Abandonné : double stack inutile, latence, fragilité HMAC/webhooks. Tout en Lovable suffit.
- Tables droppées : `paperclip_jobs`, `paperclip_documents`, `paperclip_job_events`
- Edge fns : `paperclip-intake`, `paperclip-webhook`
- Secrets : `PAPERCLIP_MOCK_ENABLED`, `PAPERCLIP_WEBHOOK_SECRET`
- Helper : `_shared/status.ts`
- **Ne jamais re-proposer**. Si besoin async lourd, utiliser sync_queue ou pg_cron.

## Agency V2 stack (removed 2026-06-11)
Système B2B2B pour agences (audit white-label avec tunnel prospect public). Code écrit mais jamais déployé : aucune des tables référencées (`audits`, `audit_links`, `agencies`, `agency_subscriptions`, `agency_users`) n'existait en base. Tout le système d'orchestrator + sub-agents (DAG Opus) ne tournait pas.
- Edge fns supprimées : `orchestrator`, `intake-agent`, `need-analyzer`, `scoping-agent`, `critic-agent`, `extractor`, `doc-generator`, `quote-builder`, `notifier`, `audit-session-start`, `audit-link-create`, `agency-billing-webhook`
- Pages : `AuditTunnel.tsx`, `AuditDone.tsx`, `src/pages/agency/*`
- Contexts : `AgencyContext.tsx` / `AgencyProvider`
- Routes : `/app/dashboard`, `/app/audits/*`, `/audit/:token`, `/audit/:token/done`
- Shared : `_shared/agent-runner.ts`, `_shared/agents/`, `_shared/active-model.ts`, `_shared/types.ts`
- Si tu refais un tunnel B2B2B plus tard, repars de zéro avec AI SDK + tool calling (`_shared/ai-gateway.ts` est déjà prêt).

## Architecture chat actuelle (à préserver)
- **Chat client principal Clarivi** : `src/pages/client/ProjectConversation.tsx` → edge fn `ai-chat` (1080 lignes, format JSON Marc avec `suggestions`/`extracted_data`/`phase_progress`/`consultant_alert`). Ne pas migrer vers `useChat` sans refonte UX complète.
- **Commercial chat landing** : `FloatingChatAgent` + `PricingAIAgent` → edge fn `commercial-agent`.
- Provider : Lovable AI Gateway via `fetch` direct (pas encore migré vers AI SDK). Helper officiel disponible : `supabase/functions/_shared/ai-gateway.ts`.
