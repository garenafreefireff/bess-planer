import { BarChart3, CloudUpload, Folder, UserCheck, Users } from "lucide-react";

import {
  formatBytes,
  formatCount
} from "../data/admin-dashboard-format";
import type { DashboardMetrics } from "../data/admin-dashboard.types";
import { DashboardMetricCard, type DashboardMetricCardData } from "./dashboard-metric-card";

export function DashboardMetricGrid({ metrics }: { metrics: DashboardMetrics }) {
  const cards: DashboardMetricCardData[] = [
    {
      delta: metrics.total_users.delta,
      detail: `${formatCount(metrics.total_users.period_value)} tài khoản mới trong kỳ`,
      icon: Users,
      label: "Tổng tài khoản",
      tone: "blue",
      value: formatCount(metrics.total_users.value)
    },
    {
      detail: `${formatCount(metrics.active_accounts.secondary_value)} ${metrics.active_accounts.secondary_label.toLowerCase()}`,
      icon: UserCheck,
      label: "Tài khoản đang hoạt động",
      tone: "green",
      value: formatCount(metrics.active_accounts.value)
    },
    {
      delta: metrics.total_projects.delta,
      detail: `${formatCount(metrics.total_projects.period_value)} dự án mới trong kỳ`,
      icon: Folder,
      label: "Tổng dự án",
      tone: "purple",
      value: formatCount(metrics.total_projects.value)
    },
    {
      delta: metrics.storage_bytes.delta,
      detail: `${formatBytes(metrics.storage_bytes.period_value)} được tải lên trong kỳ`,
      icon: CloudUpload,
      label: "Dung lượng file đã lưu",
      tone: "orange",
      value: formatBytes(metrics.storage_bytes.value)
    },
    {
      delta: metrics.analysis_runs.delta,
      detail: `${formatCount(metrics.analysis_runs.completed)} hoàn thành · ${formatCount(metrics.analysis_runs.quick_sizing)} QS · ${formatCount(metrics.analysis_runs.bess_planner)} Planner`,
      icon: BarChart3,
      label: "Lượt phân tích trong kỳ",
      tone: "slate",
      value: formatCount(metrics.analysis_runs.value)
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
      {cards.map((metric) => <DashboardMetricCard key={metric.label} metric={metric} />)}
    </div>
  );
}
