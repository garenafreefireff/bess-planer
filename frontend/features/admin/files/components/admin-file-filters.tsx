"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminFileFilters } from "../data/admin-file.types";

type Props = {
  filters: AdminFileFilters;
  loading: boolean;
  onApply: (filters: AdminFileFilters) => void;
  onReset: () => void;
};

export function AdminFileFilters({ filters, loading, onApply, onReset }: Props) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const update = <K extends keyof AdminFileFilters>(key: K, value: AdminFileFilters[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="rounded-lg border border-brand-line bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({ ...draft, page: 1 });
      }}
    >
      <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(150px,1fr))] gap-3 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
          Tìm kiếm
          <Input
            placeholder="Tên file, SHA, dự án, người dùng..."
            value={draft.search}
            onChange={(event) => update("search", event.target.value)}
          />
        </label>
        <SelectField label="Loại dữ liệu" value={draft.kind} onChange={(value) => update("kind", value as AdminFileFilters["kind"])}>
          <option value="">Tất cả</option>
          <option value="load_profile">Dữ liệu phụ tải</option>
          <option value="pv_profile">Dữ liệu PV</option>
          <option value="other">Khác</option>
        </SelectField>
        <SelectField label="Trạng thái file" value={draft.file_status} onChange={(value) => update("file_status", value as AdminFileFilters["file_status"])}>
          <option value="">Tất cả</option>
          <option value="uploaded">Đã upload</option>
          <option value="validated">Đã validate</option>
          <option value="invalid">File lỗi</option>
        </SelectField>
        <SelectField label="Chất lượng dataset" value={draft.dataset_status} onChange={(value) => update("dataset_status", value as AdminFileFilters["dataset_status"])}>
          <option value="">Tất cả</option>
          <option value="ready">Sẵn sàng</option>
          <option value="warning">Có cảnh báo</option>
          <option value="invalid">Không hợp lệ</option>
          <option value="missing">Chưa tạo dataset</option>
        </SelectField>
        <SelectField label="Định dạng" value={draft.extension} onChange={(value) => update("extension", value as AdminFileFilters["extension"])}>
          <option value="">CSV/XLSX</option>
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
        </SelectField>
        <SelectField label="Sử dụng" value={draft.active} onChange={(value) => update("active", value as AdminFileFilters["active"])}>
          <option value="">Tất cả</option>
          <option value="true">Đang active</option>
          <option value="false">Không active</option>
        </SelectField>
        <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
          Người dùng ID
          <Input value={draft.user_id} onChange={(event) => update("user_id", event.target.value)} placeholder="ObjectId" />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
          Công ty
          <Input value={draft.company} onChange={(event) => update("company", event.target.value)} placeholder="Tên công ty" />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
          Dự án ID
          <Input value={draft.project_id} onChange={(event) => update("project_id", event.target.value)} placeholder="ObjectId" />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
          Từ ngày
          <Input type="date" value={draft.date_from} onChange={(event) => update("date_from", event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
          Đến ngày
          <Input type="date" value={draft.date_to} onChange={(event) => update("date_to", event.target.value)} />
        </label>
        <SelectField label="Phiên bản" value={draft.latest_only ? "latest" : "all"} onChange={(value) => update("latest_only", value === "latest")}>
          <option value="all">Tất cả version</option>
          <option value="latest">Chỉ mới nhất</option>
        </SelectField>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-brand-muted">Filter chỉ áp dụng khi bấm Áp dụng. Khi đổi filter, trang sẽ về page 1.</p>
        <div className="flex flex-wrap gap-3">
          <Button disabled={loading} onClick={onReset} type="button" variant="outline">
            <RotateCcw size={16} /> Đặt lại
          </Button>
          <Button disabled={loading} type="submit">
            <SlidersHorizontal size={16} /> Áp dụng
          </Button>
        </div>
      </div>
    </form>
  );
}

function SelectField({ children, label, onChange, value }: { children: ReactNode; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-brand-muted">
      {label}
      <select
        className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

