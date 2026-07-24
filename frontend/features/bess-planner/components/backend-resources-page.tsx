"use client";

import { Archive, BatteryCharging, Database, FileBarChart, LoaderCircle, Plus, RefreshCw, Trash2, Zap, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  analysesApi,
  bessCatalogApi,
  datasetsApi,
  filesApi,
  readWorkspaceApiError,
  sitesApi,
  tariffsApi,
  type AnalysisRunResponse,
  type BessCatalogResponse,
  type DatasetResponse,
  type SiteResponse,
  type TariffResponse,
  type WorkspaceFileResponse
} from "../api/workspace.api";

const initialTariff = {
  code: "",
  name: "",
  customerGroup: "industrial",
  voltageLevel: "Trung áp",
  demandCharge: 0,
  vatPct: 8,
  effectiveFrom: new Date().toISOString().slice(0, 10)
};

const initialSite = {
  tariffId: "",
  name: "",
  code: "",
  location: "",
  voltageLevel: "Trung áp",
  contractCapacityKw: 1000
};

const initialCatalog = { code: "", name: "", version: 1 };

export function BackendResourcesContent() {
  const [tariffs, setTariffs] = useState<TariffResponse[]>([]);
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [catalogs, setCatalogs] = useState<BessCatalogResponse[]>([]);
  const [files, setFiles] = useState<WorkspaceFileResponse[]>([]);
  const [datasets, setDatasets] = useState<DatasetResponse[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRunResponse[]>([]);
  const [tariffForm, setTariffForm] = useState(initialTariff);
  const [siteForm, setSiteForm] = useState(initialSite);
  const [catalogForm, setCatalogForm] = useState(initialCatalog);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tariffPage, sitePage, catalogPage, filePage, datasetPage, analysisPage] = await Promise.all([
        tariffsApi.list({ page: 1, page_size: 100 }),
        sitesApi.list({ page: 1, page_size: 100 }),
        bessCatalogApi.list({ page: 1, page_size: 100 }),
        filesApi.list({ page: 1, page_size: 100 }),
        datasetsApi.list({ page: 1, page_size: 100 }),
        analysesApi.list({ page: 1, page_size: 50 })
      ]);
      setTariffs(tariffPage.items);
      setSites(sitePage.items);
      setCatalogs(catalogPage.items);
      setFiles(filePage.items);
      setDatasets(datasetPage.items);
      setAnalyses(analysisPage.items);
      setSiteForm((current) => ({ ...current, tariffId: current.tariffId || tariffPage.items.find((item) => item.status === "active")?.id || "" }));
    } catch (loadError) {
      setError(readWorkspaceApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const createTariff = async (event: FormEvent) => {
    event.preventDefault();
    setBusyKey("create-tariff");
    try {
      const created = await tariffsApi.create({
        code: tariffForm.code,
        name: tariffForm.name,
        customer_group: tariffForm.customerGroup,
        voltage_level: tariffForm.voltageLevel,
        currency: "VND",
        energy_prices: {},
        tou_periods: [],
        demand_charge_per_kw: tariffForm.demandCharge,
        vat_pct: tariffForm.vatPct,
        effective_from: tariffForm.effectiveFrom,
        status: "active"
      });
      setTariffs((items) => [created, ...items]);
      setTariffForm(initialTariff);
      setSiteForm((current) => ({ ...current, tariffId: current.tariffId || created.id }));
      toast.success("Đã tạo biểu giá trên backend.");
    } catch (createError) {
      toast.error(readWorkspaceApiError(createError));
    } finally {
      setBusyKey("");
    }
  };

  const createSite = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteForm.tariffId) {
      toast.error("Cần chọn biểu giá cho Site.");
      return;
    }
    setBusyKey("create-site");
    try {
      const created = await sitesApi.create({
        tariff_id: siteForm.tariffId,
        name: siteForm.name,
        code: siteForm.code,
        location: { address: siteForm.location },
        voltage_level: siteForm.voltageLevel,
        contract_capacity_kw: siteForm.contractCapacityKw,
        pv_system: {},
        status: "active"
      });
      setSites((items) => [created, ...items]);
      setSiteForm({ ...initialSite, tariffId: siteForm.tariffId });
      toast.success("Đã tạo Site trên backend.");
    } catch (createError) {
      toast.error(readWorkspaceApiError(createError));
    } finally {
      setBusyKey("");
    }
  };

  const createCatalog = async (event: FormEvent) => {
    event.preventDefault();
    setBusyKey("create-catalog");
    try {
      const created = await bessCatalogApi.create({
        code: catalogForm.code,
        name: catalogForm.name,
        battery: {},
        pcs: {},
        cost: {},
        warranty: {},
        version: catalogForm.version,
        status: "active"
      });
      setCatalogs((items) => [created, ...items]);
      setCatalogForm(initialCatalog);
      toast.success("Đã tạo BESS catalog trên backend.");
    } catch (createError) {
      toast.error(readWorkspaceApiError(createError));
    } finally {
      setBusyKey("");
    }
  };

  const toggleTariff = async (item: TariffResponse) => {
    const status = item.status === "archived" ? "active" : "archived";
    await runMutation(`tariff-${item.id}`, async () => {
      const updated = await tariffsApi.update(item.id, { status });
      setTariffs((items) => items.map((row) => row.id === updated.id ? updated : row));
    });
  };

  const toggleSite = async (item: SiteResponse) => {
    const status = item.status === "archived" ? "active" : "archived";
    await runMutation(`site-${item.id}`, async () => {
      const updated = await sitesApi.update(item.id, { status });
      setSites((items) => items.map((row) => row.id === updated.id ? updated : row));
    });
  };

  const toggleCatalog = async (item: BessCatalogResponse) => {
    const status = item.status === "archived" ? "active" : "archived";
    await runMutation(`catalog-${item.id}`, async () => {
      const updated = await bessCatalogApi.update(item.id, { status });
      setCatalogs((items) => items.map((row) => row.id === updated.id ? updated : row));
    });
  };

  const runMutation = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await action();
      toast.success("Đã cập nhật dữ liệu backend.");
    } catch (mutationError) {
      toast.error(readWorkspaceApiError(mutationError));
    } finally {
      setBusyKey("");
    }
  };

  const removeTariff = (item: TariffResponse) => removeResource(`tariff-${item.id}`, item.name, () => tariffsApi.remove(item.id), () => setTariffs((rows) => rows.filter((row) => row.id !== item.id)));
  const removeSite = (item: SiteResponse) => removeResource(`site-${item.id}`, item.name, () => sitesApi.remove(item.id), () => setSites((rows) => rows.filter((row) => row.id !== item.id)));
  const removeCatalog = (item: BessCatalogResponse) => removeResource(`catalog-${item.id}`, item.name, () => bessCatalogApi.remove(item.id), () => setCatalogs((rows) => rows.filter((row) => row.id !== item.id)));
  const removeFile = (item: WorkspaceFileResponse) => removeResource(`file-${item.id}`, item.original_name, () => filesApi.remove(item.id), () => setFiles((rows) => rows.filter((row) => row.id !== item.id)));
  const removeDataset = (item: DatasetResponse) => removeResource(`dataset-${item.id}`, `${item.dataset_type} dataset`, () => datasetsApi.remove(item.id), () => setDatasets((rows) => rows.filter((row) => row.id !== item.id)));

  const removeResource = async (key: string, name: string, action: () => Promise<unknown>, onDone: () => void) => {
    if (!window.confirm(`Xóa “${name}” khỏi backend?`)) return;
    setBusyKey(key);
    try {
      await action();
      onDone();
      toast.success("Đã xóa dữ liệu backend.");
    } catch (removeError) {
      toast.error(readWorkspaceApiError(removeError));
    } finally {
      setBusyKey("");
    }
  };

  return (
    <main className="w-full pb-10 pt-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-bold text-brand-navy">Dữ liệu backend</h1>
            <p className="mt-2 text-sm font-medium text-brand-muted">Quản lý Site, biểu giá, BESS catalog và theo dõi analysis run qua các API hiện có.</p>
          </div>
          <button className={buttonVariants({ variant: "secondary", className: "h-11" })} disabled={loading} onClick={() => void loadResources()} type="button"><RefreshCw className={cn(loading && "animate-spin")} size={18} />Làm mới</button>
        </div>

        {error ? <Card className="mt-5 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-none">Không tải được dữ liệu backend: {error}</Card> : null}
        {loading ? <div className="grid min-h-[280px] place-items-center"><LoaderCircle className="animate-spin text-brand-blue" size={42} /></div> : (
          <div className="mt-5 grid gap-5">
            <ResourceSection icon={Zap} title="Biểu giá" count={tariffs.length} form={
              <form className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={createTariff}>
                <TextInput label="Mã" value={tariffForm.code} onChange={(code) => setTariffForm({ ...tariffForm, code })} />
                <TextInput label="Tên biểu giá" value={tariffForm.name} onChange={(name) => setTariffForm({ ...tariffForm, name })} />
                <SelectInput label="Cấp điện áp" value={tariffForm.voltageLevel} options={["Hạ áp", "Trung áp", "Cao áp"]} onChange={(voltageLevel) => setTariffForm({ ...tariffForm, voltageLevel })} />
                <NumberInput label="Giá công suất" value={tariffForm.demandCharge} onChange={(demandCharge) => setTariffForm({ ...tariffForm, demandCharge })} />
                <NumberInput label="VAT (%)" value={tariffForm.vatPct} onChange={(vatPct) => setTariffForm({ ...tariffForm, vatPct })} />
                <TextInput label="Ngày hiệu lực" type="date" value={tariffForm.effectiveFrom} onChange={(effectiveFrom) => setTariffForm({ ...tariffForm, effectiveFrom })} />
                <SubmitButton busy={busyKey === "create-tariff"} label="Tạo biểu giá" />
              </form>
            }>
              <ResourceTable rows={tariffs.map((item) => ({ id: item.id, name: item.name, detail: `${item.code} · ${item.voltage_level} · ${item.demand_charge_per_kw.toLocaleString("vi-VN")} VND/kW/tháng`, status: item.status, busy: busyKey === `tariff-${item.id}`, onToggle: () => void toggleTariff(item), onDelete: () => void removeTariff(item) }))} />
            </ResourceSection>

            <ResourceSection icon={Database} title="Site" count={sites.length} form={
              <form className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={createSite}>
                <SelectInput label="Biểu giá" value={siteForm.tariffId} options={tariffs.filter((item) => item.status === "active").map((item) => ({ label: item.name, value: item.id }))} onChange={(tariffId) => setSiteForm({ ...siteForm, tariffId })} />
                <TextInput label="Mã Site" value={siteForm.code} onChange={(code) => setSiteForm({ ...siteForm, code })} />
                <TextInput label="Tên Site" value={siteForm.name} onChange={(name) => setSiteForm({ ...siteForm, name })} />
                <TextInput label="Địa điểm" value={siteForm.location} onChange={(location) => setSiteForm({ ...siteForm, location })} />
                <SelectInput label="Cấp điện áp" value={siteForm.voltageLevel} options={["Hạ áp", "Trung áp", "Cao áp"]} onChange={(voltageLevel) => setSiteForm({ ...siteForm, voltageLevel })} />
                <NumberInput label="Công suất hợp đồng (kW)" value={siteForm.contractCapacityKw} onChange={(contractCapacityKw) => setSiteForm({ ...siteForm, contractCapacityKw })} />
                <SubmitButton busy={busyKey === "create-site"} label="Tạo Site" />
              </form>
            }>
              <ResourceTable rows={sites.map((item) => ({ id: item.id, name: item.name, detail: `${item.code} · ${item.voltage_level} · ${item.contract_capacity_kw.toLocaleString("vi-VN")} kW`, status: item.status, busy: busyKey === `site-${item.id}`, onToggle: () => void toggleSite(item), onDelete: () => void removeSite(item) }))} />
            </ResourceSection>

            <ResourceSection icon={BatteryCharging} title="BESS catalog" count={catalogs.length} form={
              <form className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={createCatalog}>
                <TextInput label="Mã catalog" value={catalogForm.code} onChange={(code) => setCatalogForm({ ...catalogForm, code })} />
                <TextInput label="Tên catalog" value={catalogForm.name} onChange={(name) => setCatalogForm({ ...catalogForm, name })} />
                <NumberInput label="Phiên bản" value={catalogForm.version} onChange={(version) => setCatalogForm({ ...catalogForm, version })} />
                <SubmitButton busy={busyKey === "create-catalog"} label="Tạo catalog" />
              </form>
            }>
              <ResourceTable rows={catalogs.map((item) => ({ id: item.id, name: item.name, detail: `${item.code} · version ${item.version}`, status: item.status, busy: busyKey === `catalog-${item.id}`, onToggle: () => void toggleCatalog(item), onDelete: () => void removeCatalog(item) }))} />
            </ResourceSection>

            <ResourceSection icon={Database} title="Files đã upload" count={files.length}>
              <DataRecordTable rows={files.map((item) => ({
                id: item.id,
                name: item.original_name,
                detail: `${item.kind} · ${formatBytes(item.size_bytes)} · ${item.status}`,
                status: item.status,
                busy: busyKey === `file-${item.id}`,
                onDelete: () => void removeFile(item)
              }))} />
            </ResourceSection>

            <ResourceSection icon={FileBarChart} title="Datasets đã chuẩn hóa" count={datasets.length}>
              <DataRecordTable rows={datasets.map((item) => ({
                id: item.id,
                name: item.dataset_type,
                detail: `${item.valid_row_count.toLocaleString("vi-VN")}/${item.row_count.toLocaleString("vi-VN")} dòng hợp lệ · interval ${item.interval_minutes ?? "—"} phút`,
                status: item.status,
                busy: busyKey === `dataset-${item.id}`,
                onDelete: () => void removeDataset(item)
              }))} />
            </ResourceSection>

            <ResourceSection icon={FileBarChart} title="Analysis runs" count={analyses.length}>
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-brand-muted"><tr><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Tiến độ</th><th className="px-4 py-3">Engine</th><th className="px-4 py-3">Thời gian</th></tr></thead><tbody>{analyses.map((item) => <tr className="border-t border-brand-line" key={item.id ?? `${item.created_at}-${item.analysis_type}`}><td className="px-4 py-3 font-bold text-brand-navy">{item.analysis_type}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3">{item.progress_pct}%</td><td className="px-4 py-3">{item.engine_version}</td><td className="px-4 py-3">{new Date(item.created_at).toLocaleString("vi-VN")}</td></tr>)}</tbody></table></div>
            </ResourceSection>
          </div>
        )}
    </main>
  );
}

