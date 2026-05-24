import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const AGENT_NAME = "CAPTURE-EMAIL";
const TOKEN_TTL_HOURS = 24;
const MAX_PENDING_TOKENS_PER_PROJECT = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AgentOutput {
  agent: string;
  status: "success" | "error";
  email_sent: boolean;
  expires_at: string | null;
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
    agent: AGENT_NAME, status: "error", email_sent: false, expires_at: null,
    confidence: 1.0, warnings: [], error: { code, message },
  }, status);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorOut("METHOD_NOT_ALLOWED", "Use POST", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorOut("UNAUTHENTICATED", "Missing Bearer token", 401);
  }
  const jwt = authHeader.replace("Bearer ", "");

  let body: { project_id?: string };
  try { body = await req.json(); }
  catch { return errorOut("BAD_REQUEST", "Invalid JSON", 400); }
  if (!body.project_id) return errorOut("BAD_REQUEST", "Missing project_id", 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData.user) return errorOut("UNAUTHENTICATED", "Invalid JWT", 401);
  const userId = userData.user.id;
  const userEmail = userData.user.email;
  if (!userEmail) return errorOut("NO_EMAIL", "User has no email on auth.users", 400);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, client_id, email_verified")
    .eq("id", body.project_id)
    .single();

  if (projectError || !project) return errorOut("PROJECT_NOT_FOUND", "Project not accessible", 404);
  if (project.client_id !== userId) return errorOut("FORBIDDEN", "Not the project owner", 403);

  const warnings: string[] = [];
  if (project.email_verified) {
    warnings.push("Project email already verified - sending a new token anyway");
  }

  const { count: pendingCount } = await supabaseAdmin
    .from("email_verifications")
    .select("id", { count: "exact", head: true })
    .eq("project_id", body.project_id)
    .is("used_at", null)
    .gte("expires_at", new Date().toISOString());

  if ((pendingCount ?? 0) >= MAX_PENDING_TOKENS_PER_PROJECT) {
    return errorOut("RATE_LIMITED", `Too many pending tokens (max ${MAX_PENDING_TOKENS_PER_PROJECT})`, 429);
  }

  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_TTL_HOURS);

  const { error: insertError } = await supabaseAdmin
    .from("email_verifications")
    .insert({
      token, user_id: userId, project_id: body.project_id,
      email: userEmail, expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    console.error(`[${AGENT_NAME}] Insert failed:`, insertError);
    return errorOut("DB_ERROR", "Could not create verification token", 500);
  }

  const appUrl = Deno.env.get("APP_URL") ?? "https://app.imotion-conseils.fr";
  const verifyUrl = `${appUrl}/auth/verify-email?token=${token}&project_id=${body.project_id}`;

  try {
    const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({
        type: "email_verification",
        recipientId: userId,
        projectId: body.project_id,
        metadata: {
          verifyUrl, projectName: project.name,
          expiresAt: expiresAt.toISOString(),
          ttlHours: TOKEN_TTL_HOURS, email: userEmail,
        },
      }),
    });
    if (!sendRes.ok) {
      warnings.push("Email queued but delivery not confirmed");
    }
  } catch (e) {
    console.error(`[${AGENT_NAME}] send-email failed:`, e);
    warnings.push("Email service unreachable; user can retry");
  }

  return jsonResponse({
    agent: AGENT_NAME, status: "success", email_sent: true,
    expires_at: expiresAt.toISOString(), confidence: 1.0, warnings,
  });
});
