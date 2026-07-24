import { calculateBudgetEvaluation } from "./calculate-budget";
import { calculateCapex } from "./calculate-capex";
import { calculateCashFlow } from "./calculate-cash-flow";
import { calculateConfidence } from "./calculate-confidence";
import { calculateIrr, calculateLcos, calculateNpv, calculatePayback, financialWarnings } from "./calculate-financial-metrics";
import { buildParetoPoints, markParetoCandidates } from "./calculate-pareto";
import { scoreCandidates, selectRepresentativeOptions } from "./calculate-recommendation";
import { buildScenarioRanges } from "./calculate-scenarios";
import { DEFAULT_RESULT_CALCULATION_CONFIG } from "./config";
import { generateCandidates } from "./candidate-generator";
import { createWarning, validateAssumptions } from "./validation";
import type {
  BasicInfoForResult,
  CalculationTraceItem,
  EquipmentUnitCostMetadata,
  GeneratedCandidate,
  QuickSizingResult,
  ResultCalculationConfig,
  ResultScenarioConfig,
  ResultWarning,
  SizingCandidateResult,
  Step2Assumptions
} from "./types";

function getBaseScenario(config: ResultCalculationConfig) {
  return config.scenarios.find((scenario) => scenario.id === "base") ?? config.scenarios[0];
}

function resolveUnitCostScenario(metadata: EquipmentUnitCostMetadata) {
  if (metadata.source === "user_input") {
    return "custom";
  }
  if (isClose(metadata.value, metadata.scenarioValues.optimistic)) {
    return "optimistic";
  }
  if (isClose(metadata.value, metadata.scenarioValues.conservative)) {
    return "conservative";
  }
  if (isClose(metadata.value, metadata.scenarioValues.base)) {
    return "base";
  }
  return "custom";
}

function isClose(left: number, right: number) {
  return Math.abs(left - right) < 1;
}

