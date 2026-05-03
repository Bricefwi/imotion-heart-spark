/**
 * Feature flags pour la migration progressive lovelib → Clarivi.
 *
 * Chaque route marketing peut être servie soit :
 *  - en INTERNE (composant React intégré au monorepo Clarivi)
 *  - en LEGACY (redirection vers l'ancien site lovelib hébergé sur
 *    `marketing.imotion-conseils.fr`)
 *
 * La bascule est progressive (canary par % de trafic) et peut être
 * forcée par l'utilisateur via `localStorage` (`mkt_flag_<key>=on|off`).
 *
 * Ordre de migration validé :
 *   1. /marketing/audit-gratuit   (premier — loss leader, faible risque SEO)
 *   2. /marketing/blog            (deuxième — important pour SEO, à canary)
 *   3. /marketing/account         (dernier — touche l'auth croisée)
 */

export type MarketingFlagKey = "audit" | "blog" | "account";

export interface MarketingFlagConfig {
  /** Pourcentage de trafic servi en interne (0–100). 0 = 100% legacy, 100 = 100% interne. */
  rolloutPercent: number;
  /** URL legacy de fallback (ancien site lovelib). */
  legacyUrl: string;
  /** Description humaine pour l'admin panel. */
  label: string;
}

const LEGACY_BASE = "https://marketing.imotion-conseils.fr";

export const MARKETING_FLAGS: Record<MarketingFlagKey, MarketingFlagConfig> = {
  audit: {
    rolloutPercent: 100, // ✅ phase 1 — bascule complète interne
    legacyUrl: `${LEGACY_BASE}/audit`,
    label: "Audit gratuit (/marketing/audit-gratuit)",
  },
  blog: {
    rolloutPercent: 0, // 🟡 phase 2 — encore servi par lovelib
    legacyUrl: `${LEGACY_BASE}/blog`,
    label: "Blog marketing (/marketing/blog)",
  },
  account: {
    rolloutPercent: 0, // 🔴 phase 3 — pas encore basculé
    legacyUrl: `${LEGACY_BASE}/account`,
    label: "Compte marketing (/marketing/account)",
  },
};

/** Override stocké côté navigateur — prioritaire sur le rollout %. */
function readLocalOverride(key: MarketingFlagKey): "on" | "off" | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(`mkt_flag_${key}`);
  return v === "on" || v === "off" ? v : null;
}

/** Hash stable d'une chaîne (FNV-1a 32 bits) → 0..99 pour le canary. */
function bucketFor(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % 100;
}

/** Identifiant stable par visiteur (cookie-less). */
function getVisitorBucket(): number {
  if (typeof window === "undefined") return 0;
  let id = window.localStorage.getItem("mkt_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("mkt_visitor_id", id);
  }
  return bucketFor(id);
}

/** Décide si la route doit être servie en interne pour ce visiteur. */
export function shouldServeInternal(key: MarketingFlagKey): boolean {
  const override = readLocalOverride(key);
  if (override === "on") return true;
  if (override === "off") return false;

  const cfg = MARKETING_FLAGS[key];
  if (cfg.rolloutPercent >= 100) return true;
  if (cfg.rolloutPercent <= 0) return false;
  return getVisitorBucket() < cfg.rolloutPercent;
}

export function getLegacyUrl(key: MarketingFlagKey, pathSuffix = ""): string {
  return `${MARKETING_FLAGS[key].legacyUrl}${pathSuffix}`;
}

/** API admin : forcer un override depuis la console / un toggle UI. */
export function setLocalOverride(key: MarketingFlagKey, value: "on" | "off" | null) {
  if (typeof window === "undefined") return;
  const k = `mkt_flag_${key}`;
  if (value === null) window.localStorage.removeItem(k);
  else window.localStorage.setItem(k, value);
}
