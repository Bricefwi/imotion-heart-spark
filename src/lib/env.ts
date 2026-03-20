const FALLBACK_PROJECT_ID = "npmkzqxoxobfqdqpnsgf";
const FALLBACK_SUPABASE_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWt6cXhveG9iZnFkcXBuc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzUyNzksImV4cCI6MjA4OTQxMTI3OX0.GgR5IKEBAX5Y4knl1zNmSfUydIISTeksjoObC_P1FNM";

function readEnv(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() || "";
}

function resolveSupabaseUrl(): string {
  const explicitUrl = readEnv("VITE_SUPABASE_URL");
  if (explicitUrl) return explicitUrl;

  const projectId = readEnv("VITE_SUPABASE_PROJECT_ID") || FALLBACK_PROJECT_ID;
  if (projectId) {
    return `https://${projectId}.supabase.co`;
  }

  console.error("Missing Supabase URL configuration, using fallback URL.");
  return FALLBACK_SUPABASE_URL;
}

function resolveSupabaseAnonKey(): string {
  const explicitKey = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (explicitKey) return explicitKey;

  console.error("Missing Supabase publishable key configuration, using fallback key.");
  return FALLBACK_SUPABASE_ANON_KEY;
}

export const env = {
  SUPABASE_URL: resolveSupabaseUrl(),
  SUPABASE_ANON_KEY: resolveSupabaseAnonKey(),
} as const;
