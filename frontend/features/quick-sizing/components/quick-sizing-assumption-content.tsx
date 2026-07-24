"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Info,
  LockKeyhole,
  RotateCcw,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Zap
} from "lucide-react";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "amber" | "purple" | "slate";

type AssumptionRow = {
  key: string;
  label: string;
  min: number;
  max: number;
  value: number;
  unit: string;
  source?: "Tự động đề xuất" | "Mặc định hệ thống" | "Đã chỉnh sửa";
  step?: number;
};

const scenarios = [
  { title: "Mặc định đề xuất", description: "Phù hợp nhất với dữ liệu Bước 1", icon: Shield, tone: "blue" },
  { title: "Lạc quan", description: "Hiệu suất cao, CAPEX thấp", icon: ShieldCheck, tone: "green" },
  { title: "Thận trọng", description: "Chi phí và chiết khấu bảo thủ", icon: Info, tone: "amber" },
  { title: "Tùy chỉnh", description: "Tự thiết lập giả định", icon: SlidersHorizontal, tone: "purple" }
] as const;

const inheritedChips = [
  "Sản xuất",
  "5.000 kVA",
  "1,2 tỷ/tháng",
  "22 kV",
  "16 giờ/ngày",
  "Không có PV",
  "Mục tiêu: Tiết kiệm điện"
];

const technicalRows: AssumptionRow[] = [
  { key: "energy", label: "Dung lượng BESS", min: 100, max: 5000, value: 1000, unit: "kWh", source: "Tự động đề xuất" },
  { key: "power", label: "Công suất BESS", min: 50, max: 2000, value: 500, unit: "kW", source: "Tự động đề xuất" },
  { key: "dod", label: "DoD", min: 50, max: 100, value: 90, unit: "%", source: "Mặc định hệ thống" },
  { key: "rte", label: "RTE", min: 70, max: 100, value: 90, unit: "%", source: "Mặc định hệ thống" },
  { key: "degradation", label: "Suy hao pin", min: 0, max: 5, value: 2, unit: "%/năm", source: "Mặc định hệ thống", step: 0.1 },
  { key: "cycles", label: "Chu kỳ sạc/xả", min: 0.5, max: 3, value: 1, unit: "chu kỳ/ngày", source: "Tự động đề xuất", step: 0.1 },
  { key: "days", label: "Ngày vận hành", min: 200, max: 365, value: 300, unit: "ngày/năm", source: "Tự động đề xuất" }
];

const costRows = [
  { label: "Chi phí hệ thống pin DC", value: "3.000.000", unit: "VND/kWh danh định" },
  { label: "Chi phí thiết bị PCS", value: "1.500.000", unit: "VND/kW AC" },
  { label: "EPC & triển khai tổng hợp", value: "Theo all-in rate", unit: "% Equipment" },
  { label: "O&M hằng năm", value: "2,0", unit: "% CAPEX/năm" },
  { label: "Tăng O&M", value: "2,0", unit: "%/năm" }
];

const tariffRows: AssumptionRow[] = [
  { key: "offPeak", label: "Giá thấp điểm", min: 500, max: 2000, value: 1028, unit: "VND/kWh" },
  { key: "normal", label: "Giá bình thường", min: 800, max: 2500, value: 1666, unit: "VND/kWh" },
  { key: "peak", label: "Giá cao điểm", min: 1200, max: 3500, value: 2797, unit: "VND/kWh" },
  { key: "demand", label: "Giá công suất", min: 50000, max: 200000, value: 150000, unit: "VND/kW/tháng" },
  { key: "priceEscalation", label: "Tăng giá điện", min: 0, max: 10, value: 5, unit: "%/năm", step: 0.1 }
];

const financeRows: AssumptionRow[] = [
  { key: "debt", label: "Tỷ lệ vốn vay", min: 0, max: 100, value: 70, unit: "%" },
  { key: "interest", label: "Lãi suất vay", min: 5, max: 15, value: 9, unit: "%/năm", step: 0.1 },
  { key: "loanTenor", label: "Thời hạn vay", min: 5, max: 15, value: 7, unit: "năm" },
  { key: "wacc", label: "WACC", min: 5, max: 20, value: 10, unit: "%", step: 0.1 },
  { key: "tax", label: "Thuế TNDN", min: 10, max: 30, value: 20, unit: "%" }
];

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-brand-blue",
  green: "bg-green-50 text-brand-green",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-brand-muted"
};

