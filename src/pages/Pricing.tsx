import { PricingSection } from "@/components/landing/PricingSection";
import { PricingFAQ } from "@/components/landing/PricingFAQ";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      <PricingSection />
      <PricingFAQ />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
