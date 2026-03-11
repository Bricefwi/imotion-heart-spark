import { PricingSection } from "@/components/landing/PricingSection";
import { PricingFAQ, faqs } from "@/components/landing/PricingFAQ";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

// JSON-LD FAQPage schema for SEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
};

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      {/* JSON-LD FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PricingSection />
      <PricingFAQ />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
