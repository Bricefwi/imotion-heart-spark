// Paperclip Webhook — Lot 2
//
// Inbound updates from Paperclip back-office.
// Security: HMAC-SHA256(`${ts}.${nonce}.${rawBody}`) with PAPERCLIP_WEBHOOK_SECRET.
// Replay protection via public.webhook_nonces (source = 'paperclip-webhook').
// verify_jwt = false (server-to-server).
//
// Transition guards (see _shared/status.ts):
//   - Unknown new_status            → 422 (no DB write)
//   - accepted / rejected / proposal_sent → 422 (human-only)
//   - Job in accepted/rejected/cancelled → 422 (terminal)

import { adminClient, corsHeaders, jsonResponse } from "../_shared/supabase.ts";
import { verifySignedRequest } from "../_shared/hmac.ts";
import { consumeNonce } from "../_shared/nonce.ts";
import { canApplyTransition, resolveWebhookStatus } from "../_shared/status.ts";


const NONCE_SOURCE = "paperclip-webhook";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const secret = Deno.env.get("PAPERCLIP_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[paperclip-webhook] PAPERCLIP_WEBHOOK_SECRET not configured");
    return jsonResponse(500, { error: "Server misconfigured" });
  }

  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  const nonce = req.headers.get("x-webhook-nonce");
  const rawBody = await req.text();

  const sigCheck = await verifySignedRequest({ secret, signature, timestamp, nonce, rawBody });
  if (!sigCheck.ok) return jsonResponse(sigCheck.status, { error: sigCheck.error });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const jobId = typeof payload.job_id === "string" ? payload.job_id : null;
  const eventType = typeof payload.event_type === "string" ? payload.event_type : "status_update";
  const newStatus = typeof payload.new_status === "string" ? payload.new_status : null;
  if (!jobId) return jsonResponse(400, { error: "job_id required" });

  const admin = adminClient();

  // Fetch job FIRST so we can validate transition without consuming the nonce
  // on a clearly invalid request — but we still consume nonce as soon as the
  // signature is valid (anti-replay primacy).
  const nonceResult = await consumeNonce(admin, nonce!, NONCE_SOURCE);
  if (!nonceResult.ok) return jsonResponse(nonceResult.status, { error: nonceResult.error });

  const { data: job, error: jobFetchErr } = await admin
    .from("paperclip_jobs")
    .select("id,status,user_id")
    .eq("id", jobId)
    .maybeSingle();
  if (jobFetchErr || !job) return jsonResponse(404, { error: "job not found" });
  const previousStatus = job.status as string;

  // --- Resolve external/internal status + transition guard ---
  const requiresHumanValidation = payload.requires_human_validation === true;
  const resolved = resolveWebhookStatus(newStatus, requiresHumanValidation);
  if (!resolved.ok) {
    await admin.from("paperclip_job_events").insert({
      job_id: jobId,
      event_type: "rejected_transition",
      status_from: previousStatus,
      status_to: newStatus,
      source: "paperclip",
      payload: { reason: resolved.error, raw: payload },
    });
    return jsonResponse(resolved.status, { error: resolved.error, job_id: jobId });
  }
  const nextInternal = resolved.internal;
  const transition = canApplyTransition(previousStatus, nextInternal);
  if (!transition.ok) {
    await admin.from("paperclip_job_events").insert({
      job_id: jobId,
      event_type: "rejected_transition",
      status_from: previousStatus,
      status_to: nextInternal,
      source: "paperclip",
      payload: { reason: transition.error, raw: payload },
    });
    return jsonResponse(transition.status, { error: transition.error, job_id: jobId });
  }

  // --- Build update ---
  const update: Record<string, unknown> = {};
  if (nextInternal) update.status = nextInternal;
  if (typeof requiresHumanValidation === "boolean") {
    update.requires_human_validation = requiresHumanValidation;
  }
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

  await admin.from("paperclip_job_events").insert({
    job_id: jobId,
    event_type: eventType,
    status_from: previousStatus,
    status_to: nextInternal ?? previousStatus,
    source: "paperclip",
    payload: { ...payload, _resolved_namespace: resolved.namespace },
  });


  // Optional documents
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
      if (docErr) console.error("[paperclip-webhook] insert documents error", docErr);
      else insertedDocs = rows.length;
    }
  }

  admin.rpc("cleanup_webhook_nonces").then(() => {}, () => {});

  return jsonResponse(200, {
    ok: true,
    job_id: jobId,
    new_status: nextInternal ?? previousStatus,
    namespace: resolved.namespace,
    inserted_documents: insertedDocs,
  });
});

