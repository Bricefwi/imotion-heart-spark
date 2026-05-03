// Unified bridge secret resolver
// Priority: LOVELIB_BRIDGE_SECRET (primary) → MARKETING_WEBHOOK_SECRET (fallback)
//
// Both apps (Clarivi & lovelib) and all bridge-related edge functions must use
// this helper instead of reading env vars directly. This guarantees consistent
// fallback behavior and a single point to evolve the secret strategy.

export type BridgeSecretSource = "primary" | "fallback" | "none";

export interface ResolvedBridgeSecret {
  value: string;
  source: BridgeSecretSource;
  primaryName: "LOVELIB_BRIDGE_SECRET";
  fallbackName: "MARKETING_WEBHOOK_SECRET";
  hasPrimary: boolean;
  hasFallback: boolean;
}

const PRIMARY = "LOVELIB_BRIDGE_SECRET" as const;
const FALLBACK = "MARKETING_WEBHOOK_SECRET" as const;

export function resolveBridgeSecret(): ResolvedBridgeSecret {
  const primary = Deno.env.get(PRIMARY) ?? "";
  const fallback = Deno.env.get(FALLBACK) ?? "";
  const hasPrimary = primary.length > 0;
  const hasFallback = fallback.length > 0;

  let value = "";
  let source: BridgeSecretSource = "none";
  if (hasPrimary) { value = primary; source = "primary"; }
  else if (hasFallback) { value = fallback; source = "fallback"; }

  return {
    value,
    source,
    primaryName: PRIMARY,
    fallbackName: FALLBACK,
    hasPrimary,
    hasFallback,
  };
}

/** Throws when no bridge secret is configured. Convenience for handlers. */
export function requireBridgeSecret(): ResolvedBridgeSecret {
  const r = resolveBridgeSecret();
  if (!r.value) {
    throw new Error(
      `Bridge secret not configured. Set ${PRIMARY} (preferred) or ${FALLBACK}.`,
    );
  }
  return r;
}

/** 2+2 char fingerprint to compare across apps without leaking the secret. */
export function secretFingerprint(value: string): string | null {
  if (!value) return null;
  if (value.length < 6) return "***";
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
}