function ResourceSection({ title, count, icon: Icon, form, children }: { title: string; count: number; icon: LucideIcon; form?: ReactNode; children: ReactNode }) {
  return <Card className="rounded-xl bg-white shadow-panel"><div className="flex items-center justify-between border-b border-brand-line p-4"><h2 className="flex items-center gap-2 text-xl font-bold text-brand-navy"><Icon className="text-brand-blue" size={22} />{title}</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">{count}</span></div>{form ? <div className="border-b border-brand-line bg-slate-50/60 p-4">{form}</div> : null}{children}</Card>;
}

function ResourceTable({ rows }: { rows: Array<{ id: string; name: string; detail: string; status: string; busy: boolean; onToggle: () => void; onDelete: () => void }> }) {
  if (!rows.length) return <div className="p-5 text-sm font-medium text-brand-muted">Chưa có dữ liệu.</div>;
  return <div className="divide-y divide-brand-line">{rows.map((row) => <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 p-4" key={row.id}><div><strong className="block text-sm text-brand-navy">{row.name}</strong><span className="mt-1 block text-xs font-medium text-brand-muted">{row.detail}</span></div><span className={cn("rounded-full px-3 py-1 text-xs font-bold", row.status === "active" ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted")}>{row.status}</span><div className="flex gap-2"><button aria-label="Lưu trữ hoặc khôi phục" className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:text-brand-blue" disabled={row.busy} onClick={row.onToggle} type="button"><Archive size={16} /></button><button aria-label="Xóa" className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:text-red-600" disabled={row.busy} onClick={row.onDelete} type="button">{row.busy ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}</button></div></div>)}</div>;
}

