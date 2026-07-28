import { CheckCircle2, Clock3, FileText, FolderOpen, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportKpiItem } from "../data/report.types";

const kpiIcons: Record<ReportKpiItem["id"], LucideIcon> = {
  total: FileText,
  ready: CheckCircle2,
  processing: Clock3,
  projects: FolderOpen
};

const kpiToneClasses: Record<ReportKpiItem["tone"], string> = {
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-brand-green",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700"
};

export function ReportSummaryStrip({ items }: { items: ReportKpiItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {items.map((item) => {
        const Icon = kpiIcons[item.id];
        return (
          <Card className="rounded-xl bg-white p-4 shadow-panel" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">{item.label}</p>
                <strong className="mt-2 block text-2xl font-bold leading-none text-brand-navy">{item.value}</strong>
              </div>
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", kpiToneClasses[item.tone])}>
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-xs font-medium leading-5 text-brand-muted">{item.detail}</p>
          </Card>
        );
      })}
    </div>
  );
}
