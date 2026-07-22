"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BatteryCharging, Bookmark, CheckCircle2, Clock3, Info, LineChart, Mail, Phone, Send, Share2, ShieldAlert, Sparkles, Target, UserRound, Wallet, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildSizingOptions, formatNumber, formatVnd, type QuickSizingOption } from "../data/quick-sizing-model";
import type { QuickSizingStep1FormValues } from "../data/quick-sizing-step1-schema";
import { useQuickSizingStore } from "../data/quick-sizing-store";

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  acceptedTerms: boolean;
  acceptedMarketing: boolean;
};

const initialLeadForm: LeadForm = {
  name: "",
  email: "",
  phone: "",
  acceptedTerms: false,
  acceptedMarketing: false
};

export function QuickSizingResultFlow() {
  const basicInfo = useQuickSizingStore((state) => state.basicInfo);
  const assumptions = useQuickSizingStore((state) => state.assumptions);
  const scenario = useQuickSizingStore((state) => state.scenario);
  const selectedOptionId = useQuickSizingStore((state) => state.selectedOptionId);
  const selectOption = useQuickSizingStore((state) => state.selectOption);
  const [actionMessage, setActionMessage] = useState("");

  const options = useMemo(() => buildSizingOptions(assumptions, basicInfo), [assumptions, basicInfo]);
  const selected = options.find((option) => option.id === selectedOptionId) ?? options[1];

  const notify = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 1800);
  };

  const saveResult = () => {
    window.localStorage.setItem("energyinsight.quickSizing.savedResult.v1", JSON.stringify({ basicInfo, assumptions, scenario, selected, savedAt: Date.now() }));
    notify("Đã lưu kết quả trên trình duyệt");
  };

  const shareResult = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("Đã sao chép đường dẫn kết quả");
    } catch {
      notify("Không thể sao chép tự động; hãy sao chép URL trên thanh địa chỉ");
    }
  };

  return (
    <section className="mx-auto w-[min(1500px,calc(100%_-_48px))] pb-8 pt-5 max-sm:w-[min(100%_-_28px,640px)]">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-muted"><Link href="/">Trang chủ</Link><ArrowRight size={14} /><Link href="/quick-sizing">Quick Sizing</Link><ArrowRight size={14} /><span className="text-brand-navy">Kết quả</span></div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-[34px] font-bold text-brand-navy">Kết quả Quick Sizing</h1><span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-brand-green">Đã tính xong</span></div>
          <p className="mt-2 max-w-[820px] text-sm font-medium leading-6 text-brand-muted">Kết quả được tính trực tiếp từ thông tin Bước 1 và bộ giả định hiện tại. Đây vẫn là ước tính sơ bộ trước khi có dữ liệu phụ tải thực tế.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link className={buttonVariants({ variant: "secondary", className: "h-10" })} href="/quick-sizing/gia-dinh">Chỉnh sửa giả định</Link><button className={buttonVariants({ variant: "secondary", className: "h-10" })} onClick={saveResult} type="button"><Bookmark size={16} />Lưu kết quả</button><button className={buttonVariants({ variant: "secondary", className: "h-10" })} onClick={() => void shareResult()} type="button"><Share2 size={16} />Chia sẻ</button></div>
      </div>

      {actionMessage ? <div className="mt-3 rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-brand-green">{actionMessage}</div> : null}

      <ContextBar scenario={scenario} analysisYears={assumptions.analysisYears} basicInfo={basicInfo} />

      <UnifiedResultDashboard
        analysisYears={assumptions.analysisYears}
        onSelect={selectOption}
        options={options}
        selected={selected}
      />

      <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-brand-line bg-white p-3 shadow-panel max-lg:grid-cols-1">
        <Link className={buttonVariants({ variant: "secondary", className: "h-11" })} href="/quick-sizing/gia-dinh"><ArrowLeft size={17} />Chỉnh sửa giả định</Link>
        <div className="text-center text-sm font-bold text-brand-muted">Phương án đang chọn: {formatNumber(selected.powerKw, 0)} kW / {formatNumber(selected.energyKwh, 0)} kWh</div>
        <Link className={buttonVariants({ variant: "green", className: "h-11 px-7" })} href="/customer-portal/du-an-cua-toi/tao-du-an?source=quick-sizing">Tiếp tục với BESS Planner<ArrowRight size={18} /></Link>
      </div>
    </section>
  );
}

