import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Info,
  RotateCcw,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Zap
} from "lucide-react";
import { Fragment } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const scenarioCards = [
  { title: "Mặc định đề xuất", description: "Khuyến nghị cho ước tính nhanh", icon: Shield, selected: true },
  { title: "Lạc quan", description: "Giả định hiệu quả tối ưu", icon: ShieldCheck },
  { title: "Thận trọng", description: "Giả định bảo thủ", icon: CircleHelp },
  { title: "Tùy chỉnh", description: "Tự thiết lập giả định", icon: SlidersHorizontal }
];

const technicalLeft = [
  { label: "Dung lượng BESS dự kiến", min: "100", max: "5.000", value: "1.000", unit: "kWh", progress: 46 },
  { label: "Công suất BESS dự kiến", min: "50", max: "2.000", value: "500", unit: "kW", progress: 39 },
  { label: "DoD (Depth of Discharge)", min: "50%", max: "100%", value: "90", unit: "%", progress: 77 },
  { label: "RTE (Hiệu suất vòng)", min: "70%", max: "100%", value: "90", unit: "%", progress: 69 }
];

const technicalRight = [
  { label: "Suy hao pin", min: "0%/năm", max: "5%/năm", value: "2,0", unit: "%/năm", progress: 52 },
  { label: "Chu kỳ sạc/xả", min: "0,5", max: "3", value: "1,0", unit: "chu kỳ/ngày", progress: 42 },
  { label: "Ngày vận hành hệ thống", min: "200", max: "365", value: "300", unit: "ngày/năm", progress: 51 }
];

const investmentRows = [
  ["Chi phí pin (Battery)", "6.000.000", "VNĐ/kWh"],
  ["Chi phí PCS (Power Conversion System)", "2.000.000", "VNĐ/kW"],
  ["Chi phí cố định & EPC", "1.500.000.000", "VNĐ"],
  ["O&M hàng năm", "2,0", "% CAPEX/năm"],
  ["Tăng chi phí O&M hàng năm", "2,0", "%/năm"]
];

const tariffRows = [
  { label: "Giá thấp điểm", min: "500", max: "2.000", value: "1.028", progress: 31 },
  { label: "Giá bình thường", min: "800", max: "2.500", value: "1.666", progress: 39 },
  { label: "Giá cao điểm", min: "1.200", max: "3.500", value: "2.797", progress: 57 },
  { label: "Giá công suất (VNĐ/kW/tháng)", min: "50.000", max: "200.000", value: "150.000", progress: 45 }
];

const financeRows = [
  { label: "Tỷ lệ vốn vay", min: "0%", max: "100%", value: "70", unit: "%", progress: 70 },
  { label: "Lãi suất vay", min: "5%", max: "15%", value: "9,0", unit: "%/năm", progress: 40 },
  { label: "Thời hạn vay", min: "5", max: "15", value: "7", unit: "năm", progress: 35 },
  { label: "WACC (Tỷ lệ chiết khấu)", min: "5%", max: "20%", value: "10,0", unit: "%", progress: 33 },
  { label: "Thuế suất TNDN", min: "10%", max: "30%", value: "20", unit: "%", progress: 50 }
];

const summaryRows = [
  ["Dung lượng BESS", "1.000 kWh"],
  ["Công suất BESS", "500 kW"],
  ["CAPEX ước tính", "11,2 tỷ VNĐ"],
  ["Suất đầu tư (CAPEX/kWh)", "11.200.000 VNĐ/kWh"],
  ["Suất đầu tư (CAPEX/kW)", "22.400.000 VNĐ/kW"]
];

const savingRows = [
  ["Tiết kiệm điện năng", "2,18 tỷ VNĐ/năm"],
  ["Tiết kiệm công suất", "0,72 tỷ VNĐ/năm"],
  ["Tổng tiết kiệm", "2,90 tỷ VNĐ/năm"]
];

