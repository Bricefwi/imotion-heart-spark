// Admin-only: bridge secret diagnostic + generator
// - Requires admin or super_admin
// - GET  → status (is LOVELIB_BRIDGE_SECRET configured, length hint, last test)
// - POST { action: "generate" } → returns a fresh strong candidate (NOT saved server-side)
// - POST { action: "selftest" } → issues + verifies a token locally to confirm secret is wired
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { signBridgeToken, verifyBridgeToken } from "../_shared/bridge-token.ts";

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
  // base64url
  const b64 = btoa(String.fromCharCode(...buf));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SECRET = Deno.env.get("LOVELIB_BRIDGE_SECRET") ?? Deno.env.get("MARKETING_WEBHOOK_SECRET") ?? "";

  // Authn: must be admin
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "missing_authorization" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u, error: ue } = await userClient.auth.getUser();
  if (ue || !u?.user) return json({ error: "invalid_session" }, 401);

  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: u.user.id,
    _role: "admin",
  });
  const { data: isSuper } = await userClient.rpc("has_role", {
    _user_id: u.user.id,
    _role: "super_admin",
  });
  if (!isAdmin && !isSuper) return json({ error: "forbidden" }, 403);

  let body: { action?: string } = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch { /* empty */ }
  }
  const action = body.action ?? "status";

  // --- STATUS
  if (action === "status") {
    return json({
      configured: SECRET.length > 0,
      length: SECRET.length,
      strong: SECRET.length >= 32,
      // Reveal first/last 2 chars only as a fingerprint to verify both sides
      fingerprint: SECRET.length > 0 ? `${SECRET.slice(0, 2)}…${SECRET.slice(-2)}` : null,
      project_url: SUPABASE_URL,
    });
  }

  // --- GENERATE: produces a candidate; NEVER stored server-side
  if (action === "generate") {
    const candidate = randomSecret(48);
    return json({
      candidate,
      length: candidate.length,
      hint: "Copiez et collez cette valeur EXACTE dans les secrets Lovable Cloud côté Clarivi (LOVELIB_BRIDGE_SECRET) ET côté lovelib.",
    });
  }

  // --- SELFTEST: issue + verify a token using the currently-loaded SECRET
  if (action === "selftest") {
    if (!SECRET) return json({ ok: false, step: "load", error: "secret_missing" }, 200);
    try {
      const { token, jti, exp } = await signBridgeToken(
        { sub: u.user.id, email: u.user.email ?? "selftest@local", ttlSeconds: 30 },
        SECRET,
      );
      const verified = await verifyBridgeToken(token, SECRET);
      const ok = verified.jti === jti;
      return json({
        ok,
        step: ok ? "verify" : "mismatch",
        jti,
        exp,
        verified_sub: verified.sub,
        verified_email: verified.email,
      });
    } catch (e) {
      return json({ ok: false, step: "sign_or_verify", error: e instanceof Error ? e.message : String(e) });
    }
  }

  return json({ error: "unknown_action" }, 400);
});
