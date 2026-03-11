import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";

export default function Features() {
  return (
    <div className="overflow-hidden">
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
