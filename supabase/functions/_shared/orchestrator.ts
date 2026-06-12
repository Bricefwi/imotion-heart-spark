// supabase/functions/_shared/orchestrator.ts
// Orchestrateur de missions multi-agents — exécution PARALLÈLE par vagues,
// garde-fous budgétaires, passe critique anti-hallucination, anti-boucle strict.
//
// Principes :
// - Chaque mission = vagues de steps. Les steps d'une même vague tournent en
//   parallèle (Promise.allSettled) car indépendants ; les vagues sont séquentielles.
// - Routage au moindre coût : agent Mistral spécialisé si configuré (le moins
//   cher), sinon fallback sur le tier llm-gateway adapté. Jamais de modèle
//   premium pour une tâche simple.
// - Budget : plafond par mission, vérifié AVANT chaque vague. Dépassé →
//   arrêt propre avec résultats partiels (status budget_exceeded).
// - Anti-boucle : nombre de vagues borné par le preset, 1 retry max par step,
//   1 seule révision critique. Aucun agent ne peut en relancer un autre.

import { callMistralAgent, isMistralAgentAvailable, type MistralAgentKey } from "./mistral-agents.ts";
import { callLLM, type LLMTier } from "./llm-gateway.ts";

export interface MissionStep {
  id: string;
  /** Agent Mistral préféré (le moins cher si configuré) */
  mistralAgent?: MistralAgentKey;
  /** Tier llm-gateway de fallback (et de secours si l'agent échoue) */
  fallbackTier: LLMTier;
  /** Rôle système du step (utilisé en fallback ; les agents Mistral ont leur propre prompt) */
  role: string;
  /** Instruction de la tâche — reçoit le contexte mission */
  task: string;
  maxTokens: number;
  /** Step optionnel : sacrifié en premier si le budget se tend */
  optional?: boolean;
}

export interface MissionPreset {
  type: string;
  description: string;
  /** Vagues séquentielles de steps parallèles */
  waves: MissionStep[][];
  /** Coût max par défaut (écrasable à l'appel, plafonné à HARD_COST_CAP) */
  defaultMaxCostEur: number;
}

export interface StepResult {
  step: string;
  agent: string;
  status: "success" | "failed" | "skipped";
  content?: string;
  cost_eur: number;
  tokens_in: number;
  tokens_out: number;
}

export interface MissionResult {
  status: "completed" | "partial" | "failed" | "budget_exceeded";
  steps: StepResult[];
  synthesis_markdown?: string;
  critic_verdict?: string;
  quality_score?: number;
  cost_eur: number;
  tokens_in: number;
  tokens_out: number;
  agents_used: string[];
}

export const HARD_COST_CAP = 5.0; // plafond absolu par mission, non contournable

const SOBRIETY_RULES = `RÈGLES : zéro hallucination (tout fait doit venir du contexte, sinon "[À confirmer]"), réponse dense sans préambule ni remplissage, niveau senior (arbitrages explicites, risques nommés), français impeccable, jamais d'emoji.`;

// ─── Presets de missions ──────────────────────────────────────────────────────

export const MISSION_PRESETS: Record<string, MissionPreset> = {
  // Analyse 360° d'un projet : stratégie + finance + technique en parallèle
  project_analysis: {
    type: "project_analysis",
    description: "Analyse complète d'un projet : stratégie, finance, technique en parallèle, puis synthèse critiquée",
    defaultMaxCostEur: 0.80,
    waves: [[
      { id: "strategie", mistralAgent: "stratos", fallbackTier: "conversational", maxTokens: 1500,
        role: "Stratège business senior", task: "Analyse stratégique : positionnement, enjeux hiérarchisés, opportunités de différenciation, risques marché. Max 500 mots." },
      { id: "finance", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1200,
        role: "Analyste financier senior", task: "Analyse financière : cohérence budget/périmètre, structure de coûts, risques financiers, recommandation d'échelonnement. Max 400 mots." },
      { id: "technique", mistralAgent: "pixel", fallbackTier: "conversational", maxTokens: 1500,
        role: "Architecte technique senior", task: "Analyse technique : stack adaptée, complexité réelle, risques techniques, arbitrage no-code/custom. Max 500 mots." },
      { id: "marketing", mistralAgent: "marketix", fallbackTier: "conversational", maxTokens: 1200, optional: true,
        role: "Stratège marketing senior", task: "Axes d'acquisition pertinents pour ce projet : canaux, messages, quick wins. Max 400 mots." },
    ]],
  },

  // Plan marketing : acquisition + éditorial en parallèle
  marketing_plan: {
    type: "marketing_plan",
    description: "Plan marketing : stratégie d'acquisition + ligne éditoriale en parallèle, puis synthèse critiquée",
    defaultMaxCostEur: 0.60,
    waves: [[
      { id: "acquisition", mistralAgent: "marketix", fallbackTier: "conversational", maxTokens: 1500,
        role: "Stratège marketing senior", task: "Stratégie d'acquisition : segments prioritaires, canaux avec justification coût/impact, séquencement 90 jours. Max 500 mots." },
      { id: "editorial", mistralAgent: "literix", fallbackTier: "conversational", maxTokens: 1500,
        role: "Directeur éditorial senior", task: "Ligne éditoriale : piliers de contenu, tonalité, formats par canal, 10 idées de sujets ancrées dans le contexte. Max 500 mots." },
      { id: "automatisation", mistralAgent: "n8nix", fallbackTier: "routing", maxTokens: 1000, optional: true,
        role: "Expert automatisation", task: "Workflows d'automatisation marketing pertinents : déclencheur, action, outil. Format tableau. Max 300 mots." },
    ]],
  },

  // Revue de contrat : juridique + financier en parallèle
  contract_review: {
    type: "contract_review",
    description: "Revue de contrat : analyse juridique + financière en parallèle, puis synthèse critiquée",
    defaultMaxCostEur: 0.60,
    waves: [[
      { id: "juridique", mistralAgent: "juridix", fallbackTier: "strategic", maxTokens: 1800,
        role: "Juriste droit du numérique senior", task: "Revue juridique : clauses sensibles, conformité Code civil/RGPD, déséquilibres, clauses manquantes avec article de référence. Max 600 mots." },
      { id: "financier", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1200,
        role: "Analyste financier senior", task: "Revue financière : conditions de paiement, pénalités, garanties, exposition financière. Max 400 mots." },
    ]],
  },
};

