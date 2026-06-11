/**
 * IMOTION Brand v2 — Tokens partagés (frontend).
 * Miroir EXACT de `supabase/functions/_shared/brand-tokens.ts`.
 *
 * Utilisé par :
 *  - les composants documents commerciaux (devis, BC, factures, CDC) qui ont
 *    besoin de hex bruts pour la génération PDF (jsPDF/html2pdf accepte mal
 *    les variables CSS hsl() lors du rasterisation),
 *  - tout composant UI qui a besoin d'une référence canonique de couleur
 *    en dehors du contexte Tailwind (ex: charts, exports, OG images).
 *
 * RÈGLE : pour les composants React/Tailwind classiques, préférer les classes
 * sémantiques (`bg-imo-coral-600`, `text-primary`, etc.). Ce fichier est
 * réservé aux cas où la valeur littérale est nécessaire.
 */

export const BRAND = {
  name: "IMOTION Conseil",
  productName: "i-MOTION Conseil",
  url: "https://imotion-conseils.fr",
  appUrl: "https://app.imotion-conseils.fr",
  marketingUrl: "https://marketing.imotion-conseils.fr",
  supportEmail: "contact@imotion-conseils.fr",
} as const;

export const COLORS = {
  coral50: "#FFF4F1",
  coral100: "#FFE3DB",
  coral500: "#F24E2A",
  coral600: "#D63B1A",
  coral700: "#B02D14",
  amber300: "#FFC04D",
  amber400: "#FFA61F",
  amber500: "#F08A00",
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

/** RGB triplets — pratique pour jsPDF.setDrawColor / setFillColor / setTextColor */
export const RGB = {
  coral500: [242, 78, 42] as const,
  coral600: [214, 59, 26] as const,
  amber400: [255, 166, 31] as const,
  amber500: [240, 138, 0] as const,
  ink900: [15, 13, 11] as const,
  ink500: [92, 88, 84] as const,
  ink200: [229, 225, 220] as const,
  white: [255, 255, 255] as const,
};

export const GRADIENTS = {
  /** Dégradé flame officiel (CTAs UI, hero) — fort contraste. */
  flame: `linear-gradient(135deg, ${COLORS.coral500} 0%, ${COLORS.amber400} 100%)`,
  /** Dégradé flame adouci (documents, bandeaux PDF) — transition progressive coral→amber. */
  flameSubtle: `linear-gradient(100deg, #E85A2A 0%, #ED7A1F 55%, #F08A00 100%)`,
  ember: `linear-gradient(135deg, ${COLORS.coral600} 0%, ${COLORS.amber500} 50%, ${COLORS.amber300} 100%)`,
  brand: `linear-gradient(135deg, ${COLORS.coral600}, ${COLORS.amber500})`,
} as const;

export const FONTS = {
  sans:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;
