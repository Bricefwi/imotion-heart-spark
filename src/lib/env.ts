/**
 * Résolution des variables d'environnement Supabase côté frontend.
 *
 * Règles :
 *  - En développement / preview Lovable (`import.meta.env.DEV`), on
 *    autorise un fallback sur les valeurs publiques connues du projet
 *    pour ne jamais casser le mode Lovable.
 *  - En production (build hors Lovable, déploiement VPS, etc.), AUCUN
 *    fallback : si les variables ne sont pas fournies au build, on
 *    log une erreur claire et on jette. Cela évite qu'une clé /
 *    instance par défaut se retrouve servie aux utilisateurs finaux.
 */

const FALLBACK_PROJECT_ID = "npmkzqxoxobfqdqpnsgf";
const FALLBACK_SUPABASE_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWt6cXhveG9iZnFkcXBuc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzUyNzksImV4cCI6MjA4OTQxMTI3OX0.GgR5IKEBAX5Y4knl1zNmSfUydIISTeksjoObC_P1FNM";

const IS_DEV = Boolean(import.meta.env?.DEV);

function readEnv(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() || "";
}

function missing(name: string): never {
  const msg =
    `[env] Variable ${name} manquante. ` +
    `En production, toutes les variables VITE_SUPABASE_* doivent être ` +
    `fournies au build (cf. .env.example). Aucun fallback n'est utilisé en prod.`;
  console.error(msg);
  throw new Error(msg);
}

function resolveSupabaseUrl(): string {
  const explicitUrl = readEnv("VITE_SUPABASE_URL");
  if (explicitUrl) return explicitUrl;

  const projectId = readEnv("VITE_SUPABASE_PROJECT_ID");
  if (projectId) return `https://${projectId}.supabase.co`;

  if (IS_DEV) {
    console.warn("[env] VITE_SUPABASE_URL absente — fallback dev Lovable utilisé.");
    return FALLBACK_SUPABASE_URL;
  }
  return missing("VITE_SUPABASE_URL");
}

function resolveSupabaseAnonKey(): string {
  const explicitKey = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (explicitKey) return explicitKey;

  if (IS_DEV) {
    console.warn(
      "[env] VITE_SUPABASE_PUBLISHABLE_KEY absente — fallback dev Lovable utilisé.",
    );
    return FALLBACK_SUPABASE_ANON_KEY;
  }
  return missing("VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const env = {
  SUPABASE_URL: resolveSupabaseUrl(),
  SUPABASE_ANON_KEY: resolveSupabaseAnonKey(),
} as const;
