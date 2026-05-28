// Shared nonce consumption for inbound webhooks (replay protection).
// Reuses the existing public.webhook_nonces table.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export const NONCE_TTL_MINUTES = 15;

export type NonceResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function consumeNonce(
  admin: SupabaseClient,
  nonce: string,
  source: string,
): Promise<NonceResult> {
  const expiresAt = new Date(Date.now() + NONCE_TTL_MINUTES * 60 * 1000).toISOString();
  const { error } = await admin
    .from("webhook_nonces")
    .insert({ nonce, source, expires_at: expiresAt });
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, status: 409, error: "Replay detected (nonce already used)" };
    }
    console.error(`[nonce:${source}] insert error`, error);
    return { ok: false, status: 500, error: "Internal error" };
  }
  return { ok: true };
}
