// supabase/functions/_shared/mistral-agents.ts
// Couche "agents Mistral" — appelle les agents pré-configurés (La Plateforme)
// via https://api.mistral.ai/v1/agents/completions.
//
// Chaque agent logique est mappé sur un secret MISTRAL_AGENT_<NOM> contenant
// son agent_id (format "ag:..."). Secrets à saisir dans Lovable Cloud → Secrets.
// Tout est dégradable : si MISTRAL_API_KEY ou l'agent_id manque, l'appelant
// reçoit `null` (jamais d'exception) et le pipeline continue sans enrichissement.

export type MistralAgentKey =
  | "maestro"         // Orchestrateur multi-agents
  | "titan"           // Orchestrateur nested — tâches complexes multi-étapes
  | "stratos"         // Stratégie business & positionnement
  | "marketix"        // Stratégie marketing & acquisition
  | "literix"         // Rédaction éditoriale & copywriting
  | "financix"        // Analyse financière, pricing, budgets
  | "juridix"         // Expert juridique — droit numérique, contrats français
  | "pixel"           // Vibes Coder — transforme les idées en code/prompts de build
  | "nexus"           // Workflow Builder — conçoit et documente des workflows
  | "focus"           // Sub-agent d'exécution précise — extraction, classification
  | "n8nix"           // Automatisations & workflows n8n
  // C-suite IMOTION (optionnels — fallback LLM gateway si non configurés)
  | "daf"             // Directeur Administratif et Financier
  | "marketing_dir"   // Directeur Marketing Système
  | "commercial_dir"  // Directeur Commercial
  | "rh"              // Directeur Ressources Humaines
  | "dg";             // Directeur Général

const AGENT_ENV_VARS: Record<MistralAgentKey, string> = {
  maestro: "MISTRAL_AGENT_MAESTRO",
  titan: "MISTRAL_AGENT_TITAN",
  stratos: "MISTRAL_AGENT_STRATOS",
  marketix: "MISTRAL_AGENT_MARKETIX",
  literix: "MISTRAL_AGENT_LITERIX",
  financix: "MISTRAL_AGENT_FINANCIX",
  juridix: "MISTRAL_AGENT_JURIDIX",
  pixel: "MISTRAL_AGENT_PIXEL",
  nexus: "MISTRAL_AGENT_NEXUS",
  focus: "MISTRAL_AGENT_FOCUS",
  n8nix: "MISTRAL_AGENT_N8NIX",
  daf: "MISTRAL_AGENT_DAF",
  marketing_dir: "MISTRAL_AGENT_MARKETING_DIR",
  commercial_dir: "MISTRAL_AGENT_COMMERCIAL_DIR",
  rh: "MISTRAL_AGENT_RH",
  dg: "MISTRAL_AGENT_DG",
};

export interface MistralAgentMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls?: MistralToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface MistralToolCall {
  id: string;
  function: { name: string; arguments: string };
}

export interface MistralAgentResult {
  content: string;
  agent: MistralAgentKey;
  tokens_in: number;
  tokens_out: number;
  /** Fonctions custom exécutées pendant l'appel (data broker) */
  functions_called?: string[];
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
 *
 * Si l'agent a des fonctions custom déclarées dans Mistral Studio et qu'il en
 * appelle une, on l'exécute via le data broker (agent-functions.ts) et on
 * relance la complétion avec le résultat. 3 tours de fonctions max (anti-boucle).
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

  const conversation: MistralAgentMessage[] = [...messages];
  let totalIn = 0;
  let totalOut = 0;
  const functionsCalled: string[] = [];
  const MAX_TOOL_ROUNDS = 3;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 60_000);
      let data: {
        choices?: { message?: { content?: string; tool_calls?: MistralToolCall[] } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      try {
        const res = await fetch("https://api.mistral.ai/v1/agents/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            messages: conversation,
            max_tokens: opts?.maxTokens ?? 4000,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.text();
          console.error(`[mistral-agents] ${agent} HTTP ${res.status}: ${err.slice(0, 500)}`);
          return null;
        }
        data = await res.json();
      } finally {
        clearTimeout(timeout);
      }

      totalIn += data.usage?.prompt_tokens ?? 0;
      totalOut += data.usage?.completion_tokens ?? 0;

      const message = data.choices?.[0]?.message;
      const toolCalls = message?.tool_calls;

      // Pas d'appel de fonction → réponse finale
      if (!toolCalls?.length) {
        const content = message?.content ?? "";
        if (!content) return null;
        console.log(
          `[mistral-agents] ${agent} ok in=${totalIn} out=${totalOut}` +
          (functionsCalled.length ? ` functions=[${functionsCalled.join(",")}]` : ""),
        );
        return {
          content, agent, tokens_in: totalIn, tokens_out: totalOut,
          ...(functionsCalled.length ? { functions_called: functionsCalled } : {}),
        };
      }

      // Dernier tour atteint avec encore des tool_calls → on coupe (anti-boucle)
      if (round === MAX_TOOL_ROUNDS) {
        console.warn(`[mistral-agents] ${agent} : ${MAX_TOOL_ROUNDS} tours de fonctions atteints, arrêt`);
        const content = message?.content ?? "";
        return content
          ? { content, agent, tokens_in: totalIn, tokens_out: totalOut, functions_called: functionsCalled }
          : null;
      }

      // Exécuter les fonctions via le data broker et renvoyer les résultats
      const { executeAgentFunction } = await import("./agent-functions.ts");
      conversation.push({
        role: "assistant",
        content: message?.content ?? "",
        tool_calls: toolCalls,
      });
      for (const call of toolCalls.slice(0, 5)) {
        const fnName = call.function?.name ?? "unknown";
        functionsCalled.push(fnName);
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function?.arguments || "{}");
        } catch { /* arguments illisibles → objet vide */ }
        const result = await executeAgentFunction(fnName, args);
        conversation.push({
          role: "tool",
          name: fnName,
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 12_000),
        });
      }
    }
    return null;
  } catch (err) {
    console.error(`[mistral-agents] ${agent} appel échoué:`, err);
    return null;
  }
}
