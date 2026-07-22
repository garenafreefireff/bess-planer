"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Info, RotateCcw, Shield, ShieldCheck, SlidersHorizontal, TriangleAlert, Zap } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  calculateQuickSizingMetrics,
  formatNumber,
  formatVnd,
  type QuickSizingAssumptions,
  type QuickSizingScenario
} from "../data/quick-sizing-model";
import type { QuickSizingStep1FormValues } from "../data/quick-sizing-step1-schema";
import { useQuickSizingStore } from "../data/quick-sizing-store";

const scenarioCards: Array<{
  id: Exclude<QuickSizingScenario, "custom">;
  title: string;
  description: string;
  icon: typeof Shield;
}> = [
  { id: "default", title: "Mặc định đề xuất", description: "Cân bằng theo dữ liệu Bước 1", icon: Shield },
  { id: "optimistic", title: "Lạc quan", description: "CAPEX thấp, hiệu suất cao", icon: ShieldCheck },
  { id: "conservative", title: "Thận trọng", description: "Chi phí và chiết khấu bảo thủ", icon: Info }
];

type NumericAssumptionKey = {
  [K in keyof QuickSizingAssumptions]: QuickSizingAssumptions[K] extends number ? K : never
}[keyof QuickSizingAssumptions];

type NumberField = {
  key: NumericAssumptionKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
};

const technicalFields: NumberField[] = [
  { key: "energyKwh", label: "Dung lượng BESS", unit: "kWh", min: 100, max: 10_000, step: 50 },
  { key: "powerKw", label: "Công suất BESS", unit: "kW", min: 50, max: 5_000, step: 25 },
  { key: "dodPct", label: "Độ sâu xả DoD", unit: "%", min: 50, max: 100 },
  { key: "rtePct", label: "Hiệu suất vòng RTE", unit: "%", min: 70, max: 100 },
  { key: "degradationPct", label: "Suy hao pin", unit: "%/năm", min: 0, max: 5, step: 0.1 },
  { key: "cyclesPerDay", label: "Chu kỳ sạc/xả", unit: "chu kỳ/ngày", min: 0.2, max: 3, step: 0.1 },
  { key: "operatingDaysPerYear", label: "Ngày vận hành", unit: "ngày/năm", min: 100, max: 365 }
];

const costFields: NumberField[] = [
  { key: "batteryCostVndPerKwh", label: "Chi phí pin", unit: "VND/kWh", min: 1_000_000, max: 15_000_000, step: 100_000 },
  { key: "pcsCostVndPerKw", label: "Chi phí PCS", unit: "VND/kW", min: 500_000, max: 8_000_000, step: 100_000 },
  { key: "epcFixedVnd", label: "Chi phí EPC cố định", unit: "VND", min: 0, max: 20_000_000_000, step: 100_000_000 },
  { key: "omPct", label: "O&M hằng năm", unit: "% CAPEX/năm", min: 0, max: 10, step: 0.1 },
  { key: "omGrowthPct", label: "Tăng O&M", unit: "%/năm", min: 0, max: 10, step: 0.1 }
];

const tariffFields: NumberField[] = [
  { key: "offPeakPrice", label: "Giá thấp điểm", unit: "VND/kWh", min: 0, max: 5_000, step: 10 },
  { key: "normalPrice", label: "Giá bình thường", unit: "VND/kWh", min: 0, max: 5_000, step: 10 },
  { key: "peakPrice", label: "Giá cao điểm", unit: "VND/kWh", min: 0, max: 8_000, step: 10 },
  { key: "demandPrice", label: "Giá công suất", unit: "VND/kW/tháng", min: 0, max: 500_000, step: 10_000 },
  { key: "priceEscalationPct", label: "Tăng giá điện", unit: "%/năm", min: 0, max: 15, step: 0.1 }
];

const financeFields: NumberField[] = [
  { key: "debtPct", label: "Tỷ lệ vốn vay", unit: "%", min: 0, max: 100 },
  { key: "interestPct", label: "Lãi suất vay", unit: "%/năm", min: 0, max: 25, step: 0.1 },
  { key: "loanTenorYears", label: "Thời hạn vay", unit: "năm", min: 1, max: 20 },
  { key: "waccPct", label: "WACC", unit: "%", min: 0, max: 30, step: 0.1 },
  { key: "taxPct", label: "Thuế TNDN", unit: "%", min: 0, max: 40 }
];

