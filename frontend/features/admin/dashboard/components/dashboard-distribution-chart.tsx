import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCount, formatPercent } from "../data/admin-dashboard-format";
import type { DistributionItem } from "../data/admin-dashboard.types";
import { DashboardEmptyState } from "./dashboard-empty-state";

type DistributionTone = "blue" | "green" | "purple" | "orange" | "yellow" | "red";

const toneColors: Record<DistributionTone, string> = {
  blue: "#075BEA",
  green: "#0CA34B",
  orange: "#FF8A1F",
  purple: "#7C5CFF",
  red: "#EF4444",
  yellow: "#F59E0B"
};

const defaultTones: DistributionTone[] = ["blue", "green", "purple", "orange", "yellow", "red"];

export function DashboardDistributionChart({
  centerLabel,
  centerValue,
  items,
  title
}: {
  centerLabel: string;
  centerValue: number;
  items: DistributionItem[];
  title: string;
}) {
  const hasData = centerValue > 0 && items.some((item) => item.count > 0);
  const gradient = hasData ? buildGradient(items) : "#EEF2F8";

  return (
    <Card className="min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <h2 className="text-base font-bold text-brand-navy">{title}</h2>
      {!hasData ? (
        <div className="mt-4">
          <DashboardEmptyState />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-[180px_minmax(0,1fr)] items-center gap-5 max-sm:grid-cols-1">
          <div className="relative mx-auto grid size-[170px] place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="grid size-[96px] place-items-center rounded-full bg-white text-center shadow-panel">
              <span className="text-xs font-medium text-brand-muted">Tổng</span>
              <strong className="-mt-2 text-xl font-bold text-brand-navy">{formatCount(centerValue)}</strong>
              <small className="-mt-2 text-xs text-brand-muted">{centerLabel}</small>
            </div>
          </div>
          <div className="grid min-w-0 gap-3">
            {items.map((item, index) => {
              const tone = defaultTones[index % defaultTones.length];
              return (
                <div className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-3 text-sm" key={item.key}>
                  <span className="size-3 rounded-full" style={{ backgroundColor: toneColors[tone] }} />
                  <span className="min-w-0 truncate font-semibold text-brand-navy">{item.label}</span>
                  <strong className={cn("text-right text-brand-muted", item.count > 0 && "text-brand-navy")}>
                    {formatCount(item.count)} · {formatPercent(item.percentage)}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function buildGradient(items: DistributionItem[]): string {
  const visibleItems = items.filter((item) => item.count > 0 && item.percentage > 0);
  let cursor = 0;
  return visibleItems.map((item, index) => {
    const color = toneColors[defaultTones[index % defaultTones.length]];
    const end = index === visibleItems.length - 1 ? 100 : Math.min(100, cursor + item.percentage);
    const segment = `${color} ${cursor}% ${end}%`;
    cursor = end;
    return segment;
  }).join(", ");
}
