import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatBytes, formatCount, formatPercent } from "../data/admin-dashboard-format";
import type { TopCompanyStorageItem } from "../data/admin-dashboard.types";
import { DashboardEmptyState } from "./dashboard-empty-state";

export function TopStorageCompanies({ rows }: { rows: TopCompanyStorageItem[] }) {
  const largest = Math.max(...rows.map((row) => row.storage_bytes), 0);

  return (
    <Card className="min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-brand-navy">Top công ty theo dung lượng</h2>
        <Link className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue" href="/admin/files">
          File upload
          <ChevronRight size={15} />
        </Link>
      </div>
      {!rows.length ? (
        <DashboardEmptyState description="Chưa có file được tải lên trong kỳ." />
      ) : (
        <div className="grid gap-4">
          {rows.map((row, index) => {
            const width = largest > 0 ? Math.round((row.storage_bytes / largest) * 100) : 0;
            return (
              <div className="grid gap-2" key={row.company_name}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="min-w-0 font-semibold text-brand-navy">
                    <span className="mr-2 inline-grid size-6 place-items-center rounded-md bg-slate-100 text-xs font-bold text-brand-muted">{index + 1}</span>
                    {row.company_name}
                  </span>
                  <strong className="text-right text-brand-navy">{formatBytes(row.storage_bytes)}</strong>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3">
                  <span className="h-2 min-w-0 rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-brand-blue" style={{ width: `${width}%` }} />
                  </span>
                  <span className="text-right text-xs font-semibold text-brand-muted">
                    {formatCount(row.file_count)} file · {formatPercent(row.percentage_of_total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
