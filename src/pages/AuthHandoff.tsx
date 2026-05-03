import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { mintLovelibBridgeToken, appendBridgeToken } from "@/lib/lovelib-bridge";

/**
 * Cross-subdomain SSO handoff page.
 *
 *  Clarivi is the single point of authentication. When the marketing app
 *  (`marketing.imotion-conseils.fr`) needs to send a user to a feature that
 *  requires a Supabase session, it sends them here:
 *
 *      https://app.imotion-conseils.fr/auth/handoff?to=<absolute-marketing-url>
 *
 *  Behaviour:
 *   1. If the user is not authenticated → redirect to /login with `next` set
 *      to this same handoff URL so we come back here after sign-in.
 *   2. If authenticated → the SSO cookie bridge has already been initialised
 *      at boot (see `src/main.tsx` → `initSsoCookieBridge`). We just wait one
 *      tick to make sure the cookie is written on the parent domain, then
 *      hard-redirect (`window.location.replace`) to the target.
 *
 *  Security: the `to` parameter is **only** accepted if it points to a host
 *  ending in `.imotion-conseils.fr` (or the lovable.app fallback in preview).
 *  Any other host triggers a fallback to the client dashboard.
 */
const ALLOWED_HOST_SUFFIXES = [".imotion-conseils.fr", ".lovable.app"];

function isAllowedTarget(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname;
    return ALLOWED_HOST_SUFFIXES.some((s) => host.endsWith(s)) || host === "imotion-conseils.fr";
  } catch {
    return false;
  }
}

export default function AuthHandoff() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams(location.search);
  const target = params.get("to") ?? "";

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = `/auth/handoff?to=${encodeURIComponent(target)}`;
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }

    if (!target || !isAllowedTarget(target)) {
      setError("Lien de redirection invalide.");
      const t = setTimeout(() => navigate("/client/dashboard", { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    (async () => {
      // Mint a one-shot bridge token (≤60s) so lovelib can sign the user in
      // even when the cross-subdomain cookie is blocked (Safari ITP, etc.).
      const bridge = await mintLovelibBridgeToken();
      if (cancelled) return;
      const finalUrl = bridge ? appendBridgeToken(target, bridge.token) : target;
      setTimeout(() => window.location.replace(finalUrl), 150);
    })();
    return () => { cancelled = true; };
  }, [loading, user, target, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {error ? error : "Connexion à l'espace marketing IMOTION…"}
      </p>
    </div>
  );
}
