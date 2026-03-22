import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumePendingGoogleRedirect } from "@/lib/google-auth";
import { Loader2 } from "lucide-react";

/**
 * Handles the OAuth callback after a full-page redirect.
 *
 * Supabase PKCE flow redirects here with ?code=... in query params.
 * The Supabase client SDK automatically detects the code and exchanges it
 * via onAuthStateChange. We listen for the SIGNED_IN event as the primary
 * mechanism, with a manual exchangeCodeForSession as fallback.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    console.info("[AuthCallback] URL:", window.location.href);

    // Listen for auth state changes — the SDK may auto-exchange the PKCE code
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.info("[AuthCallback] Auth event:", event, "session:", !!session);
        if (event === "SIGNED_IN" && session) {
          window.history.replaceState(null, "", window.location.pathname);
          await redirectByRole();
        }
      }
    );

    // Also try manual handling as a fallback
    const handle = async () => {
      try {
        // 1. Check for hash fragment tokens (implicit flow)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error("[AuthCallback] setSession error:", error.message);
            navigate("/login", { replace: true });
            return;
          }
          window.history.replaceState(null, "", window.location.pathname);
          await redirectByRole();
          return;
        }

        // 2. Check for PKCE code in query params
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          console.info("[AuthCallback] Found PKCE code, exchanging...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[AuthCallback] code exchange error:", error.message);
            // Don't redirect immediately — the onAuthStateChange listener
            // might still pick up the session from a parallel exchange
          } else if (data.session) {
            window.history.replaceState(null, "", window.location.pathname);
            await redirectByRole();
            return;
          }
        }

        // 3. Check for error in params (OAuth denied / failed)
        const error = url.searchParams.get("error") || hashParams.get("error");
        if (error) {
          const desc = url.searchParams.get("error_description") || hashParams.get("error_description") || error;
          console.error("[AuthCallback] OAuth error:", desc);
          navigate("/login", { replace: true });
          return;
        }

        // 4. Check if session already exists (SDK may have auto-handled)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.info("[AuthCallback] Session already exists");
          await redirectByRole();
          return;
        }

        // 5. Wait up to 5 seconds for the onAuthStateChange listener to fire
        //    (the SDK may still be processing the code exchange)
        console.info("[AuthCallback] Waiting for auth state change...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Final check
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession) {
          await redirectByRole();
          return;
        }

        console.warn("[AuthCallback] No session after all attempts");
        navigate("/login", { replace: true });
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        navigate("/login", { replace: true });
      }
    };

    async function redirectByRole() {
      const pendingRedirect = consumePendingGoogleRedirect();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate(pendingRedirect || "/client/dashboard", { replace: true });
        return;
      }

      const fallback = pendingRedirect || "/client/dashboard";
      const userId = session.user.id;

      if (fallback === "/client/dashboard" || fallback === "/") {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        const roles = data?.map((r) => r.role) ?? [];

        if (roles.includes("admin") || roles.includes("super_admin")) {
          navigate("/admin/dashboard", { replace: true });
          return;
        }
        if (roles.includes("consultant")) {
          navigate("/consultant/dashboard", { replace: true });
          return;
        }
      }

      navigate(fallback, { replace: true });
    }

    void handle();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Connexion en cours...</p>
    </div>
  );
}
