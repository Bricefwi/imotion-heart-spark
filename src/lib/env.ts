function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
  }
  return value || "";
}

export const env = {
  SUPABASE_URL: requireEnv("VITE_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
} as const;
