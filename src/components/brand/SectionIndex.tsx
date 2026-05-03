import { cn } from "@/lib/utils";

/**
 * SectionIndex — marqueur de section style éditorial "01 — Titre".
 * Signature imotion observée dans les guidelines ("04 — Documents commerciaux").
 *
 * Usage :
 * <SectionIndex number="01" label="Comment ça marche" />
 * <SectionIndex number="04" label="Documents commerciaux" tone="light" />
 */
interface SectionIndexProps {
  number: string | number;
  label: string;
  tone?: "default" | "light";
  className?: string;
}

export function SectionIndex({ number, label, tone = "default", className }: SectionIndexProps) {
  const styles = {
    default: {
      number: "hsl(var(--imo-coral-600))",
      dash:   "hsl(var(--imo-ink-300))",
      label:  "hsl(var(--imo-fg-muted))",
    },
    light: {
      number: "hsl(var(--imo-coral-400))",
      dash:   "hsl(var(--imo-ink-700))",
      label:  "hsl(var(--imo-ink-300))",
    },
  }[tone];

  const num = typeof number === "number" ? String(number).padStart(2, "0") : number;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.12em]",
        className
      )}
    >
      <span className="font-bold tabular-nums" style={{ color: styles.number }}>
        {num}
      </span>
      <span aria-hidden style={{ color: styles.dash }}>—</span>
      <span style={{ color: styles.label }}>{label}</span>
    </div>
  );
}
