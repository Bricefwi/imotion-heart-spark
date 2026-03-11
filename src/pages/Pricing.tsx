import { PricingSection } from "@/components/landing/PricingSection";
import { PricingAIAgent } from "@/components/landing/PricingAIAgent";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Tarifs — CDC gratuit, réalisation sur-mesure"
        description="Cahier des charges 100% gratuit. Projets BUILD à partir de 5 000€. Maintenance RUN à 399€/mois. Découvrez nos tarifs transparents."
        canonical="/tarifs"
        jsonLd={[
          breadcrumbSchema([
            { name: "Accueil", url: "/" },
            { name: "Tarifs", url: "/tarifs" },
          ]),
        ]}
      />
      <PricingSection />
      <PricingAIAgent />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
