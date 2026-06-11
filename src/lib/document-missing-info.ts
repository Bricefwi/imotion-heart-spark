// Détecte les infos manquantes ou bloquantes sur un document
export interface DocLike {
  id: string;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  storage_path?: string | null;
  description?: string | null;
  content_markdown?: string | null;
  requires_signature?: boolean | null;
  signed_at?: string | null;
  project_id?: string | null;
  version?: number | null;
}

export interface MissingIssue {
  key: string;
  label: string;
  severity: "warn" | "error";
}

export function getDocumentMissingInfo(doc: DocLike): MissingIssue[] {
  const issues: MissingIssue[] = [];
  const hasContent =
    !!doc.storage_path ||
    (doc.content_markdown && doc.content_markdown.trim().length > 20) ||
    (doc.description && doc.description.trim().length > 20);

  if (!doc.name || doc.name.trim().length < 3) {
    issues.push({ key: "name", label: "Nom manquant", severity: "error" });
  }
  if (!hasContent) {
    issues.push({ key: "content", label: "Contenu vide", severity: "error" });
  }
  if (!doc.type) {
    issues.push({ key: "type", label: "Type non défini", severity: "warn" });
  }
  if (doc.status === "draft") {
    issues.push({ key: "draft", label: "Brouillon", severity: "warn" });
  }
  if (doc.requires_signature && !doc.signed_at) {
    issues.push({ key: "signature", label: "Signature en attente", severity: "warn" });
  }
  if (!doc.project_id) {
    issues.push({ key: "project", label: "Projet non lié", severity: "error" });
  }
  return issues;
}

export function getDocCompleteness(doc: DocLike): number {
  const issues = getDocumentMissingInfo(doc);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warns = issues.filter((i) => i.severity === "warn").length;
  const score = 100 - errors * 25 - warns * 10;
  return Math.max(0, Math.min(100, score));
}
