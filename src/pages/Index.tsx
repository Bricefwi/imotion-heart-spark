import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FloatingPhotoStrip } from "@/components/landing/FloatingPhotoStrip";
import { CTASection } from "@/components/landing/CTASection";

export default function Index() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <FloatingPhotoStrip />
      <CTASection />
    </div>
  );
}
