---
name: SDK Marketing Merge
description: RPC merge_marketing_into_project pour écriture directe lovelib→Clarivi via SDK Supabase
type: feature
---

# merge_marketing_into_project (RPC)

Permet à lovelib (backend partagé) d'écrire un audit directement dans un projet Clarivi via le SDK Supabase, **sans passer par le webhook HMAC**.

## Signature

```sql
merge_marketing_into_project(_project_id uuid, _audit_payload jsonb) RETURNS jsonb
```

## Sécurité

- `SECURITY INVOKER` → RLS de l'appelant respectée
- Vérifie que `auth.uid()` est `client_id`, `consultant_id` ou `admin` du projet
- `GRANT EXECUTE` uniquement à `authenticated` (pas anon)
- Erreurs : `28000` non authentifié, `42501` accès refusé

## Effets

1. Upsert dans `marketing_audits` (clé `(user_id, external_id)` via index unique partiel)
2. Merge non-destructif dans `projects.discovery_data.marketing_audit` (préserve le reste)
3. Insert idempotent dans `audit_to_project_links`
4. Log dans `activities` (action `marketing_audit_merged`)
5. Met à jour `projects.last_activity_at`

## Usage côté lovelib

```ts
await supabase.rpc('merge_marketing_into_project', {
  _project_id: projectId,
  _audit_payload: { external_id, score, summary, recommendations, full_payload }
});
```

## Quand utiliser quoi

| Cas | Méthode |
|---|---|
| User connecté côté lovelib avec session | RPC SDK (cette fonction) |
| Cron / job server-to-server | Webhook HMAC `/marketing-webhook` |
| User pas encore signup | Webhook HMAC |

Référence helper TS : `docs/lovelib-integration/mergeMarketingIntoProject.ts`
