import { Card } from "@/components/ui/card";
import { DashboardEmptyState } from "./dashboard-empty-state";
import type { GrowthBucket } from "../data/admin-dashboard.types";

type SeriesKey = "new_users" | "new_projects";

const seriesConfig: Array<{ color: string; key: SeriesKey; label: string }> = [
  { color: "#075BEA", key: "new_users", label: "Người dùng mới" },
  { color: "#0CA34B", key: "new_projects", label: "Dự án mới" }
];

export function DashboardGrowthChart({ series }: { series: GrowthBucket[] }) {
  const hasData = series.some((bucket) => bucket.new_users > 0 || bucket.new_projects > 0);
  const maxValue = Math.max(...series.flatMap((bucket) => [bucket.new_users, bucket.new_projects]), 0);

  return (
    <Card className="min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-brand-navy">Tăng trưởng dữ liệu hệ thống</h2>
          <p className="mt-1 text-sm font-medium text-brand-muted">Người dùng mới và dự án mới theo khoảng thời gian đã chọn.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-bold text-brand-muted">
          {seriesConfig.map((item) => (
            <span className="inline-flex items-center gap-2" key={item.key}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      {!hasData ? (
        <DashboardEmptyState description="Chưa có người dùng hoặc dự án mới trong kỳ." />
      ) : (
        <GrowthSvg maxValue={maxValue} series={series} />
      )}
    </Card>
  );
}

function GrowthSvg({ maxValue, series }: { maxValue: number; series: GrowthBucket[] }) {
  const width = 760;
  const height = 280;
  const padding = { bottom: 42, left: 46, right: 24, top: 24 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) => {
    if (series.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (series.length - 1)) * plotWidth;
  };
  const yFor = (value: number) => {
    if (maxValue <= 0) return padding.top + plotHeight;
    return padding.top + plotHeight - (value / maxValue) * plotHeight;
  };
  const labelStep = Math.max(1, Math.ceil(series.length / 6));

  return (
    <div className="w-full min-w-0">
      <svg className="h-[320px] w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ tăng trưởng dữ liệu hệ thống">
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = padding.top + (tick / 4) * plotHeight;
          return <line key={tick} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#E5EDF8" />;
        })}
        {seriesConfig.map((config) => {
          const points = series.map((bucket, index) => ({
            label: bucket.label,
            value: bucket[config.key],
            x: xFor(index),
            y: yFor(bucket[config.key])
          }));
          const path = points.map((point) => `${point.x},${point.y}`).join(" ");
          return (
            <g key={config.key}>
              <polyline fill="none" points={path} stroke={config.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              {points.map((point) => (
                <circle cx={point.x} cy={point.y} fill="white" key={`${config.key}-${point.label}`} r="4.5" stroke={config.color} strokeWidth="3">
                  <title>{`${config.label} · ${point.label}: ${point.value}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {series.map((bucket, index) => {
          if (index !== 0 && index !== series.length - 1 && index % labelStep !== 0) return null;
          return (
            <text className="fill-brand-muted text-[10px] font-semibold" key={bucket.period_start} textAnchor="middle" x={xFor(index)} y={height - 12}>
              {bucket.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
