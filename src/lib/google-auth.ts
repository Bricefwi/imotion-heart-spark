import { lovable } from "@/integrations/lovable/index";

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
  // Redirect MUST point to /auth/callback — that page handles code exchange
  // and hash-token extraction before navigating to the final destination.
  const redirectUri = `${window.location.origin}/auth/callback`;

  window.sessionStorage.setItem(GOOGLE_REDIRECT_STORAGE_KEY, safeRedirectPath);

  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: redirectUri,
    extraParams: { prompt },
  });

  if (result?.error) {
    throw result.error;
  }
}