export function QuickSizingAssumptionFlow() {
  const basicInfo = useQuickSizingStore((state) => state.basicInfo);
  const assumptions = useQuickSizingStore((state) => state.assumptions);
  const scenario = useQuickSizingStore((state) => state.scenario);
  const dirtyFields = useQuickSizingStore((state) => state.dirtyFields);
  const initializeAssumptions = useQuickSizingStore((state) => state.initializeAssumptions);
  const applyScenario = useQuickSizingStore((state) => state.applyScenario);
  const updateAssumption = useQuickSizingStore((state) => state.updateAssumption);
  const resetAssumptions = useQuickSizingStore((state) => state.resetAssumptions);
  const updateNumericAssumption = (key: NumericAssumptionKey, value: number) => updateAssumption(key, value);

  useEffect(() => {
    initializeAssumptions();
  }, [initializeAssumptions]);

  const metrics = useMemo(() => calculateQuickSizingMetrics(assumptions, basicInfo), [assumptions, basicInfo]);
  const inherited = useMemo(() => buildInheritedLabels(basicInfo), [basicInfo]);

  const selectScenario = (nextScenario: Exclude<QuickSizingScenario, "custom">) => {
    if (dirtyFields.length > 0 && !window.confirm("Áp dụng kịch bản mới sẽ thay thế các giả định đã chỉnh sửa. Tiếp tục?")) {
      return;
    }
    applyScenario(nextScenario);
  };

  return (
    <section className="site-container pb-10 pt-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
        <Link href="/">Trang chủ</Link><ArrowRight size={13} /><Link href="/quick-sizing">Quick Sizing</Link><ArrowRight size={13} /><span className="text-brand-navy">Giả định</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-6 max-xl:flex-col max-xl:items-stretch">
        <div>
          <h1 className="text-[32px] font-extrabold text-brand-navy">Kiểm tra giả định Quick Sizing</h1>
          <p className="mt-1.5 text-sm font-medium text-brand-muted">Các giá trị dưới đây được khởi tạo từ thông tin đã nhập ở Bước 1 và cập nhật kết quả ngay khi thay đổi.</p>
        </div>
        <Stepper />
      </div>

      <Card className="mt-4 rounded-xl bg-white p-3 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="mr-1 text-sm text-brand-navy">Dữ liệu kế thừa:</strong>
          {inherited.map((item) => <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-navy" key={item}>{item}</span>)}
          {!basicInfo ? <span className="text-xs font-semibold text-amber-700">Chưa tìm thấy dữ liệu Bước 1, đang dùng bộ mặc định.</span> : null}
          <Link className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "ml-auto")} href="/quick-sizing">Chỉnh sửa Bước 1</Link>
        </div>
      </Card>

      <Card className="mt-4 rounded-xl bg-white p-3 shadow-panel">
        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {scenarioCards.map(({ id, title, description, icon: Icon }) => {
            const active = scenario === id;
            return (
              <button className={cn("grid min-h-[76px] grid-cols-[38px_1fr] items-center gap-3 rounded-xl border p-3 text-left", active ? "border-brand-blue bg-blue-50" : "border-brand-line bg-white hover:border-brand-blue")} key={id} onClick={() => selectScenario(id)} type="button">
                <span className={cn("grid size-9 place-items-center rounded-lg", active ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-muted")}><Icon size={19} /></span>
                <span><strong className="block text-sm text-brand-navy">{title}</strong><small className="mt-1 block text-xs font-medium text-brand-muted">{description}</small></span>
              </button>
            );
          })}
          <div className={cn("grid min-h-[76px] grid-cols-[38px_1fr] items-center gap-3 rounded-xl border p-3", scenario === "custom" ? "border-violet-400 bg-violet-50" : "border-brand-line bg-white")}>
            <span className="grid size-9 place-items-center rounded-lg bg-violet-100 text-violet-700"><SlidersHorizontal size={19} /></span>
            <span><strong className="block text-sm text-brand-navy">Tùy chỉnh</strong><small className="mt-1 block text-xs font-medium text-brand-muted">Tự động kích hoạt khi sửa giá trị</small></span>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5 max-xl:grid-cols-1">
        <div className="grid min-w-0 gap-5">
          <div className="grid grid-cols-2 items-stretch gap-5 max-lg:grid-cols-1">
            <FieldCard title="Cấu hình kỹ thuật"><FieldGrid fields={technicalFields} values={assumptions} onChange={updateNumericAssumption} /></FieldCard>
            <FieldCard title="Chi phí đầu tư & vận hành"><FieldGrid fields={costFields} values={assumptions} onChange={updateNumericAssumption} /></FieldCard>
          </div>
          <FieldCard title="Biểu giá & giả định tài chính">
            <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
              <section><h3 className="mb-3 text-sm font-bold text-brand-navy">Biểu giá</h3><FieldGrid fields={tariffFields} values={assumptions} onChange={updateNumericAssumption} /></section>
              <section><h3 className="mb-3 text-sm font-bold text-brand-navy">Tài chính</h3><FieldGrid fields={financeFields} values={assumptions} onChange={updateNumericAssumption} />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-semibold text-brand-navy">Thời hạn phân tích<select className="h-10 rounded-lg border border-brand-line bg-white px-3" value={assumptions.analysisYears} onChange={(event) => updateAssumption("analysisYears", Number(event.target.value))}><option value={5}>5 năm</option><option value={10}>10 năm</option><option value={15}>15 năm</option></select></label>
                  <label className="grid gap-1.5 text-sm font-semibold text-brand-navy">VAT<select className="h-10 rounded-lg border border-brand-line bg-white px-3" value={assumptions.vatIncluded ? "included" : "excluded"} onChange={(event) => updateAssumption("vatIncluded", event.target.value === "included")}><option value="excluded">Chưa bao gồm</option><option value="included">Đã bao gồm</option></select></label>
                </div>
              </section>
            </div>
          </FieldCard>
        </div>

        <aside className="sticky top-24 h-fit">
          <Card className="rounded-xl bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold text-brand-navy">Tóm tắt tạm tính</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">Cập nhật realtime</span></div>
            <Summary title="Cấu hình">
              <SummaryRow label="Công suất" value={`${formatNumber(metrics.powerKw, 0)} kW`} />
              <SummaryRow label="Dung lượng" value={`${formatNumber(metrics.energyKwh, 0)} kWh`} />
              <SummaryRow label="Thời lượng" value={`${formatNumber(metrics.durationHours, 2)} giờ`} />
              <SummaryRow label="Năng lượng khả dụng" value={`${formatNumber(metrics.usableEnergyKwh, 0)} kWh`} />
            </Summary>
            <Summary title="Hiệu quả sơ bộ">
              <SummaryRow label="CAPEX" value={formatVnd(metrics.capexVnd)} />
              <SummaryRow label="Tiết kiệm/năm" value={formatVnd(metrics.annualSavingVnd)} />
              <SummaryRow label="Payback" value={`${formatNumber(metrics.paybackYears, 1)} năm`} />
              <SummaryRow label={`NPV ${assumptions.analysisYears} năm`} value={formatVnd(metrics.npvVnd)} />
              <SummaryRow label="IRR ước tính" value={`${formatNumber(metrics.irrPct, 1)}%`} />
            </Summary>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-800"><span className="flex items-center gap-2 font-bold"><TriangleAlert size={16} />Kiểm tra giả định</span>{assumptions.cyclesPerDay > 1.5 ? <p className="mt-1">Chu kỳ trên 1,5 lần/ngày có thể làm giảm tuổi thọ pin.</p> : null}{assumptions.rtePct < 85 ? <p className="mt-1">RTE dưới 85% làm giảm hiệu quả kinh tế.</p> : null}{metrics.paybackYears > assumptions.analysisYears ? <p className="mt-1">Thời gian hoàn vốn đang dài hơn thời hạn phân tích.</p> : null}</div>
          </Card>
        </aside>
      </div>

      <div className="mt-4 grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-xl border border-brand-line bg-white p-3 shadow-panel max-lg:grid-cols-1">
        <Link className={buttonVariants({ variant: "secondary", className: "h-11" })} href="/quick-sizing"><ArrowLeft size={17} />Quay lại</Link>
        <button className={buttonVariants({ variant: "secondary", className: "h-11" })} onClick={resetAssumptions} type="button"><RotateCcw size={17} />Khôi phục đề xuất</button>
        <span className="text-center text-sm font-semibold text-brand-muted">{dirtyFields.length > 0 ? `Đã chỉnh sửa ${dirtyFields.length} giả định` : "Đang sử dụng bộ giả định đề xuất"}</span>
        <Link className={buttonVariants({ className: "h-11 px-7" })} href="/quick-sizing/ket-qua"><Zap size={18} />Tính kết quả<ArrowRight size={18} /></Link>
      </div>
    </section>
  );
}

function Stepper() {
  const steps = [
    { number: "1", label: "Thông tin", status: "done" },
    { number: "2", label: "Giả định", status: "active" },
    { number: "3", label: "Kết quả", status: "upcoming" }
  ] as const;

  return (
    <div className="grid h-[68px] min-w-[560px] grid-cols-[auto_1fr_auto_1fr_auto] items-center rounded-xl border border-brand-line bg-white px-5 shadow-panel max-sm:min-w-0 max-sm:px-3">
      {steps.map((step, index) => (
        <div className="contents" key={step.label}>
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold",
                step.status === "done" && "border-green-200 bg-green-50 text-brand-green",
                step.status === "active" && "border-brand-blue bg-brand-blue text-white",
                step.status === "upcoming" && "border-slate-200 bg-slate-100 text-brand-muted"
              )}
            >
              {step.status === "done" ? <Check size={17} /> : step.number}
            </span>
            <strong className={cn("truncate text-xs", step.status === "active" ? "text-brand-blue" : "text-brand-muted")}>{step.label}</strong>
          </span>
          {index < steps.length - 1 ? <span className={cn("mx-3 border-t-2 border-dashed", index === 0 ? "border-green-200" : "border-blue-200")} /> : null}
        </div>
      ))}
    </div>
  );
}

function FieldCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card className="h-full min-w-0 rounded-xl bg-white p-5 shadow-panel">
      <h2 className="mb-4 text-lg font-bold text-brand-navy">{title}</h2>
      {children}
    </Card>
  );
}

function FieldGrid({ fields, values, onChange }: { fields: NumberField[]; values: QuickSizingAssumptions; onChange: (key: NumericAssumptionKey, value: number) => void }) {
  return (
    <div className="grid gap-2.5">
      {fields.map((field) => {
        const value = Number(values[field.key]);
        const percentage = Math.min(100, Math.max(0, ((value - field.min) / (field.max - field.min)) * 100));
        const sliderBackground = `linear-gradient(90deg, #075BEA 0%, #075BEA ${percentage}%, #E4ECF7 ${percentage}%, #E4ECF7 100%)`;

        return (
          <label
            className="grid gap-2 rounded-lg border border-transparent px-2 py-2 transition hover:bg-slate-50/80 focus-within:border-brand-blue/30 focus-within:bg-blue-50/40"
            key={field.key}
          >
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-brand-navy">
              <span>{field.label}</span>
              <small className="shrink-0 text-xs font-medium text-brand-muted">{field.unit}</small>
            </span>
            <span className="grid grid-cols-[minmax(120px,1fr)_152px] items-center gap-4 max-sm:grid-cols-1">
              <input
                aria-label={field.label}
                aria-valuetext={`${formatNumber(value, 2)} ${field.unit}`}
                className="h-2.5 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:shadow-md"
                min={field.min}
                max={field.max}
                step={field.step ?? 1}
                style={{ background: sliderBackground }}
                type="range"
                value={value}
                onChange={(event) => onChange(field.key, Number(event.target.value))}
              />
              <EditableNumberInput field={field} value={value} onChange={(nextValue) => onChange(field.key, nextValue)} />
            </span>
          </label>
        );
      })}
    </div>
  );
}

