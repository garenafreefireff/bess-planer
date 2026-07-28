import { REPORT_KIND_LABELS, REPORT_STATUS_LABELS } from "../data/report.mock";
import type { ReportKind, ReportStatus } from "../data/report.types";
import { cn } from "@/lib/utils";

const statusClasses: Record<ReportStatus, string> = {
  ready: "bg-green-50 text-brand-green ring-green-100",
  preliminary: "bg-violet-50 text-violet-700 ring-violet-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  processing: "bg-blue-50 text-brand-blue ring-blue-100",
  failed: "bg-red-50 text-red-600 ring-red-100"
};

const kindClasses: Record<ReportKind, string> = {
  quick_sizing: "bg-blue-50 text-brand-blue ring-blue-100",
  bess_planner: "bg-green-50 text-brand-green ring-green-100"
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1", statusClasses[status])}>
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}

export function ReportKindBadge({ kind }: { kind: ReportKind }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1", kindClasses[kind])}>
      {REPORT_KIND_LABELS[kind]}
    </span>
  );
}
