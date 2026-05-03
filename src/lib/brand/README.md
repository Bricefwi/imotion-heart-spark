# `@/lib/brand` — Module thème IMOTION centralisé

Point d'entrée **unique** pour toute la base UI partagée entre :
- **BUILD** (Clarivi — `/`, `/client/*`, `/consultant/*`, `/admin/*`)
- **MARKETING** (lovelib fusionné — `/marketing/*`)

## Pourquoi ?

Avant : tokens éparpillés (`brand-tokens.ts`, `app-url.ts`, `Logo.tsx`,
hex codés en dur dans plusieurs composants). Risque de drift visuel entre
les deux branches.

Après : **un seul import** réexporte tout :

```ts
import { BRAND, COLORS, GRADIENTS, Logo, useBrand, BRAND_CLASSES } from "@/lib/brand";
```

## Contenu

| Export | Source | Usage |
|---|---|---|
| `BRAND` | `brand-tokens.ts` | Nom, URLs canoniques, support email |
| `COLORS` / `RGB` / `GRADIENTS` / `FONTS` | `brand-tokens.ts` | Hex bruts (PDF, charts, OG images) |
| `PROD_*_URL`, `getAppBaseUrl()` | `app-url.ts` | URLs canoniques SEO/CSP |
| `Logo` | `components/Logo.tsx` | Composant logo officiel (variants `flux` / `chevrons` / `flame`) |
| `useBrand()` | `useBrand.ts` | Hook runtime : tokens + thème + branche courante |
| `SEMANTIC_TOKENS` | local | Liste des tokens Tailwind sémantiques |
| `BRAND_CLASSES` | local | Classes utilitaires officielles (`ctaPrimary`, `textGradient`) |

## Règles d'or

1. **Jamais de hex en dur** dans un composant. Toujours `COLORS.coral600` ou
   la classe Tailwind sémantique correspondante (`bg-primary`).
2. **Jamais de duplication d'URL prod** (`https://...imotion-conseils.fr`).
   Importer depuis `BRAND` ou `app-url`.
3. **Jamais d'import direct de `brand-tokens.ts`** dans les nouveaux modules
   — passer par `@/lib/brand` pour garantir un seul point de mise à jour.
4. Le miroir Edge Functions (`supabase/functions/_shared/brand-tokens.ts`)
   reste maintenu manuellement et **doit rester identique** côté valeurs.