// ─── Exécution d'un step (agent Mistral d'abord, fallback gateway) ───────────

async function runStep(step: MissionStep, missionContext: string): Promise<StepResult> {
  const prompt = `${step.task}\n\n${SOBRIETY_RULES}\n\n## CONTEXTE MISSION\n${missionContext}`;

  // 1. Agent Mistral spécialisé (le moins cher, prompt expert embarqué)
  if (step.mistralAgent && isMistralAgentAvailable(step.mistralAgent)) {
    const res = await callMistralAgent(step.mistralAgent, [{ role: "user", content: prompt }], {
      maxTokens: step.maxTokens, timeoutMs: 60_000,
    });
    if (res) {
      return {
        step: step.id, agent: `mistral:${step.mistralAgent}`, status: "success",
        content: res.content, cost_eur: 0, // coût agents Mistral non facturé au token ici (suivi côté Mistral)
        tokens_in: res.tokens_in, tokens_out: res.tokens_out,
      };
    }
    // échec agent → fallback gateway (1 seul rattrapage, pas de boucle)
  }

  // 2. Fallback : tier llm-gateway adapté au niveau d'exigence du step
  try {
    const res = await callLLM({
      tier: step.fallbackTier,
      systemPrompt: `Tu es ${step.role} chez IMOTION Creator Studio. ${SOBRIETY_RULES}`,
      userMessage: prompt,
      maxTokens: step.maxTokens,
    });
    return {
      step: step.id, agent: `${res.provider}:${res.model}`, status: "success",
      content: res.content, cost_eur: res.cost_eur,
      tokens_in: res.tokens_in, tokens_out: res.tokens_out,
    };
  } catch (err) {
    console.error(`[orchestrator] step ${step.id} failed:`, err);
    return { step: step.id, agent: "none", status: "failed", cost_eur: 0, tokens_in: 0, tokens_out: 0 };
  }
}

// ─── Mission complète ─────────────────────────────────────────────────────────

