---
name: Dead-letter alerts
description: Trigger notify_admins_on_dead_letter — quand un sync_queue.status passe à dead_letter, notifie tous les admins (in-app type='system') + log activité
type: feature
---

## Trigger
`trg_notify_admins_on_dead_letter` AFTER UPDATE OF status ON sync_queue
WHEN (NEW.status = 'dead_letter' AND OLD.status IS DISTINCT FROM 'dead_letter')

## Comportement
- 1 notification par admin (`user_roles.role = 'admin'`)
- `type = 'system'` (whitelist `notifications_type_check`)
- `title` = "Job en dead-letter : {job_type}"
- `body` = job_type + UUID + attempts + last_error (tronqué 280 chars)
- `link` = `/admin/sync-queue?job={uuid}` (deep-link supporté par SyncQueue.tsx)
- `sent_via` jsonb = { kind: 'sync_dead_letter', job_id, job_type, attempts, dedupe_key }
- Activity log `action='sync_job_dead_letter'`, `importance='high'` si created_by NOT NULL

## Email
Pas d'email direct. Pour ajouter : enqueue un job `notification_email` via sync_queue
(handler à créer dans process-sync-queue), réutilise infra retry/DLQ existante.
