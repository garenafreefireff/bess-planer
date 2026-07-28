import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCount } from "../data/admin-file-format";

export function AdminFilePagination({
  disabled,
  page,
  pageSize,
  total,
  totalPages,
  onChangePage,
  onChangePageSize
}: {
  disabled: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onChangePage: (page: number) => void;
  onChangePageSize: (pageSize: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const canPrevious = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-line bg-white px-4 py-3">
      <p className="text-sm font-semibold text-brand-muted">
        Hiển thị {formatCount(start)} - {formatCount(end)} trong tổng số {formatCount(total)} file
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-muted">
          Page size
          <select
            className="h-10 rounded-md border border-input bg-white px-3 text-sm font-bold text-brand-navy"
            disabled={disabled}
            value={pageSize}
            onChange={(event) => onChangePageSize(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button disabled={disabled || !canPrevious} onClick={() => onChangePage(page - 1)} type="button" variant="outline">
            <ChevronLeft size={16} /> Trước
          </Button>
          <span className="min-w-20 text-center text-sm font-bold text-brand-navy">
            {totalPages === 0 ? "0/0" : `${page}/${totalPages}`}
          </span>
          <Button disabled={disabled || !canNext} onClick={() => onChangePage(page + 1)} type="button" variant="outline">
            Sau <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
