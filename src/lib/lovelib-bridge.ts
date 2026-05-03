/**
 * Client helper to mint a one-shot SSO bridge token from Clarivi for the
 * marketing app (lovelib). Requires an active Clarivi session.
 *
 * Returns null if the call fails — callers should still allow the user to
 * navigate (lovelib will fall back to its own login flow).
 */
import { supabase } from "@/integrations/supabase/client";

export interface BridgeTokenResult {
  token: string;
  expires_at: string;
}

export async function mintLovelibBridgeToken(): Promise<BridgeTokenResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke<BridgeTokenResult>(
      "issue-bridge-token",
      { body: { ttl: 60 } },
    );
    if (error || !data?.token) {
      console.warn("[SSO] mintLovelibBridgeToken failed:", error?.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("[SSO] mintLovelibBridgeToken exception:", err);
    return null;
  }
}

/** Append `?sso=<token>` to a target marketing URL. */
export function appendBridgeToken(targetUrl: string, token: string): string {
  try {
    const u = new URL(targetUrl);
    u.searchParams.set("sso", token);
    return u.toString();
  } catch {
    return targetUrl;
  }
}