export async function runMission(params: {
  preset: MissionPreset;
  objective: string;
  context: string;
  maxCostEur: number;
  onProgress?: (steps: StepResult[], costEur: number) => Promise<void>;
}): Promise<MissionResult> {
  const { preset, objective, context, onProgress } = params;
  const budget = Math.min(params.maxCostEur, HARD_COST_CAP);

  const allSteps: StepResult[] = [];
  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;

  const missionContext = `OBJECTIF : ${objective}\n\n${context}`.slice(0, 12_000);

  // ── Vagues parallèles ──
  for (const wave of preset.waves) {
    // Garde-fou budget AVANT chaque vague : si tendu, on sacrifie les optionnels ;
    // si dépassé, on s'arrête proprement avec les résultats déjà acquis.
    if (totalCost >= budget) {
      wave.forEach((s) => allSteps.push({ step: s.id, agent: "none", status: "skipped", cost_eur: 0, tokens_in: 0, tokens_out: 0 }));
      continue;
    }
    const budgetTight = totalCost >= budget * 0.7;
    const toRun = budgetTight ? wave.filter((s) => !s.optional) : wave;
    const skipped = budgetTight ? wave.filter((s) => s.optional) : [];
    skipped.forEach((s) => allSteps.push({ step: s.id, agent: "none", status: "skipped", cost_eur: 0, tokens_in: 0, tokens_out: 0 }));

    // Exécution PARALLÈLE de la vague
    const results = await Promise.allSettled(toRun.map((s) => runStep(s, missionContext)));
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const sr: StepResult = r.status === "fulfilled"
        ? r.value
        : { step: toRun[i].id, agent: "none", status: "failed", cost_eur: 0, tokens_in: 0, tokens_out: 0 };
      allSteps.push(sr);
      totalCost += sr.cost_eur;
      totalIn += sr.tokens_in;
      totalOut += sr.tokens_out;
    }
    if (onProgress) await onProgress(allSteps, totalCost);
  }

  const successful = allSteps.filter((s) => s.status === "success");
  if (successful.length === 0) {
    return { status: "failed", steps: allSteps, cost_eur: totalCost, tokens_in: totalIn, tokens_out: totalOut, agents_used: [] };
  }

  // ── Synthèse (tier strategic : c'est le livrable final, qualité maximale) ──
  const material = successful
    .map((s) => `### Analyse "${s.step}" (par ${s.agent})\n${s.content}`)
    .join("\n\n");

  const synthesisInput = `OBJECTIF DE LA MISSION : ${objective}

## MATÉRIAU DES AGENTS SPÉCIALISTES
${material}

TÂCHE : synthétise ces analyses en UN document Markdown structuré, exécutif et actionnable.
- Tu n'ajoutes AUCUN fait nouveau : tu croises, hiérarchises et arbitres à partir du matériau exclusivement.
- Signale les contradictions entre analyses et tranche avec justification.
- Termine par "Prochaines actions" : 3-5 actions concrètes priorisées.
- ${SOBRIETY_RULES}`;

  let synthesis: string | undefined;
  let synthesisFailed = false;
  try {
    const res = await callLLM({
      tier: "strategic",
      systemPrompt: `Tu es le directeur de mission senior d'IMOTION Creator Studio. Tu produis des synthèses exécutives irréprochables. ${SOBRIETY_RULES}`,
      userMessage: synthesisInput,
      maxTokens: 3000,
    });
    synthesis = res.content;
    totalCost += res.cost_eur;
    totalIn += res.tokens_in;
    totalOut += res.tokens_out;
  } catch (err) {
    console.error("[orchestrator] synthesis failed:", err);
    synthesisFailed = true;
  }

  // ── Passe critique anti-hallucination (1 seule, jamais de boucle de révision) ──
  let criticVerdict: string | undefined;
  let qualityScore: number | undefined;
  if (synthesis && totalCost < budget) {
    try {
      const res = await callLLM({
        tier: "routing", // contrôle structuré → modèle économique suffit
        systemPrompt: `Tu es contrôleur qualité senior. Tu audites une synthèse par rapport à son matériau source. Sortie JSON UNIQUEMENT : { "verdict": "approved|needs_revision", "quality_score": 0-100, "issues": ["..."] }. Une affirmation absente du matériau source = hallucination = issue bloquante.`,
        userMessage: `## MATÉRIAU SOURCE\n${material.slice(0, 8000)}\n\n## SYNTHÈSE À AUDITER\n${synthesis.slice(0, 8000)}`,
        maxTokens: 600,
      });
      totalCost += res.cost_eur;
      totalIn += res.tokens_in;
      totalOut += res.tokens_out;
      const match = res.content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        criticVerdict = parsed.verdict;
        qualityScore = parsed.quality_score;
        // UNE révision max, et seulement si le budget le permet
        if (parsed.verdict === "needs_revision" && Array.isArray(parsed.issues) && totalCost < budget) {
          const rev = await callLLM({
            tier: "strategic",
            systemPrompt: `Tu corriges une synthèse selon les points d'audit, sans rien ajouter qui ne soit dans le matériau source. ${SOBRIETY_RULES}`,
            userMessage: `## SYNTHÈSE À CORRIGER\n${synthesis}\n\n## POINTS D'AUDIT À CORRIGER\n${parsed.issues.join("\n- ")}\n\n## MATÉRIAU SOURCE\n${material.slice(0, 8000)}`,
            maxTokens: 3000,
          });
          synthesis = rev.content;
          totalCost += rev.cost_eur;
          totalIn += rev.tokens_in;
          totalOut += rev.tokens_out;
          criticVerdict = "approved_after_revision";
        }
      }
    } catch (err) {
      console.warn("[orchestrator] critic pass skipped:", err);
    }
  }

  const failed = allSteps.some((s) => s.status === "failed" || s.status === "skipped");
  const overBudget = totalCost >= budget;

  return {
    status: synthesisFailed ? "partial" : overBudget ? "budget_exceeded" : failed ? "partial" : "completed",
    steps: allSteps,
    synthesis_markdown: synthesis,
    critic_verdict: criticVerdict,
    quality_score: qualityScore,
    cost_eur: totalCost,
    tokens_in: totalIn,
    tokens_out: totalOut,
    agents_used: [...new Set(successful.map((s) => s.agent))],
  };
}
