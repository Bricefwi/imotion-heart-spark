/**
 * Registry des variables disponibles dans les emails / notifications d'automatisation.
 * Partagé entre l'éditeur (chips d'insertion) et l'aperçu (substitution).
 */

export interface AutomationVariable {
  key: string;
  label: string;
  example: string;
  description: string;
}

export const AUTOMATION_VARIABLES: AutomationVariable[] = [
  { key: "nom", label: "Nom du client", example: "Marie Dupont", description: "Nom complet du destinataire" },
  { key: "prenom", label: "Prénom", example: "Marie", description: "Prénom seul" },
  { key: "email", label: "Email", example: "marie@exemple.fr", description: "Email du destinataire" },
  { key: "entreprise", label: "Entreprise", example: "Acme SARL", description: "Société du client" },
  { key: "projet", label: "Nom du projet", example: "Refonte site corporate", description: "Nom du projet concerné" },
  { key: "projet_code", label: "Code projet", example: "IM-2606-0042", description: "Code interne IMOTION" },
  { key: "statut", label: "Statut actuel", example: "En cours", description: "Statut humain du projet" },
  { key: "phase", label: "Phase courante", example: "4", description: "Numéro de la phase de découverte (1-7)" },
  { key: "lien_projet", label: "Lien projet", example: "https://app.imotion-conseils.fr/client/…", description: "URL directe vers le projet" },
  { key: "lien_cdc", label: "Lien CDC", example: "https://app.imotion-conseils.fr/client/documents", description: "URL vers le Cahier des Charges" },
  { key: "date", label: "Date du jour", example: "11/06/2026", description: "Date au format JJ/MM/AAAA" },
  { key: "consultant", label: "Consultant assigné", example: "Patrice Simion", description: "Nom du consultant en charge" },
];

const FALLBACK_VARS: Record<string, string> = Object.fromEntries(
  AUTOMATION_VARIABLES.map((v) => [v.key, v.example]),
);

/**
 * Remplace `{{cle}}` (avec ou sans espaces) par la valeur fournie.
 * Les variables non fournies basculent sur leur valeur d'exemple (rendu lisible pour l'aperçu).
 */
export function renderTemplate(source: string, vars: Partial<Record<string, string>> = {}): string {
  if (!source) return "";
  const merged = { ...FALLBACK_VARS, ...vars };
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = merged[key];
    return value !== undefined ? value : `{{${key}}}`;
  });
}

/**
 * Insère un placeholder à la position du curseur d'un textarea / input.
 * Retourne la nouvelle valeur ET la position du curseur après insertion.
 */
export function insertVariableAtCursor(
  el: HTMLTextAreaElement | HTMLInputElement | null,
  currentValue: string,
  key: string,
): { value: string; nextCursor: number } {
  const placeholder = `{{${key}}}`;
  if (!el) {
    return { value: currentValue + placeholder, nextCursor: currentValue.length + placeholder.length };
  }
  const start = el.selectionStart ?? currentValue.length;
  const end = el.selectionEnd ?? currentValue.length;
  const next = currentValue.slice(0, start) + placeholder + currentValue.slice(end);
  return { value: next, nextCursor: start + placeholder.length };
}
