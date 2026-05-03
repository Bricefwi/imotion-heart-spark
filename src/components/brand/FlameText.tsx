import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * FlameText — gradient text signature imotion (coral → amber).
 * À réserver aux mots-clés distinctifs dans les headlines, jamais le titre entier.
 *
 * Usage :
 * <h1>Embarquez un <FlameText>audit IA</FlameText> dans votre tunnel.</h1>
 */
interface FlameTextProps {
  children: ReactNode;
  variant?: "flame" | "ember" | "sunrise";
  className?: string;
}

export function FlameText({ children, variant = "flame", className }: FlameTextProps) {
  const gradients = {
    flame:   "var(--imo-gradient-text)",
    ember:   "var(--imo-gradient-ember)",
    sunrise: "var(--imo-gradient-sunrise)",
  };

  return (
    <span
      className={cn("inline bg-clip-text", className)}
      style={{
        backgroundImage: gradients[variant],
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </span>
  );
}
