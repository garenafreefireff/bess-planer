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
  readWorkspaceApiError,
  sitesApi,
  tariffsApi,
  type AnalysisRunResponse,
  type BessCatalogResponse,
  type SiteResponse,
  type TariffResponse
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

const initialCatalog = {
  code: "",
  name: "",
  version: 1,
  batteryEnergyKwh: 1000,
  batteryNominalVoltageV: 800,
  batteryDodPct: 90,
  batteryRtePct: 90,
  batteryDegradationPctPerYear: 2,
  batteryCycleLife: 6000,
  pcsPowerKw: 500,
  pcsEfficiencyPct: 95,
  pcsAcVoltageV: 400,
  pcsOverloadPct: 110,
  batteryUnitCost: 5_000_000,
  pcsUnitCost: 4_000_000,
  epcPct: 0,
  otherCostPct: 0,
  annualOpexPct: 2,
  warrantyYears: 10,
  capacityRetentionPct: 70,
  cycleWarranty: 6000
};

export function BackendResourcesContent() {
  const [tariffs, setTariffs] = useState<TariffResponse[]>([]);
  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [catalogs, setCatalogs] = useState<BessCatalogResponse[]>([]);
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
      const [tariffPage, sitePage, catalogPage, analysisPage] = await Promise.all([
        tariffsApi.list({ page: 1, page_size: 100 }),
        sitesApi.list({ page: 1, page_size: 100 }),
        bessCatalogApi.list({ page: 1, page_size: 100 }),
        analysesApi.list({ page: 1, page_size: 50 })
      ]);
      setTariffs(tariffPage.items);
      setSites(sitePage.items);
      setCatalogs(catalogPage.items);
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
      toast.success("Đã tạo biểu giá.");
    } catch (createError) {
      toast.error(readWorkspaceApiError(createError));
    } finally {
      setBusyKey("");
    }
  };

  const createSite = async (event: FormEvent) => {
    event.preventDefault();
    if (!siteForm.tariffId) {
      toast.error("Cần chọn biểu giá cho địa điểm.");
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
      toast.success("Đã tạo địa điểm dự án.");
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
        battery: {
          energy_kwh: catalogForm.batteryEnergyKwh,
          nominal_voltage_v: catalogForm.batteryNominalVoltageV,
          dod_pct: catalogForm.batteryDodPct,
          round_trip_efficiency_pct: catalogForm.batteryRtePct,
          degradation_pct_per_year: catalogForm.batteryDegradationPctPerYear,
          cycle_life: catalogForm.batteryCycleLife
        },
        pcs: {
          power_kw: catalogForm.pcsPowerKw,
          efficiency_pct: catalogForm.pcsEfficiencyPct,
          ac_voltage_v: catalogForm.pcsAcVoltageV,
          overload_pct: catalogForm.pcsOverloadPct
        },
        cost: {
          currency: "VND",
          battery_unit_cost_per_kwh: catalogForm.batteryUnitCost,
          pcs_unit_cost_per_kw: catalogForm.pcsUnitCost,
          epc_pct: catalogForm.epcPct,
          other_cost_pct: catalogForm.otherCostPct,
          annual_opex_pct: catalogForm.annualOpexPct
        },
        warranty: {
          years: catalogForm.warrantyYears,
          capacity_retention_pct: catalogForm.capacityRetentionPct,
          cycle_warranty: catalogForm.cycleWarranty
        },
        version: catalogForm.version,
        status: "active"
      });
      setCatalogs((items) => [created, ...items]);
      setCatalogForm(initialCatalog);
      toast.success("Đã tạo cấu hình BESS.");
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
      toast.success("Đã cập nhật dữ liệu.");
    } catch (mutationError) {
      toast.error(readWorkspaceApiError(mutationError));
    } finally {
      setBusyKey("");
    }
  };

  const removeTariff = (item: TariffResponse) => removeResource(`tariff-${item.id}`, item.name, () => tariffsApi.remove(item.id), () => setTariffs((rows) => rows.filter((row) => row.id !== item.id)));
  const removeSite = (item: SiteResponse) => removeResource(`site-${item.id}`, item.name, () => sitesApi.remove(item.id), () => setSites((rows) => rows.filter((row) => row.id !== item.id)));
  const removeCatalog = (item: BessCatalogResponse) => removeResource(`catalog-${item.id}`, item.name, () => bessCatalogApi.remove(item.id), () => setCatalogs((rows) => rows.filter((row) => row.id !== item.id)));

  const removeResource = async (key: string, name: string, action: () => Promise<unknown>, onDone: () => void) => {
    if (!window.confirm(`Xóa “${name}”?`)) return;
    setBusyKey(key);
    try {
      await action();
      onDone();
      toast.success("Đã xóa dữ liệu.");
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
            <h1 className="text-[34px] font-bold text-brand-navy">Tài nguyên dự án</h1>
            <p className="mt-2 text-sm font-medium text-brand-muted">Quản lý địa điểm, biểu giá điện và các cấu hình BESS dùng chung cho dự án.</p>
          </div>
          <button className={buttonVariants({ variant: "secondary", className: "h-11" })} disabled={loading} onClick={() => void loadResources()} type="button"><RefreshCw className={cn(loading && "animate-spin")} size={18} />Làm mới</button>
        </div>

        {error ? <Card className="mt-5 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-none">Không thể tải dữ liệu: {error}</Card> : null}
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

            <ResourceSection icon={Database} title="Địa điểm dự án" count={sites.length} form={
              <form className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1" onSubmit={createSite}>
                <SelectInput label="Biểu giá" value={siteForm.tariffId} options={tariffs.filter((item) => item.status === "active").map((item) => ({ label: item.name, value: item.id }))} onChange={(tariffId) => setSiteForm({ ...siteForm, tariffId })} />
                <TextInput label="Mã địa điểm" value={siteForm.code} onChange={(code) => setSiteForm({ ...siteForm, code })} />
                <TextInput label="Tên địa điểm" value={siteForm.name} onChange={(name) => setSiteForm({ ...siteForm, name })} />
                <TextInput label="Địa điểm" value={siteForm.location} onChange={(location) => setSiteForm({ ...siteForm, location })} />
                <SelectInput label="Cấp điện áp" value={siteForm.voltageLevel} options={["Hạ áp", "Trung áp", "Cao áp"]} onChange={(voltageLevel) => setSiteForm({ ...siteForm, voltageLevel })} />
                <NumberInput label="Công suất hợp đồng (kW)" value={siteForm.contractCapacityKw} onChange={(contractCapacityKw) => setSiteForm({ ...siteForm, contractCapacityKw })} />
                <SubmitButton busy={busyKey === "create-site"} label="Tạo địa điểm" />
              </form>
            }>
              <ResourceTable rows={sites.map((item) => ({ id: item.id, name: item.name, detail: `${item.code} · ${item.voltage_level} · ${item.contract_capacity_kw.toLocaleString("vi-VN")} kW`, status: item.status, busy: busyKey === `site-${item.id}`, onToggle: () => void toggleSite(item), onDelete: () => void removeSite(item) }))} />
            </ResourceSection>

            <ResourceSection icon={BatteryCharging} title="Danh mục cấu hình BESS" count={catalogs.length} form={
              <form className="grid gap-4" onSubmit={createCatalog}>
                <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
                  <TextInput label="Mã cấu hình" value={catalogForm.code} onChange={(code) => setCatalogForm({ ...catalogForm, code })} />
                  <TextInput label="Tên cấu hình" value={catalogForm.name} onChange={(name) => setCatalogForm({ ...catalogForm, name })} />
                  <NumberInput label="Phiên bản" value={catalogForm.version} onChange={(version) => setCatalogForm({ ...catalogForm, version })} />
                  <SubmitButton busy={busyKey === "create-catalog"} label="Tạo cấu hình" />
                </div>
                <CatalogFieldset title="Pin DC">
                  <NumberInput label="Dung lượng danh định (kWh)" value={catalogForm.batteryEnergyKwh} onChange={(batteryEnergyKwh) => setCatalogForm({ ...catalogForm, batteryEnergyKwh })} />
                  <NumberInput label="Điện áp danh định (V)" value={catalogForm.batteryNominalVoltageV} onChange={(batteryNominalVoltageV) => setCatalogForm({ ...catalogForm, batteryNominalVoltageV })} />
                  <NumberInput label="DoD (%)" value={catalogForm.batteryDodPct} onChange={(batteryDodPct) => setCatalogForm({ ...catalogForm, batteryDodPct })} />
                  <NumberInput label="RTE (%)" value={catalogForm.batteryRtePct} onChange={(batteryRtePct) => setCatalogForm({ ...catalogForm, batteryRtePct })} />
                  <NumberInput label="Suy hao (%/năm)" value={catalogForm.batteryDegradationPctPerYear} onChange={(batteryDegradationPctPerYear) => setCatalogForm({ ...catalogForm, batteryDegradationPctPerYear })} />
                  <NumberInput label="Vòng đời chu kỳ" value={catalogForm.batteryCycleLife} onChange={(batteryCycleLife) => setCatalogForm({ ...catalogForm, batteryCycleLife })} />
                </CatalogFieldset>
                <CatalogFieldset title="PCS">
                  <NumberInput label="Công suất AC (kW)" value={catalogForm.pcsPowerKw} onChange={(pcsPowerKw) => setCatalogForm({ ...catalogForm, pcsPowerKw })} />
                  <NumberInput label="Hiệu suất PCS (%)" value={catalogForm.pcsEfficiencyPct} onChange={(pcsEfficiencyPct) => setCatalogForm({ ...catalogForm, pcsEfficiencyPct })} />
                  <NumberInput label="Điện áp AC (V)" value={catalogForm.pcsAcVoltageV} onChange={(pcsAcVoltageV) => setCatalogForm({ ...catalogForm, pcsAcVoltageV })} />
                  <NumberInput label="Quá tải cho phép (%)" value={catalogForm.pcsOverloadPct} onChange={(pcsOverloadPct) => setCatalogForm({ ...catalogForm, pcsOverloadPct })} />
                </CatalogFieldset>
                <CatalogFieldset title="Chi phí và bảo hành">
                  <NumberInput label="Chi phí pin (VND/kWh)" value={catalogForm.batteryUnitCost} onChange={(batteryUnitCost) => setCatalogForm({ ...catalogForm, batteryUnitCost })} />
                  <NumberInput label="Chi phí PCS (VND/kW)" value={catalogForm.pcsUnitCost} onChange={(pcsUnitCost) => setCatalogForm({ ...catalogForm, pcsUnitCost })} />
                  <NumberInput label="EPC tổng hợp (%)" value={catalogForm.epcPct} onChange={(epcPct) => setCatalogForm({ ...catalogForm, epcPct })} />
                  <NumberInput label="Chi phí khác (%)" value={catalogForm.otherCostPct} onChange={(otherCostPct) => setCatalogForm({ ...catalogForm, otherCostPct })} />
                  <NumberInput label="OPEX hằng năm (%)" value={catalogForm.annualOpexPct} onChange={(annualOpexPct) => setCatalogForm({ ...catalogForm, annualOpexPct })} />
                  <NumberInput label="Bảo hành (năm)" value={catalogForm.warrantyYears} onChange={(warrantyYears) => setCatalogForm({ ...catalogForm, warrantyYears })} />
                  <NumberInput label="Dung lượng giữ lại (%)" value={catalogForm.capacityRetentionPct} onChange={(capacityRetentionPct) => setCatalogForm({ ...catalogForm, capacityRetentionPct })} />
                  <NumberInput label="Bảo hành chu kỳ" value={catalogForm.cycleWarranty} onChange={(cycleWarranty) => setCatalogForm({ ...catalogForm, cycleWarranty })} />
                </CatalogFieldset>
              </form>
            }>
              <ResourceTable rows={catalogs.map((item) => ({ id: item.id, name: item.name, detail: formatCatalogDetail(item), status: item.status, busy: busyKey === `catalog-${item.id}`, onToggle: () => void toggleCatalog(item), onDelete: () => void removeCatalog(item) }))} />
            </ResourceSection>

            <ResourceSection icon={FileBarChart} title="Lịch sử phân tích" count={analyses.length}>
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-brand-muted"><tr><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Tiến độ</th><th className="px-4 py-3">Phiên bản tính toán</th><th className="px-4 py-3">Thời gian</th></tr></thead><tbody>{analyses.map((item) => <tr className="border-t border-brand-line" key={item.id ?? `${item.created_at}-${item.analysis_type}`}><td className="px-4 py-3 font-bold text-brand-navy">{item.analysis_type}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3">{item.progress_pct}%</td><td className="px-4 py-3">{item.engine_version}</td><td className="px-4 py-3">{new Date(item.created_at).toLocaleString("vi-VN")}</td></tr>)}</tbody></table></div>
            </ResourceSection>
          </div>
        )}
    </main>
  );
}

