/**
 * CrossAppTransition — overlay de transition lente et subtile lors du basculement
 * entre les deux univers visuels (BUILD ⇄ MARKETING).
 *
 * - Détecte le changement de branche via le pathname (`/marketing/*` vs autres).
 * - Affiche un voile dégradé (flame) qui fade in/out doucement (~700ms).
 * - Préserve la lisibilité du contenu pendant la bascule (pas de flash, pas de
 *   reflow). Pointer-events désactivés pour ne jamais bloquer l'utilisateur.
 * - Respecte `prefers-reduced-motion`.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

type Branch = "build" | "marketing";

function getBranch(pathname: string): Branch {
  return pathname.startsWith("/marketing") ? "marketing" : "build";
}

export function CrossAppTransition() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const branchRef = useRef<Branch>(getBranch(pathname));
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const next = getBranch(pathname);
    if (next === branchRef.current) return;
    branchRef.current = next;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Reset timers
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    setVisible(true);
    timersRef.current.push(
      window.setTimeout(() => setVisible(false), 700),
    );

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, hsl(var(--primary) / 0.18) 0%, hsl(var(--secondary) / 0.10) 45%, transparent 75%)",
        backdropFilter: visible ? "blur(2px) saturate(1.05)" : "none",
        WebkitBackdropFilter: visible ? "blur(2px) saturate(1.05)" : "none",
      }}
    />
  );
}
