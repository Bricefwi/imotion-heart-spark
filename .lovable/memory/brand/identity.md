---
name: Brand Identity v2
description: Refonte 2026 — palette coral/amber/ink, font General Sans, gradients flame/ember, logo SVG 3 variantes
type: design
---

## Couleurs (HSL via tokens shadcn)
- `--primary` = `11 79% 47%` → coral-600 #D63B1A (WCAG AA sur blanc)
- `--secondary` = `34 100% 47%` → amber-500 #F08A00
- `--background` = `24 14% 98%` → ink-50 #FAF8F7 (warm)
- `--foreground` = `30 17% 5%` → ink-900 #0F0D0B
- `--border` = `28 13% 88%` → ink-200 #E5E1DC

## Gradients (via Tailwind `bg-gradient-*`)
- `bg-gradient-flame` : #F24E2A → #FFA61F (CTA hero)
- `bg-gradient-ember` : #D63B1A → #F08A00 → #FFC04D (badges premium)
- `bg-gradient-dusk` : ink-900 → ink-700 (sections sombres)
- `bg-gradient-dawn` : transition sombre→clair
- `bg-gradient-text` : à utiliser avec `bg-clip-text text-transparent` sur titres

## Typographie
- Display : `font-display` = General Sans (Fontshare CDN), pour h1-h5
- Sans : `font-sans` = Inter (Google Fonts), pour body
- Mono : `font-mono` = JetBrains Mono

## Logo
- Composant : `<Logo variant="chevrons|spark|flame" tone="auto|light|dark|mono" size="xs|sm|md|lg|xl" showText />`
- 3 directions disponibles, à choisir via `/brand-preview`
- Plus de PNG bitmap : 100% SVG vectoriel, dark/light adaptatif
- L'ancien `logo-imotion-trimmed.png` n'est plus importé par `Logo.tsx`

## Patch lovelib
Disponible dans `/mnt/documents/lovelib-brand-v2-patch.md` — à appliquer manuellement dans le projet lovelib-spyglass pour cohérence cross-sites.
