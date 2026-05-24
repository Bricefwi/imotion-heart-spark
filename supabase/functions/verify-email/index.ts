import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const AGENT_NAME = "VERIFY-EMAIL";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AgentOutput {
  agent: string;
  status: "success" | "error";
  project_id: string | null;
  verified: boolean;
  confidence: number;
  warnings: string[];
  error?: { code: string; message: string };
}

function jsonResponse(p: AgentOutput, s = 200): Response {
  return new Response(JSON.stringify(p), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorOut(code: string, message: string, status: number): Response {
  return jsonResponse({
    agent: AGENT_NAME, status: "error", project_id: null, verified: false,
    confidence: 1.0, warnings: [], error: { code, message },
  }, status);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorOut("METHOD_NOT_ALLOWED", "Use POST", 405);

  let body: { token?: string; project_id?: string };
  try { body = await req.json(); }
  catch { return errorOut("BAD_REQUEST", "Invalid JSON", 400); }
  if (!body.token || !body.project_id) {
    return errorOut("BAD_REQUEST", "Missing token or project_id", 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: verification, error } = await supabaseAdmin
    .from("email_verifications")
    .select("id, user_id, project_id, expires_at, used_at")
    .eq("token", body.token)
    .eq("project_id", body.project_id)
    .single();

  if (error || !verification) {
    return errorOut("INVALID_TOKEN", "Token not found", 404);
  }

  if (verification.used_at) {
    return jsonResponse({
      agent: AGENT_NAME, status: "success",
      project_id: verification.project_id, verified: true,
      confidence: 1.0, warnings: ["Token already used"],
    });
  }

  if (new Date(verification.expires_at) < new Date()) {
    return errorOut("EXPIRED_TOKEN", "Token expired", 410);
  }

  const ipHeader = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip");
  const usedFromIp = ipHeader?.split(",")[0]?.trim() ?? null;
  const nowIso = new Date().toISOString();

  await supabaseAdmin
    .from("email_verifications")
    .update({ used_at: nowIso, used_from_ip: usedFromIp })
    .eq("id", verification.id);

  const { error: projectError } = await supabaseAdmin
    .from("projects")
    .update({ email_verified: true, email_verified_at: nowIso })
    .eq("id", verification.project_id);

  if (projectError) {
    console.error(`[${AGENT_NAME}] Project update failed:`, projectError);
    return errorOut("DB_ERROR", "Could not update project", 500);
  }

  await supabaseAdmin.from("events").insert({
    user_id: verification.user_id,
    session_id: crypto.randomUUID(),
    event_type: "email_captured",
    event_data: { project_id: verification.project_id, verified: true, method: "token_link" },
    dedup_hash: `email_captured:${verification.project_id}`,
  }).then(() => {}, () => {});

  return jsonResponse({
    agent: AGENT_NAME, status: "success",
    project_id: verification.project_id, verified: true,
    confidence: 1.0, warnings: [],
  });
});
