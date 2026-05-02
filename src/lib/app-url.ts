/**
 * Canonical URLs for the IMOTION ecosystem.
 *
 *  - Marketing public site : https://imotion-conseils.fr (and www.)
 *  - Clarivi BUILD app     : https://app.imotion-conseils.fr  ← THIS PROJECT
 *  - lovelib MARKETING app : https://marketing.imotion-conseils.fr
 *
 * In dev / preview / lovable.app, we fall back to the current window origin
 * so canonical/SEO links don't 404 before DNS cutover.
 */

export const PROD_ROOT_URL = "https://imotion-conseils.fr";
export const PROD_APP_URL = "https://app.imotion-conseils.fr";
export const PROD_MARKETING_URL = "https://marketing.imotion-conseils.fr";

const PROD_HOSTS = new Set([
  "imotion-conseils.fr",
  "www.imotion-conseils.fr",
  "app.imotion-conseils.fr",
  "marketing.imotion-conseils.fr",
]);

function isProd(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return PROD_HOSTS.has(h) || h.endsWith(".imotion-conseils.fr");
}

/** Base URL for this app (Clarivi BUILD). */
export function getAppBaseUrl(): string {
  if (isProd()) return PROD_APP_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return PROD_APP_URL;
}

/** Public root URL (marketing site root). */
export function getRootBaseUrl(): string {
  if (isProd()) return PROD_ROOT_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return PROD_ROOT_URL;
}

/** Build an absolute URL on the app domain (defaults to current env). */
export function appUrl(path = "/"): string {
  return new URL(path, getAppBaseUrl()).toString();
}

/** Build an absolute URL on the public marketing root. */
export function rootUrl(path = "/"): string {
  return new URL(path, getRootBaseUrl()).toString();
}
