import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { QuickSizingAssumptionContent } from "./quick-sizing-assumption-content";

export function QuickSizingAssumptionPage() {
  return (
    <>
      <PublicHeader activeItem="Quick Sizing" />
      <main>
        <QuickSizingAssumptionContent />
      </main>
      <PublicFooter />
    </>
  );
}
