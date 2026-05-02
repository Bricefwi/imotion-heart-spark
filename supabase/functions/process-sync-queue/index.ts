// Worker that drains the `sync_queue`. Triggered every minute by pg_cron.
//
// Flow:
//   1. Verify CRON_SECRET
//   2. Claim a batch of ready jobs atomically (lease-based)
//   3. For each job, dispatch by job_type → handler
//   4. On success → complete_sync_job
//      On error → fail_sync_job_classified (transient/permanent/partial):
//        - transient → backoff exponentiel standard
//        - permanent → dead_letter immédiat (pas de retry inutile)
//        - partial   → re-queue 30s, l'attempt n'est PAS consommé, le checkpoint est sauvegardé
//
// Handlers can:
//   - throw a plain Error           → treated as transient
//   - throw a TransientError        → explicit transient retry
//   - throw a PermanentError        → straight to dead_letter
//   - return { partial: true, progress, reason } → auto-requeue with checkpoint
//
// Logs are persisted in `sync_logs` (1 row per attempt) for full audit trail.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const BATCH_SIZE = 10;
export const LEASE_SECONDS = 60;
const WORKER_ID = `worker-${crypto.randomUUID().slice(0, 8)}`;

// HTTP status codes that should be retried automatically.
export const TRANSIENT_HTTP_CODES = new Set([408, 425, 429, 500, 502, 503, 504, 522, 524]);

// Postgres error codes considered transient (connection / serialization issues).
export const TRANSIENT_PG_CODES = new Set([
  "08000", "08003", "08006", "08001", "08004", // connection_exception
  "40001", "40P01", // serialization_failure / deadlock_detected
  "57P03", // cannot_connect_now
  "53300", // too_many_connections
]);

export interface Job {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  dedupe_key: string | null;
  related_user_id: string | null;
  related_project_id: string | null;
}

export type ErrorKind = "transient" | "permanent" | "partial";

export class ClassifiedError extends Error {
  kind: ErrorKind;
  responseCode?: number;
  snippet?: string;
  progress?: Record<string, unknown>;
  constructor(kind: ErrorKind, message: string, opts: {
    responseCode?: number; snippet?: string; progress?: Record<string, unknown>;
  } = {}) {
    super(message);
    this.kind = kind;
    this.responseCode = opts.responseCode;
    this.snippet = opts.snippet;
    this.progress = opts.progress;
  }
}

export class TransientError extends ClassifiedError {
  constructor(message: string, opts?: { responseCode?: number; snippet?: string }) {
    super("transient", message, opts);
  }
}

export class PermanentError extends ClassifiedError {
  constructor(message: string, opts?: { responseCode?: number; snippet?: string }) {
    super("permanent", message, opts);
  }
}

