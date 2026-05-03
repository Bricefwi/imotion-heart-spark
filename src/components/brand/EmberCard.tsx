import { cn } from "@/lib/utils";
import { type ReactNode, type CSSProperties } from "react";

/**
 * EmberCard — carte signature imotion avec halo ember (coral diffus).
 * Inspirée des documents éditoriaux : épaule chaude qui glow au hover.
 *
 * Variants :
 * - "paper"    : fond paper-gradient (devis/CDC look) sur surface claire
 * - "obsidian" : fond ink-900 avec halo amber (hero feature)
 * - "outline"  : minimal avec bordure coral subtle
 *
 * Usage :
 * <EmberCard variant="paper">Mon contenu</EmberCard>
 */
interface EmberCardProps {
  children: ReactNode;
  variant?: "paper" | "obsidian" | "outline";
  glowOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function EmberCard({
  children,
  variant = "paper",
  glowOnHover = true,
  className,
  style,
}: EmberCardProps) {
  const variants: Record<string, CSSProperties> = {
    paper: {
      background: "var(--imo-gradient-card)",
      border: "1px solid hsl(var(--imo-border))",
      boxShadow: "var(--imo-shadow-md)",
    },
    obsidian: {
      background: "var(--imo-gradient-dusk)",
      border: "1px solid hsl(var(--imo-ink-800))",
      boxShadow: "var(--imo-shadow-xl)",
    },
    outline: {
      background: "transparent",
      border: "1px solid hsl(var(--imo-coral-600) / 0.25)",
      boxShadow: "none",
    },
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 transition-all duration-300",
        glowOnHover && "imo-ember-card",
        className
      )}
      style={{ ...variants[variant], ...style }}
    >
      {children}
    </div>
  );
}
