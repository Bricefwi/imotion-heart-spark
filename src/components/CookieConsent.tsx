import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  // Reserve space at the bottom of the page so the banner never covers
  // sticky CTAs / floating buttons / mobile nav. Exposes the banner height
  // as a CSS variable so other fixed elements can offset themselves with
  // `bottom: calc(<their-offset> + var(--cookie-banner-h, 0px))`.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.setProperty("--cookie-banner-h", "0px");
      document.body.style.removeProperty("padding-bottom");
      return;
    }
    const update = () => {
      const h = ref.current?.offsetHeight ?? 0;
      root.style.setProperty("--cookie-banner-h", `${h}px`);
      // Push the page content up so the banner doesn't sit on top of CTAs.
      document.body.style.paddingBottom = `calc(${h}px + env(safe-area-inset-bottom, 0px))`;
    };
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      root.style.setProperty("--cookie-banner-h", "0px");
      document.body.style.removeProperty("padding-bottom");
    };
  }, [visible]);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem("cookie-consent", "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{
        paddingTop: "1rem",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <p className="text-sm text-muted-foreground flex-1 text-center sm:text-left">
          Ce site utilise des cookies et le stockage local pour améliorer votre expérience.
          En continuant, vous acceptez notre{" "}
          <a href="/cookies" className="underline text-primary">politique de cookies</a>.
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={refuse} className="flex-1 sm:flex-none">
            Refuser
          </Button>
          <Button size="sm" onClick={accept} className="flex-1 sm:flex-none">
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
