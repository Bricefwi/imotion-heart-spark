import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type CTAAction = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "outline";
};

export interface ContextualCTAProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction: CTAAction;
  secondaryAction?: CTAAction;
  tone?: "build" | "marketing" | "neutral";
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Bandeau CTA contextuel cross-app, partagé entre :
 * - Pendant Marc (MarketingAuditCTA)
 * - Fin d'audit lovelib
 * - Post-livraison J+15
 * - Notifications enrichies
 */
export function ContextualCTA({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tone = "marketing",
  onDismiss,
  compact = false,
  className,
}: ContextualCTAProps) {
  const toneRing =
    tone === "build"
      ? "border-secondary/30 bg-gradient-to-br from-secondary/10 via-primary/5 to-primary/10"
      : tone === "neutral"
      ? "border-border/60 bg-muted/30"
      : "border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/5 to-secondary/10";

  const renderAction = (action: CTAAction, isPrimary: boolean) => {
    const isExternal = action.external ?? /^https?:\/\//.test(action.href);
    const baseClass = isPrimary
      ? "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95"
      : "";
    const ArrowIcon = isExternal ? ArrowUpRight : ArrowRight;

    const content = (
      <>
        {action.label}
        <ArrowIcon className="ml-2 h-4 w-4" />
      </>
    );

    if (isExternal) {
      return (
        <Button
          key={action.label}
          asChild
          variant={isPrimary ? "default" : "outline"}
          className={baseClass}
          size={compact ? "sm" : "default"}
        >
          <a href={action.href} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        </Button>
      );
    }
    return (
      <Button
        key={action.label}
        asChild
        variant={isPrimary ? "default" : "outline"}
        className={baseClass}
        size={compact ? "sm" : "default"}
      >
        <Link to={action.href}>{content}</Link>
      </Button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("mx-auto", className)}
    >
      <div className={cn("relative overflow-hidden rounded-2xl border p-5 shadow-md", toneRing)}>
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
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {renderAction(primaryAction, true)}
              {secondaryAction && renderAction(secondaryAction, false)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
