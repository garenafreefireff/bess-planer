import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { QuickSizingAssumptionFlow } from "./quick-sizing-assumption-flow";

export function QuickSizingAssumptionPage() {
  return (
    <>
      <PublicHeader activeItem="Quick Sizing" />
      <main>
        <QuickSizingAssumptionFlow />
      </main>
      <PublicFooter />
    </>
  );
}
