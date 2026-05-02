---
name: Sync Queue
description: File d'attente persistante avec retries exponentiels et journaux pour synchroniser lovelib↔Clarivi
type: feature
---

# Sync Queue (sync_queue + sync_logs)

File d'attente fiable pour toute synchronisation asynchrone. Garantit la livraison même en cas d'échec temporaire (réseau, downtime, rate-limit).

## Architecture

| Composant | Rôle |
|---|---|
| `sync_queue` | jobs en attente (status, attempts, next_retry_at, payload, dedupe_key) |
| `sync_logs` | 1 ligne par tentative (durée, erreur, code HTTP, snippet réponse) |
| `enqueue_sync_job(type, payload, dedupe_key, project_id, max_attempts)` | RPC user-authentifié, idempotent |
| `claim_sync_jobs(worker_id, batch_size, lease_seconds)` | claim atomique `FOR UPDATE SKIP LOCKED` |
| `complete_sync_job` / `fail_sync_job` | finalisation + log auto |
| `requeue_sync_job(id)` | admin: relance un dead_letter |
| Edge function `process-sync-queue` | worker, triggered par cron toutes les minutes |
| Cron `process-sync-queue-every-minute` | * * * * * → worker (auth via `x-cron-secret`) |

## Backoff exponentiel

| Tentative | Délai avant retry |
|---|---|
| 1 → 2 | 1 min |
| 2 → 3 | 5 min |
| 3 → 4 | 15 min |
| 4 → 5 | 1 h |
| 5+ | 6 h |
| Après `max_attempts` | `dead_letter` (visible admin, requeue manuel possible) |

`max_attempts` configurable par job (défaut 5, max 10).

## Job types supportés

- **`marketing_audit_merge`** : payload `{ user_id, project_id?, audit }` — équivalent fiable de `merge_marketing_into_project` mais via worker
- **`marketing_webhook_forward`** : payload `{ url, body, headers?, method? }` — POST HTTP générique avec retry

Ajouter un handler = ajouter une entrée dans `HANDLERS` dans `supabase/functions/process-sync-queue/index.ts`.

## Idempotence

Index unique partiel `(job_type, dedupe_key) WHERE dedupe_key IS NOT NULL AND status NOT IN ('success','dead_letter')`. Enqueuer 2x avec la même `dedupe_key` retourne le job existant.

## RLS

- Service role (worker) : full access
- Admins : full access + lecture logs
- Users : lecture de leurs propres jobs/logs (via `related_user_id`, `created_by`, ou propriétaire du `related_project_id`)

## Usage côté lovelib

```ts
// Au lieu d'appeler merge_marketing_into_project directement (fragile),
// enqueue dans la file qui retentera automatiquement :
await supabase.rpc('enqueue_sync_job', {
  _job_type: 'marketing_audit_merge',
  _payload: { user_id, project_id, audit },
  _dedupe_key: auditExternalId,  // idempotence
  _related_project_id: project_id,
  _max_attempts: 5,
});
```

## Monitoring

```sql
-- Jobs en attente
SELECT job_type, COUNT(*), MIN(next_retry_at)
FROM sync_queue WHERE status='pending' GROUP BY 1;

-- Dead-letter à investiguer
SELECT * FROM sync_queue WHERE status='dead_letter' ORDER BY updated_at DESC;

-- Historique d'un job
SELECT * FROM sync_logs WHERE job_id='...' ORDER BY created_at;
```
