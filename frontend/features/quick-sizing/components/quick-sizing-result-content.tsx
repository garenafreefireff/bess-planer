"use client";

import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Bookmark,
  CheckCircle2,
  Clock3,
  Info,
  LineChart,
  Save,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  Wallet,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReportLeadPanel } from "./quick-sizing-result-sidebar";

type ResultTab = "overview" | "detail";

const sizingOptions = [
  { id: "low", title: "Chi phí thấp", badge: "CAPEX thấp", power: "375 kW", energy: "750 kWh", capex: "8,7 tỷ", payback: "5,6 năm" },
  { id: "recommended", title: "Khuyến nghị", badge: "Khuyến nghị", power: "500 kW", energy: "1.000 kWh", capex: "11,2 tỷ", payback: "5,1 năm" },
  { id: "high", title: "Hiệu quả cao", badge: "Tiết kiệm cao", power: "750 kW", energy: "1.250 kWh", capex: "14,5 tỷ", payback: "5,8 năm" }
];

const kpiCards = [
  { label: "Công suất", value: "500", unit: "kW", icon: Zap },
  { label: "Dung lượng", value: "1.000", unit: "kWh", icon: BatteryCharging },
  { label: "Thời lượng", value: "2,0", unit: "giờ", icon: Clock3 },
  { label: "CAPEX", value: "11,2", unit: "tỷ", icon: Wallet },
  { label: "Tiết kiệm", value: "2,18", unit: "tỷ/năm", icon: LineChart },
  { label: "Payback", value: "5,1", unit: "năm", icon: Clock3 },
  { label: "NPV 10 năm", value: "12,45", unit: "tỷ", icon: Target },
  { label: "IRR", value: "23,85", unit: "%", icon: Sparkles }
];

const assumptions = [
  ["Giá điện bình quân", "2.380 VND/kWh"],
  ["Chênh lệch giá sạc/xả", "1.680 VND/kWh"],
  ["DoD", "90%"],
  ["RTE", "90%"],
  ["Chu kỳ", "1,0/ngày"],
  ["O&M", "2% CAPEX/năm"],
  ["Tuổi thọ", "6.000 chu kỳ"],
  ["Thời hạn", "10 năm"],
  ["Thuế TNDN", "20%"]
];

const comparisonRows = [
  ["Công suất", "375 kW", "500 kW", "750 kW"],
  ["Dung lượng", "750 kWh", "1.000 kWh", "1.250 kWh"],
  ["CAPEX", "8,7 tỷ", "11,2 tỷ", "14,5 tỷ"],
  ["Tiết kiệm/năm", "1,88 tỷ", "2,18 tỷ", "2,35 tỷ"],
  ["Payback", "5,6 năm", "5,1 năm", "5,8 năm"],
  ["NPV", "10,8 tỷ", "12,45 tỷ", "14,1 tỷ"],
  ["IRR", "21,4%", "23,85%", "22,8%"]
];

export function QuickSizingResultContent() {
  const [activeTab, setActiveTab] = useState<ResultTab>("overview");
  const [selectedOption, setSelectedOption] = useState("recommended");

  return (
    <section className="mx-auto w-[min(1500px,calc(100%_-_48px))] pb-24 pt-5 max-sm:w-[min(100%_-_28px,640px)]">
      <Breadcrumb />
      <ResultHeader />
      <ContextBar />
      <ResultTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OverviewScreen onDetail={() => setActiveTab("detail")} onSelect={setSelectedOption} selectedOption={selectedOption} />
      ) : (
        <DetailScreen onOverview={() => setActiveTab("overview")} />
      )}
    </section>
  );
}

function Breadcrumb() {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-brand-muted">
      <span>Trang chủ</span>
      <ArrowRight size={14} aria-hidden />
      <span>Quick Sizing</span>
      <ArrowRight size={14} aria-hidden />
      <span className="text-brand-navy">Kết quả</span>
    </div>
  );
}

function ResultHeader() {
  return (
    <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[34px] font-bold leading-tight text-brand-navy">Kết quả Quick Sizing</h1>
          <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-brand-green">Đã hoàn tất</span>
        </div>
        <p className="mt-2 max-w-[820px] text-[15px] font-medium leading-6 text-brand-muted">
          Ước tính sơ bộ cấu hình BESS và hiệu quả kinh tế dựa trên thông tin và giả định đã cung cấp.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className={buttonVariants({ variant: "secondary", className: "h-10" })} href="/quick-sizing/gia-dinh">Chỉnh sửa giả định</a>
        <button className={buttonVariants({ variant: "secondary", className: "h-10" })} type="button"><Bookmark size={16} /> Lưu kết quả</button>
        <button className={buttonVariants({ variant: "secondary", className: "h-10" })} type="button"><Share2 size={16} /> Chia sẻ</button>
      </div>
    </div>
  );
}

