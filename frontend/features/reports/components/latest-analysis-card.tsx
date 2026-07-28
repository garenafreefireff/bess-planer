import { AlertTriangle, ArrowRight, Clock3, Info, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBessConfig, formatReportNumber } from "../data/report-format";
import type { ReportAttentionItem, ReportItem } from "../data/report.types";
import { ReportKindBadge } from "./report-status-badge";

const attentionIcons: Record<ReportAttentionItem["tone"], LucideIcon> = {
  amber: AlertTriangle,
  blue: Clock3,
  red: XCircle,
  slate: Info
};

const attentionToneClasses: Record<ReportAttentionItem["tone"], string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  blue: "bg-blue-50 text-brand-blue ring-blue-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  slate: "bg-slate-100 text-brand-muted ring-slate-200"
};

export function LatestAnalysisCard({ report }: { report: ReportItem | null }) {
  if (!report) {
    return (
      <Card className="rounded-xl border-green-100 bg-green-50/35 p-4 shadow-panel">
        <h2 className="text-lg font-bold text-brand-navy">Phân tích gần nhất</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">Chưa có phân tích nào đủ dữ liệu để hiển thị.</p>
      </Card>
    );
  }

  const financials = report.financials ?? {
    capex: "Đang tính",
    annualSaving: "Đang tính",
    npv: "Đang tính",
    payback: "Đang tính"
  };
  const pmaxContractKw = Math.round(report.bessConfig.powerKw * 1.8);
  const peakReductionPct = report.status === "warning" ? 12 : report.status === "processing" ? 0 : 18;

  return (
    <Card className="rounded-xl border-green-100 bg-gradient-to-br from-green-50/70 to-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wide text-brand-green">Phân tích gần nhất</span>
          <h2 className="mt-2 break-words text-lg font-bold text-brand-navy">{report.projectName}</h2>
        </div>
        <ReportKindBadge kind={report.kind} />
      </div>

      <div className="mt-4 rounded-xl border border-green-100 bg-white/80 p-3">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-navy">
          <ShieldCheck className="text-brand-green" size={18} />
          {report.bessConfig.label || formatBessConfig(report.bessConfig)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <LatestMetric label="CAPEX" value={financials.capex} />
          <LatestMetric label="Tiết kiệm/năm" value={financials.annualSaving} />
          <LatestMetric label="NPV" value={financials.npv} />
          <LatestMetric label="Hoàn vốn" value={financials.payback} />
          <LatestMetric label="Pmax hợp đồng" value={`${formatReportNumber(pmaxContractKw)} kW`} />
          <LatestMetric label="Tỷ lệ giảm đỉnh" value={`${formatReportNumber(peakReductionPct)}%`} />
        </div>
      </div>

      <Link className={buttonVariants({ variant: "green", size: "sm", className: "mt-4 w-full rounded-lg" })} href={report.resultHref}>
        Mở kết quả phân tích
        <ArrowRight size={16} />
      </Link>
    </Card>
  );
}

export function AttentionPanel({ items }: { items: ReportAttentionItem[] }) {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-navy">Cần chú ý</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{items.length}</span>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => {
          const Icon = attentionIcons[item.tone];
          return (
            <Link className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-xl border border-brand-line p-3 transition hover:border-brand-blue/40 hover:bg-blue-50/40" href={item.href} key={item.id}>
              <span className={cn("grid size-9 place-items-center rounded-lg ring-1", attentionToneClasses[item.tone])}>
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-bold leading-5 text-brand-navy">{item.title}</strong>
                <small className="mt-1 block text-xs font-medium leading-5 text-brand-muted">{item.detail}</small>
                <span className="mt-2 inline-flex text-xs font-bold text-brand-blue">{item.actionLabel}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function LatestMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
      <small className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted">{label}</small>
      <strong className="mt-1 block break-words text-sm font-bold text-brand-navy">{value}</strong>
    </span>
  );
}
