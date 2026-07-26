"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Bookmark,
  CheckCircle2,
  Clock3,
  Info,
  LineChart,
  Mail,
  Phone,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  UserRound,
  Wallet,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { leadsApi, readLeadApiError } from "@/lib/api/leads.api";
import { cn } from "@/lib/utils";
import { buildQuickSizingResultFromAssumptions, formatNumber, formatVnd, type QuickSizingAssumptions } from "../data/quick-sizing-model";
import type { QuickSizingStep1FormValues } from "../data/quick-sizing-step1-schema";
import type { MetricRange, ParetoPoint, QuickSizingResult, ResultWarning, SizingCandidateResult, SizingOptionResult } from "../result-calculation";
import { useQuickSizingStore } from "../data/quick-sizing-store";

type LeadForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  acceptedTerms: boolean;
  acceptedMarketing: boolean;
  acceptedTraining: boolean;
};

const initialLeadForm: LeadForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  acceptedTerms: false,
  acceptedMarketing: false,
  acceptedTraining: false
};

export function QuickSizingResultFlow() {
  const basicInfo = useQuickSizingStore((state) => state.basicInfo);
  const analysisRun = useQuickSizingStore((state) => state.analysisRun);
  const assumptions = useQuickSizingStore((state) => state.assumptions);
  const scenario = useQuickSizingStore((state) => state.scenario);
  const selectedOptionId = useQuickSizingStore((state) => state.selectedOptionId);
  const selectOption = useQuickSizingStore((state) => state.selectOption);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [resultCode, setResultCode] = useState("");

  const result = useMemo(() => buildQuickSizingResultFromAssumptions(assumptions, basicInfo), [assumptions, basicInfo]);
  const options = useMemo(() => representativeOptions(result), [result]);
  const selectedFromStore = options.find((option) => option.role === selectedOptionId) ?? result.recommendedOption ?? options[0] ?? null;
  const selected = result.candidates.find((candidate) => candidate.id === selectedCandidateId)
    ?? selectedFromStore
    ?? result.candidates[0]
    ?? null;
  const reportFingerprint = useMemo(
    () => quickSizingFingerprint(analysisRun?.id ?? null, basicInfo, assumptions),
    [analysisRun?.id, assumptions, basicInfo]
  );

  useEffect(() => {
    const savedCode = window.localStorage.getItem(`energyinsight.quickSizing.unlocked.${reportFingerprint}`);
    setReportUnlocked(Boolean(savedCode));
    setResultCode(savedCode ?? "");
  }, [reportFingerprint]);

  const notify = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 1800);
  };

  const saveResult = () => {
    window.localStorage.setItem(
      "energyinsight.quickSizing.savedResult.v3",
      JSON.stringify({ basicInfo, analysisRun, assumptions, scenario, result, selectedCandidateId: selected?.id ?? null, savedAt: Date.now() })
    );
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

  const selectRepresentative = (option: SizingOptionResult) => {
    selectOption(option.role);
    setSelectedCandidateId(option.id);
  };

  return (
    <section className="mx-auto w-[min(1500px,calc(100%_-_48px))] pb-8 pt-5 max-sm:w-[min(100%_-_28px,640px)]">
      <div className="flex items-center gap-3 text-sm font-semibold text-brand-muted"><Link href="/">Trang chủ</Link><ArrowRight size={14} /><Link href="/quick-sizing">Quick Sizing</Link><ArrowRight size={14} /><span className="text-brand-navy">Kết quả</span></div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-[34px] font-bold text-brand-navy">Kết quả Quick Sizing</h1><span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-brand-green">Đã tính xong</span></div>
          <p className="mt-2 max-w-[820px] text-sm font-medium leading-6 text-brand-muted">Kết quả được tính từ bộ giả định Bước 2 bằng result engine độc lập: candidate grid, dispatch không double count, FCFF, NPV, IRR, payback, Pareto và confidence.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link className={buttonVariants({ variant: "secondary", className: "h-10" })} href="/quick-sizing/gia-dinh">Chỉnh sửa giả định</Link>{reportUnlocked ? <><button className={buttonVariants({ variant: "secondary", className: "h-10" })} onClick={saveResult} type="button"><Bookmark size={16} />Lưu kết quả</button><button className={buttonVariants({ variant: "secondary", className: "h-10" })} onClick={() => void shareResult()} type="button"><Share2 size={16} />Chia sẻ</button></> : null}</div>
      </div>

      {actionMessage ? <div className="mt-3 rounded-lg border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-brand-green">{actionMessage}</div> : null}

      <ContextBar analysisRun={analysisRun} scenario={scenario} result={result} basicInfo={basicInfo} />

      {selected ? (
        reportUnlocked ? (
          <>
            {resultCode ? <div className="mt-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-brand-green">Báo cáo đầy đủ đã mở · Mã kết quả {resultCode}</div> : null}
            <UnifiedResultDashboard
              effectiveWaccPct={assumptions.waccPct}
              assumptions={assumptions}
              onSelectCandidate={setSelectedCandidateId}
              onSelectRepresentative={selectRepresentative}
              options={options}
              result={result}
              selected={selected}
            />
          </>
        ) : (
          <QuickSizingLeadGate
            analysisRunId={analysisRun?.id ?? null}
            assumptions={assumptions}
            basicInfo={basicInfo}
            candidate={selected}
            onUnlocked={(code) => {
              window.localStorage.setItem(`energyinsight.quickSizing.unlocked.${reportFingerprint}`, code);
              setResultCode(code);
              setReportUnlocked(true);
            }}
            result={result}
            scenario={scenario}
            selectedOptionId={selectedOptionId}
          />
        )
      ) : (
        <Card className="mt-4 rounded-xl bg-white p-5 shadow-panel">
          <h2 className="text-xl font-bold text-brand-navy">Không có candidate hợp lệ</h2>
          <WarningsPanel warnings={result.warnings} />
        </Card>
      )}

      {selected && reportUnlocked ? (
        <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-brand-line bg-white p-3 shadow-panel max-lg:grid-cols-1">
          <Link className={buttonVariants({ variant: "secondary", className: "h-11" })} href="/quick-sizing/gia-dinh"><ArrowLeft size={17} />Chỉnh sửa giả định</Link>
          <div className="text-center text-sm font-bold text-brand-muted">Phương án đang chọn: {formatNumber(selected.powerKw, 0)} kW / {formatNumber(selected.energyKwh, 0)} kWh</div>
          <Link className={buttonVariants({ variant: "green", className: "h-11 px-7" })} href="/customer-portal/du-an-cua-toi/tao-du-an?source=quick-sizing">Tiếp tục với BESS Planner<ArrowRight size={18} /></Link>
        </div>
      ) : null}
    </section>
  );
}

