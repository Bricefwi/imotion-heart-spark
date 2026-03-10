import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FloatingPhotoStrip } from "@/components/landing/FloatingPhotoStrip";
import { CTASection } from "@/components/landing/CTASection";

export default function Index() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <FloatingPhotoStrip />
      <CTASection />
    </div>
  );
}
