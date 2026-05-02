// Tests d'intégration + edge pour process-sync-queue
//
// Couverture:
//  - classifyError: 5xx → transient, 4xx → permanent, network → transient,
//    timeout/abort → transient, codes PG → transient
//  - handleHttpForward: idempotency-key (dedupe_key), HMAC headers,
//    retry_on custom, timeout, validation URL/method (SSRF/protocol)
//  - DB integration: backoff exponentiel, transition vers dead_letter
//    après max_attempts, partial NE consomme PAS d'attempt
//
// Lance avec: deno test --allow-net --allow-env --allow-read

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
  assertMatch,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

import {
  classifyError,
  handleHttpForward,
  PermanentError,
  TransientError,
  type Job,
} from "./index.ts";

// --- helpers --------------------------------------------------------------

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: crypto.randomUUID(),
    job_type: "marketing_webhook_forward",
    payload: {},
    attempts: 0,
    max_attempts: 5,
    dedupe_key: null,
    related_user_id: null,
    related_project_id: null,
    ...overrides,
  };
}

// Stub minimal de SupabaseClient (handleHttpForward ne l'utilise pas)
// deno-lint-ignore no-explicit-any
const stubClient: any = {};

function withMockFetch(
  impl: (req: Request) => Promise<Response> | Response,
  fn: () => Promise<void>,
) {
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input.toString(), init);
    return Promise.resolve(impl(req));
  }) as typeof fetch;
  return fn().finally(() => { globalThis.fetch = original; });
}

// =========================================================================
// classifyError — règles HTTP / réseau / PG
// =========================================================================

Deno.test("classifyError: 500 → transient", () => {
  const err = Object.assign(new Error("oops"), { responseCode: 500 });
  assertEquals(classifyError(err).kind, "transient");
});

Deno.test("classifyError: 502/503/504 → transient", () => {
  for (const code of [502, 503, 504]) {
    assertEquals(classifyError({ message: `bad ${code}`, status: code }).kind, "transient");
  }
});

Deno.test("classifyError: 408 timeout & 429 rate-limit → transient", () => {
  assertEquals(classifyError({ message: "timeout", status: 408 }).kind, "transient");
  assertEquals(classifyError({ message: "ratelimited", status: 429 }).kind, "transient");
});

Deno.test("classifyError: 400/401/403/404/422 → permanent", () => {
  for (const code of [400, 401, 403, 404, 422]) {
    assertEquals(
      classifyError({ message: `client err ${code}`, status: code }).kind,
      "permanent",
      `code ${code} should be permanent`,
    );
  }
});

Deno.test("classifyError: réseau / TypeError fetch → transient", () => {
  const e = new TypeError("fetch failed");
  assertEquals(classifyError(e).kind, "transient");
});

Deno.test("classifyError: ECONNRESET / ETIMEDOUT → transient", () => {
  assertEquals(classifyError(new Error("read ECONNRESET")).kind, "transient");
  assertEquals(classifyError(new Error("connect ETIMEDOUT 1.2.3.4")).kind, "transient");
});

Deno.test("classifyError: PG code transient (deadlock 40P01)", () => {
  const err = Object.assign(new Error("deadlock detected"), { code: "40P01" });
  assertEquals(classifyError(err).kind, "transient");
});

Deno.test("classifyError: PermanentError préserve kind & responseCode", () => {
  const e = new PermanentError("invalid", { responseCode: 422, snippet: "bad" });
  const c = classifyError(e);
  assertEquals(c.kind, "permanent");
  assertEquals(c.responseCode, 422);
  assertEquals(c.snippet, "bad");
});

Deno.test("classifyError: TransientError préserve kind", () => {
  const e = new TransientError("flaky", { responseCode: 503 });
  assertEquals(classifyError(e).kind, "transient");
});

// =========================================================================
// handleHttpForward — idempotence, headers, validation
// =========================================================================

Deno.test("handleHttpForward: rejette URL manquante (permanent)", async () => {
  const job = makeJob({ payload: {} });
  try {
    await handleHttpForward(stubClient, job);
    throw new Error("should have thrown");
  } catch (e) {
    assertEquals((e as PermanentError).kind, "permanent");
    assertStringIncludes((e as Error).message, "Missing url");
  }
});

Deno.test("handleHttpForward: rejette protocole non http (permanent)", async () => {
  const job = makeJob({ payload: { url: "file:///etc/passwd" } });
  try {
    await handleHttpForward(stubClient, job);
    throw new Error("should have thrown");
  } catch (e) {
    assertEquals((e as PermanentError).kind, "permanent");
  }
});

