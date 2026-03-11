import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { MiniPreviewCards } from "@/components/landing/MiniPreviewCards";
import { CTASection } from "@/components/landing/CTASection";

export default function Index() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <StatsSection />
      <MiniPreviewCards />
      <CTASection />
    </div>
  );
}
