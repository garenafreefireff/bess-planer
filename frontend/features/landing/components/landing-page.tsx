import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { HeroSection } from "./hero-section";
import { LogoStrip } from "./logo-strip";
import { StepsAndPreview } from "./steps-and-preview";
import { ToolComparison } from "./tool-comparison";
import { WhyChoose } from "./why-choose";

export function LandingPage() {
  return (
    <>
      <PublicHeader activeItem="Giới thiệu" />
      <main className="overflow-hidden bg-white">
        <HeroSection />
        <div className="site-container grid grid-cols-[1fr_1fr] gap-4 pb-4 max-xl:grid-cols-1">
          <WhyChoose />
          <ToolComparison />
        </div>
        <StepsAndPreview />
        <LogoStrip />
      </main>
      <PublicFooter />
    </>
  );
}
