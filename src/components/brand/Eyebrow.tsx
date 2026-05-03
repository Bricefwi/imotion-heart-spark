import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * Eyebrow — petit label éditorial avec barre verticale coral.
 * Signature imotion : reprend le "|" du wordmark comme marqueur de section.
 *
 * Usage :
 * <Eyebrow>Pour les agences digitales</Eyebrow>
 * <Eyebrow tone="light">B2B2B · White-label</Eyebrow>
 */
interface EyebrowProps {
  children: ReactNode;
  tone?: "default" | "light" | "muted";
  className?: string;
}

export function Eyebrow({ children, tone = "default", className }: EyebrowProps) {
  const toneStyles = {
    default: { bar: "hsl(var(--imo-coral-600))", text: "hsl(var(--imo-fg))" },
    light:   { bar: "hsl(var(--imo-coral-400))", text: "hsl(var(--imo-ink-200))" },
    muted:   { bar: "hsl(var(--imo-amber-500))", text: "hsl(var(--imo-fg-muted))" },
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] font-mono",
        className
      )}
      style={{ color: toneStyles.text }}
    >
      <span
        aria-hidden
        className="inline-block h-3 w-[2px] rounded-full"
        style={{ background: toneStyles.bar }}
      />
      {children}
    </span>
  );
}
