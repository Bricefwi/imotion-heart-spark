// call-mistral-agent — Gateway générique vers les agents Mistral IMOTION.
//
// Deux modes :
//   { mode: "status" }                      → état de configuration des secrets (booleans uniquement)
//   { agent: "stratos", prompt: "..." }     → appelle l'agent et renvoie sa réponse
//
// Réservé aux admins/consultants (les agents sont des outils internes BUILD/MARKETING).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  callMistralAgent,
  getMistralAgentsStatus,
  type MistralAgentKey,
} from "../_shared/mistral-agents.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_AGENTS: MistralAgentKey[] = [
  "maestro", "titan", "stratos", "marketix", "literix",
  "financix", "juridix", "pixel", "nexus", "focus", "n8nix",
];
const MAX_PROMPT_LENGTH = 50_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await anonClient.auth.getUser();
    if (authError || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const roles = (userRoles || []).map((r: { role: string }) => r.role);
    if (!roles.some((r: string) => ["admin", "super_admin", "consultant"].includes(r))) {
      return json({ error: "Forbidden: agents réservés à l'équipe IMOTION" }, 403);
    }

    const body = await req.json();

    // ─── Mode status : quels secrets sont configurés (booleans, jamais les valeurs) ───
    if (body.mode === "status") {
      return json({ success: true, agents: getMistralAgentsStatus() });
    }

    // ─── Mode appel d'agent ───
    const agent = body.agent as MistralAgentKey;
    const prompt = body.prompt;

    if (!VALID_AGENTS.includes(agent)) {
      return json({ error: `Agent inconnu. Agents valides : ${VALID_AGENTS.join(", ")}` }, 400);
    }
    if (typeof prompt !== "string" || !prompt.trim()) {
      return json({ error: "Le champ 'prompt' est requis" }, 400);
    }

    const result = await callMistralAgent(
      agent,
      [{ role: "user", content: prompt.slice(0, MAX_PROMPT_LENGTH) }],
      { maxTokens: body.maxTokens, timeoutMs: 120_000 },
    );

    if (!result) {
      return json({
        error: `L'agent ${agent.toUpperCase()} n'est pas disponible. Vérifiez que MISTRAL_API_KEY et MISTRAL_AGENT_${agent.toUpperCase()} sont configurés dans Cloud → Secrets.`,
      }, 503);
    }

    return json({
      success: true,
      agent: result.agent,
      content: result.content,
      usage: { tokens_in: result.tokens_in, tokens_out: result.tokens_out },
    });
  } catch (e) {
    console.error("call-mistral-agent error:", e);
    return json({ error: "Erreur interne lors de l'appel à l'agent" }, 500);
  }
});
