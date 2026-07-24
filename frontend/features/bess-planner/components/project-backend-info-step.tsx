"use client";

import { formatNumber } from "@/features/quick-sizing/data/quick-sizing-model";
import type { BessCatalogResponse, SiteResponse } from "../api/workspace.api";

export type BackendProjectInfoValue = {
  name: string;
  location: string;
  industry: string;
  voltageLevel: string;
  timezone: string;
  siteId: string;
  bessCatalogId: string;
};

export function ProjectBackendInfoStep({ value, onChange, sites, catalogItems, loading }: {
  value: BackendProjectInfoValue;
  onChange: (value: BackendProjectInfoValue) => void;
  sites: SiteResponse[];
  catalogItems: BessCatalogResponse[];
  loading: boolean;
}) {
  const selectedSite = sites.find((site) => site.id === value.siteId);
  const chooseSite = (siteId: string) => {
    const site = sites.find((item) => item.id === siteId);
    onChange({
      ...value,
      siteId,
      location: readLocationLabel(site?.location) || value.location,
      voltageLevel: site?.voltage_level || value.voltageLevel
    });
  };

  return (
    <section>
      <h2 className="text-xl font-bold text-brand-navy">1. Thông tin dự án</h2>
      <p className="mt-2 text-sm font-medium text-brand-muted">
        Chọn Site và BESS catalog đang có trên backend trước khi tạo dự án.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <BackendSelect
          disabled={loading}
          label="Site trên backend"
          onChange={chooseSite}
          options={sites.map((site) => ({ label: `${site.name} · ${site.voltage_level}`, value: site.id }))}
          placeholder={loading ? "Đang tải site..." : sites.length ? "Chọn site" : "Chưa có site trên backend"}
          value={value.siteId}
        />
        <BackendSelect
          disabled={loading}
          label="BESS catalog"
          onChange={(bessCatalogId) => onChange({ ...value, bessCatalogId })}
          options={catalogItems.map((item) => ({ label: `${item.name} · v${item.version}`, value: item.id }))}
          placeholder={loading ? "Đang tải catalog..." : catalogItems.length ? "Chọn catalog" : "Chưa có catalog hoạt động"}
          value={value.bessCatalogId}
        />
        <TextField label="Tên dự án" value={value.name} onChange={(name) => onChange({ ...value, name })} placeholder="Ví dụ: Nhà máy ABC - Bình Dương" />
        <TextField label="Địa điểm" value={value.location} onChange={(location) => onChange({ ...value, location })} placeholder="Tỉnh/thành phố" />
        <TextField label="Ngành sản xuất" value={value.industry} onChange={(industry) => onChange({ ...value, industry })} placeholder="Ví dụ: Dệt may" />
        <SelectField label="Cấp điện áp" value={value.voltageLevel} onChange={(voltageLevel) => onChange({ ...value, voltageLevel })} options={["", "Hạ áp", "Trung áp", "Cao áp", "Chưa xác định"]} />
        <SelectField label="Múi giờ" value={value.timezone} onChange={(timezone) => onChange({ ...value, timezone })} options={["UTC+07:00 Bangkok, Hanoi, Jakarta", "UTC+08:00 Singapore, Kuala Lumpur", "UTC+09:00 Tokyo, Seoul"]} />
      </div>
      {!loading && (!sites.length || !catalogItems.length) ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Cần có ít nhất một Site và một BESS catalog đang hoạt động trên backend trước khi tạo dự án. <a className="ml-1 underline" href="/customer-portal?section=data">Mở quản lý dữ liệu</a>.
        </div>
      ) : null}
      {selectedSite ? (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-brand-muted">
          Site đã chọn: <strong className="text-brand-navy">{selectedSite.name}</strong> · Công suất hợp đồng {formatNumber(selectedSite.contract_capacity_kw, 0)} kW.
        </div>
      ) : null}
    </section>
  );
}

function BackendSelect({ disabled, label, onChange, options, placeholder, value }: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  value: string;
}) {
  return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label} <span className="text-red-500">*</span><select className="h-11 rounded-lg border border-brand-line bg-white px-4 text-sm font-medium outline-none focus:border-brand-blue" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}><option value="" disabled>{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label} <span className="text-red-500">*</span><input className="h-11 rounded-lg border border-brand-line px-4 text-sm font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="grid gap-2 text-sm font-bold text-brand-navy">{label} <span className="text-red-500">*</span><select className="h-11 rounded-lg border border-brand-line bg-white px-4 text-sm font-medium outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option disabled={option === ""} key={option || "empty"} value={option}>{option || "Chọn giá trị"}</option>)}</select></label>;
}

function readLocationLabel(location?: Record<string, unknown>) {
  if (!location) return "";
  const candidates = [location.address, location.city, location.province, location.name];
  return candidates.filter((item): item is string => typeof item === "string" && item.trim().length > 0).join(", ");
}
