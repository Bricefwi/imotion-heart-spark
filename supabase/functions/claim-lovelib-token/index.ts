// Public endpoint: stores a pending audit claim from a signed lovelib token.
// No Clarivi authentication required — the user may not have an account yet.
// The claim is materialized later via redeem_pending_audits() once they sign in.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TOKEN_TTL_SECONDS = 15 * 60;
const CLOCK_SKEW_SECONDS = 60;

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToString(input: string): string {
  return new TextDecoder().decode(b64urlToBytes(input));
}
async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

type Payload = {
  exp?: number; iat?: number; nbf?: number; jti?: string;
  email?: string; sub?: string; audit_id?: string;
  company_name?: string; website_url?: string;
  score?: number; summary?: string;
  recommendations?: unknown; full_payload?: unknown;
};

async function verify(token: string, secret: string): Promise<Payload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed_token");
  const [h, p, s] = parts;
  const header = JSON.parse(b64urlToString(h));
  if (header.alg !== "HS256") throw new Error("invalid_alg");
  const expected = await hmacSha256(secret, `${h}.${p}`);
  if (!timingSafeEqual(expected, b64urlToBytes(s))) throw new Error("invalid_signature");
  const payload = JSON.parse(b64urlToString(p)) as Payload;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number") throw new Error("missing_exp");
  if (payload.exp < now) throw new Error("token_expired");
  if (typeof payload.iat !== "number") throw new Error("missing_iat");
  if (payload.iat > now + CLOCK_SKEW_SECONDS) throw new Error("token_iat_in_future");
  if (payload.exp - payload.iat > MAX_TOKEN_TTL_SECONDS) throw new Error("token_ttl_too_long");
  if (typeof payload.nbf === "number" && payload.nbf > now + CLOCK_SKEW_SECONDS) throw new Error("token_not_yet_valid");
  if (!payload.jti || typeof payload.jti !== "string" || payload.jti.length < 8) throw new Error("missing_jti");
  if (!payload.email || typeof payload.email !== "string") throw new Error("missing_email");
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SECRET = Deno.env.get("MARKETING_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { token?: string };
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = body.token?.trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "missing_token" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try { payload = await verify(token, SECRET); }
  catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "verify_failed" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Reject if jti already consumed (anti-replay across both endpoints).
  const { data: used } = await admin
    .from("lovelib_token_uses")
    .select("jti")
    .eq("jti", payload.jti as string)
    .maybeSingle();
  if (used) {
    return new Response(JSON.stringify({ error: "token_already_used" }), {
      status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = (payload.email as string).toLowerCase().trim();
  const externalId = payload.audit_id ?? payload.sub ?? null;
  const expiresAt = new Date((payload.exp as number) * 1000).toISOString();

  // Store / refresh the pending claim (idempotent on jti).
  const { error: insErr } = await admin
    .from("pending_audit_claims")
    .upsert({
      jti: payload.jti as string,
      email,
      external_id: externalId,
      payload: {
        external_id: externalId,
        company_name: payload.company_name ?? null,
        website_url: payload.website_url ?? null,
        score: typeof payload.score === "number" ? payload.score : null,
        summary: payload.summary ?? null,
        recommendations: payload.recommendations ?? [],
        full_payload: payload.full_payload ?? payload,
      },
      expires_at: expiresAt,
    }, { onConflict: "jti" });

  if (insErr) {
    return new Response(
      JSON.stringify({ error: "claim_store_failed", details: insErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Best-effort cleanup
  admin.rpc("cleanup_pending_audit_claims").then(() => {}, () => {});

  // Check if a Clarivi user already exists with this email (just informational,
  // does NOT leak whether the user exists publicly — limited to email present in token).
  let userExists = false;
  try {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    userExists = !!existing;
  } catch { /* ignore */ }

  return new Response(
    JSON.stringify({
      ok: true,
      email,
      external_id: externalId,
      expires_at: expiresAt,
      user_exists: userExists,
      preview: {
        company_name: payload.company_name ?? null,
        website_url: payload.website_url ?? null,
        score: typeof payload.score === "number" ? payload.score : null,
        summary: payload.summary ?? null,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
