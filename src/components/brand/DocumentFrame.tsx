import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * DocumentFrame — wrapper qui met en scène un livrable comme un vrai document
 * (devis, CDC, facture). Reprend les codes des documents commerciaux imotion :
 * - Bande coral en haut (ruban d'identité)
 * - Surface paper-gradient
 * - Numéro de série mono en haut à droite
 * - Étiquette de type (DEVIS / CDC / FACTURE) en haut à gauche
 *
 * Usage :
 * <DocumentFrame docType="CDC" reference="CDC-2026-0142" date="03 mai 2026">
 *   ... contenu du doc ...
 * </DocumentFrame>
 */
interface DocumentFrameProps {
  docType?: string;
  reference?: string;
  date?: string;
  status?: string;
  ribbon?: "coral" | "amber" | "ember";
  children?: ReactNode;
  className?: string;
}

export function DocumentFrame({
  docType,
  reference,
  date,
  status,
  ribbon = "coral",
  children,
  className,
}: DocumentFrameProps) {
  const ribbonStyles = {
    coral:  { background: "var(--imo-gradient-coral)" },
    amber:  { background: "var(--imo-gradient-flame)" },
    ember:  { background: "var(--imo-gradient-ember)" },
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden",
        className
      )}
      style={{
        background: "var(--imo-gradient-paper)",
        border: "1px solid hsl(var(--imo-border))",
        boxShadow: "var(--imo-shadow-lg)",
      }}
    >
      {/* Ribbon top */}
      <div className="h-1.5 w-full" style={ribbonStyles[ribbon]} aria-hidden />

      {/* Header */}
      {(docType || reference || date || status) && (
        <div className="px-6 pt-5 pb-3 flex items-start justify-between border-b" style={{ borderColor: "hsl(var(--imo-ink-100))" }}>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-[2px] rounded-full" style={{ background: "hsl(var(--imo-coral-600))" }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] font-mono" style={{ color: "hsl(var(--imo-fg))" }}>
              imotion <span style={{ color: "hsl(var(--imo-coral-600))" }}>creator</span>
            </span>
          </div>
          <div className="text-right">
            {docType && (
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] font-mono" style={{ color: "hsl(var(--imo-coral-600))" }}>
                {docType}
              </div>
            )}
            {reference && (
              <div className="text-[10px] font-mono mt-0.5 tabular-nums" style={{ color: "hsl(var(--imo-fg-muted))" }}>
                {reference}
              </div>
            )}
            {date && (
              <div className="text-[10px] font-mono" style={{ color: "hsl(var(--imo-fg-subtle))" }}>
                {date}
              </div>
            )}
            {status && (
              <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ background: "hsl(var(--imo-success-500) / 0.12)", color: "hsl(var(--imo-success-500))" }}
              >
                {status}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
