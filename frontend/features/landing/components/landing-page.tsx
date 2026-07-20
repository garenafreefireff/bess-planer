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
      <main className="pb-16">
        <HeroSection />
        <div className="grid gap-16">
          <WhyChoose />
          <ToolComparison />
          <StepsAndPreview />
          <LogoStrip />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
