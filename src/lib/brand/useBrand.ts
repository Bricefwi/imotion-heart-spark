/**
 * useBrand — accès runtime aux tokens IMOTION partagés.
 *
 * Retourne tokens (couleurs, gradients, fonts, urls), branche d'app courante
 * (build vs marketing) et helpers d'URL. Sûr en SSR.
 */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { BRAND, COLORS, GRADIENTS, FONTS, RGB } from "@/lib/brand-tokens";
import { getAppBaseUrl, getRootBaseUrl } from "@/lib/app-url";

export type BrandBranch = "build" | "marketing";

export interface UseBrand {
  brand: typeof BRAND;
  colors: typeof COLORS;
  rgb: typeof RGB;
  gradients: typeof GRADIENTS;
  fonts: typeof FONTS;
  /** Branche courante détectée via le pathname (`/marketing/*` → marketing). */
  branch: BrandBranch;
  /** Thème résolu côté client (`light` | `dark`). */
  theme: "light" | "dark";
  /** URL absolue du site Clarivi BUILD. */
  appUrl: string;
  /** URL absolue du site racine IMOTION. */
  rootUrl: string;
}

export function useBrand(): UseBrand {
  const { pathname } = useLocation();
  const { resolvedTheme } = useTheme();

  return useMemo<UseBrand>(() => ({
    brand: BRAND,
    colors: COLORS,
    rgb: RGB,
    gradients: GRADIENTS,
    fonts: FONTS,
    branch: pathname.startsWith("/marketing") ? "marketing" : "build",
    theme: resolvedTheme === "dark" ? "dark" : "light",
    appUrl: getAppBaseUrl(),
    rootUrl: getRootBaseUrl(),
  }), [pathname, resolvedTheme]);
}
