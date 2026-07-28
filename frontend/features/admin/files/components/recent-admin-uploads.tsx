import { BatteryCharging, FileSpreadsheet, Sun } from "lucide-react";

import { datasetStatusLabels, fileKindLabels, formatBytes, formatRelativeTime } from "../data/admin-file-format";
import type { AdminRecentUpload } from "../data/admin-file.types";
import { DatasetStatusBadge } from "./admin-file-status-badge";

export function RecentAdminUploads({ items, onOpenDetail }: { items: AdminRecentUpload[]; onOpenDetail: (fileId: string) => void }) {
  return (
    <section className="rounded-lg border border-brand-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-navy">Upload gần đây</h2>
        <span className="text-xs font-bold text-brand-muted">{items.length} file</span>
      </div>
      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => {
            const Icon = item.kind === "load_profile" ? BatteryCharging : item.kind === "pv_profile" ? Sun : FileSpreadsheet;
            return (
              <button
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-lg border border-brand-line p-3 text-left transition hover:border-brand-blue hover:bg-blue-50/40"
                key={item.id}
                onClick={() => onOpenDetail(item.id)}
                type="button"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-brand-blue"><Icon size={18} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-brand-navy">{item.original_name}</span>
                  <span className="mt-1 block truncate text-xs font-semibold text-brand-muted">
                    v{item.version} · {fileKindLabels[item.kind]} · {formatBytes(item.size_bytes)}
                  </span>
                  <span className="mt-1 block truncate text-xs text-brand-muted">{item.owner_name} · {item.company_name || "Chưa cập nhật công ty"}</span>
                  <span className="mt-1 block truncate text-xs text-brand-muted">{item.project_name} · {formatRelativeTime(item.created_at)}</span>
                  <span className="mt-2 inline-flex"><DatasetStatusBadge status={item.dataset_status} /></span>
                  <span className="sr-only">{datasetStatusLabels[item.dataset_status]}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm font-medium leading-6 text-brand-muted">Chưa có upload nào.</p>
      )}
    </section>
  );
}
