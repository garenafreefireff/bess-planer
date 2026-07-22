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
      <main className="overflow-hidden">
        <HeroSection />
        <div className="border-y border-brand-line/80 bg-slate-50/70 py-14 max-sm:py-10">
          <div className="site-container grid grid-cols-[0.88fr_1.12fr] gap-6 max-xl:grid-cols-1">
            <WhyChoose />
            <ToolComparison />
          </div>
        </div>
        <StepsAndPreview />
        <LogoStrip />
      </main>
      <PublicFooter />
    </>
  );
}
