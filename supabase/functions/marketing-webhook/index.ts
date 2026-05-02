// Public webhook to receive `discovery_data` from lovelib (marketing) at the
// end of the marketing audit workflow.
//
// Security:
//   - HMAC-SHA256 signature verification (header `x-webhook-signature`)
//     computed over: `${timestamp}.${nonce}.${rawBody}`
//   - Replay protection: timestamp must be within ±5 minutes of server time
//   - Nonce uniqueness: stored in `webhook_nonces` table with 15min TTL
//   - Constant-time signature comparison
//
// Request format:
//   POST /functions/v1/marketing-webhook
//   Headers:
//     x-webhook-timestamp: <unix seconds>
//     x-webhook-nonce: <random unique string, e.g. uuid>
//     x-webhook-signature: <hex hmac-sha256>
//   Body (JSON):
//     {
//       "user_id": "<supabase auth user id>",        // required
//       "audit_id": "<lovelib external id>",          // optional
//       "company_name": "...", "website_url": "...",  // optional
//       "score": 0-100, "summary": "...",             // optional
//       "recommendations": [...],                     // optional
//       "discovery_data": { ... },                    // required (full payload)
//       "project_id": "<clarivi project uuid>"        // optional, for linking
//     }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-nonce",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60; // ±5 minutes
const NONCE_TTL_MINUTES = 15;

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const secret = Deno.env.get("MARKETING_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[marketing-webhook] MARKETING_WEBHOOK_SECRET not configured");
    return jsonResponse(500, { error: "Server misconfigured" });
  }

  // 1) Required headers
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  const nonce = req.headers.get("x-webhook-nonce");
  if (!signature || !timestamp || !nonce) {
    return jsonResponse(401, { error: "Missing signature headers" });
  }

  // 2) Timestamp freshness (anti-replay window)
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return jsonResponse(401, { error: "Invalid timestamp" });
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return jsonResponse(401, { error: "Timestamp outside allowed window" });
  }

  // 3) Nonce sanity (basic)
  if (nonce.length < 8 || nonce.length > 128) {
    return jsonResponse(401, { error: "Invalid nonce" });
  }

  // 4) HMAC verification over `${ts}.${nonce}.${rawBody}`
  const rawBody = await req.text();
  const expected = await hmacSha256Hex(secret, `${ts}.${nonce}.${rawBody}`);
  if (!timingSafeEqualHex(expected, signature.toLowerCase())) {
    return jsonResponse(401, { error: "Invalid signature" });
  }

  // 5) Parse JSON
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const userId = typeof payload.user_id === "string" ? payload.user_id : null;
  const discoveryData = payload.discovery_data;
  if (!userId || !discoveryData || typeof discoveryData !== "object") {
    return jsonResponse(400, { error: "Missing user_id or discovery_data" });
  }

  // 6) Service-role client (bypass RLS — we already authenticated the sender)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 7) Nonce dedup (anti-replay): insert; conflict = already used
  const expiresAt = new Date(Date.now() + NONCE_TTL_MINUTES * 60 * 1000).toISOString();
  const { error: nonceErr } = await supabase
    .from("webhook_nonces")
    .insert({ nonce, source: "marketing-webhook", expires_at: expiresAt });
  if (nonceErr) {
    if ((nonceErr as { code?: string }).code === "23505") {
      return jsonResponse(409, { error: "Replay detected (nonce already used)" });
    }
    console.error("[marketing-webhook] nonce insert error:", nonceErr);
    return jsonResponse(500, { error: "Internal error" });
  }

  // 8) Persist marketing audit (insert or update by external_id)
  const auditRow = {
    user_id: userId,
    source: "lovelib",
    status: "completed",
    completed_at: new Date().toISOString(),
    external_id: typeof payload.audit_id === "string" ? payload.audit_id : null,
    company_name: typeof payload.company_name === "string" ? payload.company_name : null,
    website_url: typeof payload.website_url === "string" ? payload.website_url : null,
    score: typeof payload.score === "number" ? payload.score : null,
    summary: typeof payload.summary === "string" ? payload.summary : null,
    recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
    full_payload: discoveryData,
  };

  let auditId: string | null = null;
  if (auditRow.external_id) {
    // Upsert pattern: try update first, then insert
    const { data: existing } = await supabase
      .from("marketing_audits")
      .select("id")
      .eq("user_id", userId)
      .eq("external_id", auditRow.external_id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("marketing_audits")
        .update(auditRow)
        .eq("id", existing.id);
      if (error) {
        console.error("[marketing-webhook] update audit error:", error);
        return jsonResponse(500, { error: "Failed to update audit" });
      }
      auditId = existing.id;
    }
  }

  if (!auditId) {
    const { data, error } = await supabase
      .from("marketing_audits")
      .insert(auditRow)
      .select("id")
      .single();
    if (error) {
      console.error("[marketing-webhook] insert audit error:", error);
      return jsonResponse(500, { error: "Failed to store audit" });
    }
    auditId = data.id;
  }

  // 9) Optional: link to a Clarivi project + merge audit into discovery_data
  const projectId = typeof payload.project_id === "string" ? payload.project_id : null;
  if (projectId && auditId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id, discovery_data")
      .eq("id", projectId)
      .maybeSingle();

    if (project) {
      const merged = {
        ...(project.discovery_data as Record<string, unknown> ?? {}),
        marketing_audit: {
          audit_id: auditId,
          received_at: new Date().toISOString(),
          score: auditRow.score,
          summary: auditRow.summary,
          recommendations: auditRow.recommendations,
        },
      };
      await supabase
        .from("projects")
        .update({ discovery_data: merged, last_activity_at: new Date().toISOString() })
        .eq("id", projectId);

      await supabase.from("audit_to_project_links").insert({
        audit_id: auditId,
        project_id: projectId,
        linked_by: userId,
        note: "Auto-linked via marketing-webhook",
      }).then(() => {}, () => {}); // ignore conflicts
    }
  }

  // 10) Best-effort cleanup of expired nonces (non-blocking)
  supabase.rpc("cleanup_webhook_nonces").then(() => {}, () => {});

  return jsonResponse(200, { ok: true, audit_id: auditId });
});
