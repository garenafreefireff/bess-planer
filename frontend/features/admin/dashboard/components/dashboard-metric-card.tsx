import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardDelta } from "../data/admin-dashboard.types";
import { formatDelta } from "../data/admin-dashboard-format";

type MetricTone = "blue" | "green" | "purple" | "orange" | "slate";

const toneClasses: Record<MetricTone, string> = {
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-brand-green",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-brand-navy"
};

const deltaClasses: Record<DashboardDelta["direction"], string> = {
  down: "bg-red-50 text-red-600",
  neutral: "bg-slate-100 text-brand-muted",
  new: "bg-blue-50 text-brand-blue",
  up: "bg-green-50 text-brand-green"
};

export type DashboardMetricCardData = {
  delta?: DashboardDelta;
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: MetricTone;
  value: string;
};

export function DashboardMetricCard({ metric }: { metric: DashboardMetricCardData }) {
  const Icon = metric.icon;
  return (
    <Card className="min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-4">
        <span className={cn("grid size-12 place-items-center rounded-full", toneClasses[metric.tone])}>
          <Icon size={24} />
        </span>
        <div className="min-w-0">
          <span className="block text-sm font-bold text-brand-muted">{metric.label}</span>
          <strong className="mt-1 block truncate text-[28px] font-bold leading-none text-brand-navy">{metric.value}</strong>
        </div>
      </div>
      <div className="mt-4 flex min-h-7 flex-wrap items-center gap-2">
        {metric.delta ? (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", deltaClasses[metric.delta.direction])}>
            {formatDelta(metric.delta)}
          </span>
        ) : null}
        <span className="text-xs font-semibold leading-5 text-brand-muted">{metric.detail}</span>
      </div>
    </Card>
  );
}
