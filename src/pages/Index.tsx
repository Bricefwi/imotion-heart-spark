import { useEffect } from "react";
import Lenis from "lenis";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { StatsSection } from "@/components/landing/StatsSection";
import { HomeHowItWorks } from "@/components/landing/HomeHowItWorks";
import { MiniPreviewCards } from "@/components/landing/MiniPreviewCards";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, organizationSchema, websiteSchema, softwareSchema, faqSchema } from "@/components/SEOHead";

export default function Index() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="overflow-hidden">
      <SEOHead
        title="IMOTION Creator Studio — Transformez votre vision en réalité digitale"
        description="Générez gratuitement votre cahier des charges grâce à notre IA conversationnelle. 7 phases de découverte, un CDC professionnel en 45 minutes."
        canonical="/"
        jsonLd={[organizationSchema, websiteSchema, softwareSchema, faqSchema]}
      />
      <HeroSection />
      <TrustBar />
      <StatsSection />
      <HomeHowItWorks />
      <MiniPreviewCards />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
