# 🧭 Cadrage pré-fusion Lovelib → Clarivi

> **Contexte** : aucune appli n'est encore en production publique (les URLs `*.lovable.app` sont des previews de construction). Latitude maximale → on optimise pour la **vitesse + propreté de l'archi**, pas pour le rollback.
>
> **Décisions validées par le product owner.**

---

## ✅ Décision 1 — Stratégie de bascule : **Big Bang assumé**

Aucun trafic réel à protéger, donc on évite la complexité du dual-run / feature flags.

**Plan d'exécution**
1. Migration SQL unique : tables `mkt_*`, `marketing_audits`, `audit_to_project_links`, `lovelib_bridge_tokens`, `pending_audit_claims`, `sync_queue` (✅ déjà en place pour la majorité).
2. Import en bloc des Edge Functions Lovelib renommées `mkt-*`.
3. Routes React montées sous `/marketing/*` + détection du host (`marketing.imotion-conseils.fr` → layout marketing par défaut).
4. Lovelib-spyglass mis en mode "redirect-only" : tout `*` → `https://marketing.imotion-conseils.fr/$1`.

**Pas besoin de** : feature flags, dual-write DB, snapshot pré-bascule, fenêtre de maintenance.

---

## ✅ Décision 2 — Réconciliation comptes : **Auto-match + Bridge token en fallback**

Couverture maximale, friction minimale.

### Voie A — Auto-match par email (par défaut)
Au premier login Clarivi, trigger côté backend :
```sql
-- RPC claim_pending_audits(p_user_id uuid, p_email text)
-- 1. Cherche marketing_audits orphelins (user_id IS NULL) où email match
-- 2. Cherche pending_audit_claims non consommés
-- 3. UPDATE user_id = p_user_id, claimed_at = now()
-- 4. Crée notification "Votre audit Lovelib a été rattaché"
```
Appelé depuis `useAuth` après chaque `SIGNED_IN`. Idempotent (vérifie `claimed_at IS NULL`).

### Voie B — Bridge token (fallback explicite)
Si l'utilisateur arrive via un lien Lovelib (`?bridge_token=xxx`) :
1. Edge Function `consume-bridge-token` valide le JWT signé (table `lovelib_bridge_tokens` ✅).
2. Vérifie `expires_at > now()` et `consumed_at IS NULL`.
3. Rattache l'audit explicitement, marque le token consommé.
4. Loggue dans `lovelib_token_uses` pour audit trail.

### Garde-fous
- **Email partagé** (boîte commerciale `contact@`) : auto-match désactivé si `email` existe déjà sur 2+ profils → fallback bridge token obligatoire.
- **Audit trail** : chaque rattachement loggue `source: 'auto_match' | 'bridge_token'` dans `activities`.

---

## ✅ Décision 3 — SEO & emails : **Plan complet avant bascule**

Même sans trafic actuel, on pose les fondations propres pour ne pas avoir à corriger après mise en prod publique.

### A. SEO — Préparation
- [ ] Inventaire des routes Lovelib (sitemap actuel) → table de mapping vers `/marketing/*`.
- [ ] Génération `public/sitemap.xml` unifié couvrant `/` (BUILD), `/marketing/*` (audit, blog, méthodologie), `/blog/*`.
- [ ] `public/robots.txt` autorise les 3 surfaces, déclare le sitemap.
- [ ] Balises canoniques par page (helper `app-url.ts` / `marketing-url.ts` ✅).
- [ ] JSON-LD Organization + WebSite sur la racine, Article sur le blog.
- [ ] Redirections 301 dans le routeur Lovelib legacy (catch-all → host marketing Clarivi).

### B. Emails — Un seul expéditeur
- [ ] **Tous** les emails (auth + transactionnels + marketing) partent de `noreply@imotion-conseils.fr` via Lovable Emails (déjà configuré sur Clarivi).
- [ ] Côté Lovelib : désactiver tout envoi (couper les Edge Functions email).
- [ ] Templates Lovelib à rapatrier : audit-ready, audit-reminder, newsletter → préfixés `mkt-` dans `_shared/email-templates/`.
- [ ] Vérifier SPF / DKIM / DMARC sur `imotion-conseils.fr` (déjà délégué à Lovable).
- [ ] Footer email unifié : mentions IMOTION Conseils + lien désinscription via `email_unsubscribe_tokens`.

### C. DNS final
| Sous-domaine | Cible | Layout servi |
|---|---|---|
| `imotion-conseils.fr` (root) | Clarivi published | Landing avec switcher BUILD↔MARKETING |
| `app.imotion-conseils.fr` | Clarivi published | ClientLayout (auth requise) |
| `marketing.imotion-conseils.fr` | Clarivi published | PublicLayout marketing |
| `notify.imotion-conseils.fr` | NS Lovable (✅) | Emails sortants |

---

## 🚦 Prochaines étapes (ordre d'exécution recommandé)

1. **Phase 1** — Migration SQL : compléter les tables `mkt_*` manquantes + RPC `claim_pending_audits`.
2. **Phase 2** — Edge Functions : import des 33 fonctions Lovelib renommées `mkt-*`.
3. **Phase 3** — Pages publiques `/marketing/*` + switcher BUILD/MARKETING dans le header.
4. **Phase 4** — Dashboard client unifié (projets BUILD + audits MARKETING côte à côte).
5. **Phase 5** — Espace admin unifié (CRM cross-services).
6. **Phase 6** — SEO (sitemap + robots + canonicals + JSON-LD) + audit final QA via `docs/qa/visual-functional-checklist.md`.

---

## 📌 Points de vigilance

- **RLS sur tables `mkt_*`** : déjà actives, ne PAS désactiver pour "simplifier".
- **`claim_pending_audits`** : `SECURITY DEFINER` + `SET search_path = public` (pattern Clarivi).
- **Bridge tokens** : TTL 15 min max, signature HMAC, stockage `jti` pour anti-rejeu.
- **Aucun envoi email** ne doit subsister depuis Lovelib après bascule (vérifier les logs `email_send_log`).
- **Pas de duplication de profils** : un seul `auth.users` partagé entre BUILD et MARKETING.
