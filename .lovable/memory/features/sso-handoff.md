---
name: SSO handoff
description: Cross-subdomain SSO via /auth/handoff page on Clarivi + cookie imotion-sso on .imotion-conseils.fr. Login uniquement sur Clarivi en prod
type: feature
---

## Architecture
- **Clarivi est le seul point d'entrée d'auth en prod** (`app.imotion-conseils.fr/login`).
- Cookie partagé `imotion-sso` sur `.imotion-conseils.fr` posé par `src/lib/sso-cookie-bridge.ts` (boot `main.tsx`).
- Page `src/pages/AuthHandoff.tsx` (route `/auth/handoff?to=<url>`) : si non authentifié → bounce `/login?next=…`, sinon attend 250ms (flush cookie) puis `window.location.replace(to)`.
- Whitelist hosts dans handoff : `*.imotion-conseils.fr` + `*.lovable.app` (preview).

## Helper sortant
`getMarketingHandoffUrl(targetPath, params)` dans `src/lib/marketing-url.ts` :
- En prod : retourne `https://app.imotion-conseils.fr/auth/handoff?to=<marketing-url>`.
- En dev/preview : retourne directement l'URL marketing (pas de cookie cross-domain dispo).

## Patch lovelib
Livré dans `/mnt/documents/lovelib-sso-handoff-patch.md` :
- Copier `sso-cookie-bridge.ts` + appel dans `main.tsx`
- `Login.tsx`/`Register.tsx`/`ForgotPassword.tsx` : `useEffect` qui redirect vers Clarivi si `isProdHost()`
- Header "Se connecter" → `redirectToClariviLogin()`
