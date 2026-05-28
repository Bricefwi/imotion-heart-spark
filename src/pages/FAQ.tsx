import { PricingFAQ } from "@/components/landing/PricingFAQ";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function FAQ() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="FAQ — Questions fréquentes"
        description="Réponses aux questions fréquentes sur i-MOTION Conseil : audit gratuit, cahier des charges, diagnostic IA & NoCode, accompagnement et missions."
        canonical="/faq"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "FAQ", url: "/faq" },
        ])}
      />
      <PricingFAQ />
      <CTASection />
    </div>
  );
}
