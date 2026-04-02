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
    conseil_technique: "Conseil Technique — Livrable Stratégique",
    build_prompts: "Prompts de Build — Guide IA",
    pricing: "Proposition Tarifaire Détaillée",
    contract_fr: "Contrat de Prestation (Droit Français)",
    pv_reception: "Proces-Verbal de Reception",
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
  company_role?: string;
  company_size?: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  preferences?: Record<string, unknown> | null;
}

interface TemplateData {
  content?: string;
  template_content?: string;
}

export function buildPromptFromTemplate(
  template: TemplateData,
  project: ProjectData,
  client: ClientData | null,
  discoveryData: Record<string, unknown>,
  conversationContext: string
): string {
  let content = template.content || template.template_content || "";
  const prefs: Record<string, unknown> = (client?.preferences && typeof client.preferences === "object" && !Array.isArray(client.preferences))
    ? client.preferences
    : {};
  const documentDate = new Date().toLocaleDateString("fr-FR");
  const vars: Record<string, string> = {
    project_name: project.name,
    project_code: project.code || "",
    client_name: client?.full_name || "N/A",
    client_company: client?.company_name || "N/A",
    client_role: client?.company_role || "Non renseignée",
    client_size: client?.company_size || "Non renseignée",
    client_industry: client?.industry || "Non spécifié",
    client_phone: client?.phone || "Non renseigné",
    client_email: client?.email || "N/A",
    client_website: client?.website || "Aucun",
    social_linkedin: String(prefs.social_linkedin || discoveryData.social_linkedin || "Non renseigné"),
    social_instagram: String(prefs.social_instagram || discoveryData.social_instagram || "Non renseigné"),
    social_facebook: String(prefs.social_facebook || discoveryData.social_facebook || "Non renseigné"),
    current_phase: `${project.current_phase}/7`,
    qualification_score: `${project.qualification_score || "N/A"}/5`,
    budget_min: String(project.estimated_budget_min || "?"),
    budget_max: String(project.estimated_budget_max || "?"),
    desired_deadline: project.desired_deadline || "Non définie",
    internal_notes: project.internal_notes || "Aucune",
    discovery_data: JSON.stringify(discoveryData, null, 2),
    conversation_context: conversationContext,
    "project.name": project.name,
    "project.code": project.code || "",
    "project.current_phase": `${project.current_phase}/7`,
    "project.qualification_score": `${project.qualification_score || "N/A"}/5`,
    "project.estimated_budget_min": String(project.estimated_budget_min || "?"),
    "project.estimated_budget_max": String(project.estimated_budget_max || "?"),
    "project.desired_deadline": project.desired_deadline || "Non définie",
    "project.internal_notes": project.internal_notes || "Aucune",
    "client.full_name": client?.full_name || "N/A",
    "client.company_name": client?.company_name || "N/A",
    "client.company_role": client?.company_role || "Non renseignée",
    "client.company_size": client?.company_size || "Non renseignée",
    "client.industry": client?.industry || "Non spécifié",
    "client.phone": client?.phone || "Non renseigné",
    "client.email": client?.email || "N/A",
    "client.website": client?.website || "Aucun",
    "document.date": documentDate,
  };
  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return `À partir du template suivant, génère le document complet en Markdown:\n\n${content}`;
}
