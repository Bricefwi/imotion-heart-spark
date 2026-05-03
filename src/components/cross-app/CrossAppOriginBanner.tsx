/**
 * CrossAppOriginBanner — bandeau contextuel "Vous arrivez de Marketing"
 * S'affiche si l'URL contient ?source=lovelib (ou si la session SSO le révèle).
 * CTA : retour Marketing ou continuer le parcours BUILD.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Target, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketingHandoffUrl } from "@/lib/marketing-url";
import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "cross-app:origin-banner-dismissed";

export function CrossAppOriginBanner() {
  const { search } = useLocation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }
    const params = new URLSearchParams(search);
    const src = params.get("source") ?? params.get("from");
    if (src === "lovelib" || src === "marketing") {
      setOrigin("marketing");
      // remember during the session for cross-page persistence
      sessionStorage.setItem("cross-app:origin", "marketing");
    } else if (sessionStorage.getItem("cross-app:origin") === "marketing") {
      setOrigin("marketing");
    }
  }, [search]);

  if (dismissed || origin !== "marketing") return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="border-b border-border/40 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
      <div className="container py-2.5 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Target className="h-4 w-4 text-secondary shrink-0" />
          <span className="font-medium truncate">
            Vous arrivez d'IMOTION Marketing
          </span>
          <span className="text-muted-foreground hidden sm:inline truncate">
            · poursuivez ici votre projet, votre audit reste accessible.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
            <a href={getMarketingHandoffUrl("/", { userId: user?.id })}>
              <ArrowLeft className="h-3 w-3" /> Retour Marketing
            </a>
          </Button>
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
