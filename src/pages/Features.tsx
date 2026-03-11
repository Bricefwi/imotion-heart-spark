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
        description="Découvrez comment IMOTION Creator Studio génère votre cahier des charges en 3 étapes : conversation IA guidée, document professionnel, proposition chiffrée."
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
