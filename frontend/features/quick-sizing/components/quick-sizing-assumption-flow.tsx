"use client";

import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, BatteryCharging, Check, CircleDollarSign, Info, RotateCcw, Shield, ShieldCheck, SlidersHorizontal, Sparkles, WalletCards, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildQuickSizingResultFromAssumptions,
  calculateBaseAssumptionCapex,
  calculateQuickSizingCandidateMetrics,
  calculateQuickSizingMetrics,
  DEMAND_CHARGE_SLIDER_MAX_VND_PER_KW_MONTH,
  DEMAND_CHARGE_SLIDER_MIN_VND_PER_KW_MONTH,
  DEMAND_CHARGE_SLIDER_STEP_VND_PER_KW_MONTH,
  formatNumber,
  formatVnd,
  resolveDemandChargeFromStep1Voltage,
  type QuickSizingAssumptions,
  type QuickSizingScenario
} from "../data/quick-sizing-model";
import type { QuickSizingStep1FormValues } from "../data/quick-sizing-step1-schema";
import { useQuickSizingStore } from "../data/quick-sizing-store";
import type { CapexBreakdown } from "../result-calculation";

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

const technicalPrimaryFields: NumberField[] = [
  { key: "energyKwh", label: "Dung lượng BESS", unit: "kWh", min: 100, max: 10_000, step: 50 },
  { key: "powerKw", label: "Công suất BESS", unit: "kW", min: 50, max: 5_000, step: 25 },
  { key: "dodPct", label: "Độ sâu xả DoD", unit: "%", min: 50, max: 100 },
  { key: "rtePct", label: "Hiệu suất vòng RTE", unit: "%", min: 70, max: 100 }
];

const operatingAdvancedFields: NumberField[] = [
  { key: "degradationPct", label: "Suy hao pin", unit: "%/năm", min: 0, max: 5, step: 0.1 },
  { key: "cyclesPerDay", label: "Chu kỳ sạc/xả", unit: "chu kỳ/ngày", min: 0.2, max: 3, step: 0.1 },
  { key: "operatingDaysPerYear", label: "Ngày vận hành", unit: "ngày/năm", min: 100, max: 365 }
];

const peakAdvancedFields: NumberField[] = [
  { key: "peakEventDurationHours", label: "Thời gian cắt đỉnh mỗi lần", unit: "giờ/lần", min: 0.25, max: 8, step: 0.25 },
  { key: "peakEventFrequencyPerOperatingDay", label: "Số lần cắt đỉnh trung bình/ngày", unit: "lần/ngày", min: 0, max: 3, step: 0.1 },
  { key: "minimumPeakCoveragePct", label: "Mức đáp ứng mục tiêu tối thiểu", unit: "%", min: 50, max: 100, step: 1 }
];

const costFields: NumberField[] = [
  { key: "batteryCostVndPerKwh", label: "Chi phí hệ thống pin DC", unit: "VND/kWh danh định", min: 1_500_000, max: 8_000_000, step: 100_000 },
  { key: "pcsCostVndPerKw", label: "Chi phí thiết bị PCS", unit: "VND/kW AC", min: 500_000, max: 5_000_000, step: 100_000 },
  { key: "omPct", label: "O&M hằng năm", unit: "% CAPEX/năm", min: 0, max: 10, step: 0.1 },
  { key: "omGrowthPct", label: "Tăng O&M", unit: "%/năm", min: 0, max: 10, step: 0.1 }
];

