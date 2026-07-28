import { Database } from "lucide-react";

export function DashboardEmptyState({
  description = "Chưa có dữ liệu trong khoảng thời gian đã chọn.",
  title = "Chưa có dữ liệu"
}: {
  description?: string;
  title?: string;
}) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-brand-line bg-slate-50/70 px-4 py-8 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-brand-muted shadow-sm">
          <Database size={21} />
        </span>
        <strong className="mt-3 block text-sm text-brand-navy">{title}</strong>
        <p className="mt-1 text-sm font-medium text-brand-muted">{description}</p>
      </div>
    </div>
  );
}