function ContextBar({ analysisRun, scenario, result, basicInfo }: { analysisRun: ReturnType<typeof useQuickSizingStore.getState>["analysisRun"]; scenario: string; result: QuickSizingResult; basicInfo: QuickSizingStep1FormValues | null }) {
  const scenarioLabels: Record<string, string> = { default: "Mặc định đề xuất", optimistic: "Lạc quan", conservative: "Thận trọng", custom: "Tùy chỉnh" };
  const objectiveLabels: Record<string, string> = { saving: "Tiết kiệm điện", peak_shaving: "Cắt đỉnh", solar_optimization: "Tối ưu PV", backup: "Dự phòng", power_quality: "Chất lượng điện", investment: "Đánh giá đầu tư" };
  const items = [
    ["Kịch bản", scenarioLabels[scenario] ?? scenario],
    ["Thời hạn", `${result.analysisYears} năm`],
    ["Biểu giá", `${basicInfo?.industry || "Sản xuất"} - ${basicInfo?.voltageLevel || "chưa xác định"}`],
    ["Mục tiêu", basicInfo?.bessObjectives.map((item) => objectiveLabels[item] ?? item).join(", ") || "Chưa xác định"],
    ["Engine", `${analysisRun?.engine_version ?? "Step 2"} + ${result.configVersions.resultEngine}`]
  ];
  return <Card className="mt-4 rounded-xl bg-white p-3 shadow-panel"><div className="flex flex-wrap gap-2">{items.map(([label, value]) => <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-brand-navy" key={label}><span className="text-brand-muted">{label}: </span>{value}</span>)}</div></Card>;
}

function UnifiedResultDashboard({
  onSelectCandidate,
  onSelectRepresentative,
  effectiveWaccPct,
  assumptions,
  options,
  result,
  selected
}: {
  effectiveWaccPct: number;
  assumptions: QuickSizingAssumptions;
  onSelectCandidate: (candidateId: string) => void;
  onSelectRepresentative: (option: SizingOptionResult) => void;
  options: SizingOptionResult[];
  result: QuickSizingResult;
  selected: SizingCandidateResult;
}) {
  return (
    <>
      <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-brand-blue">
        <Info className="mt-0.5 shrink-0" size={20} />
        <div>
          <strong className="block text-brand-navy">Dashboard kết quả tổng hợp</strong>
          <span>{formatNumber(result.candidates.length, 0)} candidate hợp lệ được tính FCFF, Pareto và recommendation score. Ba card bên dưới là đại diện, không phải toàn bộ tập candidate.</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_360px] items-start gap-5 max-xl:grid-cols-1">
        <div className="grid min-w-0 gap-5">
          <Section title="1. Chọn phương án sizing">
            <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
              {options.map((option) => (
                <OptionCard
                  key={option.role}
                  option={option}
                  selected={option.id === selected.id}
                  onSelect={() => onSelectRepresentative(option)}
                />
              ))}
            </div>
          </Section>

          <Section title="2. KPI phương án đang chọn">
            <KpiGrid candidate={selected} analysisYears={result.analysisYears} />
          </Section>

          <CashFlowChart candidate={selected} />
          <ParetoChart onSelect={onSelectCandidate} points={result.paretoPoints} selectedId={selected.id} />
          <ComparisonTable options={options} selectedId={selected.id} analysisYears={result.analysisYears} />
        </div>

        <aside className="grid gap-5">
          <RecommendationPanel candidate={selected} effectiveWaccPct={effectiveWaccPct} recommendedId={result.recommendedOption?.id ?? null} />
          <DemandChargeResultPanel assumptions={assumptions} candidate={selected} />
          <CapexBreakdownPanel candidate={selected} />
          <ScenarioRangePanel result={result} />
          <ConfidencePanel result={result} />
          <WarningsPanel warnings={result.warnings} />
          <TracePanel result={result} />
        </aside>
      </div>
    </>
  );
}

function RecommendationPanel({ candidate, effectiveWaccPct, recommendedId }: { candidate: SizingCandidateResult; effectiveWaccPct: number; recommendedId: string | null }) {
  const isRecommended = candidate.id === recommendedId;
  const hasFinancialRecommendation = recommendedId !== null;
  return (
    <Card className="rounded-xl border-blue-100 bg-blue-50 p-5 shadow-panel">
      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-blue">{isRecommended ? "Phương án khuyến nghị" : "Candidate đang chọn"}</span>
      <h2 className="mt-3 text-xl font-bold text-brand-navy">{formatNumber(candidate.powerKw, 0)} kW / {formatNumber(candidate.energyKwh, 0)} kWh</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
        {hasFinancialRecommendation
          ? `CAPEX ${formatVnd(candidate.capex.totalCapexVnd)}, tiết kiệm vận hành ròng năm đầu ${formatVnd(candidate.netOperatingSavingYear1Vnd)}, payback ${formatPayback(candidate.paybackYears)} và IRR ${formatPercent(candidate.irrPct)}.`
          : "Chưa có phương án đạt tiêu chí tài chính. Candidate đang chọn chỉ là phương án tham khảo để xem chi phí, coverage và dòng tiền."}
      </p>
      <div className="mt-4 grid gap-2">
        {candidate.meetsPeakReductionTarget !== null ? <Criterion ok={candidate.meetsPeakReductionTarget === true}>Đạt coverage peak {formatPercent(candidate.technicalCoveragePct)}</Criterion> : null}
        <Criterion ok={candidate.npvVnd > 0}>NPV dương</Criterion>
        <Criterion ok={candidate.irrPct !== null && candidate.irrPct >= effectiveWaccPct}>IRR ≥ WACC {formatPercent(effectiveWaccPct)}</Criterion>
        <Criterion ok={candidate.paybackYears !== null && candidate.paybackYears <= candidate.yearlyResults.length - 1}>Payback trong horizon</Criterion>
        <Criterion ok={candidate.budgetEvaluation.status !== "materially_over"}>{formatBudgetStatus(candidate.budgetEvaluation.status)}</Criterion>
      </div>
    </Card>
  );
}

function DemandChargeResultPanel({ assumptions, candidate }: { assumptions: QuickSizingAssumptions; candidate: SizingCandidateResult }) {
  const year1 = candidate.yearlyResults[1];
  const reducedPeakKw = year1?.effectivePeakReductionKw ?? 0;
  const demandSavingVnd = year1?.demandSavingVnd ?? 0;
  const potentialDemandSavingVnd = year1?.potentialDemandSavingVnd ?? 0;
  const rows: Array<[string, string]> = [
    ["Applicability", formatDemandApplicability(assumptions.demandChargeApplicability)],
    ["Effective value", `${formatVnd(assumptions.effectiveDemandChargeVndPerKwMonth)}/kW/tháng`],
    ["Source", formatDemandSource(assumptions.demandChargeSource)],
    ["Status", assumptions.demandChargeStatus],
    ["Voltage band", formatDemandVoltageBand(assumptions.detailedVoltageBand)],
    ["Included in NPV", assumptions.demandSavingIncludedInBaseNpv ? "Có" : "Không"]
  ];

  return (
    <Section title="Giá công suất">
      {assumptions.demandChargeStatus === "trial_reference" ? (
        <span className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Tham chiếu thử nghiệm</span>
      ) : null}
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={label}>
            <span className="font-semibold text-brand-muted">{label}</span>
            <strong className="text-right text-brand-navy">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-muted">
        <strong className="text-brand-navy">DemandSaving:</strong> {formatNumber(reducedPeakKw, 1)} kW x {formatVnd(assumptions.effectiveDemandChargeVndPerKwMonth)}/kW/tháng x 12 = {formatVnd(demandSavingVnd)}/năm.
      </div>
      {demandSavingVnd <= 0 ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
          Chưa ghi nhận lợi ích phí công suất.
          {potentialDemandSavingVnd > 0 ? ` Potential tham chiếu chưa cộng vào NPV cơ sở: ${formatVnd(potentialDemandSavingVnd)}/năm.` : ""}
        </div>
      ) : null}
    </Section>
  );
}