function ContextBar({ scenario, analysisYears, basicInfo }: { scenario: string; analysisYears: number; basicInfo: QuickSizingStep1FormValues | null }) {
  const scenarioLabels: Record<string, string> = { default: "Mặc định đề xuất", optimistic: "Lạc quan", conservative: "Thận trọng", custom: "Tùy chỉnh" };
  const objectiveLabels: Record<string, string> = { saving: "Tiết kiệm điện", peak_shaving: "Cắt đỉnh", solar_optimization: "Tối ưu PV", backup: "Dự phòng", power_quality: "Chất lượng điện", investment: "Đánh giá đầu tư" };
  const items = [
    ["Kịch bản", scenarioLabels[scenario] ?? scenario],
    ["Thời hạn", `${analysisYears} năm`],
    ["Biểu giá", `${basicInfo?.industry || "Sản xuất"} - ${basicInfo?.voltageLevel || "chưa xác định"}`],
    ["Mục tiêu", basicInfo?.bessObjectives.map((item) => objectiveLabels[item] ?? item).join(", ") || "Chưa xác định"]
  ];
  return <Card className="mt-4 rounded-xl bg-white p-3 shadow-panel"><div className="flex flex-wrap gap-2">{items.map(([label, value]) => <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-brand-navy" key={label}><span className="text-brand-muted">{label}: </span>{value}</span>)}</div></Card>;
}

function UnifiedResultDashboard({
  analysisYears,
  onSelect,
  options,
  selected
}: {
  analysisYears: number;
  onSelect: (id: "low" | "recommended" | "high") => void;
  options: QuickSizingOption[];
  selected: QuickSizingOption;
}) {
  return (
    <>
      <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-brand-blue">
        <Info className="mt-0.5 shrink-0" size={20} />
        <div>
          <strong className="block text-brand-navy">Dashboard kết quả tổng hợp</strong>
          <span>Chọn một phương án để cập nhật đồng thời KPI, dòng tiền, bảng so sánh và nội dung yêu cầu báo cáo.</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5 max-xl:grid-cols-1">
        <div className="grid min-w-0 gap-5">
          <Section title="1. Chọn phương án sizing">
            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
              {options.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  selected={option.id === selected.id}
                  onSelect={() => onSelect(option.id)}
                />
              ))}
            </div>
          </Section>

          <Section title="2. KPI phương án đang chọn">
            <KpiGrid option={selected} />
          </Section>

          <CashFlowChart option={selected} />

          <ComparisonTable options={options} selectedId={selected.id} />
        </div>

        <aside className="grid gap-5">
          <RecommendationPanel option={selected} />

          <Section title="Khoảng kết quả dự kiến">
            <RangeRow
              label="Tiết kiệm"
              values={options.map((item) => item.annualSavingVnd)}
              formatter={(value) => `${formatVnd(value)}/năm`}
            />
            <RangeRow
              label="Payback"
              values={options.map((item) => item.paybackYears)}
              formatter={(value) => `${formatNumber(value, 1)} năm`}
            />
            <RangeRow
              label={`NPV ${analysisYears} năm`}
              values={options.map((item) => item.npvVnd)}
              formatter={formatVnd}
            />
          </Section>

          <Section title="Mức độ tin cậy">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Sơ bộ</span>
              <strong className="text-right text-sm text-brand-navy">Cần dữ liệu thực tế</strong>
            </div>
            <div className="mt-4 grid gap-2.5">
              {["Dữ liệu đầu vào do người dùng khai báo", "Chưa có phụ tải 15 phút", "Chưa có chuỗi PV thực tế", "Chưa kiểm tra Pmax theo tháng"].map((row) => (
                <div className="flex items-start gap-2 text-sm font-medium leading-5 text-brand-muted" key={row}>
                  <ShieldAlert className="mt-0.5 shrink-0 text-amber-500" size={16} />
                  {row}
                </div>
              ))}
            </div>
          </Section>

          <ReportRequestPanel option={selected} />
        </aside>
      </div>
    </>
  );
}