function DataRecordTable({ rows }: { rows: Array<{ id: string; name: string; detail: string; status: string; busy: boolean; onDelete: () => void }> }) {
  if (!rows.length) return <div className="p-5 text-sm font-medium text-brand-muted">Chưa có dữ liệu.</div>;
  return <div className="divide-y divide-brand-line">{rows.map((row) => <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 p-4" key={row.id}><div><strong className="block text-sm text-brand-navy">{row.name}</strong><span className="mt-1 block text-xs font-medium text-brand-muted">{row.detail}</span></div><span className={cn("rounded-full px-3 py-1 text-xs font-bold", row.status === "ready" || row.status === "validated" ? "bg-green-50 text-brand-green" : row.status === "warning" || row.status === "uploaded" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600")}>{row.status}</span><button aria-label="Xóa" className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:text-red-600" disabled={row.busy} onClick={row.onDelete} type="button">{row.busy ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}</button></div>)}</div>;
}

function formatBytes(value: number) {
  return value >= 1024 * 1024 ? `${(value / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(value / 1024))} KB`;
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1.5 text-xs font-bold text-brand-muted">{label}<input className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} required type={type} value={value} /></label>;
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1.5 text-xs font-bold text-brand-muted">{label}<input className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" min={0} onChange={(event) => onChange(Number(event.target.value))} required type="number" value={value} /></label>;
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[] | Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  const normalized = options.map((option) => typeof option === "string" ? { label: option, value: option } : option);
  return <label className="grid gap-1.5 text-xs font-bold text-brand-muted">{label}<select className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} required value={value}><option value="" disabled>Chọn giá trị</option>{normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return <button className={buttonVariants({ className: "mt-[22px] h-10" })} disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />}{label}</button>;
}
