// Paperclip Webhook — Lot 2
// Receives status updates / deliverables from the Paperclip back-office.
//
// Security:
//   - HMAC-SHA256 signature over `${timestamp}.${nonce}.${rawBody}` using
//     PAPERCLIP_WEBHOOK_SECRET
//   - Timestamp window: ±5 minutes
//   - Replay protection via `webhook_nonces` table (source="paperclip-webhook")
//   - verify_jwt = false (server-to-server)
//
// Request body (JSON):
//   {
//     "job_id":              "<uuid>",            // required
//     "paperclip_ticket_id": "<string>",          // optional, stored if present
//     "event_type":          "status_update" | "document_ready" | "validation_required" | "completed" | "failed",
//     "new_status":          "<one of the 12 allowed statuses>", // optional
//     "output_payload":      { ... },             // optional
//     "qa_report":           { ... },             // optional
//     "scores":              { lead_score, maturity_score, confidence_score }, // optional
//     "documents":           [                    // optional
//       { "doc_type": "...", "title": "...", "storage_path": "...",
//         "visibility": "admin"|"client", "is_validated": bool }
//     ],
//     "error":               "string"             // optional, sets last_error
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-nonce",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;
const NONCE_TTL_MINUTES = 15;

const ALLOWED_STATUSES = new Set([
  "draft",
  "audit_completed",
  "qualified",
  "sent_to_paperclip",
  "paperclip_processing",
  "waiting_human_validation",
  "proposal_ready",
  "proposal_sent",
  "accepted",
  "rejected",
  "cancelled",
  "failed",
]);

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

  const secret = Deno.env.get("PAPERCLIP_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[paperclip-webhook] PAPERCLIP_WEBHOOK_SECRET not configured");
    return jsonResponse(500, { error: "Server misconfigured" });
  }

  // 1) Headers
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  const nonce = req.headers.get("x-webhook-nonce");
  if (!signature || !timestamp || !nonce) {
    return jsonResponse(401, { error: "Missing signature headers" });
  }

  // 2) Timestamp freshness
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return jsonResponse(401, { error: "Invalid timestamp" });
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return jsonResponse(401, { error: "Timestamp outside allowed window" });
  }

  // 3) Nonce sanity
  if (nonce.length < 8 || nonce.length > 128) {
    return jsonResponse(401, { error: "Invalid nonce" });
  }

  // 4) HMAC verification
  const rawBody = await req.text();
  const expected = await hmacSha256Hex(secret, `${ts}.${nonce}.${rawBody}`);
  if (!timingSafeEqualHex(expected, signature.toLowerCase())) {
    return jsonResponse(401, { error: "Invalid signature" });
  }

  // 5) Parse
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const jobId = typeof payload.job_id === "string" ? payload.job_id : null;
  const eventType =
    typeof payload.event_type === "string" ? payload.event_type : "status_update";
  const newStatus =
    typeof payload.new_status === "string" ? payload.new_status : null;
  if (!jobId) return jsonResponse(400, { error: "job_id required" });
  if (newStatus && !ALLOWED_STATUSES.has(newStatus)) {
    return jsonResponse(400, { error: `new_status invalid: ${newStatus}` });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 6) Nonce dedup
  const expiresAt = new Date(Date.now() + NONCE_TTL_MINUTES * 60 * 1000).toISOString();
  const { error: nonceErr } = await admin
    .from("webhook_nonces")
    .insert({ nonce, source: "paperclip-webhook", expires_at: expiresAt });
  if (nonceErr) {
    if ((nonceErr as { code?: string }).code === "23505") {
      return jsonResponse(409, { error: "Replay detected (nonce already used)" });
    }
    console.error("[paperclip-webhook] nonce insert error", nonceErr);
    return jsonResponse(500, { error: "Internal error" });
  }

  // 7) Fetch job
  const { data: job, error: jobFetchErr } = await admin
    .from("paperclip_jobs")
    .select("id,status,user_id")
    .eq("id", jobId)
    .maybeSingle();
  if (jobFetchErr || !job) {
    return jsonResponse(404, { error: "job not found" });
  }
  const previousStatus = job.status as string;

  // 8) Build update
  const update: Record<string, unknown> = {
    last_synced_at: new Date().toISOString(),
  };
  if (newStatus) update.status = newStatus;
  if (typeof payload.paperclip_ticket_id === "string") {
    update.paperclip_ticket_id = payload.paperclip_ticket_id;
  }
  if (payload.output_payload && typeof payload.output_payload === "object") {
    update.output_payload = payload.output_payload;
  }
  if (payload.qa_report && typeof payload.qa_report === "object") {
    update.qa_report = payload.qa_report;
  }
  if (payload.scores && typeof payload.scores === "object") {
    const s = payload.scores as Record<string, unknown>;
    if (typeof s.lead_score === "number") update.lead_score = s.lead_score;
    if (typeof s.maturity_score === "number") update.maturity_score = s.maturity_score;
    if (typeof s.confidence_score === "number") update.confidence_score = s.confidence_score;
  }
  if (typeof payload.error === "string") {
    update.last_error = payload.error.slice(0, 1000);
  }

  const { error: updErr } = await admin
    .from("paperclip_jobs")
    .update(update)
    .eq("id", jobId);
  if (updErr) {
    console.error("[paperclip-webhook] update job error", updErr);
    return jsonResponse(500, { error: "Failed to update job" });
  }

  // 9) Persist event
  await admin.from("paperclip_job_events").insert({
    job_id: jobId,
    event_type: eventType,
    status_from: previousStatus,
    status_to: newStatus ?? previousStatus,
    source: "paperclip",
    payload,
  });

  // 10) Documents (optional)
  let insertedDocs = 0;
  if (Array.isArray(payload.documents)) {
    const rows = (payload.documents as Array<Record<string, unknown>>)
      .filter((d) => typeof d.storage_path === "string" && typeof d.doc_type === "string")
      .map((d) => ({
        job_id: jobId,
        user_id: job.user_id,
        doc_type: d.doc_type as string,
        title: typeof d.title === "string" ? d.title : null,
        storage_path: d.storage_path as string,
        visibility: d.visibility === "client" ? "client" : "admin",
        is_validated: d.is_validated === true,
      }));
    if (rows.length) {
      const { error: docErr } = await admin.from("paperclip_documents").insert(rows);
      if (docErr) {
        console.error("[paperclip-webhook] insert documents error", docErr);
      } else {
        insertedDocs = rows.length;
      }
    }
  }

  // 11) Best-effort nonce cleanup
  admin.rpc("cleanup_webhook_nonces").then(() => {}, () => {});

  return jsonResponse(200, {
    ok: true,
    job_id: jobId,
    new_status: newStatus ?? previousStatus,
    inserted_documents: insertedDocs,
  });
});