function CapexBreakdownPanel({ candidate }: { candidate: SizingCandidateResult }) {
  const capex = candidate.capex;
  const rows: Array<[string, string]> = [
    ["Chi phí hệ thống pin DC", formatVnd(capex.batteryCostVnd)],
    ["Chi phí thiết bị PCS", formatVnd(capex.pcsCostVnd)],
    ["Tổng chi phí thiết bị", formatVnd(capex.equipmentCostVnd)],
    ["Tỷ lệ EPC cơ sở", `${formatNumber(capex.epcBaseRatePct, 1)}%`],
    ["Điều chỉnh điện áp", `${formatNumber(capex.epcVoltageAdjustmentPct, 1)}%`],
    ["Tỷ lệ EPC áp dụng", `${formatNumber(capex.epcAppliedRatePct, 1)}%`],
    ["EPC & triển khai tổng hợp", formatVnd(capex.epcAllInVnd)],
    ["CAPEX trước VAT", formatVnd(capex.capexExcludingVatVnd)],
    ["VAT", formatVnd(capex.vatVnd)],
    ["Tổng CAPEX", formatVnd(capex.totalCapexVnd)]
  ];

  return (
    <Section title="Chi tiết CAPEX">
      {capex.costModelStatus !== "confirmed" ? (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
          Chi phí đang là ước tính sơ bộ, chưa phải báo giá nhà cung cấp.
        </div>
      ) : null}
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 text-sm" key={label}>
            <span className="font-semibold text-brand-muted">{label}</span>
            <strong className="text-right text-brand-navy">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-muted">
        <strong className="text-brand-navy">Catalog:</strong> {capex.costCatalogVersion} ({capex.costModelStatus}, {capex.costModelSourceName})
      </div>
      <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-brand-muted">
        <UnitCostLine title="Pin DC" source={capex.batteryUnitCost.source} unit={capex.batteryUnitCost.unit} value={capex.batteryUnitCost.value} />
        <UnitCostLine title="PCS" source={capex.pcsUnitCost.source} unit={capex.pcsUnitCost.unit} value={capex.pcsUnitCost.value} />
      </div>
      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-muted">
        <strong className="text-brand-navy">EPC bao gồm:</strong> {capex.epcScopeItems.join(", ")}
      </div>
    </Section>
  );
}

