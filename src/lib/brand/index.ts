/**
 * IMOTION Brand — Single source of truth (frontend).
 *
 * Point d'entrée UNIQUE pour toute la base UI partagée entre BUILD (Clarivi)
 * et MARKETING (lovelib fusionné). Réexporte :
 *
 *   - tokens bruts (couleurs, gradients, fonts, RGB) depuis `brand-tokens`
 *   - URLs canoniques (root / app / marketing) depuis `app-url`
 *   - composants visuels (Logo) depuis `@/components/Logo`
 *   - hook `useBrand()` pour récupérer la palette en runtime (dark/light)
 *
 * Usage recommandé :
 *
 *   import { BRAND, COLORS, GRADIENTS, Logo, useBrand } from "@/lib/brand";
 *
 * RÈGLE : ne JAMAIS dupliquer un hex, un gradient, un nom de marque ou une
 * URL de production ailleurs dans le code. Ajoute la valeur ici, importe-la
 * partout — y compris dans les nouveaux modules /marketing/*.
 */

export {
  BRAND,
  COLORS,
  RGB,
  GRADIENTS,
  FONTS,
} from "@/lib/brand-tokens";

export {
  PROD_ROOT_URL,
  PROD_APP_URL,
  PROD_MARKETING_URL,
  getAppBaseUrl,
  getRootBaseUrl,
} from "@/lib/app-url";

export { Logo } from "@/components/Logo";

export { useBrand } from "./useBrand";

/**
 * Tokens sémantiques Tailwind disponibles partout via `bg-*`, `text-*`, etc.
 * Liste exposée pour le tooling (Storybook, doc, audits) — ne pas modifier
 * sans synchroniser `tailwind.config.ts` + `index.css` (couche --imo-*).
 */
export const SEMANTIC_TOKENS = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "accent", "accent-foreground",
  "muted", "muted-foreground",
  "destructive", "destructive-foreground",
  "success", "success-foreground",
  "warning", "warning-foreground",
  "info", "info-foreground",
  "border", "input", "ring",
  "sidebar-background", "sidebar-foreground",
  "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground",
  "sidebar-border", "sidebar-ring",
] as const;

/** Classes utilitaires recommandées pour le gradient flame officiel. */
export const BRAND_CLASSES = {
  /** Bouton / CTA principal — usage prioritaire. */
  ctaPrimary:
    "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:opacity-95",
  /** Texte avec gradient flame. */
  textGradient:
    "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
  /** Bordure subtile branded. */
  borderBrand: "border border-primary/20",
} as const;
