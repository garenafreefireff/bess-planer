import { RefreshCw, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  REPORT_STATUS_FILTER_OPTIONS,
  REPORT_TYPE_FILTER_OPTIONS
} from "../data/report.mock";
import type { ReportFilters, ReportStatusFilter, ReportTypeFilter } from "../data/report.types";

export function ReportFilterBar({
  filters,
  hasActiveFilters,
  onReset,
  onUpdate
}: {
  filters: ReportFilters;
  hasActiveFilters: boolean;
  onReset: () => void;
  onUpdate: <Key extends keyof ReportFilters>(key: Key, value: ReportFilters[Key]) => void;
}) {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(160px,0.7fr)_minmax(170px,0.7fr)_auto] gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <label className="relative min-w-0">
          <span className="sr-only">Tìm kiếm báo cáo</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
          <input
            className="h-11 w-full rounded-lg border border-brand-line bg-white pl-10 pr-3 text-sm font-semibold text-brand-navy outline-none transition placeholder:text-brand-muted focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
            onChange={(event) => onUpdate("search", event.target.value)}
            placeholder="Tìm theo tên dự án hoặc mã báo cáo"
            value={filters.search}
          />
        </label>

        <FilterSelect
          label="Loại báo cáo"
          onChange={(value) => onUpdate("type", value as ReportTypeFilter)}
          options={REPORT_TYPE_FILTER_OPTIONS}
          value={filters.type}
        />

        <FilterSelect
          label="Trạng thái"
          onChange={(value) => onUpdate("status", value as ReportStatusFilter)}
          options={REPORT_STATUS_FILTER_OPTIONS}
          value={filters.status}
        />

        <button className={buttonVariants({ variant: "secondary", className: "h-11 rounded-lg max-sm:w-full" })} disabled={!hasActiveFilters} onClick={onReset} type="button">
          <RefreshCw size={17} />
          Reset bộ lọc
        </button>
      </div>
    </Card>
  );
}

function FilterSelect({ label, onChange, options, value }: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select
        className="h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