function UnitCostLine({ source, title, unit, value }: { source: string; title: string; unit: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span>{title}: {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} {unit}</span>
      <strong className="text-brand-navy">{source === "user_input" ? "User input" : source === "frontend_fallback" ? "Fallback frontend" : `Backend catalog (${source})`}</strong>
    </div>
  );
}

function OptionCard({ option, selected, onSelect }: { option: SizingOptionResult; selected: boolean; onSelect: () => void }) {
  return <button className={cn("rounded-xl border bg-white p-4 text-left transition hover:border-brand-blue hover:bg-blue-50/40", selected && "border-brand-blue bg-blue-50 shadow-[0_0_0_1px_rgba(7,91,234,0.14)]")} onClick={onSelect} type="button"><span className={cn("rounded-full px-3 py-1 text-xs font-bold", selected ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-muted")}>{option.badge}</span><h3 className="mt-3 text-base font-bold text-brand-navy">{option.title}</h3><div className="mt-3 grid grid-cols-2 gap-2"><Metric label="Công suất" value={`${formatNumber(option.powerKw, 0)} kW`} /><Metric label="Dung lượng" value={`${formatNumber(option.energyKwh, 0)} kWh`} /><Metric label="CAPEX" value={formatVnd(option.capex.totalCapexVnd)} /><Metric label="Payback" value={formatPayback(option.paybackYears)} /></div></button>;
}

function KpiGrid({ analysisYears, candidate, compact = false }: { analysisYears: number; candidate: SizingCandidateResult; compact?: boolean }) {
  const peakCards: Array<[string, string, string, LucideIcon]> = candidate.designObjective === "peak_shaving"
    ? [
      ["Cửa sổ peak", formatNumber(candidate.designPeakEventDurationHours ?? 0, 2), "giờ thiết kế", Clock3],
      ["AC khả dụng/event", formatNumber(candidate.usableAcEnergyPerEventKwh ?? 0, 0), "kWh", BatteryCharging],
      ["Giảm peak hiệu dụng", formatNumber(candidate.effectivePeakReductionKw ?? 0, 0), "kW", Target],
      ["Duration tại peak", formatNumber(candidate.deliverableDurationAtReducedPeakHours ?? 0, 2), "giờ", Clock3]
    ]
    : [];
  const cards: Array<[string, string, string, LucideIcon]> = [
    ["Công suất", formatNumber(candidate.powerKw, 0), "kW", Zap],
    ["Dung lượng", formatNumber(candidate.energyKwh, 0), "kWh", BatteryCharging],
    ["Thời lượng danh định", formatNumber(candidate.nominalDurationHours, 2), "giờ", Clock3],
    ...peakCards,
    ["CAPEX", formatVnd(candidate.capex.totalCapexVnd), "", Wallet],
    ["Tiết kiệm ròng", formatVnd(candidate.netOperatingSavingYear1Vnd), "/năm", LineChart],
    ["Payback", formatPayback(candidate.paybackYears), "", Clock3],
    [`NPV ${analysisYears} năm`, formatVnd(candidate.npvVnd), "", Target],
    ["IRR", formatPercent(candidate.irrPct), "", Sparkles]
  ];
  return <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-4 max-xl:grid-cols-2 max-sm:grid-cols-1")}>{cards.map(([label, value, unit, Icon]) => <Card className="grid min-h-[90px] grid-cols-[40px_1fr] items-center gap-3 rounded-xl p-3 shadow-none" key={label}><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand-blue"><Icon size={20} /></span><span><small className="block text-xs font-bold text-brand-muted">{label}</small><strong className="mt-1 block text-xl font-bold text-brand-navy">{value} {unit ? <span className="text-sm">{unit}</span> : null}</strong></span></Card>)}</div>;
}