function buildTrace(
  assumptions: Step2Assumptions,
  candidates: SizingCandidateResult[],
  config: ResultCalculationConfig,
  selectedCandidateId?: string | null
): CalculationTraceItem[] {
  const selected = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? candidates[0];
  const batteryUnitCost = selected?.capex.batteryUnitCost ?? assumptions.batteryCostMetadata;
  const pcsUnitCost = selected?.capex.pcsUnitCost ?? assumptions.pcsCostMetadata;
  return [
    {
      formulaId: "F1",
      title: "Sinh tập cấu hình ứng viên",
      formula: (assumptions.selectedObjectives ?? []).length === 1 && (assumptions.selectedObjectives ?? []).includes("peak_shaving")
        ? "P_i = roundStep(P_base x m_i); E_i = roundStep(E_base x m_i)"
        : "P_i = roundStep(P_base x mP_i); E_i = roundStep(E_base x mE_i)",
      inputs: {
        basePowerKw: assumptions.powerKw,
        baseEnergyKwh: assumptions.energyKwh,
        powerMultipliers: config.candidate.powerMultipliers,
        energyMultipliers: config.candidate.energyMultipliers
      },
      output: candidates.length,
      unit: "candidate",
      source: "calculated",
      configVersion: config.candidate.version
    },
    {
      formulaId: "F5",
      title: "Điện xả và điện sạc hằng năm",
      formula: "Peak events/year = operatingDays x frequency; peak discharge = effectivePeakReduction x eventDuration x events",
      inputs: {
        dodPct: assumptions.dodPct,
        cyclesPerDay: assumptions.cyclesPerDay,
        operatingDaysPerYear: assumptions.operatingDaysPerYear,
        rtePct: assumptions.rtePct,
        peakEventDurationHours: assumptions.peakEventDurationHours,
        peakEventFrequencyPerOperatingDay: assumptions.peakEventFrequencyPerOperatingDay,
        annualPeakEventCount: selected?.yearlyResults[1]?.annualPeakEventCount ?? 0
      },
      output: {
        peakShavingDischargeEnergyPerEventKwh: selected?.yearlyResults[1]?.peakShavingDischargeEnergyPerEventKwh ?? 0,
        peakShavingDischargeEnergyAnnualKwh: selected?.yearlyResults[1]?.peakShavingDischargeEnergyAnnualKwh ?? 0,
        peakShavingGridChargeEnergyAnnualKwh: selected?.yearlyResults[1]?.peakShavingGridChargeEnergyAnnualKwh ?? 0,
        totalDischargedEnergyAcKwh: selected?.yearlyResults[1]?.dischargedEnergyAcKwh ?? 0,
        totalChargedEnergyAcKwh: selected?.yearlyResults[1]?.chargedEnergyAcKwh ?? 0
      },
      unit: "kWh",
      source: "calculated",
      configVersion: config.dispatch.version
    },
    {
      formulaId: "F5-PEAK-COVERAGE",
      title: "Peak shaving coverage",
      formula: "EffectivePeakReduction = min(Target, P x realization, UsableAC/event / duration, FinalPeakDemand)",
      inputs: {
        targetPeakReductionKw: selected?.targetPeakReductionKw ?? null,
        designPeakEventDurationHours: selected?.designPeakEventDurationHours ?? null,
        usableAcEnergyPerEventKwh: selected?.usableAcEnergyPerEventKwh ?? null,
        powerLimitedPeakReductionKw: selected?.powerLimitedPeakReductionKw ?? null,
        energyLimitedPeakReductionKw: selected?.energyLimitedPeakReductionKw ?? null,
        minimumPeakCoveragePct: assumptions.minimumPeakCoveragePct
      },
      output: {
        effectivePeakReductionKw: selected?.effectivePeakReductionKw ?? null,
        technicalCoveragePct: selected?.technicalCoveragePct ?? null,
        meetsPeakReductionTarget: selected?.meetsPeakReductionTarget ?? null,
        deliverableDurationAtReducedPeakHours: selected?.deliverableDurationAtReducedPeakHours ?? null
      },
      unit: "mixed",
      source: "calculated",
      configVersion: config.dispatch.version
    },
    {
      formulaId: "F13",
      title: "CAPEX chi tiết",
      formula: "BatteryCost = EnergyKwh x BatteryDcPackageUnitCost; PcsCost = PowerKw x PcsEquipmentUnitCost; Equipment = Battery + PCS; EPC all-in = Equipment x EPC rate; CAPEX = Equipment + EPC all-in + VAT",
      inputs: {
        candidateId: selected?.id ?? null,
        energyKwh: selected?.energyKwh ?? null,
        powerKw: selected?.powerKw ?? null,
        batteryDcPackageUnitCost: batteryUnitCost.value,
        batteryDcPackageUnit: batteryUnitCost.unit,
        batteryUnitCostSource: batteryUnitCost.source,
        batteryUnitCostStatus: batteryUnitCost.status,
        batteryUnitCostCatalogVersion: batteryUnitCost.catalogVersion,
        batteryUnitCostScenario: resolveUnitCostScenario(batteryUnitCost),
        batteryUserOverride: batteryUnitCost.source === "user_input",
        pcsEquipmentUnitCost: pcsUnitCost.value,
        pcsEquipmentUnit: pcsUnitCost.unit,
        pcsUnitCostSource: pcsUnitCost.source,
        pcsUnitCostStatus: pcsUnitCost.status,
        pcsUnitCostCatalogVersion: pcsUnitCost.catalogVersion,
        pcsUnitCostScenario: resolveUnitCostScenario(pcsUnitCost),
        pcsUserOverride: pcsUnitCost.source === "user_input",
        voltageLevel: assumptions.voltageLevel,
        epcMode: assumptions.epcMode,
        costCatalogVersion: selected?.capex.costCatalogVersion ?? assumptions.costCatalogVersion
      },
      output: {
        batteryCostFormula: `${selected?.energyKwh ?? 0} kWh x ${batteryUnitCost.value} ${batteryUnitCost.unit}`,
        batteryCostVnd: selected?.capex.batteryCostVnd ?? 0,
        pcsCostFormula: `${selected?.powerKw ?? 0} kW x ${pcsUnitCost.value} ${pcsUnitCost.unit}`,
        pcsCostVnd: selected?.capex.pcsCostVnd ?? 0,
        equipmentCostVnd: selected?.capex.equipmentCostVnd ?? 0,
        epcAppliedRatePct: selected?.capex.epcAppliedRatePct ?? 0,
        epcAllInVnd: selected?.capex.epcAllInVnd ?? 0,
        capexExcludingVatVnd: selected?.capex.capexExcludingVatVnd ?? 0,
        vatVnd: selected?.capex.vatVnd ?? 0,
        totalCapexVnd: selected?.capex.totalCapexVnd ?? 0
      },
      unit: "VND",
      source: "calculated",
      configVersion: config.cost.version
    },
    {
      formulaId: "F16-SAVINGS",
      title: "Savings breakdown",
      formula: "Gross = arbitrage + peakEnergySaving + demandSaving + PV + nonEnergy; peakEnergySaving is net of peak charging cost",
      inputs: {
        peakChargeShares: config.dispatch.peakShavingChargeShares,
        arbitrageChargeShares: config.dispatch.arbitrageChargeShares,
        arbitrageDischargeShares: config.dispatch.arbitrageDischargeShares,
        demandChargeMonthsPerYear: config.dispatch.demandChargeMonthsPerYear,
        demandSavingIncludedInBaseNpv: assumptions.demandSavingIncludedInBaseNpv
      },
      output: {
        arbitrageSavingVnd: selected?.yearlyResults[1]?.arbitrageSavingVnd ?? 0,
        peakShavingAvoidedEnergyCostVnd: selected?.yearlyResults[1]?.peakShavingAvoidedEnergyCostVnd ?? 0,
        peakShavingChargingCostVnd: selected?.yearlyResults[1]?.peakShavingChargingCostVnd ?? 0,
        peakShavingEnergySavingVnd: selected?.yearlyResults[1]?.peakShavingEnergySavingVnd ?? 0,
        demandSavingVnd: selected?.yearlyResults[1]?.demandSavingVnd ?? 0,
        potentialDemandSavingVnd: selected?.yearlyResults[1]?.potentialDemandSavingVnd ?? 0,
        grossSavingVnd: selected?.yearlyResults[1]?.grossSavingVnd ?? 0
      },
      unit: "VND/year",
      source: "calculated",
      configVersion: config.dispatch.version
    },
    {
      formulaId: "F16-DEMAND",
      title: "Demand charge saving",
      formula: "DemandSaving = EffectivePeakReductionKw x EffectiveDemandCharge x Months",
      inputs: {
        demandChargeApplicability: assumptions.demandChargeApplicability,
        demandChargeMode: assumptions.demandChargeMode,
        detailedVoltageBand: assumptions.detailedVoltageBand,
        demandChargeInputVndPerKwMonth: assumptions.demandChargeInputVndPerKwMonth,
        demandChargeReferenceVndPerKwMonth: assumptions.demandChargeReferenceVndPerKwMonth,
        effectiveDemandChargeVndPerKwMonth: assumptions.effectiveDemandChargeVndPerKwMonth,
        demandChargeMonthsPerYear: config.dispatch.demandChargeMonthsPerYear,
        effectivePeakReductionKw: selected?.yearlyResults[1]?.effectivePeakReductionKw ?? 0,
        demandChargeStatus: assumptions.demandChargeStatus,
        demandChargeSource: assumptions.demandChargeSource,
        demandChargeVoltageBand: assumptions.demandChargeVoltageBand ?? null,
        demandChargeCatalogVersion: assumptions.demandChargeCatalogVersion
      },
      output: {
        demandSavingVnd: selected?.yearlyResults[1]?.demandSavingVnd ?? 0,
        potentialDemandSavingVnd: selected?.yearlyResults[1]?.potentialDemandSavingVnd ?? 0,
        includedInBaseNpv: selected?.yearlyResults[1]?.demandSavingIncludedInBaseNpv ?? false,
        warningCode: assumptions.demandSavingIncludedInBaseNpv ? null : "DEMAND_CHARGE_NOT_CONFIRMED"
      },
      unit: "VND/year",
      source: "calculated",
      configVersion: assumptions.demandChargeCatalogVersion
    },
    {
      formulaId: "F16",
      title: "Dòng tiền dự án FCFF",
      formula: "FCFF_0 = -CAPEX; FCFF_y = GrossSaving - OM - Tax - Replacement + TerminalValue",
      inputs: {
        analysisYears: assumptions.analysisYears,
        taxPct: assumptions.taxPct,
        omPct: assumptions.omPct
      },
      output: selected?.yearlyResults[1]?.fcffVnd ?? 0,
      unit: "VND",
      source: "calculated",
      configVersion: config.version
    },
    {
      formulaId: "F18",
      title: "NPV dự án",
      formula: "NPV = sum(FCFF_y / (1 + WACC)^y), y = 0..T",
      inputs: {
        waccPct: assumptions.waccPct,
        analysisYears: assumptions.analysisYears
      },
      output: selected?.npvVnd ?? 0,
      unit: "VND",
      source: "calculated",
      configVersion: config.version
    },
    {
      formulaId: "F23",
      title: "Pareto Savings x NPV/CAPEX",
      formula: "Không tồn tại candidate khác có Savings và NPV/CAPEX cùng tốt hơn",
      inputs: { candidateCount: candidates.length },
      output: candidates.filter((candidate) => candidate.isPareto).length,
      unit: "candidate",
      source: "calculated",
      configVersion: config.recommendation.version
    }
  ];
}

