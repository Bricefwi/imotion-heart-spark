import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * Stamp — badge tampon-éditorial inspiré des cartouches de devis/factures imotion.
 * Style mono, uppercase, avec rotation subtile possible. Utilisable comme badge
 * de statut ou label de catégorie.
 *
 * Usage :
 * <Stamp>BÊTA</Stamp>
 * <Stamp tone="amber" rotate>NOUVEAU</Stamp>
 * <Stamp tone="dashed">CACHET & SIGNATURE</Stamp>
 */
interface StampProps {
  children: ReactNode;
  tone?: "coral" | "amber" | "ink" | "dashed";
  rotate?: boolean;
  className?: string;
}

export function Stamp({ children, tone = "coral", rotate = false, className }: StampProps) {
  const variants = {
    coral: {
      border: "1.5px solid hsl(var(--imo-coral-600))",
      color:  "hsl(var(--imo-coral-700))",
      background: "hsl(var(--imo-coral-50))",
    },
    amber: {
      border: "1.5px solid hsl(var(--imo-amber-500))",
      color:  "hsl(var(--imo-amber-700))",
      background: "hsl(var(--imo-amber-50))",
    },
    ink: {
      border: "1.5px solid hsl(var(--imo-ink-900))",
      color:  "hsl(var(--imo-ink-900))",
      background: "transparent",
    },
    dashed: {
      border: "1.5px dashed hsl(var(--imo-coral-600) / 0.6)",
      color:  "hsl(var(--imo-coral-600))",
      background: "hsl(var(--imo-coral-50) / 0.4)",
    },
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded px-2.5 py-1",
        "text-[10px] font-bold uppercase tracking-[0.16em] font-mono whitespace-nowrap",
        rotate && "-rotate-2",
        className
      )}
      style={variants}
    >
      {children}
    </span>
  );
}