function CashFlowChart({ candidate }: { candidate: SizingCandidateResult }) {
  const values = candidate.yearlyResults.map((row) => row.cumulativeCashFlowVnd);
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

function ParetoChart({ onSelect, points, selectedId }: { onSelect: (candidateId: string) => void; points: ParetoPoint[]; selectedId: string }) {
  const xs = points.map((point) => point.annualSavingMillionVnd);
  const ys = points.map((point) => point.npvOverCapex);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, -0.2);
  const maxY = Math.max(...ys, 0.2);
  const width = 820;
  const height = 330;
  const x = (value: number) => 58 + ((value - minX) / Math.max(1, maxX - minX)) * 700;
  const y = (value: number) => 265 - ((value - minY) / Math.max(0.01, maxY - minY)) * 210;
  const zeroY = y(0);

  return <Section title="Pareto tiết kiệm ròng × NPV/CAPEX"><div className="h-[360px] overflow-x-auto"><svg className="h-full min-w-[760px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Pareto Savings x NPV/CAPEX">{[60, 110, 160, 215, 265].map((lineY) => <line key={lineY} x1="52" x2="780" y1={lineY} y2={lineY} stroke="#DBE6F6" strokeDasharray="5 7" />)}<line x1="52" x2="780" y1={zeroY} y2={zeroY} stroke="#94A3B8" strokeDasharray="6 6" /><text x="58" y={Math.max(20, zeroY - 8)} fill="#64748B" fontSize="11">ROI = 0</text>{points.map((point) => <g className="cursor-pointer" key={point.candidateId} onClick={() => onSelect(point.candidateId)}><circle cx={x(point.annualSavingMillionVnd)} cy={y(point.npvOverCapex)} r={point.candidateId === selectedId ? 8 : point.isPareto ? 6 : 4} fill={point.candidateId === selectedId ? "#075BEA" : point.isPareto ? "#08A64A" : "#94A3B8"} stroke="#fff" strokeWidth="2" /><title>{`${formatNumber(point.powerKw, 0)} kW / ${formatNumber(point.energyKwh, 0)} kWh - Saving ${formatNumber(point.annualSavingMillionVnd, 1)} triệu/năm - NPV/CAPEX ${formatNumber(point.npvOverCapex, 2)} lần`}</title></g>)}<text x="410" y="318" textAnchor="middle" fill="#627194" fontSize="12">Tiết kiệm vận hành ròng năm đầu (triệu VND/năm)</text><text x="18" y="160" transform="rotate(-90 18 160)" textAnchor="middle" fill="#627194" fontSize="12">NPV/CAPEX (lần)</text></svg></div></Section>;
}

function ScenarioRangePanel({ result }: { result: QuickSizingResult }) {
  return (
    <Section title="Khoảng kết quả dự kiến">
      <RangeRow label="Tiết kiệm ròng" range={result.scenarioRanges.netOperatingSavingYear1Vnd} formatter={(value) => `${formatVnd(value)}/năm`} />
      <RangeRow label="Payback" range={result.scenarioRanges.paybackYears} emptyText="Chưa hoàn vốn" formatter={(value) => formatPayback(value, result.analysisYears)} />
      <RangeRow label={`NPV ${result.analysisYears} năm`} range={result.scenarioRanges.npvVnd} formatter={formatVnd} />
      <RangeRow label="IRR" range={result.scenarioRanges.irrPct} formatter={(value) => `${formatNumber(value, 1)}%`} />
    </Section>
  );
}

