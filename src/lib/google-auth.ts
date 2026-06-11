import { supabase } from "@/integrations/supabase/client";

const GOOGLE_REDIRECT_STORAGE_KEY = "google-oauth-redirect-path";

type StartGoogleOAuthOptions = {
  redirectPath: string;
  prompt?: "none" | "consent" | "select_account";
};

const sanitizeRedirectPath = (value: string | null | undefined): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/client/dashboard";
  }

  return value;
};

export function consumePendingGoogleRedirect(): string | null {
  const storedValue = window.sessionStorage.getItem(GOOGLE_REDIRECT_STORAGE_KEY);

  if (storedValue) {
    window.sessionStorage.removeItem(GOOGLE_REDIRECT_STORAGE_KEY);
  }

  return storedValue ? sanitizeRedirectPath(storedValue) : null;
}

export async function startGoogleOAuth({
  redirectPath,
  prompt = "select_account",
}: StartGoogleOAuthOptions): Promise<void> {
  const safeRedirectPath = sanitizeRedirectPath(redirectPath);
  const redirectTo = `${window.location.origin}/login`;

  window.sessionStorage.setItem(GOOGLE_REDIRECT_STORAGE_KEY, safeRedirectPath);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt },
    },
  });

  if (error) {
    throw error;
  }
}