function evaluateCandidate(
  candidate: GeneratedCandidate,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig
): SizingCandidateResult {
  const { capex, warnings: capexWarnings } = calculateCapex(candidate, assumptions, config, scenario);
  const { yearlyResults, warnings: cashFlowWarnings } = calculateCashFlow(candidate, capex, assumptions, config, scenario);
  const npvVnd = calculateNpv(yearlyResults, assumptions.waccPct + scenario.waccDeltaPct);
  const irrPct = calculateIrr(yearlyResults);
  const paybackYears = calculatePayback(yearlyResults);
  const lcosVndPerKwh = calculateLcos(capex, yearlyResults, assumptions);
  const budgetEvaluation = calculateBudgetEvaluation(capex.totalCapexVnd, assumptions.budgetMax, config);
  const year1 = yearlyResults[1];
  const warnings: ResultWarning[] = [
    ...candidate.warnings,
    ...capexWarnings,
    ...cashFlowWarnings,
    ...financialWarnings(candidate.id, irrPct, paybackYears)
  ];

  if (budgetEvaluation.status === "not_defined") {
    warnings.push(createWarning("BUDGET_NOT_DEFINED", "Chưa có ngân sách để so sánh candidate.", { candidateId: candidate.id, severity: "info" }));
  } else if (budgetEvaluation.status !== "within_budget") {
    warnings.push(createWarning("BUDGET_OVERRUN", "CAPEX candidate vượt ngân sách đã nhập.", { candidateId: candidate.id }));
  }

  return {
    id: candidate.id,
    powerKw: candidate.powerKw,
    energyKwh: candidate.energyKwh,
    nominalDurationHours: candidate.nominalDurationHours,
    usableDurationHours: candidate.energyKwh * assumptions.dodPct / 100 / candidate.powerKw,
    designObjective: candidate.designObjective ?? null,
    designPeakEventDurationHours: candidate.designPeakEventDurationHours ?? null,
    targetPeakReductionKw: candidate.targetPeakReductionKw ?? null,
    usableAcEnergyPerEventKwh: candidate.usableAcEnergyPerEventKwh ?? null,
    energyLimitedPeakReductionKw: candidate.energyLimitedPeakReductionKw ?? null,
    powerLimitedPeakReductionKw: candidate.powerLimitedPeakReductionKw ?? null,
    effectivePeakReductionKw: candidate.effectivePeakReductionKw ?? null,
    technicalCoveragePct: candidate.technicalCoveragePct ?? null,
    meetsPeakReductionTarget: candidate.meetsPeakReductionTarget ?? null,
    deliverableDurationAtReducedPeakHours: candidate.deliverableDurationAtReducedPeakHours ?? null,
    capex,
    yearlyResults,
    grossSavingYear1Vnd: year1?.grossSavingVnd ?? 0,
    netOperatingSavingYear1Vnd: (year1?.grossSavingVnd ?? 0) - (year1?.omVnd ?? 0),
    npvVnd,
    irrPct,
    irrStatus: irrPct === null ? "not_available" : "available",
    paybackYears,
    paybackStatus: paybackYears === null ? "beyond_analysis_horizon" : "within_horizon",
    npvPerCapex: capex.totalCapexVnd > 0 ? npvVnd / capex.totalCapexVnd : 0,
    lcosVndPerKwh,
    budgetEvaluation,
    isPareto: false,
    recommendationScore: null,
    warnings
  };
}

