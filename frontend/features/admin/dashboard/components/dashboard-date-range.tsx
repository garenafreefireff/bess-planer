"use client";

import { CalendarDays, RefreshCw } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  countInclusiveDays,
  getCurrentMonthFilters,
  isDateRangeOrdered
} from "../data/admin-dashboard-format";
import type { DashboardFilters, DashboardGranularity } from "../data/admin-dashboard.types";

const granularityOptions: Array<{ label: string; value: DashboardGranularity }> = [
  { label: "Theo ngày", value: "day" },
  { label: "Theo tuần", value: "week" },
  { label: "Theo tháng", value: "month" }
];

export function DashboardDateRange({
  filters,
  loading,
  onApply
}: {
  filters: DashboardFilters;
  loading: boolean;
  onApply: (filters: DashboardFilters) => void;
}) {
  const [draft, setDraft] = useState(filters);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const validationError = useMemo(() => validateRange(draft), [draft]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    if (validationError) return;
    onApply(draft);
  };

  const reset = () => {
    const next = getCurrentMonthFilters(draft.timezone);
    setTouched(false);
    setDraft(next);
    onApply(next);
  };

  return (
    <form className="rounded-xl border border-brand-line bg-white p-4 shadow-panel" onSubmit={submit}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_auto_auto] items-end gap-3 max-xl:grid-cols-3 max-md:grid-cols-1">
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-brand-navy">
          Từ ngày
          <Input
            className="h-10 min-w-0"
            disabled={loading}
            onChange={(event) => setDraft((current) => ({ ...current, date_from: event.target.value }))}
            type="date"
            value={draft.date_from}
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-brand-navy">
          Đến ngày
          <Input
            className="h-10 min-w-0"
            disabled={loading}
            onChange={(event) => setDraft((current) => ({ ...current, date_to: event.target.value }))}
            type="date"
            value={draft.date_to}
          />
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-bold text-brand-navy">
          Nhóm dữ liệu
          <select
            className="h-10 min-w-0 rounded-md border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy"
            disabled={loading}
            onChange={(event) => setDraft((current) => ({ ...current, granularity: event.target.value as DashboardGranularity }))}
            value={draft.granularity}
          >
            {granularityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <Button className="h-10" disabled={loading || Boolean(validationError)} type="submit">
          <CalendarDays size={16} />
          Áp dụng
        </Button>
        <Button className="h-10" disabled={loading} onClick={reset} type="button" variant="secondary">
          <RefreshCw size={16} />
          Tháng hiện tại
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
        <span className="text-brand-muted">Timezone: {draft.timezone}</span>
        {validationError && (touched || draft.date_from || draft.date_to) ? <span className="text-red-600">{validationError}</span> : null}
      </div>
    </form>
  );
}

function validateRange(filters: DashboardFilters): string {
  if (!filters.date_from || !filters.date_to) return "Vui lòng chọn đủ từ ngày và đến ngày.";
  if (!isDateRangeOrdered(filters.date_from, filters.date_to)) return "Từ ngày không được lớn hơn đến ngày.";
  if (countInclusiveDays(filters.date_from, filters.date_to) > 366) return "Khoảng thời gian không được vượt quá 366 ngày.";
  return "";
}