function ConfidencePanel({ result }: { result: QuickSizingResult }) {
  const labels: Record<string, string> = { high: "Cao", medium: "Trung bình", preliminary: "Sơ bộ", low: "Thấp" };
  return (
    <Section title="Chất lượng dữ liệu">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{labels[result.confidence.level] ?? result.confidence.level}</span>
        <strong className="text-right text-sm text-brand-navy">{result.confidence.score}/100</strong>
      </div>
      <div className="mt-4 grid gap-2.5">
        {result.confidence.reasons.map((row) => (
          <div className="flex items-start gap-2 text-sm font-medium leading-5 text-brand-muted" key={row}>
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-500" size={16} />
            {row}
          </div>
        ))}
      </div>
    </Section>
  );
}

function WarningsPanel({ warnings }: { warnings: ResultWarning[] }) {
  const visible = warnings.slice(0, 6);
  return (
    <Section title="Cảnh báo">
      <div className="grid gap-2">
        {visible.length > 0 ? visible.map((warning) => (
          <div className={cn("rounded-lg px-3 py-2 text-xs font-semibold leading-5", warning.severity === "error" ? "bg-red-50 text-red-700" : warning.severity === "warning" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-brand-blue")} key={`${warning.code}-${warning.candidateId ?? "global"}-${warning.message}`}>
            <strong>{warning.code}: </strong>{warning.message}
          </div>
        )) : <p className="text-sm font-medium text-brand-muted">Không có cảnh báo blocking.</p>}
      </div>
    </Section>
  );
}

function TracePanel({ result }: { result: QuickSizingResult }) {
  return (
    <Section title="Cách tính">
      <div className="grid gap-2">
        {result.calculationTrace.slice(0, 5).map((trace) => (
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5" key={trace.formulaId}>
            <strong className="text-brand-navy">{trace.formulaId} - {trace.title}</strong>
            <p className="mt-1 font-medium text-brand-muted">{trace.formula}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function QuickSizingLeadGate({
  analysisRunId,
  assumptions,
  basicInfo,
  candidate,
  onUnlocked,
  result,
  scenario,
  selectedOptionId
}: {
  analysisRunId: string | null;
  assumptions: QuickSizingAssumptions;
  basicInfo: QuickSizingStep1FormValues | null;
  candidate: SizingCandidateResult;
  onUnlocked: (resultCode: string) => void;
  result: QuickSizingResult;
  scenario: string;
  selectedOptionId: string;
}) {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<LeadForm>({
    ...initialLeadForm,
    name: user?.representative_name ?? "",
    company: user?.company_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await leadsApi.captureQuickSizing({
        full_name: form.name,
        company_name: form.company || undefined,
        email: form.email,
        phone: form.phone,
        industry: basicInfo?.industry || undefined,
        interest: "Nhận báo cáo Quick Sizing đầy đủ",
        privacy_consent: form.acceptedTerms,
        marketing_consent: form.acceptedMarketing,
        training_consent: form.acceptedTraining,
        analysis_run_id: analysisRunId,
        input_snapshot: {
          basic_info: basicInfo,
          assumptions,
          scenario,
          selected_option_id: selectedOptionId
        },
        result_snapshot: {
          selected_candidate: compactQuickSizingCandidate(candidate),
          representative_options: {
            low_cost: compactQuickSizingCandidate(result.lowCostOption),
            recommended: compactQuickSizingCandidate(result.recommendedOption),
            high_benefit: compactQuickSizingCandidate(result.highBenefitOption)
          },
          analysis_years: result.analysisYears,
          confidence: result.confidence,
          scenario_ranges: result.scenarioRanges,
          pareto_points: result.paretoPoints,
          warnings: result.warnings,
          config_versions: result.configVersions
        },
        metadata: {
          page: "quick-sizing-result",
          locale: "vi-VN"
        }
      });
      onUnlocked(response.result_code ?? `QS-${response.lead_id.slice(-8).toUpperCase()}`);
    } catch (submitError) {
      setError(readLeadApiError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 grid grid-cols-[minmax(0,1fr)_420px] items-start gap-5 max-xl:grid-cols-1">
      <Card className="rounded-xl border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-panel">
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-blue">Kết quả sơ bộ</span>
        <h2 className="mt-4 text-2xl font-bold text-brand-navy">Phương án đề xuất khoảng {formatNumber(candidate.powerKw, 0)} kW / {formatNumber(candidate.energyKwh, 0)} kWh</h2>
        <p className="mt-3 max-w-[760px] text-sm font-medium leading-6 text-brand-muted">Hệ thống đã hoàn tất candidate grid và xác định phương án đại diện. Nhập thông tin liên hệ để mở báo cáo đầy đủ gồm ba phương án, dòng tiền, NPV, IRR, Pareto, CAPEX và các cảnh báo giả định.</p>
        <div className="mt-5 grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <Metric label="Công suất sơ bộ" value={`${formatNumber(candidate.powerKw, 0)} kW`} />
          <Metric label="Dung lượng sơ bộ" value={`${formatNumber(candidate.energyKwh, 0)} kWh`} />
          <Metric label="CAPEX ước tính" value={formatVnd(candidate.capex.totalCapexVnd)} />
          <Metric label="Tiết kiệm năm đầu" value={formatVnd(candidate.netOperatingSavingYear1Vnd)} />
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-blue-200 bg-white/80 p-5">
          <div className="grid grid-cols-3 gap-4 opacity-45 blur-[2px] max-md:grid-cols-1">
            <div className="h-28 rounded-lg bg-blue-100" />
            <div className="h-28 rounded-lg bg-green-100" />
            <div className="h-28 rounded-lg bg-violet-100" />
          </div>
          <p className="mt-4 text-center text-sm font-bold text-brand-blue">Báo cáo chi tiết đang được khóa</p>
        </div>
      </Card>

      <Card className="sticky top-24 rounded-xl bg-white p-5 shadow-panel max-xl:static">
        <h2 className="text-xl font-bold text-brand-navy">Mở báo cáo Quick Sizing đầy đủ</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">Thông tin được lưu vào pipeline lead của DataInsight cùng input và kết quả Quick Sizing để đội ngũ tư vấn tiếp tục hỗ trợ.</p>
        <form className="mt-4 grid gap-3" onSubmit={submit}>
          <LeadInput icon={UserRound} label="Họ và tên" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <LeadInput icon={Wallet} label="Công ty" required={false} value={form.company} onChange={(value) => setForm({ ...form, company: value })} />
          <LeadInput icon={Mail} label="Email công việc" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <LeadInput icon={Phone} label="Số điện thoại" type="tel" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <label className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-navy"><input className="mt-1 size-4 accent-brand-blue" checked={form.acceptedTerms} onChange={(event) => setForm({ ...form, acceptedTerms: event.target.checked })} required type="checkbox" /><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</span></label>
          <label className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-muted"><input className="mt-1 size-4 accent-brand-blue" checked={form.acceptedMarketing} onChange={(event) => setForm({ ...form, acceptedMarketing: event.target.checked })} type="checkbox" /><span>Tôi đồng ý nhận thông tin tư vấn từ DataInsight.</span></label>
          <label className="flex items-start gap-3 text-sm font-medium leading-6 text-brand-muted"><input className="mt-1 size-4 accent-brand-blue" checked={form.acceptedTraining} onChange={(event) => setForm({ ...form, acceptedTraining: event.target.checked })} type="checkbox" /><span>Tôi đồng ý cho phép sử dụng dữ liệu Quick Sizing đã ẩn danh để cải thiện mô hình.</span></label>
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div> : null}
          <button className={buttonVariants({ variant: "green", className: "h-11 w-full" })} disabled={submitting} type="submit"><Send size={18} />{submitting ? "Đang lưu và mở báo cáo..." : "Nhận báo cáo đầy đủ"}</button>
        </form>
      </Card>
    </div>
  );
}

function LeadInput({ icon: Icon, label, required = true, value, onChange, type = "text" }: { icon: LucideIcon; label: string; required?: boolean; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="relative grid gap-1.5"><span className="text-sm font-semibold text-brand-navy">{label} {required ? <span className="text-red-600">*</span> : null}</span><Icon className="absolute left-4 top-[38px] text-brand-muted" size={17} /><input className="h-10 rounded-lg border border-brand-line pl-11 pr-4 text-sm font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15" onChange={(event) => onChange(event.target.value)} placeholder={label} required={required} type={type} value={value} /></label>;
}

function ComparisonTable({ analysisYears, options, selectedId }: { analysisYears: number; options: SizingOptionResult[]; selectedId: string }) {
  const rows: Array<[string, (option: SizingOptionResult) => string]> = [
    ["Công suất", (item) => `${formatNumber(item.powerKw, 0)} kW`],
    ["Dung lượng", (item) => `${formatNumber(item.energyKwh, 0)} kWh`],
    ["CAPEX", (item) => formatVnd(item.capex.totalCapexVnd)],
    ["Tiết kiệm ròng/năm", (item) => formatVnd(item.netOperatingSavingYear1Vnd)],
    ["Payback", (item) => formatPayback(item.paybackYears)],
    [`NPV ${analysisYears} năm`, (item) => formatVnd(item.npvVnd)],
    ["IRR", (item) => formatPercent(item.irrPct)]
  ];
  return <Section title="So sánh ba phương án"><div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-sm"><thead><tr className="bg-blue-50"><th className="px-3 py-3 text-left">Chỉ tiêu</th>{options.map((item) => <th className={cn("px-3 py-3 text-center", item.id === selectedId && "bg-brand-blue text-white")} key={item.id}>{item.title}</th>)}</tr></thead><tbody>{rows.map(([label, render]) => <tr className="border-t border-brand-line" key={label}><td className="px-3 py-2 font-semibold text-brand-navy">{label}</td>{options.map((item) => <td className={cn("px-3 py-2 text-center font-medium text-brand-muted", item.id === selectedId && "bg-blue-50 font-bold text-brand-blue")} key={item.id}>{render(item)}</td>)}</tr>)}</tbody></table></div></Section>;
}

function RangeRow({ emptyText = "N/A", label, range, formatter }: { emptyText?: string; label: string; range: MetricRange; formatter: (value: number) => string }) {
  const value = range.min === null || range.max === null ? emptyText : `${formatter(range.min)} - ${formatter(range.max)}`;
  return <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm font-semibold text-brand-muted">{label}</span><strong className="text-right text-brand-navy">{value}</strong></div>;
}

function compactQuickSizingCandidate(candidate: SizingCandidateResult | null) {
  if (!candidate) return null;
  return {
    id: candidate.id,
    power_kw: candidate.powerKw,
    energy_kwh: candidate.energyKwh,
    capex_vnd: candidate.capex.totalCapexVnd,
    annual_saving_vnd: candidate.netOperatingSavingYear1Vnd,
    npv_vnd: candidate.npvVnd,
    irr_pct: candidate.irrPct,
    payback_years: candidate.paybackYears,
    technical_coverage_pct: candidate.technicalCoveragePct,
    effective_peak_reduction_kw: candidate.effectivePeakReductionKw,
    budget_status: candidate.budgetEvaluation.status,
    recommendation_score: candidate.recommendationScore
  };
}

function quickSizingFingerprint(
  analysisRunId: string | null,
  basicInfo: QuickSizingStep1FormValues | null,
  assumptions: QuickSizingAssumptions
) {
  const raw = analysisRunId || JSON.stringify({
    industry: basicInfo?.industry,
    bill: basicInfo?.monthlyElectricityBillVnd,
    voltage: basicInfo?.voltageLevel,
    objectives: basicInfo?.bessObjectives,
    assumptions
  });
  let hash = 5381;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(index);
  }
  return Math.abs(hash >>> 0).toString(36);
}

function representativeOptions(result: QuickSizingResult) {
  return [result.lowCostOption, result.recommendedOption, result.highBenefitOption].filter((option): option is SizingOptionResult => Boolean(option));
}

function formatPayback(value: number | null, analysisYears?: number) {
  if (value === null || !Number.isFinite(value) || value < 0 || (analysisYears !== undefined && value > analysisYears)) {
    return "Chưa hoàn vốn";
  }

  return `${formatNumber(value, 1)} năm`;
}

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${formatNumber(value, 1)}%`;
}

function formatBudgetStatus(status: string) {
  const labels: Record<string, string> = {
    within_budget: "Trong ngân sách",
    slightly_over: "Vượt nhẹ ngân sách",
    materially_over: "Vượt ngân sách đáng kể",
    not_defined: "Chưa có ngân sách"
  };

  return labels[status] ?? status;
}

function formatDemandApplicability(value: QuickSizingAssumptions["demandChargeApplicability"]) {
  const labels: Record<QuickSizingAssumptions["demandChargeApplicability"], string> = {
    applicable: "Có áp dụng",
    not_applicable: "Không áp dụng",
    unknown: "Chưa xác định"
  };

  return labels[value];
}

function formatDemandSource(value: string) {
  const labels: Record<string, string> = {
    invoice: "Hóa đơn/hợp đồng",
    user_input: "Người dùng nhập",
    evn_trial_reference: "EVN trial reference",
    not_applicable: "Không áp dụng",
    not_confirmed: "Chưa xác nhận",
    legacy_unconfirmed: "Legacy chưa xác nhận"
  };

  return labels[value] ?? value;
}

function formatDemandVoltageBand(value: QuickSizingAssumptions["detailedVoltageBand"]) {
  const labels: Record<QuickSizingAssumptions["detailedVoltageBand"], string> = {
    lt_6kv: "Dưới 6 kV",
    "6_to_lt_22kv": "6 - <22 kV",
    "22_to_lt_110kv": "22 - <110 kV",
    gte_110kv: ">=110 kV",
    low_voltage_step1_default: "Hạ áp từ Bước 1",
    medium_voltage_broad_default: "Trung áp rộng từ Bước 1",
    high_voltage_step1_default: "Cao áp từ Bước 1",
    unknown: "Chưa xác định"
  };

  return labels[value];
}

function Section({ children, title }: { children: ReactNode; title: string }) { return <Card className="rounded-xl bg-white p-4 shadow-panel"><h2 className="mb-4 text-xl font-bold text-brand-navy">{title}</h2>{children}</Card>; }
function Metric({ label, value }: { label: string; value: string }) { return <span className="rounded-lg bg-slate-50 p-2"><span className="block text-xs font-semibold text-brand-muted">{label}</span><strong className="mt-1 block text-sm font-bold text-brand-navy">{value}</strong></span>; }
function Criterion({ children, ok }: { children: ReactNode; ok: boolean }) { return <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold", ok ? "bg-white text-brand-navy" : "bg-amber-50 text-amber-800")}><CheckCircle2 className={ok ? "text-brand-green" : "text-amber-500"} size={16} />{children}</span>; }
