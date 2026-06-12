// supabase/functions/_shared/types.ts
// Types partagés du pipeline d'agents internes.

export type AgentName =
  | "ORCHESTRATOR"
  | "EXTRACTOR"
  | "NOTIFIER"
  | "INTAKE-AGENT"
  | "NEED-ANALYZER"
  | "SCOPING-AGENT"
  | "CRITIC-AGENT"
  | "DOC-GENERATOR"
  | "QUOTE-BUILDER";

export interface AgentOutput {
  agent: AgentName;
  status: "success" | "error" | "needs_input";
  message?: string;
  extracted_data?: Record<string, unknown>;
  confidence: number;            // 0-1 : confiance déclarée par l'agent
  warnings: string[];            // doutes, données manquantes, hypothèses
  reasoning?: string;
  next_action?: string;
  next_agent?: string;
  raw?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_eur?: number;
}
