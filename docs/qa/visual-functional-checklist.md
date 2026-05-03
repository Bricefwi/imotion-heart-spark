# ✅ Checklist QA — Cohérence Design System V2 (post-fusion Clarivi + Lovelib)

> Objectif : valider que la fusion BUILD (Clarivi) + MARKETING (Lovelib) respecte
> l'identité v2 (palette flame Coral #D63B1A → Amber #F08A00, Inter only) sur
> **toute** la surface : UI app, landing, documents commerciaux, emails.
>
> Mode d'emploi : cocher chaque item en thème **clair ET sombre**, sur
> **desktop (1440)**, **tablette (768)** et **mobile (375)**.

---

## 1. Tokens & fondations

- [ ] `src/lib/brand-tokens.ts` et `supabase/functions/_shared/brand-tokens.ts` exportent les **mêmes** valeurs (COLORS, GRADIENTS, RGB).
- [ ] Aucune couleur hardcodée (`#xxxxxx`, `rgb(...)`, `text-white`, `bg-black`) dans les composants — seulement des tokens sémantiques (`bg-primary`, `text-foreground`, `bg-gradient-flame`…).
- [ ] `index.css` : variables HSL définies pour `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--muted`, `--border`, `--ring` — en `:root` et `.dark`.
- [ ] Police **Inter** uniquement (aucune trace de General Sans / Plus Jakarta / Poppins dans `tailwind.config.ts` et CSS).
- [ ] Gradient flame `135deg, #F24E2A → #FFA61F` rendu identiquement en CSS, en email (inline style) et en PDF (jsPDF RGB).

## 2. Couleurs & contrastes

- [ ] Coral `#D63B1A` utilisé pour CTA primaires uniquement.
- [ ] Amber `#F08A00` utilisé pour accents / hovers / highlights.
- [ ] Contraste AA (≥ 4.5:1) sur tous les textes body, AAA souhaité sur titres.
- [ ] Texte sur gradient flame reste lisible (overlay ou `text-white` sémantique).
- [ ] Thème **sombre** : surfaces (`--card`, `--popover`) lisibles, bordures visibles, gradient flame conservé.

## 3. États interactifs

Pour chaque composant interactif (Button, Input, Select, Tabs, Card cliquable, NavLink, Switcher BUILD/MARKETING) :

- [ ] **default** : couleur token correcte
- [ ] **hover** : transition douce (≤ 200ms), variation de luminosité cohérente
- [ ] **focus-visible** : ring `--ring` visible (clavier Tab)
- [ ] **active / pressed** : retour visuel
- [ ] **disabled** : opacité 50%, cursor `not-allowed`
- [ ] **loading** : spinner ou `<Skeleton>`, jamais d'écran vide

## 4. Composants Shadcn customisés

- [ ] `Button` variants : `default`, `secondary`, `outline`, `ghost`, `destructive`, `premium` (gradient flame) — tous présents et cohérents.
- [ ] `Card`, `Dialog`, `Sheet`, `Popover` : ombres `--shadow-elegant`, radius cohérent.
- [ ] `Toast` (success / error / info) : couleurs alignées tokens.
- [ ] `Badge` (status projet, phase) : palette cohérente entre BUILD et MARKETING.

## 5. Landing page (PublicLayout)

- [ ] `HeroSection` : alternance BUILD ↔ MARKETING fluide (~11s, fondu 1,8s), contenu lisible pendant transition.
- [ ] `MarketingTrackSection` rendue avec tokens v2.
- [ ] Header : switcher BUILD / MARKETING visible, état actif clair.
- [ ] Footer : liens cohérents, logo IMOTION/Clarivi, mentions légales.
- [ ] CTA "Démarrer un audit" (MARKETING) et "Démarrer une découverte" (BUILD) : gradient flame.

## 6. Espaces authentifiés

- [ ] **Dashboard client** : projets BUILD + audits MARKETING affichés côte à côte, badges distincts mais palette unifiée.
- [ ] **Chat IA (ProjectConversation)** : bulles user/assistant, TypingIndicator, suggestions — couleurs v2.
- [ ] **Consultant** : vue projets, édition documents — header/sidebar tokens v2.
- [ ] **Admin** : CRM, blog, analytics — graphiques utilisent les couleurs tokens (pas de palette Recharts par défaut).

## 7. Documents commerciaux (PDF)

- [ ] `ProfessionalDocument.tsx` : header gradient flame rendu correctement via jsPDF (RGB triplets).
- [ ] `DocumentHeader` / `DocumentFooter` partagés utilisés dans devis, BC, facture.
- [ ] Logo, n° de doc, dates, totaux : police Inter embarquée, pas de fallback Helvetica visible.
- [ ] Couleur Coral sur titres de section, Amber sur accents (totaux, mentions).
- [ ] Impression A4 : marges respectées, pas de débordement.

## 8. Emails transactionnels (13 templates)

Tester rendu sur **Gmail web**, **Apple Mail**, **Outlook desktop**, **mobile iOS/Android** :

- [ ] `_layout.tsx` : header gradient flame, footer standardisé, largeur 600px.
- [ ] `_blocks.tsx` : `Heading`, `Cta`, `Card`, `StatLine` cohérents.
- [ ] Templates audités : `magic-link`, `signup`, `recovery`, `reauthentication`, `email-change`, `invite`, `cdc-ready`, `proposal-sent`, `contract-signed`, `development-started`, `discovery-complete`, `project-delivered`, `conversation-summary`.
- [ ] CTA boutons : gradient flame inline, fallback couleur unie pour Outlook.
- [ ] Aucune référence à `text-white`/`bg-black` ; tout en styles inline avec valeurs des tokens.
- [ ] Mode sombre Apple Mail : pas d'inversion catastrophique (logo, header).

## 9. Responsive & accessibilité

- [ ] Breakpoints `sm` / `md` / `lg` testés sans débordement horizontal.
- [ ] Chat et Dashboard utilisables au pouce sur 375px.
- [ ] Navigation clavier complète (Tab, Shift+Tab, Enter, Esc).
- [ ] Focus-visible jamais supprimé sans alternative.
- [ ] `prefers-reduced-motion` : animations Framer Motion désactivées proprement.
- [ ] Alt text sur toutes les images, aria-labels sur boutons icônes.

## 10. Cohérence cross-surface (smoke test final)

Capturer côte à côte et comparer :

- [ ] CTA primaire : Landing ↔ Dashboard ↔ Email ↔ PDF → **même** Coral, **même** gradient.
- [ ] Titre H1 : Landing ↔ Email ↔ PDF → **même** weight, **même** taille relative.
- [ ] Logo : 4 surfaces → **mêmes** proportions et marges.
- [ ] Footer mentions : app ↔ email ↔ PDF → texte identique (mentions légales, SIRET).

## 11. Régressions à surveiller

- [ ] Aucun import de `@formkit/auto-animate` (interdit, boucle de rendu).
- [ ] Lenis chargé en `dynamic import` uniquement.
- [ ] `ai-chat` Edge Function : `verify_jwt = false` toujours dans `config.toml`.
- [ ] Routes `/marketing/*` n'écrasent pas les routes `/app/*`.
- [ ] RLS toujours active sur tables `mkt_*`.

---

### Procédure de validation

1. Dérouler la checklist en **light** puis en **dark**.
2. Capturer screenshots des écrans clés (`docs/qa/screenshots/<date>/`).
3. Pour chaque écart : créer une issue avec capture + token attendu vs token rendu.
4. Re-tester après correctifs avant publication.
