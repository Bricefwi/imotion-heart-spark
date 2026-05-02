import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- helpers ----------

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
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

// Maximum allowed token TTL (15 minutes). Tokens with longer lifetimes are rejected.
const MAX_TOKEN_TTL_SECONDS = 15 * 60;
// Tolerance for clock skew on iat / nbf
const CLOCK_SKEW_SECONDS = 60;

type LovelibTokenPayload = {
  iss?: string;
  sub?: string; // user email or external user id on lovelib
  aud?: string;
  exp?: number; // seconds
  iat?: number;
  nbf?: number;
  jti?: string; // unique token id (required for one-shot enforcement)
  audit_id?: string; // external audit id on lovelib
  email?: string;
  company_name?: string;
  website_url?: string;
  score?: number;
  summary?: string;
  recommendations?: unknown;
  full_payload?: unknown;
};

async function verifyToken(
  token: string,
  secret: string,
): Promise<LovelibTokenPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed_token");
  const [headerB64, payloadB64, sigB64] = parts;

  const header = JSON.parse(b64urlToString(headerB64));
  if (header.alg !== "HS256") throw new Error("invalid_alg");

  const expectedSig = await hmacSha256(secret, `${headerB64}.${payloadB64}`);
  const givenSig = b64urlToBytes(sigB64);
  if (!timingSafeEqual(expectedSig, givenSig)) {
    throw new Error("invalid_signature");
  }

  const payload = JSON.parse(b64urlToString(payloadB64)) as LovelibTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  // exp is mandatory
  if (typeof payload.exp !== "number") throw new Error("missing_exp");
  if (payload.exp < now) throw new Error("token_expired");

  // iat is mandatory + cap maximum lifetime
  if (typeof payload.iat !== "number") throw new Error("missing_iat");
  if (payload.iat > now + CLOCK_SKEW_SECONDS) throw new Error("token_iat_in_future");
  if (payload.exp - payload.iat > MAX_TOKEN_TTL_SECONDS) {
    throw new Error("token_ttl_too_long");
  }

  if (typeof payload.nbf === "number" && payload.nbf > now + CLOCK_SKEW_SECONDS) {
    throw new Error("token_not_yet_valid");
  }

  // jti required for one-shot replay protection
  if (!payload.jti || typeof payload.jti !== "string" || payload.jti.length < 8) {
    throw new Error("missing_jti");
  }

  return payload;
}

// ---------- handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SECRET = Deno.env.get("MARKETING_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: require a logged-in Clarivi user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userJwt = authHeader.slice("Bearer ".length);

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await adminClient.auth.getUser(userJwt);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Body
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = body.token?.trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "missing_token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify
  let payload: LovelibTokenPayload;
  try {
    payload = await verifyToken(token, SECRET);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "verify_failed";
    return new Response(JSON.stringify({ error: reason }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Optional: enforce that token email matches the logged-in user
  if (payload.email && user.email && payload.email.toLowerCase() !== user.email.toLowerCase()) {
    return new Response(
      JSON.stringify({ error: "email_mismatch", token_email: payload.email }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const externalId = payload.audit_id ?? payload.sub ?? null;

  // Upsert marketing_audits for this user (RLS-safe via service role)
  let auditId: string | null = null;
  if (externalId) {
    const { data: existing } = await adminClient
      .from("marketing_audits")
      .select("id")
      .eq("user_id", user.id)
      .eq("external_id", externalId)
      .maybeSingle();
    auditId = existing?.id ?? null;
  }

  const auditRow = {
    user_id: user.id,
    source: "lovelib",
    status: "completed" as const,
    completed_at: new Date().toISOString(),
    external_id: externalId,
    company_name: payload.company_name ?? null,
    website_url: payload.website_url ?? null,
    score: typeof payload.score === "number" ? payload.score : null,
    summary: payload.summary ?? null,
    recommendations: payload.recommendations ?? [],
    full_payload: payload.full_payload ?? payload,
  };

  if (auditId) {
    const { error: upErr } = await adminClient
      .from("marketing_audits")
      .update({ ...auditRow, updated_at: new Date().toISOString() })
      .eq("id", auditId);
    if (upErr) {
      return new Response(
        JSON.stringify({ error: "update_failed", details: upErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } else {
    const { data: inserted, error: insErr } = await adminClient
      .from("marketing_audits")
      .insert(auditRow)
      .select("id")
      .single();
    if (insErr) {
      return new Response(
        JSON.stringify({ error: "insert_failed", details: insErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    auditId = inserted.id;
  }

  // Activity log
  await adminClient.from("activities").insert({
    user_id: user.id,
    action: "marketing_audit_token_verified",
    description: "Audit lovelib hydraté via token signé",
    importance: "normal",
    metadata: { audit_id: auditId, external_id: externalId, source: "token" },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      audit_id: auditId,
      external_id: externalId,
      company_name: auditRow.company_name,
      website_url: auditRow.website_url,
      score: auditRow.score,
      summary: auditRow.summary,
      already_existed: !!externalId && auditId !== null && !!externalId,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
