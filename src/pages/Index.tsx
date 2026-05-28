import { useEffect } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksImotion } from "@/components/landing/HowItWorksImotion";
import { DocumentsPreview } from "@/components/landing/DocumentsPreview";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASectionImotion } from "@/components/landing/CTASectionImotion";
import { FAQSection } from "@/components/landing/FAQSection";
import { SEOHead, organizationSchema, websiteSchema, softwareSchema, faqSchema } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Index() {
  useEffect(() => {
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let rafId: number | null = null;

    try {
      import("lenis").then((mod) => {
        const Lenis = mod.default;
        lenis = new Lenis({ duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        function raf(time: number) {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);
      }).catch((err) => {
        console.warn("Lenis smooth scroll not available:", err);
      });
    } catch (err) {
      console.warn("Lenis init error:", err);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return (
    <div className="overflow-hidden">
      <SEOHead
        title="i-MOTION Conseil — Cabinet de conseil IA & NoCode"
        description="Cabinet de conseil IA & NoCode augmenté par des agents IA. Audit gratuit, cahier des charges, diagnostic et accompagnement sur mesure pour vos projets digitaux."
        canonical="/"
        jsonLd={[organizationSchema, websiteSchema, softwareSchema, faqSchema]}
      />
      <ErrorBoundary>
        <HeroSection />
      </ErrorBoundary>
      <HowItWorksImotion />
      <DocumentsPreview />
      <PricingSection />
      <ErrorBoundary>
        <FAQSection />
      </ErrorBoundary>
      <CTASectionImotion />
    </div>
  );
}