function ContextBar() {
  const items = [
    ["Kịch bản", "Mặc định đề xuất"],
    ["Thời hạn", "10 năm"],
    ["Biểu giá", "Sản xuất 22 kV - 2026"],
    ["Mục tiêu", "Tiết kiệm điện"],
    ["Cập nhật", "20/07/2026 15:30"]
  ];

  return (
    <Card className="mt-4 rounded-xl bg-white p-3 shadow-panel">
      <div className="flex flex-wrap gap-2">
        {items.map(([label, value]) => (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-brand-navy" key={label}>
            <span className="text-brand-muted">{label}: </span>{value}
          </span>
        ))}
      </div>
    </Card>
  );
}

function ResultTabs({ activeTab, onChange }: { activeTab: ResultTab; onChange: (tab: ResultTab) => void }) {
  const tabs: Array<{ id: ResultTab; label: string }> = [
    { id: "overview", label: "Tổng quan" },
    { id: "detail", label: "Phân tích chi tiết" }
  ];

  return (
    <div className="mt-4 inline-grid grid-cols-2 rounded-xl border border-brand-line bg-white p-1 shadow-panel">
      {tabs.map((tab) => (
        <button
          className={cn(
            "h-10 min-w-[190px] rounded-lg px-5 text-sm font-bold text-brand-muted transition",
            activeTab === tab.id && "bg-brand-blue text-white shadow-sm"
          )}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function OverviewScreen({
  onDetail,
  onSelect,
  selectedOption
}: {
  onDetail: () => void;
  onSelect: (id: string) => void;
  selectedOption: string;
}) {
  return (
    <>
      <div className="mt-4 grid grid-cols-[minmax(0,2.1fr)_minmax(340px,0.82fr)] gap-5 max-lg:grid-cols-1">
        <div className="grid min-w-0 gap-4">
          <InfoBanner />
          <SizingOptions onSelect={onSelect} selectedOption={selectedOption} />
          <KpiGrid />
          <WhyRecommended onDetail={onDetail} />
        </div>
        <ReportLeadPanel />
      </div>
      <ResultActionBar
        center="Phương án đang chọn: 500 kW / 1.000 kWh"
        left={<a className={buttonVariants({ variant: "secondary", className: "h-11" })} href="/quick-sizing/gia-dinh">Chỉnh sửa giả định</a>}
        right={<button className={buttonVariants({ className: "h-11 bg-brand-blue px-7 text-white hover:bg-brand-blue/90" })} onClick={onDetail} type="button">Xem phân tích chi tiết <ArrowRight size={18} /></button>}
      />
    </>
  );
}

function DetailScreen({ onOverview }: { onOverview: () => void }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-[minmax(0,1.58fr)_minmax(360px,0.82fr)] gap-5 max-lg:grid-cols-1">
        <CashFlowChart />
        <div className="grid gap-4">
          <ResultRange />
          <DataConfidence />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5 max-lg:grid-cols-1">
        <MainAssumptions />
        <ComparisonTable />
      </div>
      <ResultActionBar
        center={<DetailCenterActions />}
        left={<button className={buttonVariants({ variant: "secondary", className: "h-11" })} onClick={onOverview} type="button"><ArrowLeft size={17} /> Quay lại Tổng quan</button>}
        right={<a className={buttonVariants({ variant: "green", className: "h-11 px-7" })} href="/customer-portal">Chuyển sang BESS Planner <ArrowRight size={18} /></a>}
      />
    </>
  );
}

function InfoBanner() {
  return (
    <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-brand-blue">
      <Info className="shrink-0" size={20} aria-hidden />
      <span>Đây là kết quả ước tính sơ bộ dựa trên dữ liệu nhập tay. Kết quả không thay thế thiết kế kỹ thuật hoặc thẩm định đầu tư.</span>
    </div>
  );
}

function SizingOptions({ onSelect, selectedOption }: { selectedOption: string; onSelect: (id: string) => void }) {
  return (
    <SectionCard title="1. Ba phương án sizing">
      <div className="grid grid-cols-3 gap-4 max-xl:grid-cols-1">
        {sizingOptions.map((option) => {
          const selected = option.id === selectedOption;
          return (
            <button
              className={cn(
                "rounded-xl border bg-white p-4 text-left transition hover:border-brand-blue hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
                selected && "border-brand-blue bg-blue-50 shadow-[0_0_0_1px_rgba(7,91,234,0.14)]"
              )}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", selected ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-muted")}>{option.badge}</span>
              <h3 className="mt-3 text-base font-bold text-brand-navy">{option.title}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Công suất" value={option.power} />
                <Metric label="Dung lượng" value={option.energy} />
                <Metric label="CAPEX" value={option.capex} />
                <Metric label="Payback" value={option.payback} />
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function KpiGrid() {
  return (
    <SectionCard title="2. KPI chính">
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {kpiCards.map((item) => <KpiCard key={item.label} {...item} />)}
      </div>
    </SectionCard>
  );
}

function WhyRecommended({ onDetail }: { onDetail: () => void }) {
  const criteria = ["Phù hợp ngân sách", "NPV dương", "IRR > WACC", "Payback < 7 năm"];

  return (
    <Card className="rounded-xl border-blue-100 bg-blue-50 p-5 shadow-panel">
      <div className="grid grid-cols-[1fr_auto] gap-4 max-md:grid-cols-1">
        <div>
          <h2 className="text-xl font-bold text-brand-navy">Vì sao hệ thống đề xuất cấu hình này?</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
            Cấu hình 500 kW / 1.000 kWh cân bằng tốt giữa chi phí đầu tư, tiết kiệm và thời gian hoàn vốn.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {criteria.map((item) => (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-navy" key={item}>
                <CheckCircle2 className="text-brand-green" size={16} />
                {item}
              </span>
            ))}
          </div>
        </div>
        <button className={buttonVariants({ variant: "secondary", className: "self-end bg-white" })} onClick={onDetail} type="button">
          Xem phân tích chi tiết
          <ArrowRight size={17} />
        </button>
      </div>
    </Card>
  );
}

function CashFlowChart() {
  const values = [-11.2, -9.1, -6.8, -4.3, -1.8, 0.2, 2.6, 5.1, 7.7, 10.1, 12.45];
  const x = (index: number) => 58 + index * 70;
  const y = (value: number) => 265 - ((value + 12) / 26) * 205;
  const path = values.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ");
  const area = `${path} L ${x(10)} 265 L ${x(0)} 265 Z`;

  return (
    <SectionCard title="Dòng tiền tích lũy trong 10 năm">
      <div className="h-[360px]">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 820 330" role="img" aria-label="Dòng tiền tích lũy trong 10 năm">
          {[60, 110, 160, 215, 265].map((lineY) => <line key={lineY} x1="52" x2="768" y1={lineY} y2={lineY} stroke="#DBE6F6" strokeDasharray="5 7" />)}
          <line x1="52" x2="768" y1="265" y2="265" stroke="#B9C7DE" />
          <path d={area} fill="rgba(7,91,234,0.10)" />
          <path d={path} fill="none" stroke="#075BEA" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="5" fill="#075BEA" stroke="#fff" strokeWidth="2" />)}
          <line x1={x(5) + 7} x2={x(5) + 7} y1="82" y2="265" stroke="#08A64A" strokeDasharray="6 6" strokeWidth="2" />
          <foreignObject x={x(5) - 70} y="42" width="190" height="56">
            <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold leading-5 text-brand-green shadow-panel">Điểm hòa vốn<br />khoảng 5,1 năm</div>
          </foreignObject>
          {[-10, 0, 10].map((tick) => <text key={tick} x="12" y={y(tick) + 4} fill="#627194" fontSize="12">{tick}</text>)}
          {Array.from({ length: 11 }, (_, year) => <text key={year} x={x(year)} y="302" textAnchor="middle" fill="#627194" fontSize="12">Năm {year}</text>)}
          <text x="12" y="28" fill="#627194" fontSize="12">Tỷ VND</text>
        </svg>
      </div>
    </SectionCard>
  );
}

function ResultRange() {
  return (
    <SectionCard title="Khoảng kết quả dự kiến">
      <div className="grid gap-3">
        <RangeItem label="Tiết kiệm" value="1,85-2,35 tỷ/năm" />
        <RangeItem label="Payback" value="4,7-5,8 năm" />
        <RangeItem label="NPV 10 năm" value="10,8-14,1 tỷ" />
      </div>
    </SectionCard>
  );
}

function DataConfidence() {
  const rows = ["Dữ liệu nhập tay", "Chưa có phụ tải 15 phút", "Chưa có dữ liệu PV thực tế", "Chưa có P_max theo tháng"];

  return (
    <SectionCard title="Mức độ tin cậy">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Cần dữ liệu thực tế để tăng độ chính xác</span>
        <strong className="text-base font-bold text-brand-navy">Sơ bộ</strong>
      </div>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div className="flex items-center gap-2 text-sm font-medium text-brand-muted" key={row}>
            <ShieldAlert className="text-amber-500" size={16} />
            {row}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function MainAssumptions() {
  return (
    <SectionCard title="Giả định chính">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-md:grid-cols-1">
        {assumptions.map(([label, value]) => (
          <div className="flex items-center justify-between gap-4 border-b border-blue-50 pb-2 text-sm font-medium text-brand-muted" key={label}>
            <span>{label}</span>
            <strong className="text-right font-bold text-brand-navy">{value}</strong>
          </div>
        ))}
      </div>
      <a className={buttonVariants({ variant: "secondary", className: "mt-4 h-10" })} href="/quick-sizing/gia-dinh">Xem toàn bộ giả định</a>
    </SectionCard>
  );
}

function ComparisonTable() {
  return (
    <SectionCard title="So sánh ba phương án">
      <div className="overflow-hidden rounded-xl border border-brand-line">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-blue-50 text-brand-navy">
            <tr>
              <th className="px-3 py-3 text-left font-bold">Chỉ tiêu</th>
              <th className="px-3 py-3 text-center font-bold">Chi phí thấp</th>
              <th className="bg-brand-blue px-3 py-3 text-center font-bold text-white">Khuyến nghị</th>
              <th className="px-3 py-3 text-center font-bold">Hiệu quả cao</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([label, low, recommended, high]) => (
              <tr className="border-t border-brand-line" key={label}>
                <td className="px-3 py-2 font-semibold text-brand-navy">{label}</td>
                <td className="px-3 py-2 text-center font-medium text-brand-muted">{low}</td>
                <td className="bg-blue-50 px-3 py-2 text-center font-bold text-brand-blue">{recommended}</td>
                <td className="px-3 py-2 text-center font-medium text-brand-muted">{high}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function DetailCenterActions() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button className={buttonVariants({ variant: "secondary", className: "h-10" })} type="button"><Save size={16} /> Xuất bản tóm tắt</button>
      <button className={buttonVariants({ variant: "secondary", className: "h-10" })} type="button"><Bookmark size={16} /> Lưu kết quả</button>
      <button className={buttonVariants({ variant: "secondary", className: "h-10" })} type="button"><Share2 size={16} /> Chia sẻ</button>
    </div>
  );
}

function SectionCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-panel">
      <h2 className="mb-4 text-xl font-bold text-brand-navy">{title}</h2>
      {children}
    </Card>
  );
}

function KpiCard({ icon: Icon, label, unit, value }: { label: string; value: string; unit: string; icon: LucideIcon }) {
  return (
    <Card className="grid min-h-[92px] grid-cols-[40px_1fr] items-center gap-3 rounded-xl bg-white p-3 shadow-none">
      <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand-blue"><Icon size={20} /></span>
      <span>
        <small className="block text-xs font-bold leading-5 text-brand-muted">{label}</small>
        <strong className="mt-1 block text-2xl font-bold text-brand-navy">{value} <span className="text-sm font-bold">{unit}</span></strong>
      </span>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg bg-slate-50 p-2">
      <span className="block text-xs font-semibold text-brand-muted">{label}</span>
      <strong className="mt-1 block text-sm font-bold text-brand-navy">{value}</strong>
    </span>
  );
}

function RangeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
      <span className="text-sm font-semibold text-brand-muted">{label}</span>
      <strong className="text-lg font-bold text-brand-navy">{value}</strong>
    </div>
  );
}

function ResultActionBar({ center, left, right }: { center: ReactNode; left: ReactNode; right: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-line bg-white/95 py-3 backdrop-blur">
      <div className="mx-auto grid w-[min(1500px,calc(100%_-_48px))] grid-cols-[auto_1fr_auto] items-center gap-3 max-lg:grid-cols-1">
        {left}
        <div className="text-center text-sm font-bold text-brand-muted">{center}</div>
        {right}
      </div>
    </div>
  );
}
