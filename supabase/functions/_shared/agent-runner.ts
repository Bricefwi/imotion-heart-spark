// supabase/functions/_shared/agent-runner.ts
// Runner commun pour tous les agents Clarivi V2.

import Anthropic from "npm:@anthropic-ai/sdk@^0.30.0";
import { createClient } from "jsr:@supabase/supabase-js@2";
import type { AgentName, AgentOutput } from "./types.ts";

export type { AgentName, AgentOutput };

export interface AgentInput {
  agent: AgentName;
  systemPrompt: string;
  userMessage: string;
  context?: Record<string, unknown>;
  model: string;
  temperature: number;
  maxTokens: number;
}

const PRICING_PER_1M_TOKENS_EUR = {
  "claude-opus-4-7":           { in: 14,  out: 70  },
  "claude-sonnet-4-6":         { in: 2.8, out: 14  },
  "claude-haiku-4-5-20251001": { in: 0.7, out: 3.5 },
} as const;

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  const userContent = input.context
    ? `${input.userMessage}\n\nCONTEXTE:\n${JSON.stringify(input.context, null, 2)}`
    : input.userMessage;

  const response = await client.messages.create({
    model: input.model,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    system: input.systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  let parsed: Partial<AgentOutput>;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
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

  const pricing = PRICING_PER_1M_TOKENS_EUR[input.model as keyof typeof PRICING_PER_1M_TOKENS_EUR];
  const tokensIn = response.usage?.input_tokens ?? 0;
  const tokensOut = response.usage?.output_tokens ?? 0;
  const costEur = pricing
    ? (tokensIn * pricing.in + tokensOut * pricing.out) / 1_000_000
    : 0;

  console.log(`[${input.agent}] tokens_in=${tokensIn} tokens_out=${tokensOut} cost_eur=${costEur.toFixed(4)}`);

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
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_eur: costEur,
  };
}

export function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
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