Deno.test("handleHttpForward: rejette URL invalide (permanent)", async () => {
  const job = makeJob({ payload: { url: "not a url" } });
  try {
    await handleHttpForward(stubClient, job);
    throw new Error("should have thrown");
  } catch (e) {
    assertEquals((e as PermanentError).kind, "permanent");
  }
});

Deno.test("handleHttpForward: rejette méthode non autorisée (permanent)", async () => {
  const job = makeJob({ payload: { url: "https://example.com", method: "TRACE" } });
  try {
    await handleHttpForward(stubClient, job);
    throw new Error("should have thrown");
  } catch (e) {
    assertEquals((e as PermanentError).kind, "permanent");
  }
});

Deno.test("handleHttpForward: dedupe_key → Idempotency-Key", async () => {
  const dedupe = "audit-42-merge";
  const cap: { value: Headers | null } = { value: null };
  await withMockFetch(
    (req) => { cap.value = req.headers; return new Response("ok", { status: 200 }); },
    async () => {
      const job = makeJob({
        dedupe_key: dedupe,
        payload: { url: "https://example.com/hook", body: { foo: 1 } },
      });
      const out = await handleHttpForward(stubClient, job) as { idempotency_key: string };
      assertEquals(out.idempotency_key, dedupe);
    },
  );
  assertExists(cap.value);
  assertEquals(cap.value!.get("idempotency-key"), dedupe);
  assertEquals(cap.value!.get("x-job-id"), expect_anything_uuid(cap.value!));
});

// helper inline pour valider format UUID (et éviter erreur "any")
function expect_anything_uuid(h: Headers): string {
  const v = h.get("x-job-id") ?? "";
  assertMatch(v, /^[0-9a-f-]{36}$/i);
  return v;
}

Deno.test("handleHttpForward: fallback Idempotency-Key = job.id si pas de dedupe", async () => {
  const cap: { value: Headers | null } = { value: null };
  const job = makeJob({
    payload: { url: "https://example.com/hook", body: { x: 1 } },
  });
  await withMockFetch(
    (req) => { cap.value = req.headers; return new Response("ok", { status: 200 }); },
    async () => { await handleHttpForward(stubClient, job); },
  );
  assertEquals(cap.value!.get("idempotency-key"), job.id);
});

Deno.test("handleHttpForward: 503 → TransientError", async () => {
  await withMockFetch(
    () => new Response("upstream down", { status: 503 }),
    async () => {
      const job = makeJob({
        payload: { url: "https://example.com/hook", body: { a: 1 } },
      });
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as TransientError).kind, "transient");
        assertEquals((e as TransientError).responseCode, 503);
      }
    },
  );
});

Deno.test("handleHttpForward: 404 → PermanentError (pas de retry inutile)", async () => {
  await withMockFetch(
    () => new Response("nope", { status: 404 }),
    async () => {
      const job = makeJob({
        payload: { url: "https://example.com/hook", body: { a: 1 } },
      });
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as PermanentError).kind, "permanent");
        assertEquals((e as PermanentError).responseCode, 404);
      }
    },
  );
});

Deno.test("handleHttpForward: retry_on custom (418) → transient", async () => {
  await withMockFetch(
    () => new Response("teapot", { status: 418 }),
    async () => {
      const job = makeJob({
        payload: {
          url: "https://example.com/hook",
          body: { a: 1 },
          retry_on: [418],
        },
      });
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as TransientError).kind, "transient");
      }
    },
  );
});

Deno.test("handleHttpForward: 418 sans retry_on → permanent", async () => {
  await withMockFetch(
    () => new Response("teapot", { status: 418 }),
    async () => {
      const job = makeJob({
        payload: { url: "https://example.com/hook", body: { a: 1 } },
      });
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as PermanentError).kind, "permanent");
      }
    },
  );
});

Deno.test("handleHttpForward: erreur réseau (fetch throws) → transient", async () => {
  await withMockFetch(
    () => { throw new TypeError("fetch failed"); },
    async () => {
      const job = makeJob({
        payload: { url: "https://example.com/hook", body: {} },
      });
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as TransientError).kind, "transient");
        assertStringIncludes((e as Error).message, "fetch failed");
      }
    },
  );
});

Deno.test("handleHttpForward: timeout → transient", async () => {
  await withMockFetch(
    (req) => new Promise<Response>((resolve, reject) => {
      // simule un fetch qui ne répond jamais — l'AbortController du worker doit le couper
      req.signal.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    }),
    async () => {
      const job = makeJob({
        payload: {
          url: "https://example.com/slow",
          body: {},
          timeout_ms: 1000,
        },
      });
      const t0 = Date.now();
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as TransientError).kind, "transient");
        assertStringIncludes((e as Error).message, "timeout");
        // sanity: a effectivement attendu ~timeout_ms
        const dt = Date.now() - t0;
        if (dt < 800) throw new Error(`timeout déclenché trop tôt: ${dt}ms`);
      }
    },
  );
});

