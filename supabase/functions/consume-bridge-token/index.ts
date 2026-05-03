// Public endpoint called by lovelib (marketing app) to redeem a one-shot
// bridge token issued by Clarivi. Returns the verified user identity so
// lovelib can either (a) sign the user in via service-role on its own
// Supabase project, or (b) start a session by calling its own
// `signInWithIdToken` flow.
//
// POST /functions/v1/consume-bridge-token   { token }
// → 200 { user_id, email, expires_at }
// → 401 { error: "invalid_signature" | "token_expired" | … }
// → 409 { error: "token_already_used" }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyBridgeToken } from "../_shared/bridge-token.ts";
import { resolveBridgeSecret } from "../_shared/bridge-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const { value: SECRET } = resolveBridgeSecret();
  if (!SUPABASE_URL || !SERVICE_ROLE || !SECRET) return json({ error: "server_not_configured" }, 500);

  let body: { token?: string };
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const token = body.token?.trim();
  if (!token) return json({ error: "missing_token" }, 400);

  let payload;
  try { payload = await verifyBridgeToken(token, SECRET); }
  catch (e) { return json({ error: e instanceof Error ? e.message : "verify_failed" }, 401); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Atomic one-shot: only succeed if not already consumed.
  const { data: row, error: selErr } = await admin
    .from("lovelib_bridge_tokens")
    .select("jti, user_id, email, expires_at, consumed_at")
    .eq("jti", payload.jti)
    .maybeSingle();
  if (selErr) return json({ error: "lookup_failed", details: selErr.message }, 500);
  if (!row) return json({ error: "unknown_jti" }, 401);
  if (row.consumed_at) return json({ error: "token_already_used" }, 409);

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip");
  const ua = req.headers.get("user-agent");
  const { error: updErr } = await admin
    .from("lovelib_bridge_tokens")
    .update({
      consumed_at: new Date().toISOString(),
      consumer_ip: ip,
      consumer_ua: ua,
    })
    .eq("jti", payload.jti)
    .is("consumed_at", null);
  if (updErr) return json({ error: "consume_failed", details: updErr.message }, 500);

  return json({
    ok: true,
    user_id: row.user_id,
    email: row.email,
    expires_at: row.expires_at,
  });
});