function collectGlobalWarnings(warnings: ResultWarning[], candidates: SizingCandidateResult[], config: ResultCalculationConfig) {
  const result = [...warnings];
  if (candidates.length === 0) {
    result.push(createWarning("NO_VALID_CANDIDATE", "Không có candidate hợp lệ để tính kết quả.", { severity: "error", blocking: true }));
  }
  if (candidates.length > 0 && candidates.length < config.candidate.minimumCandidateCount) {
    result.push(createWarning("FALLBACK_ASSUMPTION_USED", "Số candidate hợp lệ thấp hơn mức khuyến nghị cho Pareto.", { severity: "info" }));
  }

  return result;
}

export function buildQuickSizingResult(
  assumptions: Step2Assumptions,
  basicInfo?: BasicInfoForResult | null,
  config: ResultCalculationConfig = DEFAULT_RESULT_CALCULATION_CONFIG
): QuickSizingResult {
  const baseScenario = getBaseScenario(config);
  const assumptionWarnings = validateAssumptions(assumptions);
  const blockingAssumption = assumptionWarnings.some((warning) => warning.blocking);
  const generated = blockingAssumption ? [] : generateCandidates(assumptions, config);
  const evaluated = generated.map((candidate) => evaluateCandidate(candidate, assumptions, config, baseScenario));
  const withPareto = markParetoCandidates(evaluated);
  const globalWarnings = collectGlobalWarnings(assumptionWarnings, withPareto, config);
  const confidence = calculateConfidence(assumptions, basicInfo, globalWarnings, config);
  const scored = scoreCandidates(withPareto, assumptions, confidence, config, baseScenario);
  const options = selectRepresentativeOptions(scored);
  const recommendedId = options.recommendedOption?.id ?? null;
  const paretoPoints = buildParetoPoints(scored, recommendedId);
  const scenarioCandidate = generated.find((candidate) => candidate.id === recommendedId) ?? generated[0] ?? null;
  const scenarioRanges = buildScenarioRanges(
    scenarioCandidate
      ? config.scenarios.map((scenario) => evaluateCandidate(scenarioCandidate, assumptions, config, scenario))
      : []
  );
  const warnings = [
    ...globalWarnings,
    ...scored.flatMap((candidate) => candidate.warnings.filter((warning) => (
      warning.severity === "error"
      || warning.code === "BUDGET_OVERRUN"
      || warning.code === "PEAK_TARGET_NOT_MET"
    )))
  ];

  return {
    generatedAt: `${config.effectiveDate}T00:00:00.000Z`,
    analysisYears: assumptions.analysisYears,
    scenario: baseScenario.id,
    candidates: scored,
    paretoPoints,
    ...options,
    scenarioRanges,
    confidence,
    warnings,
    calculationTrace: buildTrace(assumptions, scored, config, recommendedId),
    configVersions: {
      resultEngine: config.version,
      candidate: config.candidate.version,
      cost: config.cost.version,
      dispatch: config.dispatch.version,
      recommendation: config.recommendation.version,
      scenario: config.scenarios.map((scenario) => scenario.id).join(",")
    }
  };
}