export function QuickSizingAssumptionContent() {
  const [scenario, setScenario] = useState("Mặc định đề xuất");
  const [changeCount, setChangeCount] = useState(0);

  const markChanged = () => setChangeCount((count) => count + 1);
  const resetChanges = () => {
    setScenario("Mặc định đề xuất");
    setChangeCount(0);
  };

  const comparisonText = changeCount === 0 ? "Chưa thay đổi" : "Đã cập nhật";

  return (
    <section className="mx-auto w-[min(1560px,calc(100%_-_40px))] pb-7 pt-4 max-sm:w-[min(100%_-_28px,640px)]">
      <Breadcrumb />

      <div className="mt-3 grid grid-cols-[1fr_620px] items-end gap-6 max-xl:grid-cols-1">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight text-brand-navy">Quick Sizing</h1>
          <p className="mt-1.5 max-w-[820px] text-[15px] font-medium leading-6 text-brand-muted">
            Kiểm tra và điều chỉnh các giả định được hệ thống đề xuất từ thông tin ở Bước 1.
          </p>
        </div>
        <AssumptionStepper />
      </div>

      <InheritedDataStrip />
      <ScenarioSelector onChange={(title) => { setScenario(title); markChanged(); }} selected={scenario} />

      <div className="mt-4 grid gap-4">
        <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,0.36fr)_minmax(0,0.36fr)_minmax(330px,0.28fr)]">
          <TechnicalCard onChange={markChanged} />
          <CostCard onChange={markChanged} />
          <SummaryColumn comparisonText={comparisonText} />
        </div>

        <TariffFinanceCard onChange={markChanged} />
      </div>

      <BottomActionBar changeCount={changeCount} onReset={resetChanges} />
    </section>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-muted">
      <span>Trang chủ</span>
      <ArrowRight size={13} aria-hidden />
      <span>Quick Sizing</span>
      <ArrowRight size={13} aria-hidden />
      <span className="text-brand-navy">Giả định</span>
    </div>
  );
}

function AssumptionStepper() {
  const steps = [
    { number: 1, title: "Bước 1", description: "Thông tin cơ bản", done: true },
    { number: 2, title: "Bước 2", description: "Giả định", active: true },
    { number: 3, title: "Bước 3", description: "Kết quả" }
  ];

  return (
    <div className="grid h-[70px] grid-cols-[auto_1fr_auto_1fr_auto] items-center rounded-xl border border-brand-line bg-white px-5 shadow-panel">
      {steps.map((step, index) => (
        <Fragment key={step.number}>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-sm font-bold",
                step.active && "bg-brand-blue text-white",
                step.done && "border border-brand-green bg-green-50 text-brand-green",
                !step.active && !step.done && "bg-slate-100 text-brand-navy/70"
              )}
            >
              {step.done ? <Check size={18} aria-hidden /> : step.number}
            </span>
            <span>
              <strong className={cn("block text-xs font-bold", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.title}</strong>
              <small className={cn("block text-xs font-semibold", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.description}</small>
            </span>
          </div>
          {index < steps.length - 1 ? <span className="mx-4 border-t-2 border-dashed border-blue-200" /> : null}
        </Fragment>
      ))}
    </div>
  );
}

function InheritedDataStrip() {
  return (
    <Card className="mt-3 rounded-xl bg-white px-4 py-2.5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="mr-1 text-sm font-bold text-brand-navy">Dữ liệu kế thừa từ Bước 1</strong>
          {inheritedChips.map((chip) => (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-navy" key={chip}>
              {chip}
            </span>
          ))}
        </div>
        <Link className={buttonVariants({ variant: "secondary", className: "h-9 shrink-0 text-sm font-bold" })} href="/quick-sizing">
          <Eye size={15} />
          Xem lại Bước 1
        </Link>
      </div>
    </Card>
  );
}

