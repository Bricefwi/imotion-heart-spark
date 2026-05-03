// Authenticated endpoint: issues a short-lived (≤60s) one-shot SSO token
// for the marketing app (lovelib). Caller must be logged in to Clarivi.
//
// POST /functions/v1/issue-bridge-token   (Authorization: Bearer <user JWT>)
// → { token, expires_at, redirect_url? }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { signBridgeToken, BRIDGE_MAX_TTL_SECONDS } from "../_shared/bridge-token.ts";
import { resolveBridgeSecret } from "../_shared/bridge-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const { value: SECRET, source: SECRET_SOURCE } = resolveBridgeSecret();
  if (!SUPABASE_URL || !ANON || !SERVICE_ROLE || !SECRET) {
    return json({ error: "server_not_configured" }, 500);
  }
  if (SECRET_SOURCE === "fallback") {
    console.warn("[issue-bridge-token] Using MARKETING_WEBHOOK_SECRET fallback. Configure LOVELIB_BRIDGE_SECRET for clarity.");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "missing_authorization" }, 401);
  }

  // Identify the calling user from their JWT.
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: "invalid_session" }, 401);
  const user = userRes.user;
  if (!user.email) return json({ error: "user_email_missing" }, 400);

  let body: { ttl?: number; redirect_to?: string } = {};
  try { body = (await req.json()) as typeof body; } catch { /* allow empty body */ }
  const ttl = Math.min(Math.max(body.ttl ?? 60, 10), BRIDGE_MAX_TTL_SECONDS);

  // Sign + persist jti for one-shot enforcement.
  const { token, jti, exp } = await signBridgeToken(
    { sub: user.id, email: user.email.toLowerCase(), ttlSeconds: ttl },
    SECRET,
  );

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: insErr } = await admin.from("lovelib_bridge_tokens").insert({
    jti,
    user_id: user.id,
    email: user.email.toLowerCase(),
    expires_at: new Date(exp * 1000).toISOString(),
  });
  if (insErr) return json({ error: "persist_failed", details: insErr.message }, 500);

  // Best-effort cleanup of expired tokens.
  admin.rpc("cleanup_lovelib_bridge_tokens").then(() => {}, () => {});

  return json({
    token,
    jti,
    expires_at: new Date(exp * 1000).toISOString(),
    ttl_seconds: ttl,
    redirect_to: body.redirect_to ?? null,
  });
});
