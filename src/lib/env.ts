/**
 * Résolution des variables d'environnement Supabase côté frontend.
 *
 * Règles (durcies — finding B1) :
 *  - AUCUNE clé ni URL de projet n'est codée en dur dans le dépôt, y compris
 *    la clé anon (publique par nature, mais un JWT valide commité banalise
 *    la pratique et expose le `ref` projet à tout lecteur du dépôt).
 *  - En développement comme en production : si les variables VITE_SUPABASE_*
 *    ne sont pas fournies, on log une erreur claire et on jette. En dev,
 *    utiliser un `.env.local` non commité (cf. `.env.example`).
 */

function readEnv(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() || "";
}

function missing(name: string): never {
  const msg =
    `[env] Variable ${name} manquante. ` +
    `Fournissez les variables VITE_SUPABASE_* au build (prod) ou via un ` +
    `fichier .env.local non commité (dev) — cf. .env.example. ` +
    `Aucun fallback codé en dur n'est utilisé.`;
  console.error(msg);
  throw new Error(msg);
}

function resolveSupabaseUrl(): string {
  const explicitUrl = readEnv("VITE_SUPABASE_URL");
  if (explicitUrl) return explicitUrl;

  const projectId = readEnv("VITE_SUPABASE_PROJECT_ID");
  if (projectId) return `https://${projectId}.supabase.co`;

  return missing("VITE_SUPABASE_URL");
}

function resolveSupabaseAnonKey(): string {
  const explicitKey = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (explicitKey) return explicitKey;

  return missing("VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const env = {
  SUPABASE_URL: resolveSupabaseUrl(),
  SUPABASE_ANON_KEY: resolveSupabaseAnonKey(),
} as const;
