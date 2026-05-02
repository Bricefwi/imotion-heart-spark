---
name: Marketing Webhook
description: Endpoint sécurisé recevant discovery_data depuis lovelib (HMAC + anti-replay)
type: feature
---

# marketing-webhook

Edge function publique (`verify_jwt = false`) qui reçoit `discovery_data` à la fin du workflow d'audit marketing lovelib.

## Sécurité (3 couches)

1. **HMAC-SHA256** : signature dans `x-webhook-signature` calculée sur `${timestamp}.${nonce}.${rawBody}` avec `MARKETING_WEBHOOK_SECRET` (partagé Clarivi ↔ lovelib). Comparaison en temps constant.
2. **Timestamp** : header `x-webhook-timestamp` (unix sec), tolérance ±5 min.
3. **Nonce** : header `x-webhook-nonce` (8-128 chars), persisté dans `webhook_nonces` (PK = nonce, TTL 15 min, RLS service_role only). Un replay = `409`.

## Côté émetteur (lovelib)

```ts
const ts = Math.floor(Date.now() / 1000);
const nonce = crypto.randomUUID();
const body = JSON.stringify(payload);
const sig = hmacSha256Hex(SECRET, `${ts}.${nonce}.${body}`);
fetch(`${CLARIVI_URL}/functions/v1/marketing-webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-timestamp": String(ts),
    "x-webhook-nonce": nonce,
    "x-webhook-signature": sig,
  },
  body,
});
```

## Payload

`user_id` + `discovery_data` requis. Optionnel : `audit_id` (dédup via `external_id`), `company_name`, `website_url`, `score`, `summary`, `recommendations`, `project_id` (auto-link + merge dans `projects.discovery_data.marketing_audit`).

## Tables touchées

- `marketing_audits` (insert/update par `external_id`)
- `audit_to_project_links` (si `project_id` fourni)
- `projects.discovery_data.marketing_audit` (merge JSON)
- `webhook_nonces` (anti-replay)
