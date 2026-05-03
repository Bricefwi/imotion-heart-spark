// Admin-only: unified bridge secret management
// - Requires admin or super_admin
// - Actions:
//   * status   → which secret is active (primary/fallback), fingerprints of both, drift?
//   * generate → fresh strong candidate (NOT saved server-side)
//   * selftest → sign + verify with active secret
//   * compare_fingerprints { primary?, fallback? } → cross-check expected fingerprints
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { signBridgeToken, verifyBridgeToken } from "../_shared/bridge-token.ts";
import { resolveBridgeSecret, secretFingerprint } from "../_shared/bridge-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function randomSecret(bytes = 48): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  const b64 = btoa(String.fromCharCode(...buf));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const resolved = resolveBridgeSecret();
  const primaryRaw = Deno.env.get(resolved.primaryName) ?? "";
  const fallbackRaw = Deno.env.get(resolved.fallbackName) ?? "";

  // Authn: must be admin
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "missing_authorization" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: ue } = await userClient.auth.getUser();
  if (ue || !u?.user) return json({ error: "invalid_session" }, 401);

  const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  const { data: isSuper } = await userClient.rpc("has_role", { _user_id: u.user.id, _role: "super_admin" });
  if (!isAdmin && !isSuper) return json({ error: "forbidden" }, 403);

  let body: { action?: string; primary_fp?: string; fallback_fp?: string } = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch { /* empty */ }
  }
  const action = body.action ?? "status";

  // --- STATUS — unified view of both secrets
  if (action === "status") {
    const driftBetweenLocal =
      resolved.hasPrimary && resolved.hasFallback && primaryRaw !== fallbackRaw;

    return json({
      active: {
        source: resolved.source,                // "primary" | "fallback" | "none"
        name: resolved.source === "primary" ? resolved.primaryName
            : resolved.source === "fallback" ? resolved.fallbackName : null,
        fingerprint: secretFingerprint(resolved.value),
        length: resolved.value.length,
        strong: resolved.value.length >= 32,
      },
      primary: {
        name: resolved.primaryName,
        configured: resolved.hasPrimary,
        fingerprint: secretFingerprint(primaryRaw),
        length: primaryRaw.length,
      },
      fallback: {
        name: resolved.fallbackName,
        configured: resolved.hasFallback,
        fingerprint: secretFingerprint(fallbackRaw),
        length: fallbackRaw.length,
      },
      // True when both are set but differ → fallback usage would not match primary
      drift_between_local: driftBetweenLocal,
      // Recommendation surfaced to UI
      recommendation:
        !resolved.hasPrimary && resolved.hasFallback
          ? "promote_fallback"
          : driftBetweenLocal
          ? "align_or_remove_fallback"
          : !resolved.hasPrimary && !resolved.hasFallback
          ? "configure_primary"
          : "ok",
      project_url: SUPABASE_URL,
    });
  }

  // --- GENERATE
  if (action === "generate") {
    const candidate = randomSecret(48);
    return json({
      candidate,
      length: candidate.length,
      hint: `Collez cette valeur dans ${resolved.primaryName} côté Clarivi ET côté lovelib.`,
    });
  }

  // --- SELFTEST
  if (action === "selftest") {
    if (!resolved.value) return json({ ok: false, step: "load", error: "secret_missing" });
    try {
      const { token, jti, exp } = await signBridgeToken(
        { sub: u.user.id, email: u.user.email ?? "selftest@local", ttlSeconds: 30 },
        resolved.value,
      );
      const verified = await verifyBridgeToken(token, resolved.value);
      return json({
        ok: verified.jti === jti,
        step: "verify",
        source: resolved.source,
        fingerprint: secretFingerprint(resolved.value),
        jti, exp,
      });
    } catch (e) {
      return json({ ok: false, step: "sign_or_verify", error: e instanceof Error ? e.message : String(e) });
    }
  }

  // --- COMPARE FINGERPRINTS — cross-check what the operator sees on lovelib
  if (action === "compare_fingerprints") {
    const localPrimary = secretFingerprint(primaryRaw);
    const localFallback = secretFingerprint(fallbackRaw);
    const remotePrimary = body.primary_fp?.trim() || null;
    const remoteFallback = body.fallback_fp?.trim() || null;
    return json({
      primary: {
        local: localPrimary, remote: remotePrimary,
        match: !!localPrimary && !!remotePrimary && localPrimary === remotePrimary,
      },
      fallback: {
        local: localFallback, remote: remoteFallback,
        match: !!localFallback && !!remoteFallback && localFallback === remoteFallback,
      },
    });
  }

  return json({ error: "unknown_action" }, 400);
});
