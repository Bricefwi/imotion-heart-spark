import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Pricing() {
  return (
    <div className="overflow-hidden">
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}
