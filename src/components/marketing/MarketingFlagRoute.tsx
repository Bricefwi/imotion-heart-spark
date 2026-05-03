import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  getLegacyUrl,
  shouldServeInternal,
  type MarketingFlagKey,
} from "@/config/marketingFlags";

interface MarketingFlagRouteProps {
  flag: MarketingFlagKey;
  /** Composant React à afficher quand le flag est ON (route interne servie). */
  children: ReactNode;
  /** Suffixe de chemin à reporter sur la legacy URL (ex: `/${slug}`). */
  legacyPathSuffix?: string;
}

/**
 * Garde de route à feature-flag :
 *   - flag ON  → render `children` (composant interne)
 *   - flag OFF → redirection 302 vers l'URL legacy lovelib correspondante
 *
 * La redirection se fait côté client via `window.location.replace` afin
 * de préserver les paramètres de query (utm, ref, source=clarivi…).
 */
export function MarketingFlagRoute({
  flag,
  children,
  legacyPathSuffix = "",
}: MarketingFlagRouteProps) {
  const location = useLocation();
  const internal = useMemo(() => shouldServeInternal(flag), [flag]);
  const [redirecting, setRedirecting] = useState(!internal);

  useEffect(() => {
    if (internal) return;
    const target = new URL(getLegacyUrl(flag, legacyPathSuffix));
    // Report des query params (utm, source, etc.)
    const incoming = new URLSearchParams(location.search);
    incoming.forEach((value, key) => {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value);
    });
    window.location.replace(target.toString());
    setRedirecting(true);
  }, [internal, flag, legacyPathSuffix, location.search]);

  if (!internal && redirecting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Redirection vers la version actuelle…
      </div>
    );
  }

  return <>{children}</>;
}
