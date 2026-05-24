import { PricingSection } from "@/components/landing/PricingSection";
import { PricingFAQ } from "@/components/landing/PricingFAQ";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Notre approche — CDC gratuit, devis sur mesure"
        description="Le cahier des charges est 100% gratuit. Le devis de réalisation est personnalisé, construit ligne par ligne à partir de votre périmètre réel."
        canonical="/tarifs"
        jsonLd={[
          breadcrumbSchema([
            { name: "Accueil", url: "/" },
            { name: "Notre approche", url: "/tarifs" },
          ]),
        ]}
      />
      <PricingSection />
      <PricingFAQ />
      <CTASection />
    </div>
  );
}
