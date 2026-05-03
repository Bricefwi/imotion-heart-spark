/**
 * CrossAppSwitcher — segmented control unifié [Build ⇄ Marketing]
 * À placer dans tous les headers Clarivi.
 * Côté lovelib : composant jumeau avec `current="marketing"` (patch fourni).
 */
import { Link } from "react-router-dom";
import { Rocket, Target } from "lucide-react";

interface Props {
  current?: "build" | "marketing";
  className?: string;
  /** "compact" = icônes seules <md, "full" = labels visibles */
  size?: "compact" | "full";
}

export function CrossAppSwitcher({ current = "build", className = "", size = "full" }: Props) {
  const baseSeg =
    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all duration-200";

  return (
    <div
      role="tablist"
      aria-label="Changer d'application IMOTION"
      className={`inline-flex items-center gap-1 p-1 rounded-[var(--radius-md)] border border-border/50 bg-muted/40 backdrop-blur-sm ${className}`}
    >
      {/* BUILD */}
      <Link
        to="/"
        role="tab"
        aria-selected={current === "build"}
        className={`${baseSeg} ${
          current === "build"
            ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Rocket className="h-3.5 w-3.5" />
        <span className={size === "compact" ? "hidden md:inline" : ""}>Build</span>
      </Link>

      {/* MARKETING (route interne fusionnée) */}
      <Link
        to="/marketing"
        role="tab"
        aria-selected={current === "marketing"}
        className={`${baseSeg} ${
          current === "marketing"
            ? "bg-gradient-to-r from-primary to-secondary text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Target className="h-3.5 w-3.5" />
        <span className={size === "compact" ? "hidden md:inline" : ""}>Marketing</span>
      </Link>
    </div>
  );
}
