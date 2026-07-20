import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ComparisonHero } from "./comparison-hero";
import { ComparisonMatrix } from "./comparison-matrix";
import { ComparisonProcess } from "./comparison-process";

export function ToolComparisonPage() {
  return (
    <>
      <PublicHeader activeItem="So sánh công cụ" />
      <main className="pb-3">
        <ComparisonHero />
        <ComparisonMatrix />
        <ComparisonProcess />
      </main>
      <PublicFooter />
    </>
  );
}
