import { PricingSection } from "@/components/landing/PricingSection";
import { OffersSection } from "@/components/landing/OffersSection";
import { PricingFAQ } from "@/components/landing/PricingFAQ";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Tarifs & offres — i-MOTION Conseil"
        description="Audit et cahier des charges gratuits. Trois niveaux d'accompagnement (Diagnostic, Conseil, Build & Run), chiffrés sur la base de votre périmètre réel."
        canonical="/tarifs"
        jsonLd={[
          breadcrumbSchema([
            { name: "Accueil", url: "/" },
            { name: "Tarifs", url: "/tarifs" },
          ]),
        ]}
      />
      <PricingSection />
      <OffersSection />
      <PricingFAQ />
      <CTASection />
    </div>
  );
}
