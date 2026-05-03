import { useEffect } from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { StatsSection } from "@/components/landing/StatsSection";
import { HomeHowItWorks } from "@/components/landing/HomeHowItWorks";
import { MarketingTrackSection } from "@/components/landing/MarketingTrackSection";
import { MiniPreviewCards } from "@/components/landing/MiniPreviewCards";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, organizationSchema, websiteSchema, softwareSchema, faqSchema } from "@/components/SEOHead";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Index() {
  useEffect(() => {
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let rafId: number | null = null;

    try {
      // Dynamic import to avoid SSR/build issues
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
        title="IMOTION Creator Studio — Transformez votre vision en réalité digitale"
        description="Générez gratuitement votre cahier des charges grâce à notre IA conversationnelle. 7 phases de découverte, un CDC professionnel en 45 minutes."
        canonical="/"
        jsonLd={[organizationSchema, websiteSchema, softwareSchema, faqSchema]}
      />
      <ErrorBoundary>
        <HeroSection />
      </ErrorBoundary>
      <TrustBar />
      <StatsSection />
      <HomeHowItWorks />
      <MiniPreviewCards />
      <TestimonialsSection />
      <ErrorBoundary>
        <FAQSection />
      </ErrorBoundary>
      <CTASection />
    </div>
  );
}
