/**
 * Marketing URL helpers.
 *
 * Depuis la fusion lovelib → Clarivi, le marketing est servi en interne
 * sur les routes /marketing/*. On garde ces helpers pour conserver la
 * compatibilité avec les anciens appels (emails, edge functions) qui
 * pouvaient pointer vers le sous-domaine `marketing.imotion-conseils.fr`.
 *
 * - En navigateur : on retourne des chemins relatifs (/marketing/...)
 *   que React Router gère sans rechargement.
 * - Côté serveur (edge functions, emails) : on retourne des URLs absolues
 *   sur le domaine app pour rester cliquables hors-app.
 */
const PROD_APP_URL = "https://app.imotion-conseils.fr";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getMarketingBaseUrl(): string {
  if (!isBrowser()) return PROD_APP_URL;
  return window.location.origin;
}

export interface MarketingAuditLinkParams {
  projectId?: string;
  userId?: string;
  reason?: string;
}

function appendParams(url: URL, params: MarketingAuditLinkParams) {
  url.searchParams.set("source", "clarivi");
  if (params.projectId) url.searchParams.set("project", params.projectId);
  if (params.userId) url.searchParams.set("user", params.userId);
  if (params.reason) url.searchParams.set("reason", params.reason);
}

/** URL (absolue ou relative selon le contexte) de l'audit marketing offert. */
export function getMarketingAuditUrl(params: MarketingAuditLinkParams = {}): string {
  const url = new URL("/marketing/audit-gratuit", getMarketingBaseUrl());
  appendParams(url, params);
  return isBrowser() ? url.pathname + url.search : url.toString();
}

/**
 * Handoff vers la branche marketing. Plus besoin de SSO inter-domaine
 * puisque tout est servi par la même app : on renvoie simplement la route
 * interne avec ses paramètres tracés.
 */
export function getMarketingHandoffUrl(targetPath = "/", params: MarketingAuditLinkParams = {}): string {
  const path = targetPath.startsWith("/marketing")
    ? targetPath
    : `/marketing${targetPath === "/" ? "" : targetPath}`;
  const url = new URL(path || "/marketing", getMarketingBaseUrl());
  appendParams(url, params);
  return isBrowser() ? url.pathname + url.search : url.toString();
}


export function getMarketingUrl(path: string): string {
  const url = new URL(path, getMarketingBaseUrl());
  return isBrowser() ? url.pathname : url.toString();
}
