import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { MiniPreviewCards } from "@/components/landing/MiniPreviewCards";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, organizationSchema, websiteSchema, softwareSchema } from "@/components/SEOHead";

export default function Index() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="IMOTION Creator Studio — Transformez votre vision en réalité digitale"
        description="Générez gratuitement votre cahier des charges grâce à notre IA conversationnelle. 7 phases de découverte, un CDC professionnel en 45 minutes."
        canonical="/"
        jsonLd={[organizationSchema, websiteSchema, softwareSchema]}
      />
      <HeroSection />
      <StatsSection />
      <MiniPreviewCards />
      <CTASection />
    </div>
  );
}
