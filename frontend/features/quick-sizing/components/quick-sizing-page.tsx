import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { QuickSizingContent } from "./quick-sizing-content";

export function QuickSizingPage() {
  return (
    <>
      <PublicHeader activeItem="Quick Sizing" />
      <main>
        <QuickSizingContent />
      </main>
      <PublicFooter />
    </>
  );
}
