// Resolves the active Claude model with Supabase-backed TTL cache.
// Avoids re-pinging the Anthropic API on every turn.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PRIMARY = "claude-opus-4-5";
const FALLBACK = "claude-sonnet-4-5";
const DEFAULT_TTL_SECONDS = 3600; // 1h
const PING_TIMEOUT_MS = 4000;

type Scope = "orchestrator" | "cdc-worker" | "synthesizer" | string;

let _serviceClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service credentials missing");
  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _serviceClient;
}

async function pingAnthropicModel(model: string, apiKey: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ok" }],
      }),
    });
    if (res.ok) return true;
    const body = await res.text();
    const notFound =
      res.status === 404 ||
      /model_not_found|not_available|invalid.*model/i.test(body);
    if (notFound) {
      console.warn(`[active-model] ${model} unavailable: ${res.status}`);
      return false;
    }
    // Transient error -> assume available, don't fallback unnecessarily
    console.warn(`[active-model] ${model} ping transient error ${res.status}`);
    return true;
  } catch (e) {
    console.error(`[active-model] ping ${model} failed:`, e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns the active Claude model for a given scope.
 * Strategy:
 *   1. Read cached value from Supabase (TTL-aware via get_active_model RPC).
 *   2. If miss/expired -> ping PRIMARY, fallback to FALLBACK if KO.
 *   3. Persist resolved model with TTL via set_active_model RPC.
 */
export async function getActiveClaudeModel(opts?: {
  scope?: Scope;
  ttlSeconds?: number;
  apiKey?: string;
}): Promise<string> {
  const scope = opts?.scope ?? "orchestrator";
  const ttl = opts?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const apiKey = opts?.apiKey ?? Deno.env.get("ANTHROPIC_API_KEY") ?? "";

  const supabase = getServiceClient();

  // 1. Cache lookup
  const { data: cached, error: readErr } = await supabase.rpc("get_active_model", {
    _scope: scope,
  });
  if (!readErr && cached) {
    return cached as string;
  }
  if (readErr) {
    console.warn("[active-model] cache read failed, will resolve fresh:", readErr.message);
  }

  // 2. Resolve fresh
  let resolved = PRIMARY;
  if (apiKey) {
    const primaryOk = await pingAnthropicModel(PRIMARY, apiKey);
    resolved = primaryOk ? PRIMARY : FALLBACK;
  } else {
    console.warn("[active-model] no ANTHROPIC_API_KEY, defaulting to PRIMARY without ping");
  }

  // 3. Persist (best-effort, don't block on write error)
  const { error: writeErr } = await supabase.rpc("set_active_model", {
    _model: resolved,
    _scope: scope,
    _ttl_seconds: ttl,
  });
  if (writeErr) {
    console.error("[active-model] cache write failed:", writeErr.message);
  }

  return resolved;
}

/** Force invalidation (e.g. after observing 404 mid-session). */
export async function invalidateActiveModel(scope: Scope = "orchestrator"): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("agent_state")
    .delete()
    .eq("scope", scope)
    .eq("key", "active_model");
}
