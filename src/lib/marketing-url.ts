/**
 * Returns the public URL of the IMOTION marketing app (lovelib).
 *
 * - In production (custom domain `app.imotion-conseils.fr`), points to the
 *   sibling subdomain `marketing.imotion-conseils.fr`.
 * - Everywhere else (preview, lovable.app, localhost), falls back to the
 *   public lovable.app URL of lovelib so links keep working before DNS cutover.
 */
const PROD_MARKETING_URL = "https://marketing.imotion-conseils.fr";
const FALLBACK_MARKETING_URL = "https://lovelib-spyglass.lovable.app";

export function getMarketingBaseUrl(): string {
  if (typeof window === "undefined") return PROD_MARKETING_URL;
  const host = window.location.hostname;
  if (host === "imotion-conseils.fr" || host.endsWith(".imotion-conseils.fr")) {
    return PROD_MARKETING_URL;
  }
  return FALLBACK_MARKETING_URL;
}

export interface MarketingAuditLinkParams {
  projectId?: string;
  userId?: string;
  reason?: string;
}

/** Build the absolute URL of the free marketing audit landing page. */
export function getMarketingAuditUrl(params: MarketingAuditLinkParams = {}): string {
  const url = new URL("/audit-gratuit", getMarketingBaseUrl());
  url.searchParams.set("source", "clarivi");
  if (params.projectId) url.searchParams.set("project", params.projectId);
  if (params.userId) url.searchParams.set("user", params.userId);
  if (params.reason) url.searchParams.set("reason", params.reason);
  return url.toString();
}

/**
 * Build a SSO handoff URL: route the user through Clarivi's `/auth/handoff`
 * page so the shared cookie on `.imotion-conseils.fr` is guaranteed to be
 * written before we land on the marketing app. If the user is not logged in
 * yet, the handoff page sends them to `/login?next=/auth/handoff?to=…` and
 * comes back automatically.
 *
 * In dev / preview (non-prod hosts), we skip the handoff and link directly to
 * the marketing app — the SSO cookie isn't available off the custom domain
 * anyway, and the marketing app falls back to its own auth.
 */
export function getMarketingHandoffUrl(targetPath = "/", params: MarketingAuditLinkParams = {}): string {
  const marketing = new URL(targetPath || "/", getMarketingBaseUrl());
  marketing.searchParams.set("source", "clarivi");
  if (params.projectId) marketing.searchParams.set("project", params.projectId);
  if (params.userId) marketing.searchParams.set("user", params.userId);
  if (params.reason) marketing.searchParams.set("reason", params.reason);

  if (typeof window === "undefined") return marketing.toString();
  const host = window.location.hostname;
  const isProd = host === "imotion-conseils.fr" || host.endsWith(".imotion-conseils.fr");
  if (!isProd) return marketing.toString();

  const handoff = new URL("/auth/handoff", "https://app.imotion-conseils.fr");
  handoff.searchParams.set("to", marketing.toString());
  return handoff.toString();
}