const tariffFields: NumberField[] = [
  { key: "offPeakPrice", label: "Giá thấp điểm", unit: "VND/kWh", min: 0, max: 5_000, step: 10 },
  { key: "normalPrice", label: "Giá bình thường", unit: "VND/kWh", min: 0, max: 5_000, step: 10 },
  { key: "peakPrice", label: "Giá cao điểm", unit: "VND/kWh", min: 0, max: 8_000, step: 10 },
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
  const analysisRun = useQuickSizingStore((state) => state.analysisRun);
  const assumptions = useQuickSizingStore((state) => state.assumptions);
  const scenario = useQuickSizingStore((state) => state.scenario);
  const dirtyFields = useQuickSizingStore((state) => state.dirtyFields);
  const initializeAssumptions = useQuickSizingStore((state) => state.initializeAssumptions);
  const applyScenario = useQuickSizingStore((state) => state.applyScenario);
  const setAnalysisRun = useQuickSizingStore((state) => state.setAnalysisRun);
  const updateAssumption = useQuickSizingStore((state) => state.updateAssumption);
  const resetEpcToAuto = useQuickSizingStore((state) => state.resetEpcToAuto);
  const resetDemandChargeToStep1Voltage = useQuickSizingStore((state) => state.resetDemandChargeToStep1Voltage);
  const resetAssumptions = useQuickSizingStore((state) => state.resetAssumptions);
  const updateNumericAssumption = (key: NumericAssumptionKey, value: number) => updateAssumption(key, value);
  const previousFinancialCandidateRef = useRef<{ demandKey: string; id: string; powerKw: number; energyKwh: number } | null>(null);
  const [candidateShiftMessage, setCandidateShiftMessage] = useState<string | null>(null);

  useEffect(() => {
    initializeAssumptions();
  }, [initializeAssumptions]);

  const resultPreview = useMemo(() => buildQuickSizingResultFromAssumptions(assumptions, basicInfo), [assumptions, basicInfo]);
  const financialPreviewOption = resultPreview.recommendedOption ?? resultPreview.lowCostOption ?? resultPreview.candidates[0] ?? null;
  const baseCandidatePreview = resultPreview.candidates.find((candidate) => (
    candidate.powerKw === assumptions.powerKw && candidate.energyKwh === assumptions.energyKwh
  )) ?? null;
  const capexPreview = useMemo(() => calculateBaseAssumptionCapex(assumptions, basicInfo), [assumptions, basicInfo]);
  const metrics = useMemo(() => calculateQuickSizingMetrics(assumptions, basicInfo), [assumptions, basicInfo]);
  const financialMetrics = useMemo(() => calculateQuickSizingCandidateMetrics(assumptions, basicInfo), [assumptions, basicInfo]);
  const hasPeakShaving = (basicInfo?.bessObjectives ?? []).includes("peak_shaving");
  const technicalFields = hasPeakShaving
    ? [...technicalPrimaryFields, ...operatingAdvancedFields, ...peakAdvancedFields]
    : [...technicalPrimaryFields, ...operatingAdvancedFields];
  const demandChargeKey = [
    assumptions.demandChargeApplicability,
    assumptions.demandChargeMode,
    assumptions.detailedVoltageBand,
    assumptions.demandChargeInputVndPerKwMonth,
    assumptions.effectiveDemandChargeVndPerKwMonth
  ].join("|");
  const inherited = useMemo(() => buildInheritedLabels(basicInfo), [basicInfo]);
  const backendResult = analysisRun?.result;
  const backendWarnings = backendResult?.warnings ?? [];
  const blockingWarnings = backendWarnings.filter((warning) => warning.blocking);
  const costModelIsPreliminary = assumptions.costModelStatus !== "confirmed";
  const dominantPowerObjective = backendResult?.technical_assumptions.power_kw
    ? backendResult.objective_sizing
      .filter((item) => item.applicable)
      .sort((left, right) => right.power_kw - left.power_kw)[0]?.objective
    : null;
  const dominantEnergyObjective = backendResult?.technical_assumptions.energy_kwh
    ? backendResult.objective_sizing
      .filter((item) => item.applicable)
      .sort((left, right) => right.energy_kwh - left.energy_kwh)[0]?.objective
    : null;
  const summaryWarnings = [
    assumptions.demandChargeSource === "step1_voltage_auto" ? `Giá công suất này ĐÃ tự động gán từ cấp điện áp (${resolveDemandChargeFromStep1Voltage(assumptions.voltageLevel).voltageLevel}) bạn đã chọn ở Bước 1.` : null,
    hasPeakShaving && !assumptions.demandSavingIncludedInBaseNpv ? "Giá công suất chưa được xác nhận nên chưa cộng lợi ích giảm phí công suất vào NPV." : null,
    costModelIsPreliminary ? "Chi phí pin, PCS và EPC hiện vẫn là ước tính sơ bộ." : null,
    financialMetrics.paybackYears === null || financialMetrics.paybackYears > assumptions.analysisYears ? "Phương án tham khảo chưa hoàn vốn trong thời hạn phân tích." : null,
    assumptions.cyclesPerDay > 1.5 ? "Chu kỳ trên 1,5 lần/ngày có thể làm giảm tuổi thọ pin." : null,
    assumptions.rtePct < 85 ? "RTE dưới 85% làm giảm hiệu quả kinh tế." : null
  ].filter((message): message is string => Boolean(message));

  useEffect(() => {
    if (!financialPreviewOption) {
      previousFinancialCandidateRef.current = null;
      return;
    }
    const previous = previousFinancialCandidateRef.current;
    if (previous && previous.demandKey !== demandChargeKey && previous.id !== financialPreviewOption.id) {
      setCandidateShiftMessage(
        `Giá công suất thay đổi làm phương án tài chính tham khảo chuyển từ ${formatNumber(previous.powerKw, 0)} kW / ${formatNumber(previous.energyKwh, 0)} kWh sang ${formatNumber(financialPreviewOption.powerKw, 0)} kW / ${formatNumber(financialPreviewOption.energyKwh, 0)} kWh. CAPEX của từng cấu hình không thay đổi.`
      );
    }
    previousFinancialCandidateRef.current = {
      demandKey: demandChargeKey,
      id: financialPreviewOption.id,
      powerKw: financialPreviewOption.powerKw,
      energyKwh: financialPreviewOption.energyKwh
    };
  }, [demandChargeKey, financialPreviewOption]);

  const selectScenario = (nextScenario: Exclude<QuickSizingScenario, "custom">) => {
    if (dirtyFields.length > 0 && !window.confirm("Áp dụng kịch bản mới sẽ thay thế các giả định đã chỉnh sửa. Tiếp tục?")) {
      return;
    }
    if (nextScenario === "default" && analysisRun) {
      setAnalysisRun(analysisRun);
      return;
    }
    applyScenario(nextScenario);
  };

  return (
    <section className="mx-auto w-[min(1440px,calc(100%_-_48px))] pb-10 pt-5 max-sm:w-[min(100%_-_28px,640px)]">
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

      <Card className="mt-4 rounded-xl bg-white p-4 shadow-panel">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="mr-1 text-sm text-brand-navy">Dữ liệu kế thừa:</strong>
          {inherited.map((item) => <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-brand-navy" key={item}>{item}</span>)}
          {!basicInfo ? <span className="text-xs font-semibold text-amber-700">Chưa tìm thấy dữ liệu Bước 1, đang dùng bộ mặc định.</span> : null}
          <Link className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "ml-auto")} href="/quick-sizing">Chỉnh sửa Bước 1</Link>
        </div>
        {backendResult ? (
          <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-navy">
            <summary className="cursor-pointer text-brand-blue">Xem dữ liệu tính toán</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              <span>Phiên bản tính toán: {formatCalculationVersion(analysisRun.engine_version)}</span>
              <span>Nguồn công suất: {formatObjectiveLabel(dominantPowerObjective)}</span>
              <span>Nguồn dung lượng: {formatObjectiveLabel(dominantEnergyObjective)}</span>
              <span>Nhóm biểu giá: {formatTariffPlanCode(backendResult.tariff_assumptions.tariff_plan_code)}</span>
              <span>Ngân sách: {formatBudgetStatus(backendResult.budget_evaluation.status)}</span>
            </div>
            {backendWarnings.length > 0 ? (
              <div className={cn("mt-2 rounded-md px-3 py-2", blockingWarnings.length > 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800")}>
                {backendWarnings.slice(0, 3).map((warning) => warning.message).join(" ")}
              </div>
            ) : null}
          </details>
        ) : null}
      </Card>

      <Card className="mt-4 rounded-xl bg-white p-3 shadow-panel">
        <div className="grid grid-cols-4 gap-2.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {scenarioCards.map(({ id, title, description, icon: Icon }) => {
            const active = scenario === id;
            return (
              <button className={cn("grid min-h-[68px] grid-cols-[34px_1fr] items-center gap-3 rounded-lg border px-3 py-2 text-left", active ? "border-brand-blue bg-blue-50/70" : "border-brand-line bg-white hover:border-brand-blue")} key={id} onClick={() => selectScenario(id)} type="button">
                <span className={cn("grid size-8 place-items-center rounded-md", active ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-muted")}><Icon size={17} /></span>
                <span><strong className="block text-sm text-brand-navy">{title}</strong><small className="mt-1 block text-xs font-medium text-brand-muted">{description}</small></span>
              </button>
            );
          })}
          <div className={cn("grid min-h-[68px] grid-cols-[34px_1fr] items-center gap-3 rounded-lg border px-3 py-2", scenario === "custom" ? "border-brand-blue bg-blue-50/70" : "border-brand-line bg-white")}>
            <span className="grid size-8 place-items-center rounded-md bg-slate-100 text-brand-muted"><SlidersHorizontal size={17} /></span>
            <span><strong className="block text-sm text-brand-navy">Tùy chỉnh</strong><small className="mt-1 block text-xs font-medium text-brand-muted">Tự động kích hoạt khi sửa giá trị</small></span>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_390px] items-start gap-5 max-2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px] max-xl:grid-cols-1">
        <FieldCard description="Các thông số kỹ thuật chính được cập nhật tức thời khi điều chỉnh." icon={BatteryCharging} title="Cấu hình kỹ thuật">
          <FieldGrid fields={technicalFields} mode="slider" values={assumptions} onChange={updateNumericAssumption} />
        </FieldCard>

        <FieldCard description="Đơn giá thiết bị, O&M và tỷ lệ EPC cho cấu hình đang nhập." icon={WalletCards} title="Chi phí đầu tư & vận hành">
          <CostCatalogNotice isPreliminary={costModelIsPreliminary} source={assumptions.costModelSourceName} version={assumptions.costCatalogVersion} />
          <FieldGrid fields={costFields} mode="slider" values={assumptions} onChange={updateNumericAssumption} />
          <EpcRateSlider
            assumptions={assumptions}
            capex={capexPreview}
            onChange={(value) => updateAssumption("epcManualRatePct", value)}
            onResetAuto={resetEpcToAuto}
          />
          <EquipmentCostScopePanel assumptions={assumptions} />
        </FieldCard>

        <aside className="sticky top-24 h-fit max-xl:static">
          <div className="grid max-h-[calc(100vh-120px)] gap-4 overflow-auto pr-1 max-xl:max-h-none max-xl:overflow-visible max-xl:pr-0">
            <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-brand-navy via-[#123f77] to-brand-blue p-5 text-white shadow-panel">
              <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Activity size={20} /></span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-50">Cập nhật tức thời</span></div>
              <h2 className="mt-5 text-xl font-bold">Cấu hình đang nhập</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-blue-100">Theo dõi nhanh quy mô và khả năng đáp ứng của BESS.</p>
            </Card>
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-brand-blue"><Sparkles size={18} /></span><div><strong className="block text-sm text-brand-navy">Sẵn sàng xem kết quả</strong><span className="text-xs font-medium text-brand-muted">{dirtyFields.length > 0 ? `Đã chỉnh sửa ${dirtyFields.length} giả định` : "Đang dùng bộ đề xuất"}</span></div></div>
              <div className="mt-4 grid gap-2">
                <Link className={buttonVariants({ className: "h-11 w-full" })} href="/quick-sizing/ket-qua"><Zap size={18} />Tính kết quả<ArrowRight size={18} /></Link>
                <button className={buttonVariants({ variant: "secondary", className: "h-10 w-full" })} onClick={resetAssumptions} type="button"><RotateCcw size={16} />Khôi phục đề xuất</button>
                <Link className="text-center text-xs font-bold text-brand-muted hover:text-brand-blue" href="/quick-sizing"><ArrowLeft className="mr-1 inline" size={13} />Quay lại Bước 1</Link>
              </div>
            </Card>
            <Summary title="Thông số chính">
              <SummaryRow label="Công suất" value={`${formatNumber(metrics.powerKw, 0)} kW`} />
              <SummaryRow label="Dung lượng" value={`${formatNumber(metrics.energyKwh, 0)} kWh`} />
              <SummaryRow label="Thời lượng danh định" value={`${formatNumber(metrics.durationHours, 2)} giờ`} />
              <SummaryRow label="Năng lượng khả dụng" value={`${formatNumber(metrics.usableEnergyKwh, 0)} kWh`} />
              {hasPeakShaving ? (
                <>
                  <SummaryRow label="Cửa sổ cắt đỉnh" value={`${formatNumber(assumptions.peakEventDurationHours, 1)} giờ`} />
                  <SummaryRow label="Mức đáp ứng dự kiến" value={baseCandidatePreview?.technicalCoveragePct !== null && baseCandidatePreview?.technicalCoveragePct !== undefined ? formatPercent(baseCandidatePreview.technicalCoveragePct) : "Chưa tính"} />
                </>
              ) : null}
            </Summary>
            <Summary title="CAPEX cấu hình đang nhập">
              <SummaryRow label="Pin" value={formatVnd(capexPreview.batteryCostVnd)} />
              <SummaryRow label="PCS" value={formatVnd(capexPreview.pcsCostVnd)} />
              <SummaryRow label="EPC" value={formatVnd(capexPreview.epcAllInVnd)} />
              <SummaryRow label="Tổng CAPEX" value={formatVnd(capexPreview.totalCapexVnd)} />
            </Summary>
            <Summary title="Phương án tài chính tham khảo">
              <SummaryRow label="Hiệu quả dự án" value={resultPreview.recommendedOption ? "Đạt tiêu chí dự án" : "Chưa đạt"} />
              <SummaryRow label="Khả năng tài trợ" value={resultPreview.financingRecommendedOption ? "Đạt tiêu chí vốn chủ và trả nợ" : "Chưa đạt"} />
              <SummaryRow label="Tiết kiệm/năm" value={formatVnd(financialMetrics.annualSavingVnd)} />
              <SummaryRow label="Hoàn vốn dự án" value={formatPayback(financialMetrics.paybackYears)} />
              <SummaryRow label={`NPV dự án ${assumptions.analysisYears} năm`} value={formatVnd(financialMetrics.npvVnd)} />
              <SummaryRow label="IRR dự án" value={formatPercent(financialMetrics.irrPct)} />
              <SummaryRow label="Khoản vay" value={formatVnd(financialMetrics.debtAmountVnd)} />
              <SummaryRow label="Vốn chủ ban đầu" value={formatVnd(financialMetrics.equityInvestmentVnd)} />
              <SummaryRow label="Tổng lãi vay" value={formatVnd(financialMetrics.totalInterestVnd)} />
              <SummaryRow label="Hoàn vốn vốn chủ" value={formatPayback(financialMetrics.equityPaybackYears)} />
              <SummaryRow label={`NPV vốn chủ ${assumptions.analysisYears} năm`} value={formatVnd(financialMetrics.equityNpvVnd)} />
              <SummaryRow label="IRR vốn chủ" value={formatPercent(financialMetrics.equityIrrPct)} />
              <SummaryRow label="DSCR thấp nhất" value={financialMetrics.minimumDscr === null ? "Không có dư nợ" : `${formatNumber(financialMetrics.minimumDscr, 2)}x`} />
              {financialPreviewOption && (financialPreviewOption.powerKw !== assumptions.powerKw || financialPreviewOption.energyKwh !== assumptions.energyKwh) ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-muted">
                  Phương án tài chính tham khảo: {formatNumber(financialPreviewOption.powerKw, 0)} kW / {formatNumber(financialPreviewOption.energyKwh, 0)} kWh
                </p>
              ) : null}
              {candidateShiftMessage ? <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-navy">{candidateShiftMessage}</p> : null}
            </Summary>
            {summaryWarnings.length > 0 ? (
              <Card className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                <SectionNotice messages={summaryWarnings} />
              </Card>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="mt-5">
        <FieldCard description="Giá điện năng, tài chính và giá công suất theo cấp điện áp Bước 1." icon={CircleDollarSign} title="Biểu giá & giả định tài chính">
          <div className="grid grid-cols-3 items-start gap-6 max-xl:grid-cols-1">
            <section>
              <h3 className="mb-3 text-sm font-bold text-brand-navy">Biểu giá điện năng</h3>
              <FieldGrid fields={tariffFields} mode="slider" values={assumptions} onChange={updateNumericAssumption} />
            </section>
            <section>
              <h3 className="mb-3 text-sm font-bold text-brand-navy">Tài chính</h3>
              <FieldGrid fields={financeFields} mode="slider" values={assumptions} onChange={updateNumericAssumption} />
              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-muted">
                Khoản vay được giải ngân tại năm 0 và trả gốc đều hằng năm. Nếu thời hạn vay dài hơn kỳ phân tích, phần dư nợ còn lại được tất toán ở năm cuối.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <label className="grid gap-1.5 text-sm font-semibold text-brand-navy">Thời hạn phân tích<select className="h-10 rounded-lg border border-brand-line bg-white px-3" value={assumptions.analysisYears} onChange={(event) => updateAssumption("analysisYears", Number(event.target.value))}><option value={5}>5 năm</option><option value={10}>10 năm</option><option value={15}>15 năm</option></select></label>
                <label className="grid gap-1.5 text-sm font-semibold text-brand-navy">Tính VAT vào tổng CAPEX<select className="h-10 rounded-lg border border-brand-line bg-white px-3" value={assumptions.includeVatInCapex ? "yes" : "no"} onChange={(event) => updateAssumption("includeVatInCapex", event.target.value === "yes")}><option value="no">Không</option><option value="yes">Có</option></select></label>
              </div>
            </section>
            <section>
              <DemandChargePanel assumptions={assumptions} onChange={(value) => updateAssumption("demandChargeInputVndPerKwMonth", value)} onReset={resetDemandChargeToStep1Voltage} />
            </section>
          </div>
        </FieldCard>
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

function FieldCard({
  children,
  description,
  icon: Icon,
  title
}: {
  children: ReactNode;
  description?: string;
  icon?: typeof Shield;
  title: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-5">
        {Icon ? <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand-blue"><Icon size={20} /></span> : null}
        <div><h2 className="text-xl font-bold text-brand-navy">{title}</h2>{description ? <p className="mt-1 text-sm font-medium leading-6 text-brand-muted">{description}</p> : null}</div>
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}

function CostCatalogNotice({ isPreliminary, source, version }: { isPreliminary: boolean; source: string; version: string }) {
  void source;
  void version;
  if (!isPreliminary) {
    return (
      <div className="mb-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold leading-5 text-green-700">
        Đơn giá đang dùng từ nguồn đã xác nhận. Vẫn nên đối chiếu báo giá thực tế trước khi chốt dự án.
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-5 text-amber-800">
      Các đơn giá đang là ước tính sơ bộ, chưa phải báo giá nhà cung cấp.
    </div>
  );
}

function EquipmentCostScopePanel({ assumptions }: { assumptions: QuickSizingAssumptions }) {
  const items = [
    {
      title: "Chi phí hệ thống pin DC",
      value: assumptions.batteryCostVndPerKwh,
      metadata: assumptions.batteryCostMetadata
    },
    {
      title: "Chi phí thiết bị PCS",
      value: assumptions.pcsCostVndPerKw,
      metadata: assumptions.pcsCostMetadata
    }
  ];

  return (
    <details className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold leading-5 text-brand-muted">
      <summary className="cursor-pointer text-brand-blue">Phạm vi đơn giá gồm những gì?</summary>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div className="rounded-lg bg-slate-50 p-3" key={item.title}>
            <strong className="text-brand-navy">
              {item.title}: {formatUnitCost(item.value, item.metadata.unit)} · {formatFriendlyCostSource(item.metadata.source, assumptions.costModelSourceName)}
            </strong>
            <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <ScopeList title="Bao gồm" items={item.metadata.scopeIncluded} />
              <ScopeList title="Không bao gồm" items={item.metadata.scopeExcluded} />
            </div>
            {item.metadata.notes.length > 0 ? (
              <p className="mt-3 rounded-md bg-white px-3 py-2 text-brand-muted">{item.metadata.notes.join(" ")}</p>
            ) : null}
          </div>
        ))}
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
          Bộ đơn giá: {assumptions.costCatalogVersion} · Trạng thái: {formatCostModelStatus(assumptions.costModelStatus)} · {formatFriendlyCostSource(assumptions.costModelSourceName, assumptions.costModelSourceName)}
        </div>
      </div>
    </details>
  );
}

function DemandChargePanel({
  assumptions,
  onChange,
  onReset
}: {
  assumptions: QuickSizingAssumptions;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  const resolution = resolveDemandChargeFromStep1Voltage(assumptions.voltageLevel);
  const isCustom = assumptions.demandChargeSource === "user_input";
  const badgeLabel = isCustom ? "Người dùng điều chỉnh" : resolution.badgeLabel;

  return (
    <div className="grid gap-3">
      <CompactSliderNumber
        badge={badgeLabel}
        label="Giá công suất"
        max={DEMAND_CHARGE_SLIDER_MAX_VND_PER_KW_MONTH}
        min={DEMAND_CHARGE_SLIDER_MIN_VND_PER_KW_MONTH}
        step={DEMAND_CHARGE_SLIDER_STEP_VND_PER_KW_MONTH}
        unit="VND/kW/tháng"
        value={assumptions.effectiveDemandChargeVndPerKwMonth}
        onChange={onChange}
      />
      <p className="text-xs font-semibold leading-5 text-brand-muted">
        Giá được tự động gán từ cấp điện áp đã chọn ở Bước 1 và có thể khác nhau theo khu vực.
      </p>
      {isCustom ? (
        <button className="w-fit text-xs font-bold text-brand-blue hover:underline" onClick={onReset} type="button">
          Khôi phục theo cấp điện áp
        </button>
      ) : null}
      <SectionNotice messages={["Giá công suất là tham chiếu sơ bộ theo cấp điện áp, cần đối chiếu hóa đơn hoặc hợp đồng trước khi quyết định đầu tư."]} />
      <details className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold leading-5 text-brand-muted">
        <summary className="cursor-pointer text-brand-blue">Xem nguồn và trạng thái</summary>
        <div className="mt-3 grid gap-2">
          <CompactLine label="Trạng thái áp dụng" value={formatDemandApplicability(assumptions.demandChargeApplicability)} />
          <CompactLine label="Trạng thái chi tiết" value={formatDemandChargeStatus(assumptions.demandChargeStatus)} />
          <CompactLine label="Nguồn dữ liệu" value={formatDemandChargeSource(assumptions.demandChargeSource)} />
          <CompactLine label="Dải điện áp" value={formatDemandVoltageBand(assumptions)} />
          <CompactLine label="Cộng vào NPV cơ sở" value={assumptions.demandSavingIncludedInBaseNpv ? "Có" : "Không"} />
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
            Bộ tham chiếu: {assumptions.demandChargeCatalogVersion}
            {assumptions.demandChargeReferenceVndPerKwMonth ? ` · Giá tham chiếu: ${formatVnd(assumptions.demandChargeReferenceVndPerKwMonth)}/kW/tháng` : ""}
          </div>
        </div>
      </details>
    </div>
  );
}

function ScopeList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <strong className="text-brand-navy">{title}</strong>
      <ul className="mt-1 grid gap-1 text-brand-muted">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

function EpcRateSlider({
  assumptions,
  capex,
  onChange,
  onResetAuto
}: {
  assumptions: QuickSizingAssumptions;
  capex: CapexBreakdown | null;
  onChange: (value: number) => void;
  onResetAuto: () => void;
}) {
  const appliedRatePct = capex?.epcAppliedRatePct ?? assumptions.epcMinRatePct;
  const badge = assumptions.epcMode === "manual" ? "Đã chỉnh" : "Tự động";

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <CompactSliderNumber
        badge={badge}
        label="Tỷ lệ EPC tổng hợp"
        max={assumptions.epcMaxRatePct}
        min={assumptions.epcMinRatePct}
        step={0.5}
        unit="%"
        value={appliedRatePct}
        onChange={onChange}
      />
      <div className="mt-3 grid gap-2 text-sm font-semibold text-brand-navy">
        <p>EPC tổng hợp: {formatVnd(capex?.epcAllInVnd ?? 0)}</p>
        <p className="text-xs font-medium leading-5 text-brand-muted">
          Đã bao gồm BOS, EMS cơ bản, đấu nối cơ bản, PCCC, xây dựng cơ bản, vận chuyển, lắp đặt, testing, commissioning và contingency.
        </p>
        {assumptions.epcMode === "manual" ? (
          <button className="w-fit text-xs font-bold text-brand-blue hover:underline" onClick={onResetAuto} type="button">
            Khôi phục tỷ lệ tự động
          </button>
        ) : null}
      </div>

      <details className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold leading-5 text-brand-muted">
        <summary className="cursor-pointer text-brand-blue">Xem chi tiết EPC</summary>
        <div className="mt-3 grid gap-2">
          <CompactLine label="Chi phí thiết bị" value={formatVnd(capex?.equipmentCostVnd ?? 0)} />
          <CompactLine label="Tỷ lệ EPC cơ sở" value={`${formatNumber(capex?.epcBaseRatePct ?? 0, 1)}%`} />
          <CompactLine label="Điều chỉnh điện áp" value={`${formatNumber(capex?.epcVoltageAdjustmentPct ?? 0, 1)}%`} />
          <CompactLine label="Tỷ lệ áp dụng" value={`${formatNumber(capex?.epcAppliedRatePct ?? 0, 1)}%`} />
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
            <strong className="text-brand-navy">Phạm vi EPC:</strong> {assumptions.epcScopeItems.join(", ")}
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
            Bộ đơn giá: {assumptions.costCatalogVersion} · Trạng thái: {formatCostModelStatus(assumptions.costModelStatus)} · {formatFriendlyCostSource(assumptions.costModelSourceName, assumptions.costModelSourceName)}
          </div>
        </div>
      </details>
    </div>
  );
}

function CompactLine({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
      <span className="font-semibold text-brand-muted">{label}</span>
      <strong className={cn("text-right", strong ? "text-base text-brand-navy" : "text-brand-navy")}>{value}</strong>
    </div>
  );
}

function formatUnitCost(value: number, unit: string) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} ${unit}`;
}

function formatFriendlyCostSource(source: string, costModelSourceName: string) {
  if (source === "user_input") {
    return "Nguồn: Người dùng nhập";
  }
  if (source === "frontend_fallback" || costModelSourceName === "frontend_fallback") {
    return "Nguồn: Dữ liệu dự phòng";
  }
  return "Nguồn: Bộ đơn giá sơ bộ";
}

function formatCostModelStatus(status: string) {
  const labels: Record<string, string> = {
    confirmed: "Đã xác nhận",
    preliminary: "Sơ bộ"
  };

  return labels[status] ?? "Sơ bộ";
}

function formatDemandChargeSource(source: string) {
  const labels: Record<string, string> = {
    invoice: "Hóa đơn/hợp đồng",
    user_input: "Người dùng nhập",
    step1_voltage_auto: "Tự động theo điện áp Bước 1",
    evn_trial_reference: "Tham chiếu EVN thử nghiệm",
    not_applicable: "Không áp dụng",
    not_confirmed: "Chưa xác nhận",
    legacy_unconfirmed: "Dữ liệu cũ chưa xác nhận"
  };

  return labels[source] ?? source;
}

function formatDemandApplicability(value: QuickSizingAssumptions["demandChargeApplicability"]) {
  const labels: Record<QuickSizingAssumptions["demandChargeApplicability"], string> = {
    applicable: "Đang áp dụng",
    not_applicable: "Không áp dụng",
    unknown: "Chưa xác định"
  };

  return labels[value];
}

function formatDemandChargeStatus(status: string) {
  const labels: Record<string, string> = {
    invoice_confirmed: "Theo hóa đơn/hợp đồng",
    manual_unconfirmed: "Giá nhập thủ công - chưa xác nhận",
    preliminary_reference: "Tham chiếu sơ bộ theo điện áp",
    trial_reference: "Tham chiếu thử nghiệm",
    not_applicable: "Không áp dụng",
    unknown: "Chưa xác định",
    legacy_unconfirmed: "Dữ liệu cũ - chưa xác nhận",
    invalid_input: "Cần nhập lại giá"
  };

  return labels[status] ?? status;
}

function formatDetailedVoltageBand(value: QuickSizingAssumptions["detailedVoltageBand"]) {
  const labels: Record<string, string> = {
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

function formatDemandVoltageBand(assumptions: QuickSizingAssumptions) {
  const labels: Record<string, string> = {
    low_voltage_step1_default: "Hạ áp từ Bước 1",
    medium_voltage_broad_default: "Trung áp rộng từ Bước 1",
    high_voltage_step1_default: "Cao áp từ Bước 1",
    unknown: "Chưa xác định"
  };

  return labels[assumptions.demandChargeVoltageBand] ?? formatDetailedVoltageBand(assumptions.detailedVoltageBand);
}

function SectionNotice({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-5 text-amber-800">
      <p>{messages[0]}</p>
      {messages.length > 1 ? (
        <details className="mt-1">
          <summary className="cursor-pointer text-xs font-bold">Xem {messages.length - 1} lưu ý</summary>
          <div className="mt-1 grid gap-1 text-xs">
            {messages.slice(1).map((message) => <p key={message}>{message}</p>)}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function CompactSliderNumber({
  badge,
  label,
  max,
  min,
  step,
  unit,
  value,
  onChange
}: {
  badge?: string;
  label: string;
  max: number;
  min: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const fractionDigits = step < 1 ? Math.max(1, String(step).split(".")[1]?.length ?? 1) : 0;
  const percentage = max === min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const sliderBackground = `linear-gradient(90deg, #075BEA 0%, #075BEA ${percentage}%, #E4ECF7 ${percentage}%, #E4ECF7 100%)`;

  return (
    <label className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30 focus-within:border-brand-blue/40 focus-within:bg-blue-50/40">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-brand-navy">
        <span className="inline-flex items-center gap-2">
          {label}
          {badge ? <small className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-brand-green">{badge}</small> : null}
        </span>
        <small className="shrink-0 text-xs font-medium text-brand-muted">{unit}</small>
      </span>
      <span className="grid grid-cols-[minmax(120px,1fr)_132px] items-center gap-4 max-sm:grid-cols-1">
        <input
          aria-label={label}
          aria-valuetext={`${formatNumber(value, fractionDigits)} ${unit}`}
          className="h-2.5 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/25 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:shadow-md"
          max={max}
          min={min}
          step={step}
          style={{ background: sliderBackground }}
          type="range"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <DraftNumberInput fractionDigits={fractionDigits} max={max} min={min} value={value} onChange={onChange} />
      </span>
      <span className="flex items-center justify-between text-[11px] font-bold text-brand-muted">
        <span>{formatNumber(min, fractionDigits)}</span>
        <span>{formatNumber(max, fractionDigits)}</span>
      </span>
    </label>
  );
}

function FieldGrid({ columns = 1, fields, mode = "slider", values, onChange }: { columns?: 1 | 2; fields: NumberField[]; mode?: "slider" | "input"; values: QuickSizingAssumptions; onChange: (key: NumericAssumptionKey, value: number) => void }) {
  return (
    <div className={cn("grid gap-3", columns === 2 && "md:grid-cols-2")}>
      {fields.map((field) => {
        const value = Number(values[field.key]);
        const percentage = Math.min(100, Math.max(0, ((value - field.min) / (field.max - field.min)) * 100));
        const sliderBackground = `linear-gradient(90deg, #075BEA 0%, #075BEA ${percentage}%, #E4ECF7 ${percentage}%, #E4ECF7 100%)`;

        return (
          <label
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30 focus-within:border-brand-blue/40 focus-within:bg-blue-50/40"
            key={field.key}
          >
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-brand-navy">
              <span>{field.label}</span>
              <small className="shrink-0 text-xs font-medium text-brand-muted">{field.unit}</small>
            </span>
            <span className={cn("grid items-center gap-4", mode === "slider" ? "grid-cols-[minmax(120px,1fr)_152px] max-sm:grid-cols-1" : "grid-cols-1")}>
              {mode === "slider" ? (
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
              ) : null}
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

function DraftNumberInput({
  fractionDigits,
  max,
  min,
  value,
  onChange
}: {
  fractionDigits: number;
  max: number;
  min: number;
  value: number;
  onChange: (value: number) => void;
}) {
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

    const bounded = Math.min(max, Math.max(min, parsed));
    onChange(bounded);
    setDraft(formatNumber(bounded, fractionDigits));
  };

  return (
    <input
      aria-label="Nhập trực tiếp"
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
  return <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-muted">{title}</h3><div className="grid gap-2.5">{children}</div></Card>;
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
    values.bessObjectives.map((item) => objectiveLabels[item] ?? item).join(", ") || "Chưa chọn mục tiêu"
  ].filter(Boolean);
}

function formatObjectiveLabel(objective?: string | null) {
  const objectiveLabels: Record<string, string> = {
    saving: "Tiết kiệm điện",
    peak_shaving: "Cắt đỉnh",
    solar_optimization: "Tối ưu PV",
    backup: "Dự phòng",
    power_quality: "Chất lượng điện",
    investment: "Đầu tư"
  };

  return objective ? objectiveLabels[objective] ?? objective : "Chưa xác định";
}

function formatCalculationVersion(version?: string | null) {
  const labels: Record<string, string> = {
    "quick-sizing-step2-formulas-v1": "Quick Sizing Step 2 formulas v1"
  };

  return version ? labels[version] ?? version : "Chưa xác định";
}

function formatTariffPlanCode(code?: string | null) {
  if (!code) {
    return "Chưa xác định";
  }

  const [customerGroup, voltageLevel] = code.split(":");
  const customerGroupLabels: Record<string, string> = {
    industrial: "Công nghiệp",
    commercial: "Thương mại",
    residential: "Sinh hoạt",
    other: "Khác"
  };
  const voltageLevelLabels: Record<string, string> = {
    "Hạ áp": "Hạ áp",
    "Trung áp": "Trung áp",
    "Cao áp": "Cao áp",
    low_voltage: "Hạ áp",
    medium_voltage: "Trung áp",
    high_voltage: "Cao áp"
  };

  if (!voltageLevel) {
    return customerGroupLabels[customerGroup] ?? code;
  }

  return `${customerGroupLabels[customerGroup] ?? customerGroup}: ${voltageLevelLabels[voltageLevel] ?? voltageLevel}`;
}

function formatBudgetStatus(status: string) {
  const labels: Record<string, string> = {
    unbounded: "Chưa giới hạn",
    within_budget: "Trong ngân sách",
    over_budget: "Vượt ngân sách"
  };

  return labels[status] ?? status;
}

function formatPayback(value: number | null) {
  return value === null ? "Chưa hoàn vốn" : `${formatNumber(value, 1)} năm`;
}

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${formatNumber(value, 1)}%`;
}