function RecommendationPanel({ option }: { option: QuickSizingOption }) {
  return (
    <Card className="rounded-xl border-blue-100 bg-blue-50 p-5 shadow-panel">
      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-blue">Phương án đang chọn</span>
      <h2 className="mt-3 text-xl font-bold text-brand-navy">{option.title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
        Cấu hình {formatNumber(option.powerKw, 0)} kW / {formatNumber(option.energyKwh, 0)} kWh, CAPEX {formatVnd(option.capexVnd)}, hoàn vốn {formatNumber(option.paybackYears, 1)} năm và IRR ước tính {formatNumber(option.irrPct, 1)}%.
      </p>
      <div className="mt-4 grid gap-2">
        <Criterion ok={option.npvVnd > 0}>NPV dương</Criterion>
        <Criterion ok={option.irrPct >= 10}>IRR ≥ WACC tham chiếu</Criterion>
        <Criterion ok={option.paybackYears <= 7}>Payback ≤ 7 năm</Criterion>
      </div>
    </Card>
  );
}

function OptionCard({ option, selected, onSelect }: { option: QuickSizingOption; selected: boolean; onSelect: () => void }) {
  return <button className={cn("rounded-xl border bg-white p-4 text-left transition hover:border-brand-blue hover:bg-blue-50/40", selected && "border-brand-blue bg-blue-50 shadow-[0_0_0_1px_rgba(7,91,234,0.14)]")} onClick={onSelect} type="button"><span className={cn("rounded-full px-3 py-1 text-xs font-bold", selected ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-muted")}>{option.badge}</span><h3 className="mt-3 text-base font-bold text-brand-navy">{option.title}</h3><div className="mt-3 grid grid-cols-2 gap-2"><Metric label="Công suất" value={`${formatNumber(option.powerKw, 0)} kW`} /><Metric label="Dung lượng" value={`${formatNumber(option.energyKwh, 0)} kWh`} /><Metric label="CAPEX" value={formatVnd(option.capexVnd)} /><Metric label="Payback" value={`${formatNumber(option.paybackYears, 1)} năm`} /></div></button>;
}

function KpiGrid({ option, compact = false }: { option: QuickSizingOption; compact?: boolean }) {
  const cards = [
    ["Công suất", formatNumber(option.powerKw, 0), "kW", Zap], ["Dung lượng", formatNumber(option.energyKwh, 0), "kWh", BatteryCharging], ["Thời lượng", formatNumber(option.durationHours, 2), "giờ", Clock3], ["CAPEX", formatVnd(option.capexVnd), "", Wallet], ["Tiết kiệm", formatVnd(option.annualSavingVnd), "/năm", LineChart], ["Payback", formatNumber(option.paybackYears, 1), "năm", Clock3], ["NPV", formatVnd(option.npvVnd), "", Target], ["IRR", formatNumber(option.irrPct, 1), "%", Sparkles]
  ] as const;
  return <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-4 max-xl:grid-cols-2 max-sm:grid-cols-1")}>{cards.map(([label, value, unit, Icon]) => <Card className="grid min-h-[90px] grid-cols-[40px_1fr] items-center gap-3 rounded-xl p-3 shadow-none" key={label}><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand-blue"><Icon size={20} /></span><span><small className="block text-xs font-bold text-brand-muted">{label}</small><strong className="mt-1 block text-xl font-bold text-brand-navy">{value} {unit ? <span className="text-sm">{unit}</span> : null}</strong></span></Card>)}</div>;
}

function ReportRequestPanel({ option }: { option: QuickSizingOption }) {
  const [form, setForm] = useState(initialLeadForm);
  const [submitted, setSubmitted] = useState(false);
  const [resultCode, setResultCode] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResultCode(`QS-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    setSubmitted(true);
  };

  if (submitted) {
    return <aside className="sticky top-24 h-fit"><Card className="rounded-xl bg-white p-5 text-center shadow-panel"><span className="mx-auto grid size-14 place-items-center rounded-full bg-green-50 text-brand-green"><CheckCircle2 size={30} /></span><h2 className="mt-4 text-xl font-bold text-brand-navy">Đã ghi nhận yêu cầu báo cáo</h2><p className="mt-3 text-sm font-medium text-brand-muted">Email nhận báo cáo: <strong className="text-brand-navy">{form.email}</strong></p><p className="mt-1 text-sm font-medium text-brand-muted">Mã kết quả: <strong className="text-brand-navy">{resultCode}</strong></p><p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs font-medium leading-5 text-brand-muted">Bản frontend hiện chỉ ghi nhận yêu cầu và chưa gửi email thực tế.</p><button className={buttonVariants({ variant: "secondary", className: "mt-4 h-10 w-full" })} onClick={() => setSubmitted(false)} type="button">Chỉnh sửa thông tin</button></Card></aside>;
  }

  return <aside className="sticky top-24 h-fit"><Card className="rounded-xl bg-white p-5 shadow-panel"><h2 className="text-xl font-bold text-brand-navy">Nhận bản tóm tắt phương án</h2><p className="mt-2 text-sm font-medium leading-6 text-brand-muted">Phương án: {formatNumber(option.powerKw, 0)} kW / {formatNumber(option.energyKwh, 0)} kWh · CAPEX {formatVnd(option.capexVnd)}.</p><form className="mt-4 grid gap-3" onSubmit={submit}><LeadInput icon={UserRound} label="Họ và tên" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><LeadInput icon={Mail} label="Email công việc" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><LeadInput icon={Phone} label="Số điện thoại" type="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><label className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-navy"><input className="mt-1 size-4 accent-brand-blue" checked={form.acceptedTerms} onChange={(event) => setForm({ ...form, acceptedTerms: event.target.checked })} required type="checkbox" /><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</span></label><label className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-muted"><input className="mt-1 size-4 accent-brand-blue" checked={form.acceptedMarketing} onChange={(event) => setForm({ ...form, acceptedMarketing: event.target.checked })} type="checkbox" /><span>Tôi đồng ý nhận thông tin tư vấn.</span></label><button className={buttonVariants({ variant: "green", className: "h-11 w-full" })} type="submit"><Send size={18} />Ghi nhận yêu cầu báo cáo</button></form></Card></aside>;
}

function LeadInput({ icon: Icon, label, value, onChange, type = "text" }: { icon: LucideIcon; label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="relative grid gap-1.5"><span className="text-sm font-semibold text-brand-navy">{label} <span className="text-red-600">*</span></span><Icon className="absolute left-4 top-[38px] text-brand-muted" size={17} /><input className="h-10 rounded-lg border border-brand-line pl-11 pr-4 text-sm font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => onChange(event.target.value)} placeholder={label} required type={type} value={value} /></label>;
}

function CashFlowChart({ option }: { option: QuickSizingOption }) {
  const values = option.cashFlowVnd.reduce<number[]>((acc, value, index) => {
    acc.push((acc[index - 1] ?? 0) + value);
    return acc;
  }, []);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const width = 820;
  const height = 330;
  const x = (index: number) => 58 + index * ((width - 110) / Math.max(1, values.length - 1));
  const y = (value: number) => 270 - ((value - min) / Math.max(1, max - min)) * 210;
  const path = values.map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`).join(" ");
  const breakEvenIndex = values.findIndex((value) => value >= 0);
  return <Section title="Dòng tiền tích lũy"><div className="h-[360px] overflow-x-auto"><svg className="h-full min-w-[760px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ dòng tiền tích lũy">{[60, 110, 160, 215, 270].map((lineY) => <line key={lineY} x1="52" x2="780" y1={lineY} y2={lineY} stroke="#DBE6F6" strokeDasharray="5 7" />)}<path d={path} fill="none" stroke="#075BEA" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="5" fill="#075BEA" stroke="#fff" strokeWidth="2" />)}{breakEvenIndex > 0 ? <><line x1={x(breakEvenIndex)} x2={x(breakEvenIndex)} y1="55" y2="270" stroke="#08A64A" strokeDasharray="6 6" strokeWidth="2" /><text x={x(breakEvenIndex)} y="42" textAnchor="middle" fill="#0CA34B" fontSize="12" fontWeight="700">Hòa vốn khoảng năm {breakEvenIndex}</text></> : null}{values.map((_, index) => <text key={index} x={x(index)} y="305" textAnchor="middle" fill="#627194" fontSize="11">Năm {index}</text>)}</svg></div></Section>;
}

