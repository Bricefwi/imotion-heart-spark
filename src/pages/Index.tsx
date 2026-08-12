import { useEffect } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { ConstatReponseSection } from "@/components/landing/ConstatReponseSection";
import { HowItWorksImotion } from "@/components/landing/HowItWorksImotion";
import { CTASectionImotion } from "@/components/landing/CTASectionImotion";
import { FAQSection } from "@/components/landing/FAQSection";
import { SEOHead, organizationSchema, websiteSchema, softwareSchema, faqSchema } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Index() {
  useEffect(() => {
    // Accessibilité : pas de smooth-scroll forcé si l'utilisateur préfère un mouvement réduit.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let rafId: number | null = null;

    import("lenis").then((mod) => {
      const Lenis = mod.default;
      lenis = new Lenis({ duration: 0.9, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      function raf(time: number) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    }).catch((err) => {
      console.warn("Lenis smooth scroll not available:", err);
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return (
    <div className="overflow-hidden">
      <SEOHead
        title="i-MOTION Conseil — Cabinet IA & NoCode pour PME et entrepreneurs"
        description="Cadrez, concevez et déployez vos projets digitaux, IA et NoCode. Méthode structurée, consultants spécialisés, validation humaine à chaque étape. Diagnostic gratuit."
        canonical="/"
        jsonLd={[organizationSchema, websiteSchema, softwareSchema, faqSchema]}
      />
      <ErrorBoundary>
        <HeroSection />
      </ErrorBoundary>
      <HowItWorksImotion />
      <ConstatReponseSection />
      <ErrorBoundary>
        <FAQSection />
      </ErrorBoundary>
      <CTASectionImotion />
    </div>
  );
}