const projectRows = [
  ["NPV (10 năm)", "12,45 tỷ VNĐ", true],
  ["IRR", "23,85%", true],
  ["Payback", "5,1 năm", false]
];

export function QuickSizingAssumptionContent() {
  return (
    <section className="mx-auto w-[min(1948px,calc(100%_-_72px))] pb-5 pt-3 max-xl:w-[min(1220px,calc(100%_-_42px))] max-sm:w-[min(100%_-_28px,640px)]">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-muted">
        <span>Trang chủ</span>
        <ArrowRight size={14} />
        <span>Quick Sizing</span>
        <ArrowRight size={14} />
        <span className="text-brand-navy">Giả định</span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_910px] items-end gap-8 max-2xl:grid-cols-[1fr_760px] max-xl:grid-cols-1">
        <div>
          <h1 className="text-[34px] font-extrabold leading-tight text-brand-navy">Quick Sizing</h1>
          <p className="mt-2 text-[14px] font-semibold leading-6 text-brand-muted">
            Thiết lập các giả định để hệ thống ước tính nhanh hiệu quả kinh tế của hệ thống BESS.
          </p>
        </div>
        <AssumptionStepper />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_520px] gap-5 max-xl:grid-cols-1">
        <div className="grid gap-3">
          <ScenarioSection />
          <div className="grid grid-cols-[1fr_390px] gap-3 max-lg:grid-cols-1">
            <TechnicalSection />
            <InvestmentSection />
          </div>
          <div className="grid grid-cols-[1.12fr_0.88fr] gap-3 max-lg:grid-cols-1">
            <TariffSection />
            <FinanceSection />
          </div>
        </div>
        <SummaryPanel />
      </div>

      <div className="mt-3 grid grid-cols-[150px_240px_1fr_280px] items-center gap-9 rounded-md border border-brand-line bg-white p-3 shadow-panel max-xl:grid-cols-1">
        <a className={buttonVariants({ variant: "secondary", className: "h-11 border-brand-line text-brand-navy" })} href="/quick-sizing">
          <ArrowLeft size={18} />
          Quay lại
        </a>
        <button className={buttonVariants({ variant: "secondary", className: "h-11" })} type="button">
          <RotateCcw size={18} />
          Khôi phục mặc định
        </button>
        <div />
        <a className={buttonVariants({ className: "h-11 bg-brand-blue text-white hover:bg-brand-blue/90" })} href="/quick-sizing/ket-qua">
          <Zap size={18} />
          Tính kết quả
          <ArrowRight size={18} />
        </a>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3 text-sm font-semibold text-brand-muted">
        <ShieldCheck size={20} />
        <span>Các giả định trên sẽ được lưu lại vào dự án của bạn và có thể chỉnh sửa bất cứ lúc nào.</span>
      </div>
    </section>
  );
}

function AssumptionStepper() {
  const steps = [
    { number: 1, title: "Bước 1", description: "Thông tin cơ bản", done: true },
    { number: 2, title: "Bước 2", description: "Giả định", active: true },
    { number: 3, title: "Bước 3", description: "Kết quả" }
  ];

  return (
    <div className="grid h-[84px] grid-cols-[auto_1fr_auto_1fr_auto] items-center rounded-lg border border-brand-line bg-white px-6 shadow-panel">
      {steps.map((step, index) => (
        <Fragment key={step.number}>
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "grid size-10 place-items-center rounded-full text-lg font-black",
                step.active && "bg-brand-blue text-white",
                step.done && "border border-brand-green bg-green-50 text-brand-green",
                !step.active && !step.done && "bg-slate-100 text-brand-navy/70"
              )}
            >
              {step.done ? <Check size={22} /> : step.number}
            </span>
            <span>
              <strong className={cn("block text-sm", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.title}</strong>
              <small className={cn("block text-sm font-bold", step.active ? "text-brand-blue" : "text-brand-muted")}>{step.description}</small>
            </span>
          </div>
          {index < steps.length - 1 ? <span className="mx-9 border-t-2 border-dashed border-blue-200" /> : null}
        </Fragment>
      ))}
    </div>
  );
}