function ComparisonTable({ options, selectedId }: { options: QuickSizingOption[]; selectedId: string }) {
  const rows: Array<[string, (option: QuickSizingOption) => string]> = [
    ["Công suất", (item) => `${formatNumber(item.powerKw, 0)} kW`], ["Dung lượng", (item) => `${formatNumber(item.energyKwh, 0)} kWh`], ["CAPEX", (item) => formatVnd(item.capexVnd)], ["Tiết kiệm/năm", (item) => formatVnd(item.annualSavingVnd)], ["Payback", (item) => `${formatNumber(item.paybackYears, 1)} năm`], ["NPV", (item) => formatVnd(item.npvVnd)], ["IRR", (item) => `${formatNumber(item.irrPct, 1)}%`]
  ];
  return <Section title="So sánh ba phương án"><div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-sm"><thead><tr className="bg-blue-50"><th className="px-3 py-3 text-left">Chỉ tiêu</th>{options.map((item) => <th className={cn("px-3 py-3 text-center", item.id === selectedId && "bg-brand-blue text-white")} key={item.id}>{item.title}</th>)}</tr></thead><tbody>{rows.map(([label, render]) => <tr className="border-t border-brand-line" key={label}><td className="px-3 py-2 font-semibold text-brand-navy">{label}</td>{options.map((item) => <td className={cn("px-3 py-2 text-center font-medium text-brand-muted", item.id === selectedId && "bg-blue-50 font-bold text-brand-blue")} key={item.id}>{render(item)}</td>)}</tr>)}</tbody></table></div></Section>;
}

function RangeRow({ label, values, formatter }: { label: string; values: number[]; formatter: (value: number) => string }) {
  return <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm font-semibold text-brand-muted">{label}</span><strong className="text-brand-navy">{formatter(Math.min(...values))} – {formatter(Math.max(...values))}</strong></div>;
}

function Section({ children, title }: { children: ReactNode; title: string }) { return <Card className="rounded-xl bg-white p-4 shadow-panel"><h2 className="mb-4 text-xl font-bold text-brand-navy">{title}</h2>{children}</Card>; }
function Metric({ label, value }: { label: string; value: string }) { return <span className="rounded-lg bg-slate-50 p-2"><span className="block text-xs font-semibold text-brand-muted">{label}</span><strong className="mt-1 block text-sm font-bold text-brand-navy">{value}</strong></span>; }
function Criterion({ children, ok }: { children: ReactNode; ok: boolean }) { return <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold", ok ? "bg-white text-brand-navy" : "bg-amber-50 text-amber-800")}><CheckCircle2 className={ok ? "text-brand-green" : "text-amber-500"} size={16} />{children}</span>; }
