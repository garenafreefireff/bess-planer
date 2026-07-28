import { AlertTriangle, CheckCircle2, CloudUpload, Database, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatBytes, formatCount } from "../data/admin-file-format";
import type { AdminFilesOverview } from "../data/admin-file.types";

type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
};

export function AdminFileMetrics({ loading, overview }: { loading: boolean; overview: AdminFilesOverview | null }) {
  const metrics: Metric[] = overview ? [
    {
      label: "Tổng số file",
      value: formatCount(overview.metrics.total_files),
      detail: "CSV/XLSX đã lưu trong MongoDB",
      icon: FileText,
      tone: "bg-blue-50 text-brand-blue"
    },
    {
      label: "Dung lượng file đã lưu",
      value: formatBytes(overview.metrics.total_storage_bytes),
      detail: "Tính từ files.size_bytes",
      icon: Database,
      tone: "bg-green-50 text-brand-green"
    },
    {
      label: "Upload hôm nay",
      value: formatCount(overview.metrics.uploads_today.count),
      detail: formatBytes(overview.metrics.uploads_today.total_size_bytes),
      icon: CloudUpload,
      tone: "bg-violet-50 text-violet-700"
    },
    {
      label: "Dataset sẵn sàng",
      value: formatCount(overview.metrics.ready_datasets),
      detail: "dataset.status = ready",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700"
    },
    {
      label: "Cần kiểm tra",
      value: formatCount(overview.metrics.needs_attention),
      detail: "Warning, invalid hoặc chưa có dataset",
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-700"
    }
  ] : [];

  return (
    <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {loading && !overview ? Array.from({ length: 5 }).map((_, index) => (
        <Card className="h-32 animate-pulse bg-slate-50" key={index} />
      )) : metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-muted">{metric.label}</p>
          <p className="mt-3 truncate text-2xl font-bold text-brand-navy">{metric.value}</p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${metric.tone}`}>
          <Icon size={21} />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-brand-muted">{metric.detail}</p>
    </Card>
  );
}