function SectionTitle({ children, number }: { children: React.ReactNode; number: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-brand-navy">
      <span>{number}. {children}</span>
      <Info size={14} className="text-brand-muted" />
    </h2>
  );
}

function ScenarioSection() {
  return (
    <Card className="bg-white p-3.5 shadow-none">
      <SectionTitle number={1}>Kịch bản tính toán</SectionTitle>
      <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {scenarioCards.map(({ description, icon: Icon, selected, title }) => (
          <label
            className={cn(
              "flex h-[62px] cursor-pointer items-center gap-4 rounded-md border bg-white px-4",
              selected ? "border-brand-blue shadow-[0_0_0_1px_rgba(7,91,234,0.12)]" : "border-brand-line"
            )}
            key={title}
          >
            <input className="sr-only" defaultChecked={selected} name="scenario" type="radio" />
            <span className={cn("grid size-9 place-items-center rounded-full", selected ? "bg-brand-blue text-white" : "bg-white text-brand-muted")}>
              <Icon size={22} />
            </span>
            <span>
              <strong className="block text-sm text-brand-navy">{title}</strong>
              <small className="block text-xs font-semibold text-brand-muted">{description}</small>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand-muted">
        <Info size={16} />
        Kịch bản mặc định được sử dụng để ước tính nhanh khi chưa có dữ liệu phụ tải và PV thực tế.
      </p>
    </Card>
  );
}

function TechnicalSection() {
  return (
    <Card className="bg-white p-3.5 shadow-none">
      <SectionTitle number={2}>Giả định kỹ thuật</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-md:grid-cols-1">
        <div className="grid gap-2">{technicalLeft.map((row) => <SliderRow key={row.label} {...row} />)}</div>
        <div className="grid gap-2">{technicalRight.map((row) => <SliderRow key={row.label} {...row} />)}</div>
      </div>
    </Card>
  );
}

function InvestmentSection() {
  return (
    <Card className="bg-white p-3.5 shadow-none">
      <SectionTitle number={3}>Chi phí đầu tư & vận hành</SectionTitle>
      <div className="grid gap-1">
        {investmentRows.map(([label, value, unit]) => (
          <label className="grid gap-1" key={label}>
            <span className="text-[11px] font-bold text-brand-navy">{label}</span>
            <span className="grid grid-cols-[1fr_112px]">
              <input className="h-7 rounded-l-md border border-r-0 border-brand-line px-3 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" defaultValue={value} />
              <span className="grid h-7 place-items-center rounded-r-md border border-brand-line bg-white text-[11px] font-bold text-brand-muted">{unit}</span>
            </span>
          </label>
        ))}
      </div>
    </Card>
  );
}

function TariffSection() {
  return (
    <Card className="bg-white p-3.5 shadow-none">
      <SectionTitle number={4}>Giá điện & biểu giá</SectionTitle>
      <div className="grid grid-cols-[210px_1fr] gap-7 max-md:grid-cols-1">
        <div className="grid content-start gap-2.5">
          <SelectField label="Nhóm khách hàng" value="Sản xuất" />
          <SelectField label="Cấp điện áp" value="22kV" />
          <SelectField label="Bộ giá điện áp dụng" value="Giá sản xuất 22kV - 2024" />
        </div>
        <div className="grid gap-2">
          {tariffRows.map((row) => <SliderRow key={row.label} unit="" {...row} />)}
          <div className="mt-1 flex items-center gap-5 text-sm font-semibold text-brand-navy">
            <span>VAT</span>
            <label className="flex items-center gap-2"><input className="size-4 accent-brand-blue" defaultChecked name="vat" type="radio" /> Chưa bao gồm</label>
            <label className="flex items-center gap-2"><input className="size-4 accent-brand-blue" name="vat" type="radio" /> Đã bao gồm</label>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FinanceSection() {
  return (
    <Card className="bg-white p-3.5 shadow-none">
      <SectionTitle number={5}>Giả định tài chính</SectionTitle>
      <div className="grid gap-2">
        {financeRows.map((row) => <SliderRow key={row.label} {...row} />)}
        <label className="grid grid-cols-[1fr_188px] items-center gap-4 text-xs font-bold text-brand-navy">
          <span>Thời hạn phân tích</span>
          <span className="relative">
            <select className="h-7 w-full appearance-none rounded-md border border-brand-line bg-white px-8 text-sm font-semibold outline-none focus:border-brand-blue" defaultValue="10 năm">
              <option>10 năm</option>
              <option>15 năm</option>
              <option>20 năm</option>
            </select>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" size={15} />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" size={15} />
          </span>
        </label>
      </div>
    </Card>
  );
}

function SliderRow({ label, max, min, progress, unit, value }: { label: string; min: string; max: string; value: string; unit?: string; progress: number }) {
  return (
    <label className="grid gap-1 text-[11px] font-bold text-brand-navy">
      <span className="truncate">{label}</span>
      <span className="grid grid-cols-[44px_1fr_46px_64px_auto] items-center gap-2">
        <span className="text-brand-muted">{min}</span>
        <input className="h-1.5 min-w-0 accent-brand-blue" defaultValue={progress} max={100} min={0} type="range" />
        <span className="text-brand-muted">{max}</span>
        <input className="h-7 rounded-md border border-brand-line px-2 text-center text-sm font-semibold outline-none focus:border-brand-blue" defaultValue={value} />
        <span className="min-w-[38px] text-brand-muted">{unit}</span>
      </span>
    </label>
  );
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-bold text-brand-navy">{label}</span>
      <span className="relative">
        <select className="h-8 w-full appearance-none rounded-md border border-brand-line bg-white px-3 pr-8 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue" defaultValue={value}>
          <option>{value}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" size={15} />
      </span>
    </label>
  );
}

function SummaryPanel() {
  return (
    <Card className="bg-white p-4 shadow-none">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand-navy">
          Tóm tắt & ảnh hưởng
          <Info size={15} className="text-brand-muted" />
        </h2>
        <button className="h-8 rounded-md border border-brand-line px-4 text-sm font-bold text-brand-blue" type="button">Xem chi tiết</button>
      </div>
      <SummaryBox rows={summaryRows} />
      <SummaryBox className="mt-3" title="Hiệu quả sơ bộ (năm đầu)" rows={savingRows} />
      <SummaryBox className="mt-3" title="Hiệu quả dự án (10 năm)" rows={projectRows} />

      <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-amber-800">
        <h3 className="mb-2 flex items-center gap-2 font-extrabold">
          <TriangleAlert size={18} />
          Lưu ý
        </h3>
        <p>• RTE thấp hơn 85% có thể làm giảm hiệu quả kinh tế.</p>
        <p className="mt-1">• Chu kỳ sạc/xả &gt; 1,5 lần/ngày có thể ảnh hưởng đến tuổi thọ pin.</p>
      </div>
    </Card>
  );
}

function SummaryBox({ className, rows, title }: { className?: string; rows: (string | boolean)[][]; title?: string }) {
  return (
    <div className={cn("rounded-md border border-brand-line p-3.5", className)}>
      {title ? <h3 className="mb-3 text-sm font-extrabold text-brand-navy">{title}</h3> : null}
      <div className="grid gap-2.5">
        {rows.map(([label, value, positive]) => (
          <div className="flex items-center justify-between gap-4 text-sm font-semibold text-brand-muted" key={String(label)}>
            <span>{label}</span>
            <strong className={positive ? "text-brand-green" : "text-brand-navy"}>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
