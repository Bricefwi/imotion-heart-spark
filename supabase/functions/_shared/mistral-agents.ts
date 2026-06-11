// supabase/functions/_shared/mistral-agents.ts
// Couche "agents Mistral" — appelle les agents pré-configurés (La Plateforme)
// via https://api.mistral.ai/v1/agents/completions.
//
// Chaque agent logique est mappé sur un secret MISTRAL_AGENT_<NOM> contenant
// son agent_id (format "ag:..."). Secrets à saisir dans Lovable Cloud → Secrets.
// Tout est dégradable : si MISTRAL_API_KEY ou l'agent_id manque, l'appelant
// reçoit `null` (jamais d'exception) et le pipeline continue sans enrichissement.

export type MistralAgentKey =
  | "maestro"   // Orchestrateur multi-agents
  | "stratos"   // Stratégie business & positionnement
  | "marketix"  // Stratégie marketing & acquisition
  | "literix"   // Rédaction éditoriale & copywriting
  | "financix"  // Analyse financière, pricing, budgets
  | "n8nix";    // Automatisations & workflows n8n

const AGENT_ENV_VARS: Record<MistralAgentKey, string> = {
  maestro: "MISTRAL_AGENT_MAESTRO",
  stratos: "MISTRAL_AGENT_STRATOS",
  marketix: "MISTRAL_AGENT_MARKETIX",
  literix: "MISTRAL_AGENT_LITERIX",
  financix: "MISTRAL_AGENT_FINANCIX",
  n8nix: "MISTRAL_AGENT_N8NIX",
};

export interface MistralAgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MistralAgentResult {
  content: string;
  agent: MistralAgentKey;
  tokens_in: number;
  tokens_out: number;
}

/** Liste l'état de configuration de chaque agent (sans exposer les valeurs). */
export function getMistralAgentsStatus(): Record<string, boolean> & { api_key: boolean } {
  const status = { api_key: !!Deno.env.get("MISTRAL_API_KEY") } as Record<string, boolean> & { api_key: boolean };
  for (const [key, envVar] of Object.entries(AGENT_ENV_VARS)) {
    status[key] = !!Deno.env.get(envVar);
  }
  return status;
}

export function isMistralAgentAvailable(agent: MistralAgentKey): boolean {
  return !!Deno.env.get("MISTRAL_API_KEY") && !!Deno.env.get(AGENT_ENV_VARS[agent]);
}

/**
 * Appelle un agent Mistral. Retourne `null` si non configuré ou en erreur —
 * les enrichissements d'agents ne doivent JAMAIS bloquer la génération principale.
 */
export async function callMistralAgent(
  agent: MistralAgentKey,
  messages: MistralAgentMessage[],
  opts?: { maxTokens?: number; timeoutMs?: number },
): Promise<MistralAgentResult | null> {
  const apiKey = Deno.env.get("MISTRAL_API_KEY");
  const agentId = Deno.env.get(AGENT_ENV_VARS[agent]);
  if (!apiKey || !agentId) {
    console.log(`[mistral-agents] ${agent} non configuré (secret manquant), skip`);
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 60_000);

  try {
    const res = await fetch("https://api.mistral.ai/v1/agents/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agentId,
        messages,
        max_tokens: opts?.maxTokens ?? 4000,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[mistral-agents] ${agent} HTTP ${res.status}: ${err.slice(0, 500)}`);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) return null;

    console.log(
      `[mistral-agents] ${agent} ok in=${data.usage?.prompt_tokens ?? 0} out=${data.usage?.completion_tokens ?? 0}`,
    );
    return {
      content,
      agent,
      tokens_in: data.usage?.prompt_tokens ?? 0,
      tokens_out: data.usage?.completion_tokens ?? 0,
    };
  } catch (err) {
    console.error(`[mistral-agents] ${agent} appel échoué:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