Deno.test("handleHttpForward: HMAC signe avec secret env", async () => {
  Deno.env.set("MARKETING_WEBHOOK_SECRET", "test-secret-xyz");
  const cap: { value: Headers | null } = { value: null };
  const bodyRef: { value: string | null } = { value: null };
  await withMockFetch(
    async (req) => {
      cap.value = req.headers;
      bodyRef.value = await req.text();
      return new Response("ok", { status: 200 });
    },
    async () => {
      const job = makeJob({
        payload: {
          url: "https://example.com/hook",
          body: { hello: "world" },
          sign: {},
        },
      });
      await handleHttpForward(stubClient, job);
    },
  );
  assertExists(cap.value);
  const sig = cap.value!.get("x-webhook-signature");
  const ts = cap.value!.get("x-webhook-timestamp");
  const nonce = cap.value!.get("x-webhook-nonce");
  assertExists(sig); assertExists(ts); assertExists(nonce);
  assertMatch(sig!, /^[0-9a-f]{64}$/);
  assertEquals(bodyRef.value, JSON.stringify({ hello: "world" }));
});

Deno.test("handleHttpForward: HMAC sans secret → permanent", async () => {
  Deno.env.delete("MARKETING_WEBHOOK_SECRET");
  await withMockFetch(
    () => new Response("ok"),
    async () => {
      const job = makeJob({
        payload: {
          url: "https://example.com/hook",
          body: { x: 1 },
          sign: { secret_env: "MISSING_SECRET_XYZ" },
        },
      });
      try {
        await handleHttpForward(stubClient, job);
        throw new Error("expected throw");
      } catch (e) {
        assertEquals((e as PermanentError).kind, "permanent");
      }
    },
  );
});

Deno.test("handleHttpForward: 200 → résultat avec response_code + snippet", async () => {
  await withMockFetch(
    () => new Response("OK_BODY", { status: 200 }),
    async () => {
      const job = makeJob({
        payload: { url: "https://example.com/hook", body: {} },
      });
      const out = await handleHttpForward(stubClient, job) as {
        response_code: number; snippet: string; idempotency_key: string;
      };
      assertEquals(out.response_code, 200);
      assertEquals(out.snippet, "OK_BODY");
      assertEquals(out.idempotency_key, job.id);
    },
  );
});

// =========================================================================
// Intégration DB — backoff, idempotence dedupe_key, DLQ
// =========================================================================

// Tests d'intégration DB: opt-in uniquement (nécessite une vraie service-role key
// et la possibilité d'écrire dans sync_queue/sync_logs). Lance avec :
//   RUN_DB_TESTS=1 deno test --allow-net --allow-env --allow-read
// Sinon, on couvre l'intégration DB par le script SQL `tests/sync-queue-db.sql`.
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RUN_DB_TESTS = Deno.env.get("RUN_DB_TESTS") === "1" && Boolean(SUPABASE_URL && SERVICE_KEY);

function dbTest(name: string, fn: () => Promise<void>) {
  Deno.test({
    name,
    ignore: !RUN_DB_TESTS,
    fn,
  });
}

const admin = RUN_DB_TESTS
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } })
  : null;

async function enqueue(jobType: string, payload: Record<string, unknown>, dedupeKey?: string) {
  const { data, error } = await admin!
    .rpc("enqueue_sync_job", {
      _job_type: jobType,
      _payload: payload,
      _dedupe_key: dedupeKey ?? null,
      _related_project_id: null,
      _max_attempts: 3,
    });
  if (error) throw error;
  return data as string;
}

