import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
/**
 * Variants:
 * - "flux"     → NOUVEAU logo officiel (wordmark "imotion", flèche-i gradient). Direction C.
 * - "chevrons" / "spark" / "flame" → anciennes directions, conservées pour rétro-compat.
 */
type LogoVariant = "flux" | "chevrons" | "spark" | "flame";
type LogoTone = "auto" | "light" | "dark" | "mono";

interface LogoProps {
  size?: LogoSize;
  /** Affiche le sous-titre "Creator Studio" à droite du wordmark. */
  showText?: boolean;
  /**
   * Réduit le logo à la marque seule (flèche), sans le mot "motion".
   * Idéal pour sidebar collapsée, favicon, mobile compact.
   * Par défaut, déduit de !showText pour les variants legacy uniquement.
   */
  markOnly?: boolean;
  variant?: LogoVariant;
  tone?: LogoTone;
  className?: string;
  /**
   * Override du libellé accessible. Par défaut :
   * - "IMOTION Creator Studio" si showText
   * - "IMOTION" sinon
   */
  ariaLabel?: string;
  /**
   * Si true, masque entièrement le logo aux lecteurs d'écran (utile lorsqu'il
   * est imbriqué dans un lien ou bouton qui porte déjà son propre libellé).
   */
  decorative?: boolean;
}

/* ---------- Sizing ---------- */

// Pour les variantes "mark only" (chevrons / spark / flame)
const markSizeMap: Record<LogoSize, { mark: string; text: string; sub: string; gap: string }> = {
  xs: { mark: "h-6 w-6", text: "text-base", sub: "text-[9px]", gap: "gap-1.5" },
  sm: { mark: "h-8 w-8", text: "text-lg", sub: "text-[10px]", gap: "gap-2" },
  md: { mark: "h-10 w-10", text: "text-xl", sub: "text-[11px]", gap: "gap-2.5" },
  lg: { mark: "h-14 w-14", text: "text-3xl", sub: "text-xs", gap: "gap-3" },
  xl: { mark: "h-20 w-20", text: "text-5xl", sub: "text-sm", gap: "gap-4" },
};

// Pour le wordmark "flux" (hauteur du SVG, qui inclut déjà le texte "motion")
// Hauteur responsive : plus petit en mobile, valeur cible en md+ pour éviter l'écrasement.
const fluxSizeMap: Record<LogoSize, { wordmark: string; sub: string; gap: string; subGap: string }> = {
  xs: { wordmark: "h-4 sm:h-5",        sub: "text-[8px]",            gap: "gap-1.5 sm:gap-2",   subGap: "ml-2" },
  sm: { wordmark: "h-5 sm:h-6",        sub: "text-[9px]",            gap: "gap-2 sm:gap-2.5",   subGap: "ml-2.5" },
  md: { wordmark: "h-6 sm:h-7 md:h-8", sub: "text-[10px]",           gap: "gap-2 sm:gap-3",     subGap: "ml-3" },
  lg: { wordmark: "h-8 sm:h-10 md:h-12", sub: "text-[10px] md:text-xs", gap: "gap-3 md:gap-4",   subGap: "ml-4" },
  xl: { wordmark: "h-10 sm:h-12 md:h-16", sub: "text-xs md:text-sm", gap: "gap-3 md:gap-5",     subGap: "ml-5" },
};

/* ---------- NEW: Flux wordmark (Direction C) ---------- */
/**
 * Wordmark "imotion" où le "i" est remplacé par une flèche verticale
 * avec gradient orange→rouge (Stripe / Resend / Ramp style).
 * ViewBox basé sur la hauteur (40), largeur auto-ajustée par les glyphes.
 */
function WordmarkFlux({
  tone,
  id,
  markOnly = false,
}: {
  tone: LogoTone;
  id: string;
  markOnly?: boolean;
}) {
  const wordColor =
    tone === "light" ? "#FFFFFF"
    : tone === "dark" ? "#0F0D0B"
    : tone === "mono" ? "currentColor"
    : "currentColor";

  const useGradient = tone !== "mono";
  const arrowFill = useGradient ? `url(#${id}-arrow)` : "currentColor";

  // Square viewBox for mark-only (favicon / collapsed sidebar)
  const viewBox = markOnly ? "0 0 28 56" : "0 0 220 56";

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="h-full w-auto"
    >
      <defs>
        <linearGradient id={`${id}-arrow`} x1="0" y1="56" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D63B1A" />
          <stop offset="55%" stopColor="#EE6B1F" />
          <stop offset="100%" stopColor="#F5A524" />
        </linearGradient>
      </defs>

      {/* ---- Flèche verticale qui remplace le "i" ---- */}
      <g>
        <circle cx="14" cy="52" r="2.6" fill={arrowFill} />
        <rect x="11.4" y="14" width="5.2" height="32" rx="1.2" fill={arrowFill} />
        <path
          d="M14 4 L23.5 16.5 L18 16.5 L18 20 L10 20 L10 16.5 L4.5 16.5 Z"
          fill={arrowFill}
        />
      </g>

      {!markOnly && (
        <text
          x="30"
          y="46"
          fontFamily='"General Sans", "Inter", system-ui, -apple-system, sans-serif'
          fontWeight="700"
          fontSize="44"
          letterSpacing="-1.5"
          fill={wordColor}
        >
          motion
        </text>
      )}
    </svg>
  );
}