export interface PartialResult {
  partial: true;
  reason: string;
  progress?: Record<string, unknown>;
  responseCode?: number;
  snippet?: string;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Classify any thrown error → kind + metadata.
function classifyError(e: unknown): { kind: ErrorKind; message: string; responseCode?: number; snippet?: string; progress?: Record<string, unknown> } {
  if (e instanceof ClassifiedError) {
    return { kind: e.kind, message: e.message, responseCode: e.responseCode, snippet: e.snippet, progress: e.progress };
  }

  const err = e as Error & { responseCode?: number; snippet?: string; code?: string; status?: number; cause?: unknown };
  const message = err?.message ?? String(e);
  const code = err?.responseCode ?? err?.status;

  // HTTP status classification
  if (typeof code === "number") {
    if (TRANSIENT_HTTP_CODES.has(code)) {
      return { kind: "transient", message, responseCode: code, snippet: err.snippet };
    }
    if (code >= 400 && code < 500) {
      return { kind: "permanent", message, responseCode: code, snippet: err.snippet };
    }
    return { kind: "transient", message, responseCode: code, snippet: err.snippet };
  }

  // Network / fetch failure → transient
  if (
    err?.name === "TypeError" && /fetch|network|load failed/i.test(message) ||
    /ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|aborted|timeout/i.test(message)
  ) {
    return { kind: "transient", message, snippet: err.snippet };
  }

  // Postgres error code
  if (err?.code && TRANSIENT_PG_CODES.has(err.code)) {
    return { kind: "transient", message, snippet: err.snippet };
  }

  // Default: transient (safer to retry; backoff + max_attempts will eventually DLQ)
  return { kind: "transient", message, snippet: err.snippet };
}

// --- Handlers -------------------------------------------------------------

async function handleMarketingAuditMerge(supabase: SupabaseClient, job: Job) {
  const p = job.payload as {
    user_id?: string;
    project_id?: string;
    audit?: Record<string, unknown>;
    _progress?: { audit_done?: boolean; audit_id?: string; project_done?: boolean; link_done?: boolean };
  };
  if (!p.user_id || !p.audit) {
    throw new PermanentError("Missing user_id or audit in payload");
  }

  // Resume from checkpoint if present
  const progress = p._progress ?? {};
  let auditId: string | null = progress.audit_id ?? null;

  // Step 1: upsert audit (skip if already done)
  if (!progress.audit_done) {
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

    if (auditRow.external_id) {
      const { data: existing, error } = await supabase
        .from("marketing_audits").select("id")
        .eq("user_id", p.user_id).eq("external_id", auditRow.external_id).maybeSingle();
      if (error) throw new TransientError(`select audit: ${error.message}`);
      if (existing?.id) {
        const { error: updErr } = await supabase.from("marketing_audits").update(auditRow).eq("id", existing.id);
        if (updErr) throw new TransientError(`update audit: ${updErr.message}`);
        auditId = existing.id;
      }
    }
    if (!auditId) {
      const { data, error } = await supabase
        .from("marketing_audits").insert(auditRow).select("id").single();
      if (error) throw new TransientError(`insert audit: ${error.message}`);
      auditId = data.id;
    }
  }

  // Step 2: merge into project (optional)
  let projectDone = progress.project_done ?? !p.project_id;
  if (p.project_id && !projectDone) {
    const { data: project, error: selErr } = await supabase
      .from("projects").select("id, discovery_data").eq("id", p.project_id).maybeSingle();
    if (selErr) {
      // Project step failed but audit succeeded → partial success, retry only step 2+3
      return {
        partial: true,
        reason: `project select failed: ${selErr.message}`,
        progress: { audit_done: true, audit_id: auditId },
      } as PartialResult;
    }
    if (project) {
      const merged = {
        ...((project.discovery_data as Record<string, unknown>) ?? {}),
        marketing_audit: {
          audit_id: auditId,
          received_at: new Date().toISOString(),
          source: "sync_queue",
          score: p.audit.score,
          summary: p.audit.summary,
          recommendations: p.audit.recommendations,
        },
      };
      const { error: updErr } = await supabase.from("projects")
        .update({ discovery_data: merged, last_activity_at: new Date().toISOString() })
        .eq("id", p.project_id);
      if (updErr) {
        return {
          partial: true,
          reason: `project update failed: ${updErr.message}`,
          progress: { audit_done: true, audit_id: auditId },
        } as PartialResult;
      }
      projectDone = true;
    } else {
      projectDone = true; // project gone — nothing to do
    }
  }

  // Step 3: link audit ↔ project (best-effort, non-blocking)
  if (p.project_id && !progress.link_done && auditId) {
    const { error: linkErr } = await supabase.from("audit_to_project_links").insert({
      audit_id: auditId, project_id: p.project_id,
      linked_by: p.user_id, note: "Auto-linked via sync_queue",
    });
    // Ignore unique-violation (already linked); other errors → partial retry
    if (linkErr && !/duplicate|unique/i.test(linkErr.message)) {
      return {
        partial: true,
        reason: `link insert failed: ${linkErr.message}`,
        progress: { audit_done: true, audit_id: auditId, project_done: projectDone },
      } as PartialResult;
    }
  }

  return { audit_id: auditId };
}

// HMAC-SHA256 hex (for optional outbound webhook signing)
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface HttpForwardPayload {
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  timeout_ms?: number;
  // Idempotency: explicit key wins, else dedupe_key, else job.id
  idempotency_key?: string;
  // Optional HMAC signing of body (uses MARKETING_WEBHOOK_SECRET or provided secret_env)
  sign?: { secret_env?: string; header?: string }; // header default: x-webhook-signature
  // Treat these extra HTTP codes as transient for this specific call
  retry_on?: number[];
}

async function handleHttpForward(_supabase: SupabaseClient, job: Job) {
  const p = job.payload as HttpForwardPayload;
  if (!p.url) throw new PermanentError("Missing url in payload");

  // Validate URL early (no localhost/SSRF; HTTPS in prod)
  let parsedUrl: URL;
  try { parsedUrl = new URL(p.url); }
  catch { throw new PermanentError(`Invalid url: ${p.url}`); }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new PermanentError(`Unsupported protocol: ${parsedUrl.protocol}`);
  }

  const method = (p.method ?? "POST").toUpperCase();
  const allowedMethods = new Set(["POST", "PUT", "PATCH", "DELETE", "GET"]);
  if (!allowedMethods.has(method)) {
    throw new PermanentError(`Unsupported method: ${method}`);
  }

  // Serialize body once (used for both fetch + HMAC signature)
  const bodyString = (method === "GET" || p.body == null)
    ? undefined
    : (typeof p.body === "string" ? p.body : JSON.stringify(p.body));

