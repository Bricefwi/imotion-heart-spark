// Worker that drains the `sync_queue`. Triggered every minute by pg_cron.
//
// Flow:
//   1. Verify CRON_SECRET (or admin call)
//   2. Claim a batch of ready jobs atomically (lease-based)
//   3. For each job, dispatch by job_type → handler
//   4. On success → complete_sync_job; on error → fail_sync_job (auto retry/DLQ)
//
// Supported job_types:
//   - "marketing_audit_merge": payload = { user_id, project_id?, audit }
//   - "marketing_webhook_forward": payload = { url, body, headers? }  (generic HTTP)
//
// Logs are persisted in `sync_logs` (1 row per attempt) for full audit trail.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 10;
const LEASE_SECONDS = 60;
const WORKER_ID = `worker-${crypto.randomUUID().slice(0, 8)}`;

interface Job {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  related_user_id: string | null;
  related_project_id: string | null;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Handlers -------------------------------------------------------------

async function handleMarketingAuditMerge(supabase: SupabaseClient, job: Job) {
  const p = job.payload as {
    user_id?: string;
    project_id?: string;
    audit?: Record<string, unknown>;
  };
  if (!p.user_id || !p.audit) throw new Error("Missing user_id or audit in payload");

  const auditRow = {
    user_id: p.user_id,
    source: "lovelib",
    status: "completed",
    completed_at: new Date().toISOString(),
    external_id: (p.audit.external_id as string | undefined) ?? null,
    company_name: (p.audit.company_name as string | undefined) ?? null,
    website_url: (p.audit.website_url as string | undefined) ?? null,
    score: (p.audit.score as number | undefined) ?? null,
    summary: (p.audit.summary as string | undefined) ?? null,
    recommendations: Array.isArray(p.audit.recommendations) ? p.audit.recommendations : [],
    full_payload: (p.audit.full_payload as Record<string, unknown>) ?? p.audit,
  };

  let auditId: string | null = null;
  if (auditRow.external_id) {
    const { data: existing } = await supabase
      .from("marketing_audits")
      .select("id")
      .eq("user_id", p.user_id)
      .eq("external_id", auditRow.external_id)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("marketing_audits").update(auditRow).eq("id", existing.id);
      if (error) throw new Error(`update audit: ${error.message}`);
      auditId = existing.id;
    }
  }
  if (!auditId) {
    const { data, error } = await supabase
      .from("marketing_audits").insert(auditRow).select("id").single();
    if (error) throw new Error(`insert audit: ${error.message}`);
    auditId = data.id;
  }

  if (p.project_id) {
    const { data: project } = await supabase
      .from("projects").select("id, discovery_data").eq("id", p.project_id).maybeSingle();
    if (project) {
      const merged = {
        ...((project.discovery_data as Record<string, unknown>) ?? {}),
        marketing_audit: {
          audit_id: auditId,
          received_at: new Date().toISOString(),
          source: "sync_queue",
          score: auditRow.score,
          summary: auditRow.summary,
          recommendations: auditRow.recommendations,
        },
      };
      await supabase.from("projects")
        .update({ discovery_data: merged, last_activity_at: new Date().toISOString() })
        .eq("id", p.project_id);
      await supabase.from("audit_to_project_links").insert({
        audit_id: auditId, project_id: p.project_id,
        linked_by: p.user_id, note: "Auto-linked via sync_queue",
      }).then(() => {}, () => {});
    }
  }

  return { audit_id: auditId };
}

async function handleHttpForward(_supabase: SupabaseClient, job: Job) {
  const p = job.payload as { url?: string; body?: unknown; headers?: Record<string, string>; method?: string };
  if (!p.url) throw new Error("Missing url in payload");

  const res = await fetch(p.url, {
    method: p.method ?? "POST",
    headers: { "Content-Type": "application/json", ...(p.headers ?? {}) },
    body: p.body ? JSON.stringify(p.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    (err as Error & { responseCode?: number; snippet?: string }).responseCode = res.status;
    (err as Error & { responseCode?: number; snippet?: string }).snippet = text.slice(0, 500);
    throw err;
  }
  return { response_code: res.status, snippet: text.slice(0, 500) };
}

const HANDLERS: Record<string, (s: SupabaseClient, j: Job) => Promise<unknown>> = {
  marketing_audit_merge: handleMarketingAuditMerge,
  marketing_webhook_forward: handleHttpForward,
};

// --- Server ---------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  // Auth: cron secret OR admin user
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Claim batch
  const { data: jobs, error: claimErr } = await supabase
    .rpc("claim_sync_jobs", {
      _worker_id: WORKER_ID,
      _batch_size: BATCH_SIZE,
      _lease_seconds: LEASE_SECONDS,
    });

  if (claimErr) {
    console.error("[sync-worker] claim error:", claimErr);
    return jsonResponse(500, { error: claimErr.message });
  }

  const claimed = (jobs as Job[] | null) ?? [];
  if (claimed.length === 0) {
    return jsonResponse(200, { ok: true, processed: 0, worker_id: WORKER_ID });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const job of claimed) {
    const startedAt = Date.now();
    const handler = HANDLERS[job.job_type];

    if (!handler) {
      await supabase.rpc("fail_sync_job", {
        _job_id: job.id,
        _error_message: `Unknown job_type: ${job.job_type}`,
        _duration_ms: 0,
        _worker_id: WORKER_ID,
      });
      results.push({ id: job.id, status: "failure", error: "unknown_type" });
      continue;
    }

    try {
      const out = await handler(supabase, job) as Record<string, unknown> | undefined;
      const duration = Date.now() - startedAt;
      await supabase.rpc("complete_sync_job", {
        _job_id: job.id,
        _duration_ms: duration,
        _response_code: (out?.response_code as number | undefined) ?? null,
        _response_snippet: (out?.snippet as string | undefined) ?? JSON.stringify(out).slice(0, 500),
        _worker_id: WORKER_ID,
      });
      results.push({ id: job.id, status: "success" });
    } catch (e) {
      const err = e as Error & { responseCode?: number; snippet?: string };
      const duration = Date.now() - startedAt;
      await supabase.rpc("fail_sync_job", {
        _job_id: job.id,
        _error_message: err.message ?? String(e),
        _duration_ms: duration,
        _response_code: err.responseCode ?? null,
        _response_snippet: err.snippet ?? null,
        _worker_id: WORKER_ID,
      });
      results.push({ id: job.id, status: "failure", error: err.message });
      console.error(`[sync-worker] job ${job.id} (${job.job_type}) failed:`, err.message);
    }
  }

  return jsonResponse(200, {
    ok: true,
    processed: claimed.length,
    worker_id: WORKER_ID,
    results,
  });
});
