import { lovable } from "@/integrations/lovable/index";

type StartGoogleOAuthOptions = {
  authPagePath: string;
  prompt?: "none" | "consent" | "select_account";
};

export async function startGoogleOAuth({
  authPagePath,
  prompt = "select_account",
}: StartGoogleOAuthOptions): Promise<void> {
  const redirectUri = `${window.location.origin}${authPagePath}`;

  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: redirectUri,
    extraParams: { prompt },
  });

  if (result?.error) {
    throw result.error;
  }
}