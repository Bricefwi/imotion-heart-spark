/**
 * Helper functions for document generation.
 * Extracted from index.ts for maintainability.
 */

interface Message {
  role: string;
  content: string;
  phase?: number;
  created_at?: string;
}

export function getDocName(type: string, projectName: string): string {
  const names: Record<string, string> = {
    cdc: "Cahier des Charges",
    devis: "Devis",
    contrat: "Contrat de Prestation",
    proposal: "Proposition Commerciale",
    contract: "Contrat de Prestation",
    tech_recommendation: "Recommandation Technique & Prompt",
    pricing: "Proposition Tarifaire Détaillée",
    contract_fr: "Contrat de Prestation (Droit Français)",
  };
  return `${names[type] || type} - ${projectName}`;
}

export function formatConversationForPrompt(messages: Message[]): string {
  if (!messages || messages.length === 0) return "Aucun échange enregistré.";

  const phaseNames: Record<number, string> = {
    1: "Présentation & Contexte",
    2: "Objectifs & Cibles",
    3: "Fonctionnalités & Contenu",
    4: "Design & Identité visuelle",
    5: "Technique & Intégrations",
    6: "Budget & Planning",
    7: "Synthèse & Validation",
  };

  const byPhase: Record<number, Message[]> = {};
  for (const m of messages) {
    const phase = m.phase || 1;
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(m);
  }

  let result = "";
  for (const [phase, msgs] of Object.entries(byPhase)) {
    const pNum = Number(phase);
    result += `\n### Phase ${pNum} — ${phaseNames[pNum] || "Autre"}\n`;
    for (const m of msgs) {
      const label = m.role === "user" ? "CLIENT" : "ASSISTANT";
      result += `**${label}** : ${m.content.substring(0, 500)}\n\n`;
    }
  }
  return result;
}

interface ProjectData {
  name: string;
  code?: string;
  current_phase?: number;
  qualification_score?: number;
  estimated_budget_min?: number;
  estimated_budget_max?: number;
  desired_deadline?: string;
  internal_notes?: string;
}

interface ClientData {
  full_name?: string;
  company_name?: string;
  industry?: string;
}

interface TemplateData {
  content: string;
}

export function buildPromptFromTemplate(
  template: TemplateData,
  project: ProjectData,
  client: ClientData | null,
  discoveryData: Record<string, unknown>,
  conversationContext: string
): string {
  let content = template.content;
  const vars: Record<string, string> = {
    project_name: project.name,
    project_code: project.code || "",
    client_name: client?.full_name || "N/A",
    client_company: client?.company_name || "N/A",
    client_industry: client?.industry || "Non spécifié",
    current_phase: `${project.current_phase}/7`,
    qualification_score: `${project.qualification_score || "N/A"}/5`,
    budget_min: String(project.estimated_budget_min || "?"),
    budget_max: String(project.estimated_budget_max || "?"),
    internal_notes: project.internal_notes || "Aucune",
    discovery_data: JSON.stringify(discoveryData, null, 2),
    conversation_context: conversationContext,
  };
  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return `À partir du template suivant, génère le document complet en Markdown:\n\n${content}`;
}