async function fetchJob(id: string) {
  const { data, error } = await admin!.from("sync_queue").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

async function cleanup(ids: string[]) {
  if (!ids.length) return;
  await admin!.from("sync_logs").delete().in("job_id", ids);
  await admin!.from("sync_queue").delete().in("id", ids);
}

dbTest("DB: backoff exponentiel — next_retry_at recule à chaque échec transient", async () => {
  const id = await enqueue("marketing_webhook_forward", {
    url: "https://example.invalid/hook",
    body: { test: true },
  }, `test-backoff-${crypto.randomUUID()}`);
  try {
    const before = await fetchJob(id);
    assertEquals(before.attempts, 0);
    assertEquals(before.status, "pending");

    // 1er échec transient
    await admin!.rpc("fail_sync_job_classified", {
      _job_id: id, _error_message: "503 upstream", _error_kind: "transient",
      _duration_ms: 100, _response_code: 503, _worker_id: "test-worker",
    });
    const a1 = await fetchJob(id);
    assertEquals(a1.attempts, 1);
    assertEquals(a1.status, "pending");
    const dt1 = new Date(a1.next_retry_at).getTime() - Date.now();
    if (dt1 < 30_000) throw new Error(`backoff #1 trop court: ${dt1}ms`);

    // 2e échec — backoff doit être plus long
    await admin!.rpc("fail_sync_job_classified", {
      _job_id: id, _error_message: "503 upstream", _error_kind: "transient",
      _duration_ms: 100, _response_code: 503, _worker_id: "test-worker",
    });
    const a2 = await fetchJob(id);
    assertEquals(a2.attempts, 2);
    const dt2 = new Date(a2.next_retry_at).getTime() - Date.now();
    if (dt2 <= dt1) throw new Error(`backoff #2 (${dt2}) doit être > #1 (${dt1})`);
  } finally {
    await cleanup([id]);
  }
});

dbTest("DB: après max_attempts → status = dead_letter (DLQ)", async () => {
  const id = await enqueue("marketing_webhook_forward", {
    url: "https://example.invalid/dlq",
    body: { test: true },
  }, `test-dlq-${crypto.randomUUID()}`);
  try {
    // 3 échecs (max_attempts = 3)
    for (let i = 0; i < 3; i++) {
      await admin!.rpc("fail_sync_job_classified", {
        _job_id: id, _error_message: "503", _error_kind: "transient",
        _duration_ms: 50, _response_code: 503, _worker_id: "test-worker",
      });
    }
    const final = await fetchJob(id);
    assertEquals(final.attempts, 3);
    assertEquals(final.status, "dead_letter");

    // les logs doivent contenir 3 entrées
    const { data: logs } = await admin!.from("sync_logs").select("id").eq("job_id", id);
    assertEquals(logs?.length ?? 0, 3);
  } finally {
    await cleanup([id]);
  }
});

dbTest("DB: erreur permanent → dead_letter immédiat (1 attempt)", async () => {
  const id = await enqueue("marketing_webhook_forward", {
    url: "https://example.invalid/perm",
    body: { test: true },
  }, `test-perm-${crypto.randomUUID()}`);
  try {
    await admin!.rpc("fail_sync_job_classified", {
      _job_id: id, _error_message: "404 not found", _error_kind: "permanent",
      _duration_ms: 50, _response_code: 404, _worker_id: "test-worker",
    });
    const j = await fetchJob(id);
    assertEquals(j.status, "dead_letter");
    assertEquals(j.attempts, 1);
  } finally {
    await cleanup([id]);
  }
});

dbTest("DB: partial NE consomme PAS d'attempt et sauvegarde le checkpoint", async () => {
  const id = await enqueue("marketing_audit_merge", {
    user_id: crypto.randomUUID(),
    audit: { score: 80, recommendations: [] },
  }, `test-partial-${crypto.randomUUID()}`);
  try {
    await admin!.rpc("fail_sync_job_classified", {
      _job_id: id, _error_message: "step 2 failed", _error_kind: "partial",
      _duration_ms: 50, _worker_id: "test-worker",
      _progress: { audit_done: true, audit_id: crypto.randomUUID() },
    });
    const j = await fetchJob(id);
    assertEquals(j.status, "pending");
    assertEquals(j.attempts, 0, "partial ne doit PAS consommer d'attempt");
    const progress = (j.payload as Record<string, unknown>)._progress as Record<string, unknown>;
    assertExists(progress);
    assertEquals(progress.audit_done, true);
    // re-essaye dans ~30s
    const dt = new Date(j.next_retry_at).getTime() - Date.now();
    if (dt > 60_000 || dt < 10_000) {
      throw new Error(`partial requeue attendu ~30s, reçu ${dt}ms`);
    }
  } finally {
    await cleanup([id]);
  }
});

dbTest("DB: dedupe_key empêche les doublons (idempotence côté enqueue)", async () => {
  const dedupe = `test-dedupe-${crypto.randomUUID()}`;
  const id1 = await enqueue("marketing_webhook_forward", {
    url: "https://example.invalid/d", body: { v: 1 },
  }, dedupe);
  const id2 = await enqueue("marketing_webhook_forward", {
    url: "https://example.invalid/d", body: { v: 2 },
  }, dedupe);
  try {
    assertEquals(id1, id2, "même dedupe_key doit retourner le même job id");
    const { count } = await admin!
      .from("sync_queue").select("*", { count: "exact", head: true }).eq("dedupe_key", dedupe);
    assertEquals(count, 1);
  } finally {
    await cleanup([id1]);
  }
});