function EditableNumberInput({ field, value, onChange }: { field: NumberField; value: number; onChange: (value: number) => void }) {
  const fractionDigits = field.step && field.step < 1 ? Math.max(1, String(field.step).split(".")[1]?.length ?? 1) : 0;
  const [draft, setDraft] = useState(() => formatNumber(value, fractionDigits));

  useEffect(() => {
    setDraft(formatNumber(value, fractionDigits));
  }, [fractionDigits, value]);

  const commit = () => {
    const normalized = draft.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      setDraft(formatNumber(value, fractionDigits));
      return;
    }

    const bounded = Math.min(field.max, Math.max(field.min, parsed));
    onChange(bounded);
    setDraft(formatNumber(bounded, fractionDigits));
  };

  return (
    <input
      aria-label={`${field.label} nhập trực tiếp`}
      className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-right text-sm font-semibold tabular-nums text-brand-navy outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
      inputMode={fractionDigits > 0 ? "decimal" : "numeric"}
      value={draft}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(formatNumber(value, fractionDigits));
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function Summary({ children, title }: { children: ReactNode; title: string }) {
  return <section className="mt-4 border-t border-blue-50 pt-3"><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-muted">{title}</h3><div className="grid gap-2">{children}</div></section>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium text-brand-muted">{label}</span><strong className="text-right text-brand-navy">{value}</strong></div>;
}

function buildInheritedLabels(values: QuickSizingStep1FormValues | null) {
  if (!values) return ["Bộ dữ liệu mặc định"];
  const objectiveLabels: Record<string, string> = { saving: "Tiết kiệm điện", peak_shaving: "Cắt đỉnh", solar_optimization: "Tối ưu PV", backup: "Dự phòng", power_quality: "Chất lượng điện", investment: "Đánh giá đầu tư" };
  return [
    values.industry === "Khác" ? values.customIndustry || "Ngành khác" : values.industry,
    values.estimatedLoadRange,
    values.monthlyElectricityBillVnd ? `${formatVnd(values.monthlyElectricityBillVnd)}/tháng` : "Chưa có tiền điện",
    values.voltageLevel,
    values.operatingHoursPerDay ? `${values.operatingHoursPerDay} giờ/ngày` : "Chưa có giờ vận hành",
    values.solarStatus === "yes" ? "Đã có PV" : values.solarStatus === "planned" ? "Dự kiến có PV" : "Chưa có PV",
    values.bessObjectives.map((item) => objectiveLabels[item] ?? item).join(", ") || "Chưa chọn mục tiêu"
  ].filter(Boolean);
}
