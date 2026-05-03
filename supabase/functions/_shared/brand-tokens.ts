/**
 * IMOTION Brand v2 — Tokens partagés (Edge Functions + emails + documents).
 * SOURCE UNIQUE de couleurs/gradients/typo pour tout ce qui est rendu côté serveur
 * (templates React Email, PDF générés en edge, etc.).
 *
 * Côté frontend, voir `src/lib/brand-tokens.ts` qui ré-exporte les mêmes valeurs.
 * Toute mise à jour visuelle se fait ICI uniquement.
 */

export const BRAND = {
  name: "IMOTION Conseil",
  productName: "IMOTION Creator Studio",
  url: "https://imotion-conseils.fr",
  appUrl: "https://app.imotion-conseils.fr",
  marketingUrl: "https://marketing.imotion-conseils.fr",
  supportEmail: "contact@imotion-conseils.fr",
} as const;

export const COLORS = {
  // Coral (primary)
  coral50: "#FFF4F1",
  coral100: "#FFE3DB",
  coral500: "#F24E2A",
  coral600: "#D63B1A",
  coral700: "#B02D14",
  // Amber (secondary)
  amber300: "#FFC04D",
  amber400: "#FFA61F",
  amber500: "#F08A00",
  // Ink
  ink50: "#FAF8F7",
  ink100: "#F2EFEC",
  ink200: "#E5E1DC",
  ink400: "#8B8580",
  ink500: "#5C5854",
  ink600: "#3F3D3B",
  ink900: "#0F0D0B",
  white: "#FFFFFF",
  bgPage: "#F4F4F5",
} as const;

export const GRADIENTS = {
  flame: `linear-gradient(135deg, ${COLORS.coral500} 0%, ${COLORS.amber400} 100%)`,
  ember: `linear-gradient(135deg, ${COLORS.coral600} 0%, ${COLORS.amber500} 50%, ${COLORS.amber300} 100%)`,
  brand: `linear-gradient(135deg, ${COLORS.coral600}, ${COLORS.amber500})`,
} as const;

export const FONTS = {
  // Inter only — chargé via <link> dans le layout email partagé
  sans:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export const RADIUS = {
  sm: "6px",
  md: "10px",
  lg: "16px",
} as const;
