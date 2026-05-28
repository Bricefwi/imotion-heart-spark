import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, breadcrumbSchema, softwareSchema } from "@/components/SEOHead";

export default function Features() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Fonctionnalités — IA conversationnelle & CDC automatique"
        description="Découvrez comment i-MOTION Conseil structure votre projet : audit conversationnel, cahier des charges, diagnostic IA & NoCode, proposition personnalisée."
        canonical="/fonctionnalites"
        jsonLd={[
          softwareSchema,
          breadcrumbSchema([
            { name: "Accueil", url: "/" },
            { name: "Fonctionnalités", url: "/fonctionnalites" },
          ]),
        ]}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
