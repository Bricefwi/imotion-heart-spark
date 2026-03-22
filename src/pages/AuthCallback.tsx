import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumePendingGoogleRedirect } from "@/lib/google-auth";
import { Loader2 } from "lucide-react";

/**
 * Handles the OAuth callback after a full-page redirect (non-iframe flow).
 *
 * The Lovable OAuth broker or Supabase may redirect here with:
 *   - Hash fragments: #access_token=...&refresh_token=...
 *   - Query params:   ?code=...  (PKCE flow)
 *
 * This page extracts tokens / code, sets the session, and redirects
 * to the appropriate dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handle = async () => {
      try {
        // 1. Check for hash fragment tokens (implicit / Lovable broker flow)
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
            navigate("/login", { replace: true, state: { error: "session_failed" } });
            return;
          }
          // Clean up URL
          window.history.replaceState(null, "", window.location.pathname);
          await redirectByRole();
          return;
        }

        // 2. Check for PKCE code in query params
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          // Supabase client auto-handles PKCE code exchange via onAuthStateChange.
          // We wait a moment for the session to be established.
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[AuthCallback] code exchange error:", error.message);
            navigate("/login", { replace: true, state: { error: "code_exchange_failed" } });
            return;
          }
          if (data.session) {
            // Clean up URL
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
          navigate("/login", { replace: true, state: { error: "oauth_error", message: desc } });
          return;
        }

        // 4. No tokens and no code — check if session already exists
        //    (Supabase auto-detected tokens before this component mounted)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await redirectByRole();
          return;
        }

        // 5. Nothing worked — redirect to login
        console.warn("[AuthCallback] No tokens, code, or session found");
        navigate("/login", { replace: true });
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        navigate("/login", { replace: true });
      }
    };

    async function redirectByRole() {
      // Check if there's a stored redirect path from startGoogleOAuth
      const pendingRedirect = consumePendingGoogleRedirect();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate(pendingRedirect || "/client/dashboard", { replace: true });
        return;
      }

      const fallback = pendingRedirect || "/client/dashboard";
      const userId = session.user.id;

      // Only do smart redirect if the target is a generic dashboard
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
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Connexion en cours...</p>
    </div>
  );
}
