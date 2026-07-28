import { ArrowRight, Download, FileBarChart, MoreHorizontal, Printer, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBessConfig, formatReportDate } from "../data/report-format";
import { REPORT_KIND_LABELS } from "../data/report.mock";
import type { ReportItem, ReportKind } from "../data/report.types";
import { ReportKindBadge, ReportStatusBadge } from "./report-status-badge";

const reportIcons: Record<ReportKind, LucideIcon> = {
  quick_sizing: Zap,
  bess_planner: FileBarChart
};

const reportIconTone: Record<ReportKind, string> = {
  quick_sizing: "bg-blue-50 text-brand-blue",
  bess_planner: "bg-green-50 text-brand-green"
};

export function RecentReportList({ reports }: { reports: ReportItem[] }) {
  return (
    <Card className="rounded-xl bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line p-4">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Báo cáo gần đây</h2>
          <p className="mt-1 text-xs font-medium text-brand-muted">Kết quả phân tích mới nhất trong workspace.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">{reports.length} báo cáo</span>
      </div>
      <div className="divide-y divide-brand-line">
        {reports.map((report) => (
          <ReportListItem key={report.id} report={report} />
        ))}
      </div>
    </Card>
  );
}

function ReportListItem({ report }: { report: ReportItem }) {
  const Icon = reportIcons[report.kind];
  return (
    <article className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-4 p-4 transition hover:bg-slate-50/70 max-lg:grid-cols-[44px_minmax(0,1fr)] max-sm:grid-cols-1">
      <span className={cn("grid size-11 place-items-center rounded-xl", reportIconTone[report.kind])}>
        <Icon size={22} />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 break-words text-base font-bold text-brand-navy">{report.projectName}</h3>
          <ReportKindBadge kind={report.kind} />
          <ReportStatusBadge status={report.status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-brand-muted">
          <span>{report.reportCode}</span>
          <span>{formatReportDate(report.updatedAt)}</span>
          <span className="max-sm:hidden">{report.engineVersion}</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs max-md:grid-cols-1">
          <ReportMetric label="Cấu hình BESS" value={report.bessConfig.label || formatBessConfig(report.bessConfig)} />
          <ReportMetric label={REPORT_KIND_LABELS[report.kind]} value={report.primaryMetric} />
          <ReportMetric label="Ghi chú" value={report.secondaryMetric} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {report.details.slice(0, 3).map((detail) => (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-brand-muted" key={detail}>
              {detail}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-start gap-2 max-lg:col-span-2 max-lg:justify-end max-sm:col-span-1 max-sm:justify-start">
        <Link className={buttonVariants({ size: "sm", className: "h-9 rounded-lg" })} href={report.resultHref}>
          Xem báo cáo
          <ArrowRight size={16} />
        </Link>
        <button aria-label={`Tải báo cáo ${report.projectName}`} className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted transition hover:bg-blue-50 hover:text-brand-blue" type="button">
          <Download size={16} />
        </button>
        <button aria-label={`In báo cáo ${report.projectName}`} className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted transition hover:bg-blue-50 hover:text-brand-blue" type="button">
          <Printer size={16} />
        </button>
        <button aria-label={`Mở thêm hành động cho ${report.projectName}`} className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted transition hover:bg-blue-50 hover:text-brand-blue" type="button">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </article>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-lg border border-brand-line bg-white px-3 py-2">
      <small className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted">{label}</small>
      <strong className="mt-1 block break-words text-sm font-bold text-brand-navy">{value}</strong>
    </span>
  );
}
