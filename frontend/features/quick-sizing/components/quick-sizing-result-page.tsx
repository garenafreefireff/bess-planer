import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { QuickSizingResultFlow } from "./quick-sizing-result-flow";

export function QuickSizingResultPage() {
  return (
    <>
      <PublicHeader activeItem="Quick Sizing" />
      <main>
        <QuickSizingResultFlow />
      </main>
      <PublicFooter />
    </>
  );
}
