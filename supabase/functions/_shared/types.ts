// supabase/functions/_shared/types.ts
// Types V2 — Clarivi for Agencies

export type AgentName =
  | "ORCHESTRATOR"
  | "INTAKE-AGENT"
  | "NEED-ANALYZER"
  | "SCOPING-AGENT"
  | "CRITIC-AGENT"
  | "DOC-GENERATOR"
  | "QUOTE-BUILDER"
  | "EXTRACTOR"
  | "NOTIFIER";

export type AgentStatus = "success" | "partial" | "error";
export type NextAction = "continue" | "handoff" | "complete" | "escalate" | "proceed" | "retry";
export type LeadGrade = "A" | "B" | "C" | "D";

export interface AgentOutput {
  agent: AgentName;
  status: AgentStatus;
  message?: string;
  extracted_data?: Record<string, unknown>;
  confidence: number;
  warnings: string[];
  reasoning?: string;
  next_action?: NextAction;
  next_agent?: string;
  raw?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_eur?: number;
}

// Phase 1 — Intake
export interface Phase1Data {
  prospect_name: string | null;
  prospect_role: string | null;
  company_name: string | null;
  sector: string | null;
  pain_point: string | null;
  pain_quantified: {
    cost_eur_month: number | null;
    frequency: string | null;
    impact: "low" | "medium" | "high" | "critical" | null;
  };
}

// Phase 2 — Need Analysis
export interface Phase2Data {
  vision_description: string | null;
  success_metric: string | null;
  current_tools: string[];
  must_have_features: string[];
  nice_to_have: string[];
}

// Phase 3 — Scoping
export interface Phase3Data {
  budget_range: {
    min_eur: number;
    max_eur: number;
    currency: "EUR";
  } | null;
  timeline_target: string | null;
  urgency: "low" | "medium" | "high" | "critical" | null;
  team_size: number | null;
  decision_makers: Array<{
    name: string;
    role: string;
    power_level: "P0" | "P1" | "P2";
  }>;
  decision_timeline: string | null;
  qualification_score: number;
}

export interface DiscoveryData {
  phase1?: Partial<Phase1Data>;
  phase2?: Partial<Phase2Data>;
  phase3?: Partial<Phase3Data>;
}

// Agency types
export type AgencyPlan = "trial" | "starter" | "pro" | "agency" | "cancelled";
export type AgencyRole = "owner" | "admin" | "member";

export interface AgencyBranding {
  logo_url?: string | null;
  primary_color: string;
  accent_color: string;
  custom_subdomain?: string | null;
  custom_domain?: string | null;
  welcome_message?: string | null;
  consultant_persona: string;
  legal_company_name?: string | null;
  legal_siret?: string | null;
}

export interface AgencyPricingTemplate {
  id: string;
  template_name: string;
  daily_rate_eur: number;
  hourly_rate_eur: number;
  package_pricing: unknown[];
  default_margin_pct: number;
  is_default: boolean;
}
