// marketix-generate-campaign — Génération manuelle de campagnes marketing via l'agent MARKETIX.
// Réservé aux admins/super_admins/consultants. Persiste le résultat dans mkt_marketix_campaigns.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callMistralAgent } from "../_shared/mistral-agents.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface CampaignInput {
  title: string;
  objective: string;
  target_audience: string;
  channels: string[];
  tone?: string;
  budget_range?: string;
  extra_brief?: string;
  project_id?: string | null;
  audit_id?: string | null;
}

function buildPrompt(input: CampaignInput): string {
  return `Tu es MARKETIX, agent stratégique marketing IMOTION. Génère une campagne marketing complète et actionnable.

# Brief
- Titre : ${input.title}
- Objectif : ${input.objective}
- Audience cible : ${input.target_audience}
- Canaux : ${input.channels.join(", ") || "non spécifié"}
- Ton : ${input.tone || "professionnel chaleureux"}
- Budget : ${input.budget_range || "non précisé"}
${input.extra_brief ? `- Contexte supplémentaire : ${input.extra_brief}` : ""}

# Format de sortie OBLIGATOIRE (JSON strict, rien d'autre)
{
  "positionning": "Promesse centrale en 1 phrase forte",
  "key_messages": ["3 à 5 messages clés"],
  "segments": [
    { "name": "Segment", "description": "...", "pain_points": ["..."], "hook": "Accroche dédiée" }
  ],
  "channel_plan": [
    { "channel": "...", "format": "...", "frequency": "...", "kpi": "...", "content_idea": "..." }
  ],
  "content_calendar": [
    { "week": 1, "actions": ["..."] }
  ],
  "creatives": [
    { "type": "email|social|landing|ad", "headline": "...", "body": "...", "cta": "..." }
  ],
  "kpis": ["3 à 5 KPI mesurables avec cibles chiffrées"],
  "next_steps": ["Actions concrètes IMOTION pour lancer la campagne"]
}

Règles strictes :
- Pas de prix BUILD publics, jamais de témoignages ou statistiques inventés.
- Si tu cites une donnée, mentionne "à vérifier" ou source.
- Reste cohérent avec la charte IMOTION (Coral/Amber, ton expert chaleureux sans jargon).
- Renvoie UNIQUEMENT le JSON, sans markdown autour.`;
}

function tryParseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tente d'extraire le premier objet {...}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* noop */ }
    }
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const roleList = (roles || []).map((r: { role: string }) => r.role);
    const allowed = roleList.some((r: string) => ["admin", "super_admin", "consultant"].includes(r));
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const body = await req.json() as Partial<CampaignInput>;
    if (!body.title || !body.objective || !body.target_audience) {
      return json({ error: "title, objective et target_audience sont requis" }, 400);
    }
    if (body.title.length > 200 || body.objective.length > 2000 || body.target_audience.length > 2000) {
      return json({ error: "Champs trop longs" }, 400);
    }

    const input: CampaignInput = {
      title: body.title,
      objective: body.objective,
      target_audience: body.target_audience,
      channels: Array.isArray(body.channels) ? body.channels.slice(0, 12).map(String) : [],
      tone: body.tone?.slice(0, 200),
      budget_range: body.budget_range?.slice(0, 200),
      extra_brief: body.extra_brief?.slice(0, 4000),
      project_id: body.project_id || null,
      audit_id: body.audit_id || null,
    };

    // Insert draft d'abord (statut "generating")
    const { data: draft, error: insertErr } = await admin
      .from("mkt_marketix_campaigns")
      .insert({
        created_by: userId,
        project_id: input.project_id,
        audit_id: input.audit_id,
        title: input.title,
        objective: input.objective,
        target_audience: input.target_audience,
        channels: input.channels,
        tone: input.tone,
        budget_range: input.budget_range,
        extra_brief: input.extra_brief,
        status: "generating",
      })
      .select()
      .single();

    if (insertErr || !draft) {
      console.error("[marketix] insert draft failed", insertErr);
      return json({ error: "Impossible de créer la campagne" }, 500);
    }

    const prompt = buildPrompt(input);
    const result = await callMistralAgent(
      "marketix",
      [{ role: "user", content: prompt }],
      { maxTokens: 6000, timeoutMs: 120_000 },
    );

    if (!result) {
      await admin.from("mkt_marketix_campaigns").update({
        status: "failed",
        error_message: "Agent MARKETIX indisponible (vérifier MISTRAL_API_KEY et MISTRAL_AGENT_MARKETIX)",
      }).eq("id", draft.id);
      return json({ error: "Agent MARKETIX indisponible", campaign_id: draft.id }, 503);
    }

    const parsed = tryParseJson(result.content);

    await admin.from("mkt_marketix_campaigns").update({
      status: parsed ? "ready" : "ready_unparsed",
      generated_content: parsed ?? null,
      raw_response: result.content.slice(0, 50_000),
      tokens_in: result.tokens_in,
      tokens_out: result.tokens_out,
      error_message: null,
    }).eq("id", draft.id);

    return json({
      success: true,
      campaign_id: draft.id,
      parsed: !!parsed,
      content: parsed,
      usage: { tokens_in: result.tokens_in, tokens_out: result.tokens_out },
    });
  } catch (e) {
    console.error("marketix-generate-campaign error:", e);
    return json({ error: "Erreur interne" }, 500);
  }
});
