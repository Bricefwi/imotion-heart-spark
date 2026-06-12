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

  // ─── Circuit IMOTION complet ─────────────────────────────────────────────────

  // Phase 1-3 : Diagnostic (Identification → Analyse besoins → Cadrage)
  diagnostic_audit: {
    type: "diagnostic_audit",
    description: "Diagnostic complet : analyse du besoin client, douleurs, contexte marché, cadrage et qualification du lead",
    defaultMaxCostEur: 0.80,
    waves: [
      [
        { id: "intake_analysis", fallbackTier: "conversational", maxTokens: 1200,
          role: "Business analyst senior", task: "Analyse l'identité du prospect, sa douleur principale et le déclencheur de la démarche depuis les échanges. Synthèse structurée avec verbatims clients identifiés. Max 400 mots." },
        { id: "need_analysis", fallbackTier: "conversational", maxTokens: 1500,
          role: "Analyste des besoins senior", task: "Transforme les douleurs exprimées en besoins fonctionnels hiérarchisés (must/should/could). Qualifie la maturité digitale du prospect. Max 500 mots." },
        { id: "market_context", mistralAgent: "stratos", fallbackTier: "conversational", maxTokens: 1200, optional: true,
          role: "Stratège marché senior", task: "Analyse la dynamique du marché du prospect, les concurrents identifiés et les opportunités de différenciation pour IMOTION. Max 400 mots." },
      ],
      [
        { id: "scoping", fallbackTier: "conversational", maxTokens: 1500,
          role: "Chef de projet senior", task: "Confronte besoins, budget et contraintes pour produire un périmètre réaliste (in/out), un grade de lead (A/B/C/D) et les prochaines étapes. Max 500 mots." },
      ],
    ],
  },

  // Phase 2 : Conseil Stratégique
  conseil_strategique: {
    type: "conseil_strategique",
    description: "Conseil stratégique 360° : analyse business, financière et cadre juridique en parallèle, puis recommandation de solution",
    defaultMaxCostEur: 1.20,
    waves: [
      [
        { id: "strategie", mistralAgent: "stratos", fallbackTier: "strategic", maxTokens: 1800,
          role: "Stratège business senior", task: "Analyse stratégique : positionnement IMOTION pour ce client, enjeux hiérarchisés, ROI attendu, risques marché. Max 600 mots." },
        { id: "finance", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1400,
          role: "Directeur financier senior", task: "Analyse financière : cohérence budget/périmètre, structure de coûts recommandée, échelonnement, arguments de valeur pour défendre le prix. Max 500 mots." },
        { id: "cadre_juridique", mistralAgent: "juridix", fallbackTier: "conversational", maxTokens: 1200, optional: true,
          role: "Juriste droit du numérique", task: "Points juridiques à sécuriser en amont : protection IP, responsabilité, clauses essentielles pour ce type de projet. Max 400 mots." },
      ],
      [
        { id: "recommandation", mistralAgent: "maestro", fallbackTier: "strategic", maxTokens: 2000,
          role: "Directeur de mission senior", task: "Synthétise les analyses et formule une recommandation de solution (périmètre, approche technique, tarification) avec justification stratégique. Max 600 mots." },
      ],
    ],
  },

  // Phase 3 : Build — planification technique complète + guide opérationnel
  build_planning: {
    type: "build_planning",
    description: "Planification build : architecture technique, guide opérationnel étape par étape, supervision financière",
    defaultMaxCostEur: 1.50,
    waves: [
      [
        { id: "architecture", mistralAgent: "pixel", fallbackTier: "strategic", maxTokens: 2000,
          role: "Architecte technique senior", task: "Architecture technique : stack précise avec justifications, découpage composants, schéma de données, intégrations, pièges à éviter. Max 700 mots." },
        { id: "guide_execution", mistralAgent: "pixel", fallbackTier: "strategic", maxTokens: 2000,
          role: "Tech Lead senior", task: "Guide d'exécution opérationnel : outils à déployer avec étapes de configuration, prompts Lovable/Cursor/Claude prêts à l'emploi, séquence de build en jalons. Max 700 mots." },
        { id: "supervision_financiere", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1200,
          role: "DAF senior", task: "Supervision financière build : TCO 12 mois, coûts IA estimés, seuil de rentabilité, recommandation pricing maintenance. Max 400 mots." },
      ],
      [
        { id: "plan_execution", fallbackTier: "strategic", maxTokens: 2000,
          role: "Directeur de production senior", task: "Plan d'exécution : planning détaillé jalons/livrables, matrice RACI, critères de recette, points de contrôle qualité. Max 700 mots." },
      ],
    ],
  },

  // Phase 4 : RUN — monitoring et maintenance proactive
  run_monitoring: {
    type: "run_monitoring",
    description: "Bilan RUN : performance en production, maintenance proactive, satisfaction client et recommandations d'évolution",
    defaultMaxCostEur: 0.60,
    waves: [[
      { id: "performance_review", fallbackTier: "conversational", maxTokens: 1200,
        role: "Directeur technique senior", task: "Analyse des indicateurs de performance en production : uptime, Core Web Vitals, erreurs, utilisation réelle vs cibles CDC. Max 400 mots." },
      { id: "maintenance_planning", mistralAgent: "pixel", fallbackTier: "conversational", maxTokens: 1200,
        role: "Architecte technique senior", task: "Plan de maintenance proactive : tâches planifiées, mises à jour critiques, dette technique identifiée, recommandations d'évolution. Max 400 mots." },
      { id: "finance_run", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1000, optional: true,
        role: "Analyste financier senior", task: "Bilan financier RUN : coûts réels vs estimés, ROI observé, recommandation de révision tarifaire si nécessaire. Max 350 mots." },
    ]],
  },

  // Track Marketing : audit complet + plan acquisition
  marketing_audit: {
    type: "marketing_audit",
    description: "Audit marketing complet : présence digitale, pipeline contenu, automatisations et plan d'action acquisition",
    defaultMaxCostEur: 1.00,
    waves: [
      [
        { id: "presence_digitale", mistralAgent: "marketix", fallbackTier: "conversational", maxTokens: 1500,
          role: "Stratège marketing digital senior", task: "Audit présence digitale : SEO, réseaux sociaux, positionnement message/marché, forces et lacunes. Recommandations prioritaires. Max 500 mots." },
        { id: "contenu_editorial", mistralAgent: "literix", fallbackTier: "conversational", maxTokens: 1500,
          role: "Directeur éditorial senior", task: "Audit éditorial : qualité du contenu existant, trous de couverture, 10 sujets à haute valeur pour les 90 prochains jours. Max 500 mots." },
        { id: "automatisation_mkg", mistralAgent: "n8nix", fallbackTier: "routing", maxTokens: 1000, optional: true,
          role: "Expert automatisation marketing", task: "Automatisations marketing à mettre en place : séquences email, scoring leads, nurturing. Format tableau actionnable. Max 350 mots." },
      ],
      [
        { id: "plan_acquisition", mistralAgent: "marketix", fallbackTier: "conversational", maxTokens: 1800,
          role: "Directeur acquisition senior", task: "Plan d'acquisition 90 jours : canaux prioritaires avec budget indicatif, séquencement, KPIs cibles, quick wins. Max 600 mots." },
      ],
    ],
  },

  // ─── Missions C-suite (spécialistes → rapport au DG) ────────────────────────

  daf_analysis: {
    type: "daf_analysis",
    description: "Analyse DAF : rentabilité projets, coûts IA, trésorerie, directives budgétaires",
    defaultMaxCostEur: 0.80,
    waves: [[
      { id: "rentabilite_projets", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1500,
        role: "DAF senior", task: "Analyse la rentabilité des projets actifs : marges, dépassements, projets à risque financier. Tableau récapitulatif et recommandations. Max 500 mots." },
      { id: "couts_ia", fallbackTier: "conversational", maxTokens: 1200,
        role: "DAF expert coûts IA", task: "Analyse les coûts IA : budget LLM consommé, coût par projet, projections, seuil de rentabilité. Recommandations pour optimiser la marge. Max 400 mots." },
      { id: "tresorerie_previsions", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1200,
        role: "DAF senior", task: "Prévisions trésorerie : pipe commercial vs facturation, délais encaissements, recommandations de politique tarifaire. Max 400 mots." },
    ]],
  },

  marketing_system: {
    type: "marketing_system",
    description: "Système marketing IMOTION : acquisition, notoriété, pipeline contenu, automatisations",
    defaultMaxCostEur: 0.80,
    waves: [[
      { id: "acquisition_pipeline", mistralAgent: "marketix", fallbackTier: "conversational", maxTokens: 1500,
        role: "Directeur Marketing senior", task: "Pipeline acquisition IMOTION : état actuel des leads, canaux performants, actions pour générer 3-5 nouveaux projets/mois. Max 500 mots." },
      { id: "notoriete_contenu", mistralAgent: "literix", fallbackTier: "conversational", maxTokens: 1500,
        role: "Directeur éditorial senior", task: "Stratégie de notoriété : contenu LinkedIn, articles de fond, cas clients à produire, angle différenciant IMOTION. Plan éditorial 30 jours. Max 500 mots." },
      { id: "automatisations_growth", mistralAgent: "n8nix", fallbackTier: "routing", maxTokens: 1000, optional: true,
        role: "Growth hacker automatisation", task: "Automatisations growth : séquences nurturing, alertes signaux d'achat, outils recommandés. Max 350 mots." },
    ]],
  },

  commercial_action: {
    type: "commercial_action",
    description: "Actions commerciales : analyse du pipe, stratégie de closing, recommandations pricing",
    defaultMaxCostEur: 0.80,
    waves: [[
      { id: "analyse_pipe", mistralAgent: "stratos", fallbackTier: "conversational", maxTokens: 1500,
        role: "Directeur Commercial senior", task: "Analyse du pipeline commercial : leads par stade, taux de conversion, durée du cycle, projets à relancer en priorité. Max 500 mots." },
      { id: "strategie_closing", fallbackTier: "conversational", maxTokens: 1500,
        role: "Directeur Commercial senior", task: "Stratégie de closing pour les leads actifs : objections à anticiper, arguments de valeur, calendrier d'actions. Max 500 mots." },
      { id: "pricing_competitive", mistralAgent: "financix", fallbackTier: "conversational", maxTokens: 1200, optional: true,
        role: "Dir. Commercial & DAF senior", task: "Revue pricing : cohérence des devis en cours vs marché, marge à défendre, conditions de paiement recommandées. Max 400 mots." },
    ]],
  },

  rh_assessment: {
    type: "rh_assessment",
    description: "Bilan RH : capacités équipe, besoins en agents IA spécialisés, recommandations d'intégration",
    defaultMaxCostEur: 0.50,
    waves: [[
      { id: "capacites_equipe", fallbackTier: "conversational", maxTokens: 1500,
        role: "DRH senior", task: "Analyse des capacités actuelles : agents IA déployés vs besoins exprimés par les équipes Build et Marketing, écarts identifiés, priorisation. Max 500 mots." },
      { id: "besoins_agents", fallbackTier: "conversational", maxTokens: 1200,
        role: "DRH expert tech", task: "Recommandations d'agents IA à intégrer : rôle, cas d'usage, intégration pipeline, coût estimé. Format tableau avec priorité. Max 400 mots." },
    ]],
  },

  dg_synthesis: {
    type: "dg_synthesis",
    description: "Synthèse DG : vision consolidée des rapports spécialistes, décisions stratégiques à prendre",
    defaultMaxCostEur: 1.00,
    waves: [[
      { id: "synthese_executive", fallbackTier: "strategic", maxTokens: 3000,
        role: "Directeur Général senior", task: "Synthèse executive depuis les rapports des spécialistes (DAF, Marketing, Commercial, RH, Juridique). Tableau de bord : KPIs clés, alertes, décisions prioritaires, cap stratégique 30/90 jours. Max 1000 mots." },
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
