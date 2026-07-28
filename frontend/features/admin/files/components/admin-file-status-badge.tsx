import type { AdminDatasetStatusFilter, AdminFileKind, AdminFileStatus } from "../data/admin-file.types";
import { datasetStatusLabels, fileKindLabels, fileStatusLabels } from "../data/admin-file-format";

const datasetStyles: Record<AdminDatasetStatusFilter, string> = {
  ready: "bg-green-50 text-brand-green ring-green-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  invalid: "bg-red-50 text-red-700 ring-red-100",
  missing: "bg-slate-50 text-slate-600 ring-slate-200"
};

const fileStyles: Record<AdminFileStatus, string> = {
  uploaded: "bg-blue-50 text-brand-blue ring-blue-100",
  validated: "bg-green-50 text-brand-green ring-green-100",
  invalid: "bg-red-50 text-red-700 ring-red-100"
};

const kindStyles: Record<AdminFileKind, string> = {
  load_profile: "bg-blue-50 text-brand-blue ring-blue-100",
  pv_profile: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  other: "bg-slate-50 text-slate-600 ring-slate-200"
};

export function DatasetStatusBadge({ status }: { status: AdminDatasetStatusFilter }) {
  return <BadgeText className={datasetStyles[status]}>{datasetStatusLabels[status]}</BadgeText>;
}

export function FileStatusBadge({ status }: { status: AdminFileStatus }) {
  return <BadgeText className={fileStyles[status]}>{fileStatusLabels[status]}</BadgeText>;
}

export function FileKindBadge({ kind }: { kind: AdminFileKind }) {
  return <BadgeText className={kindStyles[kind]}>{fileKindLabels[kind]}</BadgeText>;
}

export function UsageBadge({ active }: { active: boolean }) {
  return active ? (
    <BadgeText className="bg-blue-50 text-brand-blue ring-blue-100">Đang active</BadgeText>
  ) : (
    <BadgeText className="bg-slate-50 text-slate-600 ring-slate-200">Không active</BadgeText>
  );
}

function BadgeText({ children, className }: { children: string; className: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${className}`}>
      {children}
    </span>
  );
}
