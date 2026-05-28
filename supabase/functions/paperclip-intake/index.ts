// Paperclip Intake — Lot 2
// Called by authenticated admin/consultant (or service-role) to push a qualified
// lead to the Paperclip back-office cabinet. In MOCK mode, no external call is
// made: the job is simulated end-to-end inside Supabase so the full cycle can
// be validated without depending on the real Paperclip Hostinger backend.
//
// Auth: verify_jwt = true (JWT required). Admin role enforced in code.
// Lead qualification rules (must satisfy AT LEAST one):
//   - marketing_audits.score >= 50, OR
//   - projects.discovery_data.phase_2_besoin populated (object with keys)
//
// Request body:
//   {
//     "audit_id":    "<uuid>",            // optional but recommended
//     "project_id":  "<uuid>",            // optional
//     "user_id":     "<uuid>",            // required (client whose lead it is)
//     "service_type":"audit_pro" | "conseil" | "build" | "run" | "custom",
//     "notes":       "string"             // optional
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_SERVICE_TYPES = [
  "audit_pro",
  "conseil",
  "build",
  "run",
  "custom",
];

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  // --- Auth ---
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "Missing bearer token" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Invalid token" });
  }
  const caller = userData.user;

  // Admin or service-role caller only
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();
  if (!roleRow) {
    return jsonResponse(403, { error: "Admin role required" });
  }

  // --- Parse body ---
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : null;
  const auditId = typeof body.audit_id === "string" ? body.audit_id : null;
  const projectId = typeof body.project_id === "string" ? body.project_id : null;
  const serviceType =
    typeof body.service_type === "string" ? body.service_type : "audit_pro";
  const notes = typeof body.notes === "string" ? body.notes : null;

  if (!userId) return jsonResponse(400, { error: "user_id required" });
  if (!ALLOWED_SERVICE_TYPES.includes(serviceType)) {
    return jsonResponse(400, { error: `service_type must be one of ${ALLOWED_SERVICE_TYPES.join(",")}` });
  }
  if (!auditId && !projectId) {
    return jsonResponse(400, { error: "audit_id or project_id required" });
  }

  // --- Lead qualification ---
  let qualified = false;
  let leadScore = 0;
  let auditPayload: Record<string, unknown> | null = null;
  let projectPayload: Record<string, unknown> | null = null;

  if (auditId) {
    const { data: audit } = await admin
      .from("marketing_audits")
      .select("id,user_id,score,summary,company_name,website_url,recommendations,full_payload")
      .eq("id", auditId)
      .maybeSingle();
    if (!audit) return jsonResponse(404, { error: "audit not found" });
    if (audit.user_id !== userId) {
      return jsonResponse(400, { error: "audit does not belong to user_id" });
    }
    auditPayload = audit as Record<string, unknown>;
    leadScore = typeof audit.score === "number" ? audit.score : 0;
    if (leadScore >= 50) qualified = true;
  }

  if (projectId) {
    const { data: project } = await admin
      .from("projects")
      .select("id,client_id,name,code,discovery_data,current_phase,status")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) return jsonResponse(404, { error: "project not found" });
    if (project.client_id !== userId) {
      return jsonResponse(400, { error: "project does not belong to user_id" });
    }
    projectPayload = project as Record<string, unknown>;
    const discovery = project.discovery_data as Record<string, unknown> | null;
    const phase2 = discovery && isObject(discovery.phase_2_besoin)
      ? (discovery.phase_2_besoin as Record<string, unknown>)
      : null;
    if (phase2 && Object.keys(phase2).length > 0) qualified = true;
  }

  if (!qualified) {
    return jsonResponse(422, {
      error: "Lead not qualified",
      reason: "audit score < 50 and no phase_2_besoin in project discovery_data",
    });
  }

  // --- Intake payload sent to Paperclip (or mocked) ---
  const intakePayload = {
    schema_version: "1.0",
    user_id: userId,
    audit_id: auditId,
    project_id: projectId,
    requested_service_type: serviceType,
    notes,
    lead_score: leadScore,
    audit: auditPayload,
    project: projectPayload,
    sent_at: new Date().toISOString(),
  };

  // --- Insert job (status: qualified) ---
  const { data: jobInsert, error: jobErr } = await admin
    .from("paperclip_jobs")
    .insert({
      user_id: userId,
      audit_id: auditId,
      project_id: projectId,
      job_type: "lead_to_cabinet",
      status: "qualified",
      requested_service_type: serviceType,
      lead_score: leadScore,
      intake_payload: intakePayload,
    })
    .select("id")
    .single();

  if (jobErr) {
    console.error("[paperclip-intake] insert job error", jobErr);
    // Likely a uniqueness violation (active job already exists for this audit)
    if ((jobErr as { code?: string }).code === "23505") {
      return jsonResponse(409, { error: "Active job already exists for this audit" });
    }
    return jsonResponse(500, { error: "Failed to create job" });
  }
  const jobId = jobInsert.id as string;

  await admin.from("paperclip_job_events").insert({
    job_id: jobId,
    event_type: "intake_created",
    status_from: null,
    status_to: "qualified",
    source: "lovable",
    payload: { caller_id: caller.id, service_type: serviceType, lead_score: leadScore },
  });

  // --- Mock vs Real Paperclip dispatch ---
  const mockEnabled = (Deno.env.get("PAPERCLIP_MOCK_ENABLED") ?? "true").toLowerCase() === "true";

  if (mockEnabled) {
    // Simulate: mark as sent_to_paperclip + log mock dispatch event.
    const mockTicketId = `MOCK-${jobId.slice(0, 8)}-${Date.now()}`;
    await admin
      .from("paperclip_jobs")
      .update({
        status: "sent_to_paperclip",
        paperclip_ticket_id: mockTicketId,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await admin.from("paperclip_job_events").insert({
      job_id: jobId,
      event_type: "mock_dispatched",
      status_from: "qualified",
      status_to: "sent_to_paperclip",
      source: "mock",
      payload: { mock_ticket_id: mockTicketId, note: "PAPERCLIP_MOCK_ENABLED=true" },
    });

    return jsonResponse(200, {
      ok: true,
      mode: "mock",
      job_id: jobId,
      paperclip_ticket_id: mockTicketId,
      status: "sent_to_paperclip",
    });
  }

  // --- Real dispatch (placeholder; not used until Paperclip is deployed) ---
  const apiUrl = Deno.env.get("PAPERCLIP_API_URL") ?? "http://mock-disabled.local";
  const apiKey = Deno.env.get("PAPERCLIP_API_KEY") ?? "mock-not-used";

  if (apiUrl.includes("mock-disabled.local") || apiKey === "mock-not-used") {
    await admin
      .from("paperclip_jobs")
      .update({
        status: "failed",
        last_error: "PAPERCLIP_API_URL/API_KEY not configured and mock disabled",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return jsonResponse(503, {
      error: "Paperclip not configured",
      hint: "Set PAPERCLIP_MOCK_ENABLED=true or configure PAPERCLIP_API_URL/API_KEY",
      job_id: jobId,
    });
  }

  try {
    const resp = await fetch(`${apiUrl.replace(/\/$/, "")}/intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...intakePayload, callback_job_id: jobId }),
    });
    const text = await resp.text();
    let parsed: Record<string, unknown> | null = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    const ticketId =
      parsed && typeof parsed.ticket_id === "string" ? parsed.ticket_id : null;

    if (!resp.ok) {
      await admin
        .from("paperclip_jobs")
        .update({
          status: "failed",
          last_error: `Paperclip ${resp.status}: ${text.slice(0, 500)}`,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      return jsonResponse(502, { error: "Paperclip rejected intake", job_id: jobId });
    }

    await admin
      .from("paperclip_jobs")
      .update({
        status: "sent_to_paperclip",
        paperclip_ticket_id: ticketId,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await admin.from("paperclip_job_events").insert({
      job_id: jobId,
      event_type: "dispatched",
      status_from: "qualified",
      status_to: "sent_to_paperclip",
      source: "paperclip",
      payload: { http_status: resp.status, ticket_id: ticketId },
    });

    return jsonResponse(200, {
      ok: true,
      mode: "live",
      job_id: jobId,
      paperclip_ticket_id: ticketId,
      status: "sent_to_paperclip",
    });
  } catch (err) {
    console.error("[paperclip-intake] dispatch error", err);
    await admin
      .from("paperclip_jobs")
      .update({
        status: "failed",
        last_error: `Network error: ${(err as Error).message}`.slice(0, 500),
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return jsonResponse(502, { error: "Paperclip unreachable", job_id: jobId });
  }
});