function CatalogFieldset({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-brand-line bg-white p-4">
      <legend className="px-2 text-sm font-bold text-brand-navy">{title}</legend>
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">{children}</div>
    </fieldset>
  );
}

function formatCatalogDetail(item: BessCatalogResponse) {
  const energyKwh = readCatalogNumber(item.battery, "energy_kwh");
  const powerKw = readCatalogNumber(item.pcs, "power_kw");
  const batteryCost = readCatalogNumber(item.cost, "battery_unit_cost_per_kwh");
  const pcsCost = readCatalogNumber(item.cost, "pcs_unit_cost_per_kw");
  const sizingLabel = energyKwh !== null && powerKw !== null
    ? `${powerKw.toLocaleString("vi-VN")} kW / ${energyKwh.toLocaleString("vi-VN")} kWh`
    : "chưa có thông số sizing";
  const costLabel = batteryCost !== null && pcsCost !== null
    ? `pin ${batteryCost.toLocaleString("vi-VN")} / PCS ${pcsCost.toLocaleString("vi-VN")}`
    : "chưa có catalog chi phí";
  return `${item.code} · version ${item.version} · ${sizingLabel} · ${costLabel}`;
}

function readCatalogNumber(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function ResourceSection({ title, count, icon: Icon, form, children }: { title: string; count: number; icon: LucideIcon; form?: ReactNode; children: ReactNode }) {
  return <Card className="rounded-xl bg-white shadow-panel"><div className="flex items-center justify-between border-b border-brand-line p-4"><h2 className="flex items-center gap-2 text-xl font-bold text-brand-navy"><Icon className="text-brand-blue" size={22} />{title}</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">{count}</span></div>{form ? <div className="border-b border-brand-line bg-slate-50/60 p-4">{form}</div> : null}{children}</Card>;
}

function ResourceTable({ rows }: { rows: Array<{ id: string; name: string; detail: string; status: string; busy: boolean; onToggle: () => void; onDelete: () => void }> }) {
  if (!rows.length) return <div className="p-5 text-sm font-medium text-brand-muted">Chưa có dữ liệu.</div>;
  return <div className="divide-y divide-brand-line">{rows.map((row) => <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 p-4" key={row.id}><div><strong className="block text-sm text-brand-navy">{row.name}</strong><span className="mt-1 block text-xs font-medium text-brand-muted">{row.detail}</span></div><span className={cn("rounded-full px-3 py-1 text-xs font-bold", row.status === "active" ? "bg-green-50 text-brand-green" : "bg-slate-100 text-brand-muted")}>{row.status}</span><div className="flex gap-2"><button aria-label="Lưu trữ hoặc khôi phục" className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:text-brand-blue" disabled={row.busy} onClick={row.onToggle} type="button"><Archive size={16} /></button><button aria-label="Xóa" className="grid size-9 place-items-center rounded-lg border border-brand-line text-brand-muted hover:text-red-600" disabled={row.busy} onClick={row.onDelete} type="button">{row.busy ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}</button></div></div>)}</div>;
}

function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1.5 text-xs font-bold text-brand-muted">{label}<input className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} required type={type} value={value} /></label>;
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1.5 text-xs font-bold text-brand-muted">{label}<input className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" min={0} onChange={(event) => onChange(Number(event.target.value))} required step="any" type="number" value={value} /></label>;
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[] | Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  const normalized = options.map((option) => typeof option === "string" ? { label: option, value: option } : option);
  return <label className="grid gap-1.5 text-xs font-bold text-brand-muted">{label}<select className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" onChange={(event) => onChange(event.target.value)} required value={value}><option value="" disabled>Chọn giá trị</option>{normalized.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return <button className={buttonVariants({ className: "mt-[22px] h-10" })} disabled={busy} type="submit">{busy ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />}{label}</button>;
}
