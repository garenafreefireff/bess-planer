import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { QuickSizingResultContent } from "./quick-sizing-result-content";

export function QuickSizingResultPage() {
  return (
    <>
      <PublicHeader activeItem="Quick Sizing" />
      <main>
        <QuickSizingResultContent />
      </main>
      <PublicFooter />
    </>
  );
}
