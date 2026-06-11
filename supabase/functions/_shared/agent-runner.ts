// supabase/functions/_shared/agent-runner.ts
// Runner commun pour tous les agents — utilise le LLM gateway multi-provider.

import { callLLM, type LLMTier } from "./llm-gateway.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import type { AgentName, AgentOutput } from "./types.ts";

export type { AgentName, AgentOutput };

export interface AgentInput {
  agent: AgentName;
  systemPrompt: string;
  userMessage: string;
  context?: Record<string, unknown>;
  model?: string;       // override optionnel (bypass tier)
  temperature?: number; // conservé pour compatibilité API, ignoré par Gemini/Mistral
  maxTokens: number;
}

// Chaque agent est mappé à un tier de coût
const AGENT_TIER: Record<AgentName, LLMTier> = {
  // Routing / JSON pur → Gemini Flash (0,14 € / 1M in)
  "ORCHESTRATOR":  "routing",
  "EXTRACTOR":     "routing",
  "NOTIFIER":      "routing",

  // Conversations empathiques FR → Mistral Small (0,18 € / 1M in, hébergé EU)
  "INTAKE-AGENT":  "conversational",
  "NEED-ANALYZER": "conversational",
  "SCOPING-AGENT": "conversational",

  // Qualité critique + génération longue → Claude Sonnet (2,75 € / 1M in)
  "CRITIC-AGENT":  "strategic",
  "DOC-GENERATOR": "strategic",
  "QUOTE-BUILDER": "strategic",
};

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const userContent = input.context
    ? `${input.userMessage}\n\nCONTEXTE:\n${JSON.stringify(input.context, null, 2)}`
    : input.userMessage;

  const tier = AGENT_TIER[input.agent] ?? "conversational";

  const response = await callLLM({
    tier,
    systemPrompt: input.systemPrompt,
    userMessage: userContent,
    maxTokens: input.maxTokens,
    modelOverride: input.model,
  });

  const raw = response.content;

  let parsed: Partial<AgentOutput>;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    return {
      agent: input.agent,
      status: "error",
      confidence: 0,
      warnings: [`JSON parse failed: ${e instanceof Error ? e.message : String(e)}`],
      raw,
    };
  }

  console.log(
    `[${input.agent}] tier=${tier} provider=${response.provider} model=${response.model} cost=${response.cost_eur.toFixed(5)}€`,
  );

  return {
    agent: input.agent,
    status: parsed.status ?? "success",
    message: parsed.message,
    extracted_data: parsed.extracted_data,
    confidence: parsed.confidence ?? 0,
    warnings: parsed.warnings ?? [],
    reasoning: parsed.reasoning,
    next_action: parsed.next_action,
    next_agent: parsed.next_agent,
    raw,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    cost_eur: response.cost_eur,
  };
}

export function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-audit-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function optionsResponse() {
  return new Response(null, { headers: corsHeaders });
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export function errorResponse(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}
