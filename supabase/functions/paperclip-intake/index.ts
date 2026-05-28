// Paperclip Intake — Lot 2
//
// Auth: verify_jwt = true. **MVP: admin / super_admin only.**
//   - Objectif: éviter qu'un client déclenche Paperclip automatiquement.
//   - Phase future: déclenchement client possible UNIQUEMENT après
//     qualification automatique maîtrisée (lead scoring serveur).
//   - Le rôle 'consultant' n'est PAS autorisé en MVP (peut être ajouté
//     ultérieurement après validation produit).
//   - Aucun rôle 'board' n'existe dans ce projet.
//
// Lead qualification (one of):
//   - marketing_audits.score >= 50, OR
//   - projects.discovery_data.phase_2_besoin is a non-empty object
//
// Un lead non qualifié est une décision métier normale, pas une erreur:
//   → HTTP 200 { status: "not_qualified", reason: "lead_score_below_threshold" }
//   → aucun job créé, aucun event créé, aucun appel Paperclip.
//
// MOCK mode (PAPERCLIP_MOCK=true OR PAPERCLIP_MOCK_ENABLED=true): no outbound
// call. PAPERCLIP_API_URL / PAPERCLIP_API_KEY are intentionally NOT read here.


import { adminClient, corsHeaders, isPaperclipMockEnabled, jsonResponse, userClient } from "../_shared/supabase.ts";

const ALLOWED_SERVICE_TYPES = ["audit_pro", "conseil", "build", "run", "custom"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "Missing bearer token" });
  }

  const uClient = userClient(authHeader);
  const admin = adminClient();

  const { data: userData, error: userErr } = await uClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse(401, { error: "Invalid token" });
  }
  const caller = userData.user;

  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();
  if (!roleRow) return jsonResponse(403, { error: "Admin role required" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : null;
  const auditId = typeof body.audit_id === "string" ? body.audit_id : null;
  const projectId = typeof body.project_id === "string" ? body.project_id : null;
  const serviceType = typeof body.service_type === "string" ? body.service_type : "audit_pro";
  const notes = typeof body.notes === "string" ? body.notes : null;

  if (!userId) return jsonResponse(400, { error: "user_id required" });
  if (!ALLOWED_SERVICE_TYPES.includes(serviceType)) {
    return jsonResponse(400, { error: `service_type must be one of ${ALLOWED_SERVICE_TYPES.join(",")}` });
  }
  if (!auditId && !projectId) {
    return jsonResponse(400, { error: "audit_id or project_id required" });
  }

  // --- Qualification ---
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
    // No job created, no Paperclip call attempted.
    return jsonResponse(422, {
      error: "Lead not qualified",
      reason: "audit score < 50 and no phase_2_besoin in project discovery_data",
    });
  }

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
    if ((jobErr as { code?: string }).code === "23505") {
      // Unique active job per audit
      return jsonResponse(409, { error: "Active job already exists for this audit" });
    }
    console.error("[paperclip-intake] insert job error", jobErr);
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

  // --- Dispatch: MOCK ONLY in this build. ---
  if (!isPaperclipMockEnabled()) {
    // Safety net: even if mock is explicitly disabled, we never call out in
    // this lot — Paperclip Hostinger is not deployed yet.
    await admin
      .from("paperclip_jobs")
      .update({
        status: "failed",
        last_error: "Mock disabled but Paperclip live dispatch is not enabled in this build",
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return jsonResponse(503, {
      error: "Paperclip live mode not enabled in this build",
      hint: "Set PAPERCLIP_MOCK=true (or PAPERCLIP_MOCK_ENABLED=true)",
      job_id: jobId,
    });
  }

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
    payload: { mock_ticket_id: mockTicketId, note: "PAPERCLIP_MOCK*=true" },
  });

  return jsonResponse(200, {
    ok: true,
    mode: "mock",
    job_id: jobId,
    paperclip_ticket_id: mockTicketId,
    status: "sent_to_paperclip",
  });
});
