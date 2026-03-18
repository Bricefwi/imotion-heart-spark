import { PricingFAQ } from "@/components/landing/PricingFAQ";
import { CTASection } from "@/components/landing/CTASection";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";

export default function FAQ() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="FAQ — Questions fréquentes"
        description="Retrouvez les réponses aux questions fréquentes sur IMOTION Creator Studio : cahier des charges gratuit, tarifs, processus et accompagnement."
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