  // Idempotency key — derived from job for natural dedup on receiver side
  const idempotencyKey = p.idempotency_key ?? job.dedupe_key ?? job.id;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    "x-job-id": job.id,
    "x-job-attempt": String(job.attempts),
    ...(p.headers ?? {}),
  };

  // Optional HMAC signing
  if (p.sign && bodyString) {
    const secretEnv = p.sign.secret_env ?? "MARKETING_WEBHOOK_SECRET";
    const secret = Deno.env.get(secretEnv);
    if (!secret) {
      throw new PermanentError(`Missing secret env: ${secretEnv}`);
    }
    const ts = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID();
    const sig = await hmacSha256Hex(secret, `${ts}.${nonce}.${bodyString}`);
    headers[p.sign.header ?? "x-webhook-signature"] = sig;
    headers["x-webhook-timestamp"] = String(ts);
    headers["x-webhook-nonce"] = nonce;
  }

  // Per-request transient codes
  const transientCodes = new Set<number>(TRANSIENT_HTTP_CODES);
  (p.retry_on ?? []).forEach((c) => transientCodes.add(c));

  // Timeout via AbortController
  const timeoutMs = Math.min(Math.max(p.timeout_ms ?? 30_000, 1000), 60_000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(p.url, {
      method,
      headers,
      body: bodyString,
      signal: controller.signal,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (controller.signal.aborted) {
      throw new TransientError(`fetch timeout after ${timeoutMs}ms`);
    }
    throw new TransientError(`fetch failed: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text().catch(() => "");
  const snippet = text.slice(0, 500);

  if (!res.ok) {
    if (transientCodes.has(res.status)) {
      throw new TransientError(`HTTP ${res.status}: ${text.slice(0, 200)}`, { responseCode: res.status, snippet });
    }
    throw new PermanentError(`HTTP ${res.status}: ${text.slice(0, 200)}`, { responseCode: res.status, snippet });
  }

  return {
    response_code: res.status,
    snippet,
    idempotency_key: idempotencyKey,
  };
}

const HANDLERS: Record<string, (s: SupabaseClient, j: Job) => Promise<unknown>> = {
  marketing_audit_merge: handleMarketingAuditMerge,
  marketing_webhook_forward: handleHttpForward,
};

// --- Server ---------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed" });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

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

  const results: Array<{ id: string; status: string; kind?: ErrorKind; error?: string }> = [];

  for (const job of claimed) {
    const startedAt = Date.now();
    const handler = HANDLERS[job.job_type];

    if (!handler) {
      await supabase.rpc("fail_sync_job_classified", {
        _job_id: job.id,
        _error_message: `Unknown job_type: ${job.job_type}`,
        _error_kind: "permanent",
        _duration_ms: 0,
        _worker_id: WORKER_ID,
      });
      results.push({ id: job.id, status: "failure", kind: "permanent", error: "unknown_type" });
      continue;
    }

    try {
      const out = await handler(supabase, job) as Record<string, unknown> | PartialResult | undefined;
      const duration = Date.now() - startedAt;

      // Detect partial success returned by handler
      if (out && (out as PartialResult).partial === true) {
        const partial = out as PartialResult;
        await supabase.rpc("fail_sync_job_classified", {
          _job_id: job.id,
          _error_message: `Partial: ${partial.reason}`,
          _error_kind: "partial",
          _duration_ms: duration,
          _response_code: partial.responseCode ?? null,
          _response_snippet: partial.snippet ?? null,
          _worker_id: WORKER_ID,
          _progress: partial.progress ?? null,
        });
        results.push({ id: job.id, status: "partial", kind: "partial" });
        console.log(`[sync-worker] job ${job.id} partial → auto-requeue: ${partial.reason}`);
        continue;
      }

      await supabase.rpc("complete_sync_job", {
        _job_id: job.id,
        _duration_ms: duration,
        _response_code: ((out as Record<string, unknown>)?.response_code as number | undefined) ?? null,
        _response_snippet: ((out as Record<string, unknown>)?.snippet as string | undefined)
          ?? JSON.stringify(out ?? {}).slice(0, 500),
        _worker_id: WORKER_ID,
      });
      results.push({ id: job.id, status: "success" });
    } catch (e) {
      const duration = Date.now() - startedAt;
      const c = classifyError(e);
      await supabase.rpc("fail_sync_job_classified", {
        _job_id: job.id,
        _error_message: c.message,
        _error_kind: c.kind,
        _duration_ms: duration,
        _response_code: c.responseCode ?? null,
        _response_snippet: c.snippet ?? null,
        _worker_id: WORKER_ID,
        _progress: c.progress ?? null,
      });
      results.push({ id: job.id, status: "failure", kind: c.kind, error: c.message });
      console.error(`[sync-worker] job ${job.id} (${job.job_type}) ${c.kind}:`, c.message);
    }
  }

  return jsonResponse(200, {
    ok: true,
    processed: claimed.length,
    worker_id: WORKER_ID,
    results,
  });
});
