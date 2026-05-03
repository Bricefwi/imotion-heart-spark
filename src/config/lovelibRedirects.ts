/**
 * Mapping canonique des anciennes URLs lovelib (`marketing.imotion-conseils.fr`
 * et legacy `lovelib.com`) vers leur équivalent Clarivi sur
 * `https://app.imotion-conseils.fr`.
 *
 * Ce fichier est la SOURCE DE VÉRITÉ unique :
 *  - consommé par `scripts/generate-sitemap.ts` (sitemap fusionné + 301)
 *  - exposé en JSON (`public/lovelib-redirects.json`) pour la conf nginx /
 *    Cloudflare Worker côté origine lovelib qui émet réellement le 301
 *  - utilisé par `<LovelibRedirect />` côté client en filet de sécurité
 *
 * Convention :
 *  - `from` : pathname legacy (sans host, sans query). Supporte `*` final
 *    pour un wildcard (ex: `/blog/*` → `/marketing/blog/*`).
 *  - `to`   : pathname Clarivi cible (sans host).
 *  - `code` : 301 (permanent, défaut) ou 302 (temporaire pour les pages
 *    encore servies en legacy via feature flag).
 *  - `priority` / `changefreq` : utilisés dans le sitemap fusionné.
 */

export type RedirectCode = 301 | 302;

export interface LegacyRedirect {
  from: string;
  to: string;
  code: RedirectCode;
  priority?: number;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  /** Note interne (non exportée dans le sitemap). */
  note?: string;
}

export const APP_ORIGIN = "https://app.imotion-conseils.fr";
export const LEGACY_ORIGIN = "https://marketing.imotion-conseils.fr";

export const LOVELIB_REDIRECTS: LegacyRedirect[] = [
  // ── Pages racines ────────────────────────────────────────────────────
  { from: "/", to: "/marketing", code: 301, priority: 1.0, changefreq: "weekly" },
  { from: "/home", to: "/marketing", code: 301 },
  { from: "/index", to: "/marketing", code: 301 },

  // ── Audit (phase 1, déjà 100% interne) ───────────────────────────────
  { from: "/audit", to: "/marketing/audit-gratuit", code: 301, priority: 0.9, changefreq: "weekly" },
  { from: "/audit-gratuit", to: "/marketing/audit-gratuit", code: 301 },
  { from: "/audit-marketing", to: "/marketing/audit-gratuit", code: 301 },
  { from: "/free-audit", to: "/marketing/audit-gratuit", code: 301 },

  // ── Méthode / Cas clients / Veille ───────────────────────────────────
  { from: "/methode", to: "/marketing/methode", code: 301, priority: 0.7, changefreq: "monthly" },
  { from: "/methodologie", to: "/marketing/methode", code: 301 },
  { from: "/cas-clients", to: "/marketing/cas-clients", code: 301, priority: 0.7, changefreq: "monthly" },
  { from: "/case-studies", to: "/marketing/cas-clients", code: 301 },
  { from: "/realisations", to: "/marketing/cas-clients", code: 301 },
  { from: "/veille", to: "/marketing/veille", code: 301, priority: 0.6, changefreq: "weekly" },
  { from: "/insights", to: "/marketing/veille", code: 301 },

  // ── Blog (phase 2 — encore servi legacy → 302 le temps du rollout) ──
  { from: "/blog", to: "/marketing/blog", code: 302, priority: 0.8, changefreq: "weekly", note: "302 tant que rolloutPercent<100" },
  { from: "/blog/*", to: "/marketing/blog/*", code: 302, note: "wildcard slugs" },
  { from: "/articles/*", to: "/marketing/blog/*", code: 301 },

  // ── Compte (phase 3 — encore legacy → 302) ───────────────────────────
  { from: "/account", to: "/marketing/account", code: 302, note: "phase 3 non basculée" },
  { from: "/login", to: "/login", code: 301, note: "auth unifiée Clarivi" },
  { from: "/signup", to: "/register", code: 301 },
  { from: "/register", to: "/register", code: 301 },

  // ── Légal / divers ───────────────────────────────────────────────────
  { from: "/contact", to: "/contact", code: 301, priority: 0.6 },
  { from: "/mentions-legales", to: "/mentions-legales", code: 301 },
  { from: "/confidentialite", to: "/confidentialite", code: 301 },
  { from: "/privacy", to: "/confidentialite", code: 301 },
  { from: "/cgu", to: "/cgu", code: 301 },
  { from: "/cgv", to: "/cgv", code: 301 },
  { from: "/cookies", to: "/cookies", code: 301 },
  { from: "/faq", to: "/faq", code: 301 },
];

/** Routes Clarivi natives à inclure dans le sitemap fusionné. */
export const CLARIVI_PUBLIC_ROUTES: Array<{
  path: string;
  priority: number;
  changefreq: LegacyRedirect["changefreq"];
}> = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/fonctionnalites", priority: 0.9, changefreq: "monthly" },
  { path: "/tarifs", priority: 0.9, changefreq: "monthly" },
  { path: "/a-propos", priority: 0.7, changefreq: "monthly" },
  { path: "/contact", priority: 0.6, changefreq: "monthly" },
  { path: "/blog", priority: 0.8, changefreq: "weekly" },
  { path: "/faq", priority: 0.6, changefreq: "monthly" },
  { path: "/marketing", priority: 0.9, changefreq: "weekly" },
  { path: "/marketing/audit-gratuit", priority: 0.95, changefreq: "weekly" },
  { path: "/marketing/methode", priority: 0.7, changefreq: "monthly" },
  { path: "/marketing/cas-clients", priority: 0.7, changefreq: "monthly" },
  { path: "/marketing/veille", priority: 0.6, changefreq: "weekly" },
  { path: "/marketing/blog", priority: 0.8, changefreq: "weekly" },
  { path: "/mentions-legales", priority: 0.3, changefreq: "yearly" },
  { path: "/confidentialite", priority: 0.3, changefreq: "yearly" },
  { path: "/cgu", priority: 0.3, changefreq: "yearly" },
  { path: "/cgv", priority: 0.3, changefreq: "yearly" },
  { path: "/cookies", priority: 0.3, changefreq: "yearly" },
];

/** Résolveur runtime : retourne l'URL Clarivi cible pour un pathname legacy. */
export function resolveLegacyPath(pathname: string): { to: string; code: RedirectCode } | null {
  // Match exact d'abord
  const exact = LOVELIB_REDIRECTS.find((r) => r.from === pathname);
  if (exact) return { to: exact.to, code: exact.code };

  // Match wildcard
  for (const r of LOVELIB_REDIRECTS) {
    if (!r.from.endsWith("/*")) continue;
    const prefix = r.from.slice(0, -2);
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      const suffix = pathname.slice(prefix.length);
      const to = r.to.endsWith("/*") ? r.to.slice(0, -2) + suffix : r.to;
      return { to, code: r.code };
    }
  }
  return null;
}