/* ---------- Legacy marks (kept for backward compat) ---------- */

function MarkChevrons({ tone }: { tone: LogoTone }) {
  const useMono = tone === "mono";
  const c1 = useMono ? "currentColor" : "#2A2622";
  const c2 = useMono ? "currentColor" : "#D63B1A";
  const c3 = useMono ? "currentColor" : "#F08A00";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M5 8 L18 20 L5 32" stroke={c1} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8 L27 20 L14 32" stroke={c2} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 8 L36 20 L23 32" stroke={c3} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarkSpark({ tone, id }: { tone: LogoTone; id: string }) {
  const useMono = tone === "mono";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D63B1A" />
          <stop offset="100%" stopColor="#F08A00" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="35" height="35" rx="9" fill={useMono ? "currentColor" : `url(#${id}-g)`} />
      <rect x="17.5" y="9" width="5" height="17" rx="2" fill={tone === "dark" ? "#0F0D0B" : "#FFFFFF"} />
      <circle cx="20" cy="30.5" r="2.5" fill={tone === "dark" ? "#0F0D0B" : "#FFFFFF"} />
    </svg>
  );
}

function MarkFlame({ tone, id }: { tone: LogoTone; id: string }) {
  const useMono = tone === "mono";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-flame`} x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F24E2A" />
          <stop offset="60%" stopColor="#F08A00" />
          <stop offset="100%" stopColor="#FFC04D" />
        </linearGradient>
      </defs>
      <path
        d="M21.4 4.2c-.6 4.4-3.5 6.4-6 9.2-3.4 3.7-5.4 7.3-5.4 11.6C10 31.4 14.5 36 20.2 36c5.7 0 10.2-4.5 10.2-10.4 0-4-1.6-7.1-4-9.4 1.4 3.6.5 6.4-1.6 7.4 1.1-3.4-.3-7-2.6-9.5-2.1-2.3-3.2-5.8-.8-9.9z"
        fill={useMono ? "currentColor" : `url(#${id}-flame)`}
      />
      <path
        d="M19 22c-.6 2.4 0 4.6 1.6 5.6.6.4 1.4.4 1.9-.1.9-.9.6-2.4-.4-3.5-.9-1-1.6-1.3-3.1-2z"
        fill={tone === "dark" ? "#0F0D0B" : "#FFFFFF"}
        fillOpacity="0.85"
      />
    </svg>
  );
}

/* ---------- Component ---------- */

export function Logo({
  size = "md",
  showText = false,
  markOnly,
  variant = "flux", // ← NOUVEAU défaut : wordmark Flux
  tone = "auto",
  className,
  ariaLabel,
  decorative = false,
}: LogoProps) {
  const uid = `logo-${variant}`;

  // Libellé accessible global (porté par le conteneur, le SVG reste aria-hidden).
  const computedLabel =
    ariaLabel ??
    (markOnly
      ? "IMOTION"
      : showText
        ? "i-MOTION Conseil"
        : "IMOTION");

  // a11y attrs partagés
  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": computedLabel };

  // Sub-label color (Creator Studio)
  // Mode mono : on garde le contraste du contexte (currentColor) sans diminuer
  // l'opacité, qui peut faire chuter le ratio sous 4.5:1 sur fond clair.
  const subColor =
    tone === "light" ? "text-white/80"
    : tone === "mono" ? "text-current"
    : "text-primary"; // accent coral pour matcher la maquette

  /* ---------- Variant FLUX (nouveau logo officiel) ---------- */
  if (variant === "flux") {
    const s = fluxSizeMap[size];
    return (
      <div
        {...a11yProps}
        className={cn(
          "inline-flex items-center min-w-0 max-w-full",
          // Anneau de focus visible si le Logo est rendu dans un élément focusable
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
          s.gap,
          className
        )}
      >
        <div className={cn("shrink-0", s.wordmark)}>
          <WordmarkFlux tone={tone} id={uid} markOnly={markOnly} />
        </div>
        {showText && !markOnly && (
          <div
            aria-hidden="true"
            className={cn(
              // Caché en < sm pour éviter l'écrasement, visible dès 640px.
              "hidden sm:flex flex-col leading-tight font-display font-semibold uppercase tracking-[0.18em] whitespace-nowrap",
              s.sub,
              subColor,
              "border-l border-current/30 pl-2 sm:pl-3"
            )}
          >
            <span>Cabinet</span>
            <span>Conseil</span>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Legacy variants ---------- */
  const s = markSizeMap[size];
  const textColor = tone === "light" ? "text-white" : "text-foreground";

  return (
    <div
      {...a11yProps}
      className={cn(
        "inline-flex items-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
        s.gap,
        className
      )}
    >
      <div className={cn("shrink-0", s.mark)}>
        {variant === "chevrons" && <MarkChevrons tone={tone} />}
        {variant === "spark" && <MarkSpark tone={tone} id={uid} />}
        {variant === "flame" && <MarkFlame tone={tone} id={uid} />}
      </div>
      {showText && (
        <div aria-hidden="true" className={cn("flex flex-col leading-none", textColor)}>
          <span className={cn("font-display font-semibold tracking-tight", s.text)}>
            IMOTION
          </span>
          <span
            className={cn(
              "font-display uppercase tracking-[0.22em] text-muted-foreground mt-0.5",
              s.sub
            )}
          >
            Conseil
          </span>
        </div>
      )}
    </div>
  );
}
