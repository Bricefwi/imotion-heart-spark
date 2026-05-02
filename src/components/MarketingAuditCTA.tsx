import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketingAuditUrl } from "@/lib/marketing-url";

interface MarketingAuditCTAProps {
  projectId?: string;
  userId?: string;
  reason?: string | null;
  onDismiss?: () => void;
}

/**
 * Bandeau de passerelle B : invite l'utilisateur à faire l'audit marketing
 * gratuit sur marketing.imotion-conseils.fr quand Marc détecte un manque de
 * stratégie. Ouvre dans un nouvel onglet pour ne pas casser la discovery.
 */
export function MarketingAuditCTA({ projectId, userId, reason, onDismiss }: MarketingAuditCTAProps) {
  const href = getMarketingAuditUrl({
    projectId,
    userId,
    reason: reason ?? undefined,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto max-w-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/5 to-secondary/10 p-5 shadow-md">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Masquer la suggestion"
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-start gap-4 pr-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-foreground">
                Avant d'aller plus loin : un audit marketing gratuit ?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {reason
                  ? `J'ai noté que ${reason.toLowerCase()}. Un audit marketing gratuit (15-20 min) clarifiera ce point avant qu'on lance le build — ça évite de construire dans le vide.`
                  : "Un audit marketing gratuit clarifie votre cible, votre positionnement et vos concurrents avant qu'on lance le build."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                asChild
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
              >
                <a href={href} target="_blank" rel="noopener noreferrer">
                  Faire l'audit gratuit
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
              {onDismiss && (
                <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground">
                  Plus tard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
