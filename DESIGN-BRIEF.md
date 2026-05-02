# IMOTION Creator Studio — Design Brief Complet pour Refonte

## 1. IDENTITÉ & POSITIONNEMENT

**Nom :** IMOTION Creator Studio  
**Tagline :** "Transformez votre vision en réalité digitale."  
**Mission :** Plateforme SaaS B2B qui utilise l'IA pour guider les clients (PME/startups) dans la création de leur cahier des charges (CDC) digital, puis pilote la réalisation de leurs projets web/app.  
**Audience :** Dirigeants, product managers, directeurs marketing — non-techniques, francophones (+ multilingue : EN, ES, DE, AR).

---

## 2. LOGO ACTUEL — PROBLÈMES & PISTES

**Situation actuelle :**
- Logo = image PNG statique (`logo-imotion-trimmed.png` / `logo-imotion.png`)
- Rendu en `h-12` (sm), `h-20` (md), `h-28` (lg), `h-36` (xl) selon le contexte
- Aucun composant SVG vectoriel — dépendant d'un fichier bitmap
- Pas de version sombre/claire adaptative
- Pas de favicon svg (favicon.ico + favicon.png uniquement)

**Ce qui est attendu du nouveau logo :**
- Composant SVG natif (scalable, adaptatif dark/light)
- Doit évoquer : mouvement, IA, digital, confiance, modernité
- La lettre "I" avec un coeur ou une flamme est un angle possible (le dépôt s'appelle `imotion-heart-spark`)
- Version icône seule (pour favicon, sidebar collapsed, app icon)
- Version complète : icône + texte "IMOTION" + sous-titre "Creator Studio"
- Palette à respecter : primary coral-red `hsl(0, 68%, 51%)` + secondary orange-gold `hsl(30, 100%, 49%)`

---

## 3. SYSTÈME DE DESIGN ACTUEL

### 3.1 Couleurs (Design Tokens)

| Token | Light | Utilisation |
|---|---|---|
| `--primary` | `hsl(0, 68%, 51%)` — Coral Red | CTA, boutons, liens actifs, anneaux |
| `--secondary` | `hsl(30, 100%, 49%)` — Orange Gold | Badges, accents, gradient |
| `--background` | `hsl(0, 0%, 99%)` | Fond page |
| `--foreground` | `hsl(220, 20%, 10%)` | Texte principal |
| `--muted` | `hsl(220, 14%, 96%)` | Fond sections secondaires |
| `--muted-foreground` | `hsl(220, 10%, 46%)` | Texte secondaire |
| `--border` | `hsl(220, 13%, 91%)` | Bordures subtiles |
| `--sidebar-background` | `hsl(220, 20%, 6%)` — Quasi noir | Sidebar app (dark par défaut) |
| `--success` | `hsl(142, 72%, 42%)` | Statuts positifs |
| `--destructive` | `hsl(0, 84%, 60%)` | Erreurs |

**Gradient principal :**
```
linear-gradient(135deg, hsl(0, 68%, 51%) 0%, hsl(30, 100%, 49%) 100%)
```
Appliqué aux : boutons CTA primaires, step icons, badges "Populaire", sections finales CTA.

**Mode sombre** : complet, géré via `.dark` class — background `hsl(220, 20%, 6%)`, cards `hsl(220, 18%, 10%)`.

### 3.2 Typographie

- **Font principale :** Inter (système, sans-serif)
- **Font display :** Inter (identique — pas de font display distincte)
- **Font mono :** JetBrains Mono / Fira Code (terminal AI demo, code)
- **Headings :** `font-weight: 700`, `letter-spacing: -0.02em`, `line-height: 1.2`
- H1 : tracking `-0.03em`, H2 : `-0.025em`
- **Body :** `line-height: 1.6`

**Problèmes actuels :**
- Pas de font display distinctive — tout est Inter, manque de personnalité premium
- Le Hero titre est en `text-5xl/6xl/7xl font-black` mais la police est générique

### 3.3 Border Radius

| Nom | Valeur |
|---|---|
| xs | 4px |
| sm | 6px |
| md | 10px (défaut composants) |
| lg | 16px (cards, drawers) |
| xl | 24px (modaux, sections) |
| full | 9999px (pills, avatars) |

Le radius global CSS est `0.625rem` (10px).

### 3.4 Ombres

Multi-couches inspirées Linear/Notion/Framer. Variant `glow` avec halo rouge : `0 4px 20px -4px hsl(0 68% 51% / 0.25)`. Utilisée sur les boutons CTA principaux.

### 3.5 Animations

- **Framer Motion** utilisé massivement (Hero, Features, Stats, Pricing, Testimonials)
- Patterns : `fadeUp`, `letterVariants` (flip 3D lettre par lettre), `slide-in-bottom`, `scale-in`
- **Orbs parallax** dans le Hero : 2 sphères floutées qui suivent la souris
- **Floating shapes** : 3 formes géométriques qui flottent (Hero)
- **AnimatedNumber** : compteurs animés dans la section Stats (ease-out cubic)
- **AI Typing demo** : terminal simulé avec frappe caractère par caractère, loop automatique 9s
- **surface-elevated** : `translateY(-2px)` au hover avec shadow augmentée

---

## 4. STRUCTURE DES PAGES

### 4.1 Page d'accueil (landing)

**Ordre des sections :**
1. `HeroSection` — fond sombre (slate-950/900), titre animé lettre par lettre, terminal IA demo flottant, 2 CTA
2. `TrustBar` — logos partenaires/certifications
3. `StatsSection` — 3 chiffres : 7 phases / 45 min / 100% structuré, avec icônes gradient
4. `FeaturesSection` — 3 features en alternance gauche/droite (images 256×256 avec halo)
5. `HowItWorksSection` — 6 étapes en grille, gradient connector line, fond image translucide
6. `TestimonialsSection` — 3 cartes avec gradient top-border coloré, avatars, étoiles
7. `PricingSection` — tabs BUILD/RUN, card CDC gratuit avec border gradient, 4 plans BUILD + 3 plans RUN
8. `PricingAIAgent` — section IA agent commercial
9. `BlogPreviewSection` — aperçu articles
10. `CTASection` — section finale gradient plein

### 4.2 Navigation publique (Header)

- **Hauteur :** 96px (`h-24`), sticky, effet `glass` (backdrop-blur-16px, bg-white/75)
- **Logo** à gauche (taille `md` = h-20)
- **Nav desktop** : 6 liens texte + dropdown "Légal" (5 liens légaux)
- **Actions droite** : LanguageSelector + bouton "Se connecter" (ghost) + bouton "Démarrer gratuitement" (gradient)
- **Mobile** : hamburger → menu full-width slide avec liens + CTA

**Problèmes actuels :**
- La navbar est trop haute (96px) pour une app moderne
- Le logo bitmap occupe toute la hauteur — visuellement lourd
- Pas d'indicateur de page active dans la nav publique

### 4.3 Footer

4 colonnes : Logo+tagline | Produit | Entreprise | Légal  
Séparateur `border-t`, copyright centré.

---

## 5. APPLICATION (Espaces connectés)

### 5.1 Layout App (Client & Consultant)

- **Sidebar gauche** : fond `hsl(220, 20%, 6%)` (noir bleuté), collapsible (`icon` mode)
- Logo en haut de la sidebar
- Nav items : texte 13px, icônes 18px, padding `px-3 py-2.5`, radius `md`
- **État actif** : fond `hsl(primary/0.12)`, texte primary, `inset-left-shadow 3px primary`
- **Footer sidebar** : avatar + nom + email + bouton déconnexion rouge au hover
- **Header app** : `h-16`, sticky, `bg-background/80 backdrop-blur-xl`, `border-b border-border/40`
- **Contenu principal** : `bg-muted/20`, padding `p-6`, animation `page-enter` (fade+translateY)

**Navigation Client :**
- Dashboard, Vue 360°, Projets, Documents, Profil
- Liens secondaires : Site public, Administration (si admin)

**Navigation Consultant :**
- Dashboard, Projets, Clients, Analytics, Templates

### 5.2 Dashboard Client

**Composants visuels :**
- `StatsCard` : métriques avec icônes
- `PhaseProgress` : progression 6 étapes (Discovery → CDC → Devis → Contrat → Développement → Livraison)
- Cards projets : badge statut coloré, progress bar, budget, dates
- Activités récentes (timeline)

**Statuts de projet (pipeline) :**
`draft` → `discovery_active/paused/completed` → `cdc_ready/generated` → `proposal_sent/accepted` → `signed` → `in_development` → `delivered/archived`

---

## 6. COMPOSANTS CLÉS

### 6.1 Boutons

- **Primary** : `gradient-primary border-0 shadow-glow` + hover `shadow-glow-lg + -translate-y-0.5 + scale-1.02`
- **Outline** : bordure, fond transparent, hover `bg-muted/50`
- **Ghost** : pas de bordure, hover `bg-muted/50`
- **Destructive** : rouge, hover `bg-red-500/10 text-red-400`
- Tailles : sm (`h-9`), default (`h-10`), lg (`h-11` ou `h-13`)
- Radius : `var(--radius-md)` soit 10px par défaut, parfois `rounded-xl` (14px) sur les cards pricing

### 6.2 Cards

- Border `border-border/30`
- Hover : `hover:border-primary/20 hover:shadow-xl hover:-translate-y-1`
- Surface premium : gradient subtle de blanc à légèrement grisé
- Cards pricing "Populaire/Recommandé" : `border-primary shadow-lg shadow-primary/10`, badge gradient flottant `-top-3`

### 6.3 Badges

- `variant="outline"` : bordure, fond transparent (sections headers)
- `variant="secondary"` : fond secondary léger (feature steps)
- Gradient : classe `.gradient-primary border-0` (Populaire, Recommandé)
- Badge hero : `bg-white/5 text-white/90 border-white/15 backdrop-blur-sm`

### 6.4 Page Connexion

- Layout split 50/50 : formulaire gauche + carousel photos droite (caché mobile)
- Connexion : mot de passe + magic link (toggle) + Google OAuth
- Logo `size="lg"` en haut à gauche

### 6.5 FloatingChatAgent

- Bouton flottant fixe `bottom-right`
- Icône `MessageCircle` avec animation pulse-glow
- Ouvre un panneau chat avec streaming IA
- Suggestions pré-définies en chips

### 6.6 AI Typing Demo (Hero)

- Terminal sombre `bg-slate-900/95` avec dots macOS (rouge/jaune/vert)
- 5 lignes qui s'écrivent séquentiellement avec spinner puis checkmark
- Dernière ligne en vert "Cahier des charges généré !"
- Loop toutes les 9 secondes

---

## 7. PROBLÈMES DE DESIGN IDENTIFIÉS

### Priorité haute

1. **Logo bitmap** : pas de SVG, pas d'adaptation dark/light, pas de cohérence multi-taille
2. **Navbar trop haute** (96px) : logo oversized, visuellement déséquilibré
3. **Pas de font display distinctive** : tout Inter, manque de hiérarchie premium
4. **Hero sombre mais reste du site clair** : rupture visuelle abrupte sans transition douce
5. **Section Stats trop minimaliste** : 3 chiffres sur fond muted, manque d'impact
6. **Features section** : images 256px flottantes sans contexte UI — manque d'authenticité

### Priorité moyenne

7. **Trust bar absente ou non documentée** (composant existe mais contenu vide)
8. **Pricing section** : les cards BUILD manquent de distinction visuelle entre elles (toutes grises sauf "Populaire")
9. **Mobile experience** : menu mobile basique, pas de bottom navigation pour l'app
10. **Dashboard client** : stats cards trop génériques, manque de data viz moderne

### Priorité basse

11. **Footer** : logo trop grand pour le footer (size="sm" = h-12, encore imposant)
12. **Color palette** : manque d'un vrai bleu sémantique distinct de l'info (actuellement bleu `hsl(217, 91%, 60%)` peu utilisé)
13. **Testimonials** : avatars photos réelles mais cartes génériques — manque de punch

---

## 8. DIRECTION CRÉATIVE SOUHAITÉE

### Inspiration
- **Linear** : sidebar sombre, typographie serrée, micro-interactions
- **Notion** : clarté documentaire, hiérarchie forte
- **Framer** : animations fluides, premium feel
- **Vercel** : dark hero + contenu light, transitions douces
- **Arc Browser** : couleurs vives mais sophistiquées

### Ce qu'on veut améliorer

| Aspect | Actuel | Cible |
|---|---|---|
| Logo | PNG bitmap statique | SVG vectoriel avec icône + texte, version dark/light |
| Typographie | 100% Inter | Inter + une display font (ex: Cal Sans, Syne, Plus Jakarta Sans) pour les headings |
| Hero | Bon mais rupture sombre→clair | Transition plus douce, background ambiante cohérente |
| Couleur primaire | Coral red #D93A2B | À conserver mais affiner — légèrement plus vibrant/premium |
| Navigation | 96px verre | 64-72px max, logo plus compact, active state visible |
| Cards | Basiques blanches | Surfaces avec micro-texture, border gradient sur hover |
| Sidebar | Fonctionnelle | Plus de personnalité — peut-être un gradient subtle en sidebar |
| Boutons | Gradient plein | Ajouter variante `gradient-outline` (border gradient, fond transparent) |
| Illustrations | PNGs génériques | Illustrations custom cohérentes avec la palette, ou remplacées par de l'UI réelle |

### Ton visuel cible

**Premium, moderne, tech B2B** — pas startup joueuse, pas corporate froid. Quelque chose entre Linear (rigueur) et Framer (créativité). L'IA doit transparaître dans le design (formes fluides, gradients lumineux, terminal esthétique). La couleur coral-rouge doit rester signature mais utilisée avec plus de subtilité.

---

## 9. PAGES ET ÉCRANS À RETRAVAILLER (par ordre de priorité)

1. **Logo** (toutes occurrences)
2. **Header/Navbar** (PublicLayout)
3. **Hero Section** (page d'accueil)
4. **Sidebar app** (Client + Consultant)
5. **Page Login/Register** (split layout)
6. **Dashboard client** (cards, stats, pipeline)
7. **Section Features** (layout alternance)
8. **Section Pricing** (cards BUILD + tabs)
9. **Section Testimonials**
10. **Footer**

---

## 10. STACK TECHNIQUE (contraintes design)

- React + TypeScript + Vite
- TailwindCSS v3 + shadcn/ui
- Framer Motion (animations)
- Lucide React (icônes)
- CSS Variables pour design tokens
- Support dark mode (classe `.dark`)
- Support RTL (arabe)
- Responsive mobile-first
