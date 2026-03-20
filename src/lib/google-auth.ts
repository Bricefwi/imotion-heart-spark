import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { env } from "@/lib/env";

const LOVABLE_HOST_SUFFIXES = ["lovable.app", "lovableproject.com"] as const;
const GOOGLE_HOST_SUFFIXES = ["google.com"] as const;

const isLovableHosted = (hostname: string) =>
  LOVABLE_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));

const matchesHostSuffix = (hostname: string, suffixes: readonly string[]) =>
  suffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));

const isAllowedOAuthUrl = (urlString: string) => {
  try {
    const oauthUrl = new URL(urlString);
    const projectAuthHost = new URL(env.SUPABASE_URL).hostname;

    if (oauthUrl.protocol !== "https:") return false;

    return oauthUrl.hostname === projectAuthHost || matchesHostSuffix(oauthUrl.hostname, GOOGLE_HOST_SUFFIXES);
  } catch {
    return false;
  }
};

type StartGoogleOAuthOptions = {
  authPagePath: string;
  prompt?: "none" | "consent" | "select_account";
};

export async function startGoogleOAuth({
  authPagePath,
  prompt = "select_account",
}: StartGoogleOAuthOptions): Promise<void> {
  const redirectUri = `${window.location.origin}${authPagePath}`;
  const isCustomDomain = !isLovableHosted(window.location.hostname);

  if (isCustomDomain) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        queryParams: { prompt },
      },
    });

    if (error) throw error;
    if (!data?.url || !isAllowedOAuthUrl(data.url)) {
      throw new Error("URL de redirection Google invalide.");
    }

    window.location.assign(data.url);
    return;
  }

  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: redirectUri,
    extraParams: { prompt },
  });

  if (result?.error) {
    throw result.error;
  }
}