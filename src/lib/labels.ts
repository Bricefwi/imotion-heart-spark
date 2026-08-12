/**
 * labels.ts — source unique de vérité pour les maps de labels/badges.
 *
 * Ces maps étaient dupliquées (avec des dérives d'accents et de couleurs)
 * dans admin/ProjectDetail.tsx, admin/CRM.tsx, client/Projects.tsx…
 * Toute évolution de wording ou de couleur de statut se fait ici.
 */
import { BookOpen, ClipboardCheck, Cpu, FileText, Scale } from "lucide-react";

/** Statuts du pipeline projet (vue admin / consultant). */
export const PROJECT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  discovery_active: { label: "En découverte", color: "bg-green-100 text-green-700" },
  discovery_completed: { label: "Découverte terminée", color: "bg-blue-100 text-blue-700" },
  cdc_draft: { label: "CDC en cours", color: "bg-secondary/10 text-orange-700" },
  cdc_ready: { label: "CDC prêt", color: "bg-blue-100 text-blue-700" },
  proposal_sent: { label: "Proposition envoyée", color: "bg-indigo-100 text-indigo-700" },
  signed: { label: "Signé", color: "bg-green-100 text-green-700" },
  in_development: { label: "En développement", color: "bg-yellow-100 text-yellow-700" },
  delivered: { label: "Livré", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Perdu", color: "bg-primary/10 text-destructive" },
};

/** Statuts projet côté client (badges plus marqués). */
export const CLIENT_PROJECT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  discovery_active: { label: "En découverte", color: "gradient-primary text-primary-foreground border-0" },
  discovery_paused: { label: "En pause", color: "bg-amber-100 text-amber-700 border-0" },
  discovery_completed: { label: "Découverte terminée", color: "bg-blue-100 text-blue-700 border-0" },
  cdc_ready: { label: "CDC prêt", color: "bg-emerald-100 text-emerald-700 border-0" },
  proposal_sent: { label: "Proposition envoyée", color: "bg-violet-100 text-violet-700 border-0" },
  signed: { label: "Signé", color: "bg-emerald-100 text-emerald-700 border-0" },
};

/** Types de documents du pipeline commercial. */
export const DOC_TYPE_LABELS: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  cdc: { label: "Cahier des Charges", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
  tech_recommendation: { label: "Reco Technique & Prompt", icon: Cpu, color: "bg-purple-100 text-purple-700" },
  proposal: { label: "Proposition Commerciale", icon: FileText, color: "bg-indigo-100 text-indigo-700" },
  pricing: { label: "Devis", icon: FileText, color: "bg-amber-100 text-amber-700" },
  devis: { label: "Devis", icon: FileText, color: "bg-amber-100 text-amber-700" },
  contract: { label: "Contrat", icon: Scale, color: "bg-green-100 text-green-700" },
  contrat: { label: "Contrat", icon: Scale, color: "bg-green-100 text-green-700" },
  contract_fr: { label: "Contrat (Droit FR)", icon: Scale, color: "bg-green-100 text-green-700" },
  pv_reception: { label: "PV de Réception", icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-700" },
};

/** Catégories d'outils recommandés (reco technique). */
export const TOOL_CATEGORIES: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend / BDD",
  hosting: "Hébergement",
  cms: "CMS / Contenu",
  design: "Design / UX",
  devops: "CI/CD / DevOps",
  analytics: "Analytics",
  ai: "IA / Automatisation",
  other: "Autre",
};

/** Badges de statut des emails transactionnels (email_send_log). */
export const EMAIL_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  sent: { label: "Envoyé", className: "bg-green-100 text-green-700" },
  failed: { label: "Échoué", className: "bg-destructive/10 text-destructive" },
  dlq: { label: "Échoué", className: "bg-destructive/10 text-destructive" },
  suppressed: { label: "Supprimé", className: "bg-muted text-muted-foreground" },
  bounced: { label: "Rebond", className: "bg-secondary/10 text-orange-700" },
  complained: { label: "Plainte", className: "bg-destructive/10 text-destructive" },
};

/** Libellés des templates d'emails transactionnels. */
export const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
  cdc_ready: "CDC prêt",
  discovery_complete: "Découverte terminée",
  proposal_sent: "Proposition envoyée",
  contract_signed: "Contrat signé",
  development_started: "Développement démarré",
  project_delivered: "Projet livré",
  auth_emails: "Email d'authentification",
};
