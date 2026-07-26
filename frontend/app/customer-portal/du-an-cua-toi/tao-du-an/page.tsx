import { Suspense } from "react";
import { BessPlannerProjectWizard } from "@/features/bess-planner/components/bess-planner-project-wizard";

export default function PortalCreateBessPlannerProjectRoute() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm font-semibold text-brand-muted">Đang tải trình tạo dự án...</div>}>
      <BessPlannerProjectWizard />
    </Suspense>
  );
}
