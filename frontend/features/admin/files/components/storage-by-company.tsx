import { Building2 } from "lucide-react";

import { formatBytes, formatCount, formatPercentage } from "../data/admin-file-format";
import type { AdminStorageByCompany } from "../data/admin-file.types";

export function StorageByCompany({ rows }: { rows: AdminStorageByCompany[] }) {
  const largest = rows.reduce((max, row) => Math.max(max, row.storage_bytes), 0);
  return (
    <section className="rounded-lg border border-brand-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-navy">Dung lượng theo công ty</h2>
        <Building2 className="text-brand-muted" size={20} />
      </div>
      {rows.length ? (
        <div className="grid gap-4">
          {rows.map((row, index) => {
            const width = largest > 0 ? Math.round(row.storage_bytes / largest * 100) : 0;
            return (
              <div className="grid gap-2" key={row.company_name}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-brand-navy">{index + 1}. {row.company_name}</p>
                    <p className="mt-1 text-xs font-medium text-brand-muted">{formatCount(row.file_count)} file · {formatPercentage(row.percentage_of_total)} tổng dung lượng</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-brand-navy">{formatBytes(row.storage_bytes)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-blue" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm font-medium leading-6 text-brand-muted">Chưa có dữ liệu dung lượng theo công ty.</p>
      )}
    </section>
  );
}
