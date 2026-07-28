import { ArrowRight, FileText, Layers3, Zap } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ReportEmptyState({ filtered }: { filtered?: boolean }) {
  return (
    <Card className="grid min-h-[360px] place-items-center rounded-xl bg-white p-8 text-center shadow-panel">
      <div className="max-w-xl">
        <div className="mx-auto grid size-20 place-items-center rounded-2xl border border-blue-100 bg-blue-50">
          <div className="relative h-12 w-12">
            <span className="absolute left-1 top-2 block h-9 w-7 rotate-[-8deg] rounded-lg border border-blue-100 bg-white" />
            <span className="absolute left-3 top-1 block h-10 w-8 rounded-lg border border-green-100 bg-white shadow-sm" />
            <FileText className="absolute left-5 top-4 text-brand-blue" size={22} />
          </div>
        </div>
        <h2 className="mt-5 text-xl font-bold text-brand-navy">{filtered ? "Không tìm thấy báo cáo phù hợp" : "Chưa có báo cáo nào"}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
          {filtered
            ? "Thử reset bộ lọc hoặc tìm theo tên dự án, mã báo cáo khác."
            : "Hoàn thành Quick Sizing để nhận báo cáo sơ bộ hoặc tạo dự án Sizing Lab với dữ liệu Load/PV thực tế."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className={buttonVariants({ className: "rounded-lg" })} href="/quick-sizing">
            <Zap size={17} />
            Bắt đầu Quick Sizing
          </Link>
          <Link className={buttonVariants({ variant: "secondary", className: "rounded-lg" })} href="/customer-portal/du-an-cua-toi/tao-du-an">
            <Layers3 size={17} />
            Tạo dự án Sizing Lab
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
