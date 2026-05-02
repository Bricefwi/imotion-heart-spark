import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoVariant = "chevrons" | "spark" | "flame";
type LogoTone = "auto" | "light" | "dark" | "mono";

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  variant?: LogoVariant;
  tone?: LogoTone;
  className?: string;
}

const sizeMap: Record<LogoSize, { mark: string; text: string; sub: string; gap: string }> = {
  xs: { mark: "h-6 w-6", text: "text-base", sub: "text-[9px]", gap: "gap-1.5" },
  sm: { mark: "h-8 w-8", text: "text-lg", sub: "text-[10px]", gap: "gap-2" },
  md: { mark: "h-10 w-10", text: "text-xl", sub: "text-[11px]", gap: "gap-2.5" },
  lg: { mark: "h-14 w-14", text: "text-3xl", sub: "text-xs", gap: "gap-3" },
  xl: { mark: "h-20 w-20", text: "text-5xl", sub: "text-sm", gap: "gap-4" },
};

/* ---------- Mark variants (each rendered in a 40x40 viewBox) ---------- */

function MarkChevrons({ tone }: { tone: LogoTone }) {
  const useMono = tone === "mono";
  const c1 = useMono ? "currentColor" : "#2A2622";
  const c2 = useMono ? "currentColor" : "#D63B1A";
  const c3 = useMono ? "currentColor" : "#F08A00";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 8 L18 20 L5 32" stroke={c1} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8 L27 20 L14 32" stroke={c2} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 8 L36 20 L23 32" stroke={c3} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarkSpark({ tone, id }: { tone: LogoTone; id: string }) {
  const useMono = tone === "mono";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D63B1A" />
          <stop offset="100%" stopColor="#F08A00" />
        </linearGradient>
      </defs>
      {/* Rounded square frame */}
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        rx="9"
        fill={useMono ? "currentColor" : `url(#${id}-g)`}
      />
      {/* "I" stem */}
      <rect x="17.5" y="9" width="5" height="17" rx="2" fill={tone === "dark" ? "#0F0D0B" : "#FFFFFF"} />
      {/* Spark dot */}
      <circle cx="20" cy="30.5" r="2.5" fill={tone === "dark" ? "#0F0D0B" : "#FFFFFF"} />
    </svg>
  );
}

function MarkFlame({ tone, id }: { tone: LogoTone; id: string }) {
  const useMono = tone === "mono";
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-flame`} x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F24E2A" />
          <stop offset="60%" stopColor="#F08A00" />
          <stop offset="100%" stopColor="#FFC04D" />
        </linearGradient>
      </defs>
      {/* Flame silhouette — organic, asymmetrical */}
      <path
        d="M21.4 4.2c-.6 4.4-3.5 6.4-6 9.2-3.4 3.7-5.4 7.3-5.4 11.6C10 31.4 14.5 36 20.2 36c5.7 0 10.2-4.5 10.2-10.4 0-4-1.6-7.1-4-9.4 1.4 3.6.5 6.4-1.6 7.4 1.1-3.4-.3-7-2.6-9.5-2.1-2.3-3.2-5.8-.8-9.9z"
        fill={useMono ? "currentColor" : `url(#${id}-flame)`}
      />
      {/* Inner highlight */}
      <path
        d="M19 22c-.6 2.4 0 4.6 1.6 5.6.6.4 1.4.4 1.9-.1.9-.9.6-2.4-.4-3.5-.9-1-1.6-1.3-3.1-2z"
        fill={tone === "dark" ? "#0F0D0B" : "#FFFFFF"}
        fillOpacity="0.85"
      />
    </svg>
  );
}

export function Logo({
  size = "md",
  showText = false,
  variant = "chevrons",
  tone = "auto",
  className,
}: LogoProps) {
  const s = sizeMap[size];
  const uid = `logo-${variant}`;

  // Auto tone follows current foreground (works on light & dark layouts)
  const textColor = tone === "dark" ? "text-foreground" : tone === "light" ? "text-white" : "text-foreground";

  return (
    <div className={cn("inline-flex items-center", s.gap, className)}>
      <div className={cn("shrink-0", s.mark)}>
        {variant === "chevrons" && <MarkChevrons tone={tone} />}
        {variant === "spark" && <MarkSpark tone={tone} id={uid} />}
        {variant === "flame" && <MarkFlame tone={tone} id={uid} />}
      </div>
      {showText && (
        <div className={cn("flex flex-col leading-none", textColor)}>
          <span
            className={cn(
              "font-display font-semibold tracking-tight",
              s.text
            )}
          >
            IMOTION
          </span>
          <span
            className={cn(
              "font-display uppercase tracking-[0.22em] text-muted-foreground mt-0.5",
              s.sub
            )}
          >
            Creator Studio
          </span>
        </div>
      )}
    </div>
  );
}
