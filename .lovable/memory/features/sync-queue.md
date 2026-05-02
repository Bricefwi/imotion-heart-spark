---
name: Sync Queue
description: File d'attente persistante avec retries exponentiels, classification d'erreurs et journaux pour synchroniser lovelib↔Clarivi
type: feature
---

# Sync Queue (sync_queue + sync_logs)

File d'attente fiable pour toute synchronisation asynchrone. Garantit la livraison même en cas d'échec temporaire (réseau, downtime, rate-limit) et **classifie automatiquement les erreurs** pour éviter les actions manuelles inutiles.

## Architecture

| Composant | Rôle |
|---|---|
| `sync_queue` | jobs en attente (status, attempts, next_retry_at, payload, dedupe_key) |
| `sync_logs` | 1 ligne par tentative (status: success/failure/partial, durée, erreur, code HTTP) |
| `enqueue_sync_job` | RPC user-authentifié, idempotent |
| `claim_sync_jobs` | claim atomique `FOR UPDATE SKIP LOCKED` |
| `complete_sync_job` | succès |
| `fail_sync_job_classified` | échec **avec classification** (transient/permanent/partial) |
| `fail_sync_job` | (legacy) échec simple — équivalent à transient |
| `requeue_sync_job(id)` | admin: relance manuelle d'un dead_letter |
| Edge function `process-sync-queue` | worker, cron toutes les minutes |

## Classification des erreurs (auto-requeue)

Le worker classifie chaque échec et l'envoie à `fail_sync_job_classified` :

| Kind | Déclenché par | Comportement |
|---|---|---|
| **`transient`** | Erreur réseau, HTTP 408/425/429/5xx, codes PG de connexion/sérialisation, `TransientError` | Backoff exponentiel standard (1m → 6h), consomme une tentative |
| **`permanent`** | HTTP 4xx (sauf 408/425/429), `PermanentError` (payload invalide, type inconnu) | **Dead_letter immédiat** — pas de retry inutile |
| **`partial`** | Handler retourne `{ partial: true, reason, progress }` | Re-queue après **30s**, **n'consomme PAS d'attempt**, sauvegarde le `progress` dans `payload._progress` |

### Reprise sur checkpoint (idempotence pas-à-pas)

Les handlers peuvent lire `payload._progress` pour reprendre où ils s'étaient arrêtés. Exemple `marketing_audit_merge` :
1. Étape 1 — upsert audit ✅ → checkpoint `{ audit_done: true, audit_id }`
2. Étape 2 — merge dans projet ❌ → retourne `partial` avec le checkpoint
3. Re-run 30s plus tard : skip étape 1, retente étape 2

Résultat : pas besoin d'intervention admin pour les pannes intermittentes au milieu d'un job multi-étapes.

## Backoff

| Kind | Délai retry |
|---|---|
| transient — tentative 1→2 | 1 min |
| transient — tentative 2→3 | 5 min |
| transient — tentative 3→4 | 15 min |
| transient — tentative 4→5 | 1 h |
| transient — tentative 5+ | 6 h |
| **partial** | **30 s** (sans consommer d'attempt) |
| permanent | dead_letter immédiat |
| > max_attempts (transient) | dead_letter |

## Job types supportés

- **`marketing_audit_merge`** : payload `{ user_id, project_id?, audit }` — handler reprend sur checkpoint
- **`marketing_webhook_forward`** : payload `{ url, body, headers?, method? }` — fetch HTTP, classifie auto par code statut

Ajouter un handler = ajouter une entrée dans `HANDLERS` dans `process-sync-queue/index.ts`. Le handler peut :
- `throw new TransientError(msg)` / `throw new PermanentError(msg)` pour forcer la classification
- `throw` une `Error` standard → traité comme transient
- `return { partial: true, reason, progress }` pour auto-requeue avec checkpoint

## Idempotence

Index unique partiel `(job_type, dedupe_key) WHERE dedupe_key IS NOT NULL AND status NOT IN ('success','dead_letter')`.

## RLS

- Service role (worker) : full access
- Admins : full access + lecture logs + dashboard `/admin/sync-queue` + `requeue_sync_job`
- Users : lecture de leurs propres jobs/logs

## Monitoring

Dashboard admin `/admin/sync-queue` : stats temps réel, filtres status/job_type, détails de job (payload + historique attempts), bouton "Relancer" pour dead_letter/failed.

```sql
-- Jobs partial en cours d'auto-récupération
SELECT job_type, COUNT(*), MIN(next_retry_at)
FROM sync_queue
WHERE status='pending' AND payload ? '_progress'
GROUP BY 1;

-- Dead-letter à investiguer
SELECT * FROM sync_queue WHERE status='dead_letter' ORDER BY updated_at DESC;
```
