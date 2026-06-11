// supabase/functions/_shared/llm-gateway.ts
// Gateway unifié — Anthropic (stratégique), Mistral (conversationnel, RGPD-EU),
// Gemini Flash (routing / extraction, ultra low-cost).

export type LLMTier = "routing" | "conversational" | "strategic";
export type LLMProvider = "gemini" | "mistral" | "anthropic";

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  tokens_in: number;
  tokens_out: number;
  cost_eur: number;
  provider: LLMProvider;
  model: string;
}

// Coût EUR / 1M tokens (maj. juin 2026)
const PRICING_EUR: Record<string, { in: number; out: number }> = {
  "gemini-2.5-flash":      { in: 0.14,  out: 0.55  },
  "mistral-small-latest":  { in: 0.18,  out: 0.55  },
  "mistral-medium-latest": { in: 2.50,  out: 7.50  },
  "claude-sonnet-4-6":     { in: 2.75,  out: 13.75 },
  "claude-opus-4-7":       { in: 13.75, out: 68.75 },
};

// Tier → provider + modèle par défaut
const TIER_CONFIG: Record<LLMTier, { provider: LLMProvider; model: string }> = {
  routing:        { provider: "gemini",    model: "gemini-2.5-flash"     },
  conversational: { provider: "mistral",   model: "mistral-small-latest" },
  strategic:      { provider: "anthropic", model: "claude-sonnet-4-6"    },
};

// --- Providers ---

async function callGemini(
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

async function callMistral(
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const apiKey = Deno.env.get("MISTRAL_API_KEY");
  if (!apiKey) throw new Error("MISTRAL_API_KEY not configured");

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral ${res.status}: ${err}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

async function callAnthropic(
  systemPrompt: string,
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // Prompt caching activé : le system prompt est mis en cache côté Anthropic
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: messages.filter((m) => m.role !== "system"),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  return {
    content: text,
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
  };
}

// --- Fallbacks par provider ---

async function withFallback(
  primary: () => Promise<{ content: string; tokensIn: number; tokensOut: number }>,
  fallback: () => Promise<{ content: string; tokensIn: number; tokensOut: number }>,
  label: string,
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  try {
    return await primary();
  } catch (err) {
    console.warn(`[llm-gateway] ${label} primary failed, falling back:`, err);
    return await fallback();
  }
}

// --- Calcul coût ---

function calcCost(model: string, tokensIn: number, tokensOut: number): number {
  const p = PRICING_EUR[model];
  if (!p) return 0;
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
}

// --- Point d'entrée public ---

export async function callLLM(params: {
  tier: LLMTier;
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  modelOverride?: string;
}): Promise<LLMResponse> {
  const { tier, systemPrompt, userMessage, maxTokens = 2000, modelOverride } = params;
  const config = TIER_CONFIG[tier];
  const model = modelOverride ?? config.model;
  const provider = config.provider;

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user",   content: userMessage  },
  ];

  let raw: { content: string; tokensIn: number; tokensOut: number };

  if (provider === "gemini") {
    raw = await withFallback(
      () => callGemini(messages, model, maxTokens),
      () => callMistral(messages, "mistral-small-latest", maxTokens),
      "gemini",
    );
  } else if (provider === "mistral") {
    raw = await withFallback(
      () => callMistral(messages, model, maxTokens),
      () => callAnthropic(systemPrompt, messages, "claude-sonnet-4-6", maxTokens),
      "mistral",
    );
  } else {
    raw = await callAnthropic(systemPrompt, messages, model, maxTokens);
  }

  const tokensIn = raw.tokensIn;
  const tokensOut = raw.tokensOut;
  const costEur = calcCost(model, tokensIn, tokensOut);

  console.log(
    `[llm-gateway] provider=${provider} model=${model} in=${tokensIn} out=${tokensOut} cost=${costEur.toFixed(5)}€`,
  );

  return { content: raw.content, tokens_in: tokensIn, tokens_out: tokensOut, cost_eur: costEur, provider, model };
}