function ScenarioSelector({ onChange, selected }: { selected: string; onChange: (title: string) => void }) {
  return (
    <Card className="mt-3 rounded-xl bg-white p-3 shadow-panel">
      <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {scenarios.map(({ description, icon: Icon, title, tone }) => {
          const isSelected = selected === title;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "grid min-h-[70px] grid-cols-[34px_1fr_16px] items-center gap-2.5 rounded-xl border bg-white px-3 py-2 text-left transition hover:border-brand-blue hover:bg-blue-50/60",
                isSelected && "border-brand-blue bg-blue-50 shadow-[0_0_0_1px_rgba(7,91,234,0.16)]"
              )}
              key={title}
              onClick={() => onChange(title)}
              type="button"
            >
              <span className={cn("grid size-8 place-items-center rounded-lg", isSelected ? "bg-brand-blue text-white" : toneClasses[tone as Tone])}>
                <Icon size={18} />
              </span>
              <span>
                <strong className="block text-sm font-bold text-brand-navy">{title}</strong>
                <small className="mt-0.5 block text-xs font-medium leading-4 text-brand-muted">{description}</small>
              </span>
              <span className={cn("size-4 rounded-full border", isSelected ? "border-brand-blue bg-brand-blue shadow-[inset_0_0_0_3px_white]" : "border-slate-300")} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function TechnicalCard({ onChange }: { onChange: () => void }) {
  return (
    <AssumptionCard className="h-full" title="Cấu hình kỹ thuật">
      <div className="grid gap-3">
        {technicalRows.map((row) => (
          <SliderRow key={row.key} row={row} onChange={onChange} />
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[13px] font-medium leading-5 text-brand-muted">
        Các giá trị này được đề xuất từ dữ liệu đã nhập ở Bước 1 và có thể điều chỉnh.
      </div>
    </AssumptionCard>
  );
}

function CostCard({ onChange }: { onChange: () => void }) {
  return (
    <AssumptionCard className="flex h-full flex-col" title="Chi phí đầu tư & vận hành">
      <div className="grid gap-2.5">
        {costRows.map((row) => (
          <NumericInputRow key={row.label} onChange={onChange} {...row} />
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-brand-green">
        <span className="block">CAPEX tạm tính</span>
        <span className="mt-1 block text-[26px] leading-none">11,2 tỷ VND</span>
      </div>
    </AssumptionCard>
  );
}

function TariffFinanceCard({ onChange }: { onChange: () => void }) {
  const tariffPriceRows = tariffRows.slice(0, 4);
  const escalationRow = tariffRows[4];
  const financeSliderRows = financeRows.filter((row) => ["debt", "interest", "wacc"].includes(row.key));

  return (
    <AssumptionCard title="Biểu giá & giả định tài chính">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <section className="min-w-0 rounded-xl border border-blue-100 bg-slate-50/55 p-4">
          <h3 className="text-[17px] font-bold text-brand-navy">Biểu giá</h3>

          <div className="mt-3">
            <div className="grid grid-cols-[1fr_1fr_1.45fr] gap-3 max-2xl:grid-cols-2 max-sm:grid-cols-1">
              <SelectField label="Nhóm khách hàng" value="Sản xuất" />
              <SelectField label="Cấp điện áp" value="22 kV" />
              <SelectField label="Bộ giá áp dụng" value="Giá sản xuất 22 kV - 2026" />
            </div>
          </div>

          <TariffNumberTable onChange={onChange} rows={tariffPriceRows} />

          <div className="mt-4 grid items-end gap-4 border-t border-blue-100 pt-4 lg:grid-cols-[minmax(0,1fr)_270px]">
            <WideSliderRow row={escalationRow} onChange={onChange} />
            <VatSegmentedControl onChange={onChange} />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-blue-100 bg-slate-50/55 p-4">
          <h3 className="text-[17px] font-bold text-brand-navy">Tài chính</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {financeSliderRows.map((row) => (
              <WideSliderRow compact key={row.key} row={row} onChange={onChange} />
            ))}
            <StaticNumberField label="Thời hạn vay" onChange={onChange} unit="năm" value="7" />
            <StaticNumberField label="Thuế TNDN" onChange={onChange} unit="%" value="20" />
            <SelectField label="Thời hạn phân tích" value="10 năm" options={["5 năm", "10 năm", "15 năm"]} />
          </div>
        </section>
      </div>
    </AssumptionCard>
  );
}

function SummaryColumn({ comparisonText }: { comparisonText: string }) {
  return (
    <aside className="h-full">
      <Card className="h-full rounded-xl bg-white p-4 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[20px] font-bold leading-tight text-brand-navy">Tóm tắt & ảnh hưởng</h2>
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-brand-blue">Kết quả tạm tính</span>
        </div>

        <SummarySection title="Cấu hình">
          <SummaryRow label="Dung lượng" value="1.000 kWh" />
          <SummaryRow label="Công suất" value="500 kW" />
          <SummaryRow label="Thời lượng" value="2,0 giờ" />
          <SummaryRow label="Năng lượng khả dụng" value="900 kWh" />
          <SummaryRow label="CAPEX" value="11,2 tỷ VND" />
        </SummarySection>

        <SummarySection title="Hiệu quả tạm tính">
          <div className="grid grid-cols-3 gap-2">
            <KpiBox label="Tiết kiệm" value="2,90 tỷ/năm" />
            <KpiBox label="Payback" value="5,1 năm" />
            <KpiBox label="NPV 10 năm" value="12,45 tỷ" />
          </div>
        </SummarySection>

        <SummarySection title="Thay đổi so với mặc định">
          <SummaryRow label="CAPEX" value={comparisonText} />
          <SummaryRow label="NPV" value={comparisonText} />
          <SummaryRow label="Payback" value={comparisonText} />
        </SummarySection>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-amber-800">
            <TriangleAlert size={17} />
            Lưu ý
          </h3>
          <ul className="mt-2 grid gap-1.5 text-[13px] font-medium leading-5 text-amber-800">
            <li>• Chu kỳ trên 1,5 lần/ngày có thể ảnh hưởng tuổi thọ pin.</li>
            <li>• RTE dưới 85% có thể làm giảm hiệu quả kinh tế.</li>
          </ul>
        </div>
      </Card>
    </aside>
  );
}

function SummarySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="mt-4 border-t border-blue-50 pt-3">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-navy">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function AssumptionCard({ children, className, title }: { children: ReactNode; className?: string; title: string }) {
  return (
    <Card className={cn("rounded-xl bg-white p-4 shadow-panel", className)}>
      <h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold leading-tight text-brand-navy">
        {title}
        <Info size={15} className="text-brand-muted" aria-hidden />
      </h2>
      {children}
    </Card>
  );
}

function TariffNumberTable({ onChange, rows }: { onChange: () => void; rows: AssumptionRow[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white">
      <div className="grid grid-cols-[1.1fr_150px_150px_1fr] bg-blue-50/70 px-3 py-2 text-xs font-bold uppercase text-brand-muted max-lg:hidden">
        <span>Thành phần giá</span>
        <span>Giá trị</span>
        <span>Đơn vị</span>
        <span>Nguồn</span>
      </div>
      <div className="divide-y divide-blue-50">
        {rows.map((row) => (
          <TariffNumberRow key={row.key} onChange={onChange} row={row} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 bg-slate-50/80 px-3 py-2.5">
        <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-muted">
          <LockKeyhole size={14} className="text-brand-blue" />
          Đồng bộ theo bộ giá điện
        </span>
        <button
          className="h-8 rounded-lg border border-brand-blue bg-white px-3 text-xs font-bold text-brand-blue transition hover:bg-blue-50"
          onClick={onChange}
          type="button"
        >
          Cho phép chỉnh thủ công
        </button>
      </div>
    </div>
  );
}

function TariffNumberRow({ onChange, row }: { onChange: () => void; row: AssumptionRow }) {
  return (
    <label className="grid items-center gap-2 px-3 py-2.5 text-sm lg:grid-cols-[1.1fr_150px_150px_1fr]">
      <span className="font-semibold text-brand-navy">{row.label}</span>
      <input
        className="h-9 rounded-lg border border-brand-line bg-white px-3 text-right text-sm font-semibold tabular-nums text-brand-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
        defaultValue={formatNumber(row.value)}
        onChange={onChange}
      />
      <span className="text-xs font-bold text-brand-muted">{row.unit}</span>
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-brand-green">Theo bộ giá áp dụng</span>
    </label>
  );
}

function StaticNumberField({ label, onChange, unit, value }: { label: string; onChange: () => void; unit: string; value: string }) {
  return (
    <label className="grid gap-1.5 rounded-lg border border-transparent p-2 transition focus-within:border-brand-blue/40 focus-within:bg-blue-50/40">
      <span className="text-[14px] font-semibold text-brand-navy">{label}</span>
      <span className="grid grid-cols-[1fr_74px]">
        <input
          className="h-10 rounded-l-lg border border-r-0 border-brand-line bg-white px-2.5 text-right text-sm font-semibold tabular-nums text-brand-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          defaultValue={value}
          onChange={onChange}
        />
        <span className="grid h-10 place-items-center rounded-r-lg border border-brand-line bg-white text-xs font-bold text-brand-muted">{unit}</span>
      </span>
    </label>
  );
}

function WideSliderRow({
  compact,
  emphasis,
  onChange,
  row
}: {
  compact?: boolean;
  emphasis?: boolean;
  onChange: () => void;
  row: AssumptionRow;
}) {
  const [value, setValue] = useState(row.value);
  const percentage = Math.min(100, Math.max(0, ((value - row.min) / (row.max - row.min)) * 100));
  const sliderBackground = `linear-gradient(90deg, #075BEA 0%, #075BEA ${percentage}%, #E5ECF7 ${percentage}%, #E5ECF7 100%)`;

  const handleChange = (nextValue: number) => {
    if (Number.isNaN(nextValue)) {
      return;
    }

    const boundedValue = Math.min(row.max, Math.max(row.min, nextValue));
    setValue(boundedValue);
    onChange();
  };

  return (
    <label
      className={cn(
        "grid gap-2 rounded-lg border border-transparent p-2 transition focus-within:border-brand-blue/40 focus-within:bg-blue-50/40",
        emphasis && "border-blue-100 bg-blue-50/50"
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-semibold text-brand-navy">{row.label}</span>
        <span className="hidden text-xs font-semibold text-brand-muted sm:inline">
          {formatNumber(row.min)} - {formatNumber(row.max)}
        </span>
      </span>
      <span className={cn("grid items-center gap-3", compact ? "grid-cols-[minmax(160px,1fr)_82px_74px]" : "grid-cols-[minmax(260px,1fr)_108px_112px]")}>
        <input
          aria-label={row.label}
          className={cn(
            "h-3 cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:shadow-md",
            compact ? "min-w-[160px]" : "min-w-[220px]"
          )}
          max={row.max}
          min={row.min}
          onChange={(event) => handleChange(Number(event.target.value))}
          step={row.step ?? 1}
          style={{ background: sliderBackground }}
          type="range"
          value={value}
        />
        <input
          className="h-10 rounded-lg border border-brand-line bg-white px-2.5 text-right text-sm font-semibold tabular-nums text-brand-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          onChange={(event) => handleChange(parseLocalizedNumber(event.target.value))}
          value={formatNumber(value)}
        />
        <span className="text-xs font-bold leading-4 text-brand-muted">{row.unit}</span>
      </span>
    </label>
  );
}

function VatSegmentedControl({ onChange }: { onChange: () => void }) {
  const [value, setValue] = useState<"excluded" | "included">("excluded");
  const selectVat = (nextValue: "excluded" | "included") => {
    setValue(nextValue);
    onChange();
  };

  return (
    <div className="grid gap-2 rounded-lg bg-blue-50/60 p-2">
      <span className="text-[14px] font-semibold text-brand-navy">VAT</span>
      <div className="grid grid-cols-2 rounded-lg border border-blue-100 bg-white p-1">
        {[
          { id: "excluded", label: "Chưa bao gồm" },
          { id: "included", label: "Đã bao gồm" }
        ].map((option) => (
          <button
            className={cn(
              "h-9 rounded-md text-sm font-bold transition",
              value === option.id ? "bg-brand-blue text-white shadow-sm" : "text-brand-muted hover:bg-blue-50 hover:text-brand-blue"
            )}
            key={option.id}
            onClick={() => selectVat(option.id as "excluded" | "included")}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({ compact, onChange, row }: { compact?: boolean; onChange: () => void; row: AssumptionRow }) {
  const [value, setValue] = useState(row.value);
  const source = useMemo(() => (value === row.value ? row.source : "Đã chỉnh sửa"), [row.source, row.value, value]);
  const percentage = Math.min(100, Math.max(0, ((value - row.min) / (row.max - row.min)) * 100));
  const sliderBackground = `linear-gradient(90deg, #075BEA 0%, #075BEA ${percentage}%, #E5ECF7 ${percentage}%, #E5ECF7 100%)`;

  const handleChange = (nextValue: number) => {
    setValue(nextValue);
    onChange();
  };

  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-semibold text-brand-navy">{row.label}</span>
        {source ? <SourceBadge source={source} /> : null}
      </span>
      <span className={cn("grid items-center gap-2", compact ? "grid-cols-[1fr_78px_88px]" : "grid-cols-[1fr_86px_94px]")}>
        <input
          className="h-2.5 min-w-[150px] cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:shadow-md"
          max={row.max}
          min={row.min}
          onChange={(event) => handleChange(Number(event.target.value))}
          step={row.step ?? 1}
          style={{ background: sliderBackground }}
          type="range"
          value={value}
        />
        <input
          className="h-9 rounded-lg border border-brand-line px-2 text-right text-sm font-medium tabular-nums text-brand-navy outline-none focus:border-brand-blue"
          onChange={(event) => handleChange(parseLocalizedNumber(event.target.value) || row.min)}
          value={formatNumber(value)}
        />
        <span className="text-xs font-bold text-brand-muted">{row.unit}</span>
      </span>
    </label>
  );
}

function NumericInputRow({ label, onChange, unit, value }: { label: string; onChange: () => void; unit: string; value: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[14px] font-semibold text-brand-navy">{label}</span>
      <span className="grid grid-cols-[1fr_116px]">
        <input
          className="h-9 rounded-l-lg border border-r-0 border-brand-line px-3 text-sm font-medium tabular-nums text-brand-navy outline-none focus:border-brand-blue"
          defaultValue={value}
          onChange={onChange}
        />
        <span className="grid h-9 place-items-center rounded-r-lg border border-brand-line bg-slate-50 text-xs font-bold text-brand-muted">{unit}</span>
      </span>
    </label>
  );
}

function SelectField({ label, options, value }: { label: string; options?: string[]; value: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[13px] font-semibold text-brand-navy">{label}</span>
      <span className="relative">
        <select
          className="h-9 w-full appearance-none rounded-lg border border-brand-line bg-white px-3 pr-8 text-sm font-medium text-brand-navy outline-none focus:border-brand-blue"
          defaultValue={value}
        >
          {(options ?? [value]).map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" size={15} aria-hidden />
      </span>
    </label>
  );
}

function SourceBadge({ source }: { source: NonNullable<AssumptionRow["source"]> }) {
  const tone = source === "Đã chỉnh sửa" ? "amber" : source === "Tự động đề xuất" ? "blue" : "slate";
  return <small className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", toneClasses[tone])}>{source}</small>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm font-medium text-brand-muted">
      <span>{label}</span>
      <strong className="text-right font-bold tabular-nums text-brand-navy">{value}</strong>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-center">
      <small className="block text-xs font-semibold text-brand-muted">{label}</small>
      <strong className="mt-1 block text-[15px] font-bold leading-tight tabular-nums text-brand-navy">{value}</strong>
    </span>
  );
}

function BottomActionBar({ changeCount, onReset }: { changeCount: number; onReset: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-brand-line bg-white px-4 py-3 shadow-panel">
      <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 max-lg:grid-cols-1">
        <Link className={buttonVariants({ variant: "secondary", className: "h-11 border-brand-line text-brand-navy" })} href="/quick-sizing">
          <ArrowLeft size={17} />
          Quay lại
        </Link>
        <button className={buttonVariants({ variant: "secondary", className: "h-11" })} onClick={onReset} type="button">
          <RotateCcw size={17} />
          Khôi phục mặc định
        </button>
        <span className="text-center text-sm font-bold text-brand-muted">{changeCount} thay đổi chưa áp dụng</span>
        <Link className={buttonVariants({ className: "h-11 bg-brand-blue px-7 text-[15px] font-bold text-white hover:bg-brand-blue/90" })} href="/quick-sizing/ket-qua">
          <Zap size={18} />
          Tính kết quả
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

function parseLocalizedNumber(value: string) {
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}
