// Imported from lovelib-spyglass — unchanged. See mem://features/marketing-fns-migration
export type PlanTier = 'freemium' | 'pro' | 'agency' | 'enterprise';
export type TaskType = 'research' | 'analysis' | 'strategy' | 'writing' | 'synthesis' | 'verification';
export type AIProvider = 'openai' | 'anthropic' | 'perplexity' | 'google' | 'lovable';

export interface ModelConfig {
  model: string;
  provider: AIProvider;
  maxTokens: number;
  temperature: number;
  description: string;
}

export interface PlanAIConfig {
  planName: string;
  displayModels: string;
  research: ModelConfig;
  analysis: ModelConfig;
  strategy: ModelConfig;
  writing: ModelConfig;
  synthesis: ModelConfig;
  verification: ModelConfig;
  searchDepth: 'basic' | 'advanced' | 'deep' | 'ultra';
  maxScrapingChars: number;
  breakpoints: string[];
  expectedPages: string;
  agentCount: number;
  infographicsCount: number;
}

export const AI_MODELS_CONFIG: Record<PlanTier, PlanAIConfig> = {
  freemium: {
    planName: "Freemium", displayModels: "Gemini 2.5 Flash Lite",
    research:    { model: "gemini-2.5-flash-lite", provider: "google", maxTokens: 4000, temperature: 0.5, description: "Recherche rapide" },
    analysis:    { model: "gemini-2.5-flash-lite", provider: "google", maxTokens: 4000, temperature: 0.3, description: "Analyse basique" },
    strategy:    { model: "gemini-2.5-flash-lite", provider: "google", maxTokens: 4000, temperature: 0.5, description: "Stratégie express" },
    writing:     { model: "gemini-2.5-flash-lite", provider: "google", maxTokens: 4000, temperature: 0.7, description: "Rédaction auto" },
    synthesis:   { model: "gemini-2.5-flash-lite", provider: "google", maxTokens: 4000, temperature: 0.4, description: "Synthèse rapide" },
    verification:{ model: "gemini-2.5-flash-lite", provider: "google", maxTokens: 2000, temperature: 0.2, description: "Vérification basique" },
    searchDepth: "basic", maxScrapingChars: 10000, breakpoints: [], expectedPages: "15-20", agentCount: 7, infographicsCount: 3
  },
  pro: {
    planName: "Pro", displayModels: "Claude Sonnet 4.5 + Sonar Pro + Gemini 3 Pro",
    research:    { model: "sonar-pro", provider: "perplexity", maxTokens: 8000, temperature: 0.3, description: "Recherche web Perplexity" },
    analysis:    { model: "gemini-3-pro", provider: "google", maxTokens: 16000, temperature: 0.3, description: "Gemini 3 Pro" },
    strategy:    { model: "claude-sonnet-4-5", provider: "anthropic", maxTokens: 16000, temperature: 0.5, description: "Claude Sonnet" },
    writing:     { model: "claude-sonnet-4-5", provider: "anthropic", maxTokens: 16000, temperature: 0.7, description: "Claude Sonnet" },
    synthesis:   { model: "gemini-3-pro", provider: "google", maxTokens: 12000, temperature: 0.4, description: "Gemini 3 Pro" },
    verification:{ model: "sonar-pro", provider: "perplexity", maxTokens: 4000, temperature: 0.2, description: "Sonar" },
    searchDepth: "advanced", maxScrapingChars: 30000, breakpoints: ["AFTER_DIAGNOSIS"], expectedPages: "35-50", agentCount: 12, infographicsCount: 8
  },
  agency: {
    planName: "Agency", displayModels: "Claude Opus 4.5 + GPT-5.1 + Sonar Reasoning Pro",
    research:    { model: "sonar-reasoning-pro", provider: "perplexity", maxTokens: 12000, temperature: 0.2, description: "Sonar Reasoning Pro" },
    analysis:    { model: "claude-opus-4-5", provider: "anthropic", maxTokens: 24000, temperature: 0.3, description: "Claude Opus 4.5" },
    strategy:    { model: "gpt-5.1", provider: "openai", maxTokens: 24000, temperature: 0.5, description: "GPT-5.1" },
    writing:     { model: "claude-opus-4-5", provider: "anthropic", maxTokens: 24000, temperature: 0.7, description: "Claude Opus" },
    synthesis:   { model: "gpt-5.1", provider: "openai", maxTokens: 20000, temperature: 0.4, description: "GPT-5.1" },
    verification:{ model: "sonar-reasoning-pro", provider: "perplexity", maxTokens: 8000, temperature: 0.2, description: "Sonar Reasoning Pro" },
    searchDepth: "deep", maxScrapingChars: 50000, breakpoints: ["AFTER_DIAGNOSIS","AFTER_MARKET_ANALYSIS"], expectedPages: "60-80", agentCount: 15, infographicsCount: 15
  },
  enterprise: {
    planName: "Enterprise", displayModels: "Claude Opus 4.5 + GPT-5.2 Pro + Sonar Deep Research + O1-Pro",
    research:    { model: "sonar-deep-research", provider: "perplexity", maxTokens: 16000, temperature: 0.2, description: "Deep Research" },
    analysis:    { model: "gpt-5.2-pro", provider: "openai", maxTokens: 32000, temperature: 0.2, description: "GPT-5.2 Pro" },
    strategy:    { model: "claude-opus-4-5", provider: "anthropic", maxTokens: 32000, temperature: 0.4, description: "Claude Opus 4.5" },
    writing:     { model: "claude-opus-4-5", provider: "anthropic", maxTokens: 32000, temperature: 0.6, description: "Claude Opus 4.5" },
    synthesis:   { model: "o1-pro", provider: "openai", maxTokens: 32000, temperature: 0.3, description: "O1-Pro" },
    verification:{ model: "sonar-deep-research", provider: "perplexity", maxTokens: 12000, temperature: 0.1, description: "Deep Research" },
    searchDepth: "ultra", maxScrapingChars: 100000, breakpoints: ["AFTER_DIAGNOSIS","AFTER_MARKET_ANALYSIS","AFTER_STRATEGY"], expectedPages: "100-150", agentCount: 17, infographicsCount: 25
  }
};

export const PROVIDER_ENDPOINTS = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  perplexity: "https://api.perplexity.ai/chat/completions",
  google: "https://generativelanguage.googleapis.com/v1beta/models",
  lovable: "https://ai.gateway.lovable.dev/v1/chat/completions"
};

export function getAIConfigForPlan(plan: string): PlanAIConfig {
  return AI_MODELS_CONFIG[(plan.toLowerCase() as PlanTier)] || AI_MODELS_CONFIG.freemium;
}
export function getModelForTask(plan: string, task: TaskType): ModelConfig {
  return getAIConfigForPlan(plan)[task];
}
export function getDisplayModelsForPlan(plan: string): string {
  return getAIConfigForPlan(plan).displayModels;
}
export function hasBreakpoint(plan: string, bp: string): boolean {
  return getAIConfigForPlan(plan).breakpoints.includes(bp);
}
export function getExpectedPages(plan: string): string { return getAIConfigForPlan(plan).expectedPages; }
export function getAgentCount(plan: string): number { return getAIConfigForPlan(plan).agentCount; }
export function getInfographicsCount(plan: string): number { return getAIConfigForPlan(plan).infographicsCount; }

export default AI_MODELS_CONFIG;
