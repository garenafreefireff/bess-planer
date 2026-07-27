import {
  buildQuickSizingResult,
  calculateCapex,
  DEFAULT_DEMAND_CHARGE_CATALOG,
  DEFAULT_RESULT_CALCULATION_CONFIG,
  DEFAULT_FRONTEND_COST_MODEL,
  type BasicInfoForResult,
  type CapexBreakdown,
  type DemandChargeApplicability,
  type DemandChargeMode,
  type DemandChargeReferenceBand,
  type DetailedVoltageBand,
  type EpcMode,
  type EpcRateBand,
  type EquipmentCostCatalogItem,
  type EquipmentUnitCostMetadata,
  type GeneratedCandidate,
  type QuickSizingResult,
  type SizingCandidateResult,
  type SizingOptionResult,
  type Step2Assumptions
} from "../result-calculation";
import type { QuickSizingStep1FormValues } from "./quick-sizing-step1-schema";

export type QuickSizingScenario = "default" | "optimistic" | "conservative" | "custom";

export type QuickSizingAssumptions = {
  energyKwh: number;
  powerKw: number;
  dodPct: number;
  rtePct: number;
  degradationPct: number;
  cyclesPerDay: number;
  operatingDaysPerYear: number;
  peakEventDurationHours: number;
  peakEventFrequencyPerOperatingDay: number;
  minimumPeakCoveragePct: number;
  batteryCostVndPerKwh: number;
  batteryCostMetadata: EquipmentUnitCostMetadata;
  pcsCostVndPerKw: number;
  pcsCostMetadata: EquipmentUnitCostMetadata;
  epcMode: EpcMode;
  epcManualRatePct: number | null;
  epcRateBands: EpcRateBand[];
  epcVoltageAdjustmentsPct: Record<string, number>;
  epcMinRatePct: number;
  epcMaxRatePct: number;
  epcScopeItems: string[];
  costModelStatus: string;
  costCatalogVersion: string;
  costModelSourceName: string;
  voltageLevel: string;
  vatPct: number;
  omPct: number;
  omGrowthPct: number;
  offPeakPrice: number;
  normalPrice: number;
  peakPrice: number;
  demandChargeApplicability: DemandChargeApplicability;
  demandChargeMode: DemandChargeMode;
  detailedVoltageBand: DetailedVoltageBand;
  demandChargeInputVndPerKwMonth: number | null;
  demandChargeReferenceVndPerKwMonth: number | null;
  effectiveDemandChargeVndPerKwMonth: number;
  demandChargeStatus: string;
  demandChargeSource: string;
  demandChargeVoltageBand: DetailedVoltageBand;
  demandChargeCatalogVersion: string;
  demandChargeEvidenceNote: string | null;
  demandChargeReferenceBands: DemandChargeReferenceBand[];
  demandSavingIncludedInBaseNpv: boolean;
  exportTariff: number;
  priceEscalationPct: number;
  demandTariffEscalationPct: number;
  exportTariffEscalationPct: number;
  debtPct: number;
  interestPct: number;
  loanTenorYears: number;
  waccPct: number;
  taxPct: number;
  analysisYears: number;
  includeVatInCapex: boolean;
  budgetMaxVnd: number | null;
  finalPeakDemandKw: number | null;
  tariffAverage: number | null;
  touShareLow: number;
  touShareNormal: number;
  touSharePeak: number;
  solarCapacityKw: number | null;
  solarMonthlyGenerationKwh: number | null;
  pvSurplusRatio: number | null;
};

const DEMAND_CHARGE_ASSUMPTION_KEYS = new Set<keyof QuickSizingAssumptions>([
  "demandChargeApplicability",
  "demandChargeMode",
  "detailedVoltageBand",
  "demandChargeInputVndPerKwMonth",
  "demandChargeSource",
  "demandChargeEvidenceNote"
]);

export type QuickSizingMetrics = {
  powerKw: number;
  energyKwh: number;
  durationHours: number;
  usableEnergyKwh: number;
  capexVnd: number;
  annualSavingVnd: number;
  paybackYears: number | null;
  npvVnd: number;
  irrPct: number | null;
  debtAmountVnd: number;
  equityInvestmentVnd: number;
  totalInterestVnd: number;
  minimumDscr: number | null;
  costOfEquityPct: number;
  equityNpvVnd: number;
  equityIrrPct: number | null;
  equityPaybackYears: number | null;
  cashFlowVnd: number[];
  equityCashFlowVnd: number[];
};

export type QuickSizingOption = QuickSizingMetrics & {
  id: "low" | "recommended" | "high";
  candidateId: string;
  title: string;
  badge: string;
  paybackStatus: string;
  irrStatus: string;
  npvPerCapex: number;
  budgetStatus: string;
  recommendationScore: number | null;
};

export type Step1VoltageDemandChargeResolution = {
  voltageLevel: "Hạ áp" | "Trung áp" | "Cao áp" | "Chưa xác định";
  priceVndPerKwMonth: number;
  status: "preliminary_reference" | "unknown";
  source: "step1_voltage_auto" | "not_confirmed";
  voltageBand: DetailedVoltageBand;
  badgeLabel: string;
  note: string;
};

const STEP1_VOLTAGE_DEMAND_CHARGE_REFERENCES = {
  "Hạ áp": {
    referenceBandCode: "lt_6kv",
    voltageBand: "low_voltage_step1_default",
    badgeLabel: "Tự động theo Hạ áp"
  },
  "Trung áp": {
    referenceBandCode: "6_to_lt_22kv",
    voltageBand: "medium_voltage_broad_default",
    badgeLabel: "Tự động theo Trung áp"
  },
  "Cao áp": {
    referenceBandCode: "gte_110kv",
    voltageBand: "high_voltage_step1_default",
    badgeLabel: "Tự động theo Cao áp"
  }
} as const;

function equipmentCostMetadataFromCatalog(
  item: EquipmentCostCatalogItem,
  value: number,
  source = DEFAULT_FRONTEND_COST_MODEL.sourceName
): EquipmentUnitCostMetadata {
  return {
    value,
    unit: item.unit,
    status: DEFAULT_FRONTEND_COST_MODEL.status,
    source,
    scopeIncluded: item.scopeIncluded,
    scopeExcluded: item.scopeExcluded,
    notes: item.notes,
    catalogVersion: DEFAULT_FRONTEND_COST_MODEL.version,
    scenarioValues: {
      optimistic: item.optimistic,
      base: item.base,
      conservative: item.conservative
    }
  };
}

export const defaultQuickSizingAssumptions: QuickSizingAssumptions = {
  energyKwh: 1000,
  powerKw: 500,
  dodPct: 90,
  rtePct: 90,
  degradationPct: 2,
  cyclesPerDay: 1,
  operatingDaysPerYear: 300,
  peakEventDurationHours: DEFAULT_RESULT_CALCULATION_CONFIG.dispatch.defaultPeakEventDurationHours,
  peakEventFrequencyPerOperatingDay: DEFAULT_RESULT_CALCULATION_CONFIG.dispatch.defaultPeakEventFrequencyPerOperatingDay,
  minimumPeakCoveragePct: DEFAULT_RESULT_CALCULATION_CONFIG.dispatch.minimumPeakCoveragePct,
  batteryCostVndPerKwh: DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage.base,
  batteryCostMetadata: equipmentCostMetadataFromCatalog(
    DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage,
    DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage.base
  ),
  pcsCostVndPerKw: DEFAULT_FRONTEND_COST_MODEL.pcsEquipment.base,
  pcsCostMetadata: equipmentCostMetadataFromCatalog(
    DEFAULT_FRONTEND_COST_MODEL.pcsEquipment,
    DEFAULT_FRONTEND_COST_MODEL.pcsEquipment.base
  ),
  epcMode: "auto",
  epcManualRatePct: null,
  epcRateBands: DEFAULT_FRONTEND_COST_MODEL.rateBands,
  epcVoltageAdjustmentsPct: DEFAULT_FRONTEND_COST_MODEL.voltageAdjustmentsPct,
  epcMinRatePct: DEFAULT_FRONTEND_COST_MODEL.epcMinRatePct,
  epcMaxRatePct: DEFAULT_FRONTEND_COST_MODEL.epcMaxRatePct,
  epcScopeItems: DEFAULT_FRONTEND_COST_MODEL.scopeItems,
  costModelStatus: DEFAULT_FRONTEND_COST_MODEL.status,
  costCatalogVersion: DEFAULT_FRONTEND_COST_MODEL.version,
  costModelSourceName: DEFAULT_FRONTEND_COST_MODEL.sourceName,
  voltageLevel: "Chưa xác định",
  vatPct: DEFAULT_FRONTEND_COST_MODEL.vatPctFallback,
  omPct: 2,
  omGrowthPct: 2,
  offPeakPrice: 1028,
  normalPrice: 1666,
  peakPrice: 2797,
  demandChargeApplicability: "unknown",
  demandChargeMode: "reference",
  detailedVoltageBand: "unknown",
  demandChargeInputVndPerKwMonth: null,
  demandChargeReferenceVndPerKwMonth: null,
  effectiveDemandChargeVndPerKwMonth: 0,
  demandChargeStatus: "unknown",
  demandChargeSource: "not_confirmed",
  demandChargeVoltageBand: "unknown",
  demandChargeCatalogVersion: DEFAULT_DEMAND_CHARGE_CATALOG.catalogVersion,
  demandChargeEvidenceNote: null,
  demandChargeReferenceBands: DEFAULT_DEMAND_CHARGE_CATALOG.referenceBands,
  demandSavingIncludedInBaseNpv: false,
  exportTariff: 0,
  priceEscalationPct: 5,
  demandTariffEscalationPct: 5,
  exportTariffEscalationPct: 5,
  debtPct: 70,
  interestPct: 9,
  loanTenorYears: 7,
  waccPct: 10,
  taxPct: 20,
  analysisYears: 10,
  includeVatInCapex: DEFAULT_FRONTEND_COST_MODEL.includeVatInCapexDefault,
  budgetMaxVnd: null,
  finalPeakDemandKw: null,
  tariffAverage: null,
  touShareLow: 0.2,
  touShareNormal: 0.5,
  touSharePeak: 0.3,
  solarCapacityKw: null,
  solarMonthlyGenerationKwh: null,
  pvSurplusRatio: null
};

const scenarioOverrides: Record<Exclude<QuickSizingScenario, "custom">, Partial<QuickSizingAssumptions>> = {
  default: {
    batteryCostVndPerKwh: DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage.base,
    pcsCostVndPerKw: DEFAULT_FRONTEND_COST_MODEL.pcsEquipment.base
  },
  optimistic: {
    batteryCostVndPerKwh: DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage.optimistic,
    pcsCostVndPerKw: DEFAULT_FRONTEND_COST_MODEL.pcsEquipment.optimistic,
    rtePct: 93,
    degradationPct: 1.5,
    priceEscalationPct: 7,
    demandTariffEscalationPct: 7,
    exportTariffEscalationPct: 7,
    waccPct: 8,
    interestPct: 8
  },
  conservative: {
    batteryCostVndPerKwh: DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage.conservative,
    pcsCostVndPerKw: DEFAULT_FRONTEND_COST_MODEL.pcsEquipment.conservative,
    rtePct: 86,
    degradationPct: 2.5,
    priceEscalationPct: 3,
    demandTariffEscalationPct: 3,
    exportTariffEscalationPct: 3,
    waccPct: 12,
    interestPct: 11
  }
};

export function createAssumptionsFromBasicInfo(values?: QuickSizingStep1FormValues | null): QuickSizingAssumptions {
  if (!values) {
    return { ...defaultQuickSizingAssumptions };
  }

  const operatingDaysPerYear = Math.round(Math.min(7, Math.max(1, values.operatingDaysPerWeek ?? 6)) * 52 * 0.96);
  const budgetMaxVnd = resolveBudgetMaxVnd(values);
  const solarCapacityKw = normalizeSolarCapacityKw(values);
  const solarMonthlyGenerationKwh = normalizeSolarMonthlyGenerationKwh(values);

  return applyStep1VoltageDemandCharge({
    ...defaultQuickSizingAssumptions,
    operatingDaysPerYear,
    budgetMaxVnd,
    finalPeakDemandKw: values.estimatedPeakDemandKw ?? null,
    voltageLevel: values.voltageLevel,
    solarCapacityKw,
    solarMonthlyGenerationKwh
  }, values.voltageLevel);
}

export function applyScenarioPreset(
  scenario: Exclude<QuickSizingScenario, "custom">,
  current: QuickSizingAssumptions
): QuickSizingAssumptions {
  const batteryCostVndPerKwh = scenarioUnitCost(current.batteryCostMetadata, "battery", scenario);
  const pcsCostVndPerKw = scenarioUnitCost(current.pcsCostMetadata, "pcs", scenario);
  return applyStep1VoltageDemandCharge({
    ...current,
    ...scenarioOverrides[scenario],
    batteryCostVndPerKwh,
    pcsCostVndPerKw,
    epcMode: "auto",
    epcManualRatePct: null,
    batteryCostMetadata: withUnitCostValue(current.batteryCostMetadata, batteryCostVndPerKwh),
    pcsCostMetadata: withUnitCostValue(current.pcsCostMetadata, pcsCostVndPerKw)
  }, current.voltageLevel);
}

function scenarioUnitCost(
  metadata: EquipmentUnitCostMetadata,
  item: "battery" | "pcs",
  scenario: Exclude<QuickSizingScenario, "custom">
) {
  const catalogItem = item === "battery"
    ? DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage
    : DEFAULT_FRONTEND_COST_MODEL.pcsEquipment;
  const fallback = catalogItem[scenario === "default" ? "base" : scenario];
  return metadata.scenarioValues[scenario === "default" ? "base" : scenario] ?? fallback;
}

function withUnitCostValue(metadata: EquipmentUnitCostMetadata, value: number): EquipmentUnitCostMetadata {
  return {
    ...metadata,
    value
  };
}

export function markEquipmentCostUserInput(
  assumptions: QuickSizingAssumptions,
  key: "batteryCostVndPerKwh" | "pcsCostVndPerKw",
  value: number
): QuickSizingAssumptions {
  if (key === "batteryCostVndPerKwh") {
    return {
      ...assumptions,
      batteryCostVndPerKwh: value,
      batteryCostMetadata: {
        ...assumptions.batteryCostMetadata,
        value,
        source: "user_input"
      }
    };
  }

  return {
    ...assumptions,
    pcsCostVndPerKw: value,
    pcsCostMetadata: {
      ...assumptions.pcsCostMetadata,
      value,
      source: "user_input"
    }
  };
}

export const DEMAND_CHARGE_SLIDER_MIN_VND_PER_KW_MONTH = 0;
export const DEMAND_CHARGE_SLIDER_MAX_VND_PER_KW_MONTH = 500_000;
export const DEMAND_CHARGE_SLIDER_STEP_VND_PER_KW_MONTH = 5_000;

export function normalizeStep1VoltageLevel(
  voltageLevel?: string | null
): Step1VoltageDemandChargeResolution["voltageLevel"] {
  const normalized = String(voltageLevel ?? "").trim().toLowerCase();

  if (normalized.includes("hạ") || normalized.includes("ha ap") || normalized.includes("low")) {
    return "Hạ áp";
  }
  if (normalized.includes("trung") || normalized.includes("medium")) {
    return "Trung áp";
  }
  if (normalized.includes("cao") || normalized.includes("high")) {
    return "Cao áp";
  }

  return "Chưa xác định";
}

export function resolveDemandChargeFromStep1Voltage(
  voltageLevel?: string | null
): Step1VoltageDemandChargeResolution {
  const normalizedVoltage = normalizeStep1VoltageLevel(voltageLevel);
  const reference = normalizedVoltage === "Chưa xác định"
    ? null
    : STEP1_VOLTAGE_DEMAND_CHARGE_REFERENCES[normalizedVoltage];

  if (!reference) {
    return {
      voltageLevel: "Chưa xác định",
      priceVndPerKwMonth: 0,
      status: "unknown",
      source: "not_confirmed",
      voltageBand: "unknown",
      badgeLabel: "Chưa xác định điện áp",
      note: "Chưa đủ dữ liệu cấp điện áp ở Bước 1 để tự gán giá công suất."
    };
  }

  return {
    voltageLevel: normalizedVoltage,
    priceVndPerKwMonth: resolveDemandChargeReferenceBandPrice(reference.referenceBandCode),
    status: "preliminary_reference",
    source: "step1_voltage_auto",
    voltageBand: reference.voltageBand,
    badgeLabel: reference.badgeLabel,
    note: `Tự động gán theo cấp điện áp ${normalizedVoltage} tại Bước 1. Có thể kéo để điều chỉnh theo hóa đơn thực tế.`
  };
}

function resolveDemandChargeReferenceBandPrice(code: DemandChargeReferenceBand["code"]) {
  return DEFAULT_DEMAND_CHARGE_CATALOG.referenceBands.find((band) => band.code === code)?.priceVndPerKwMonth ?? 0;
}

export function applyStep1VoltageDemandCharge(
  assumptions: QuickSizingAssumptions,
  voltageLevel = assumptions.voltageLevel
): QuickSizingAssumptions {
  const resolution = resolveDemandChargeFromStep1Voltage(voltageLevel);

  if (resolution.priceVndPerKwMonth <= 0) {
    return resolveQuickSizingDemandCharge({
      ...assumptions,
      voltageLevel: resolution.voltageLevel,
      demandChargeApplicability: "unknown",
      demandChargeMode: "reference",
      detailedVoltageBand: "unknown",
      demandChargeInputVndPerKwMonth: null,
      demandChargeReferenceVndPerKwMonth: null,
      effectiveDemandChargeVndPerKwMonth: 0,
      demandChargeStatus: resolution.status,
      demandChargeSource: resolution.source,
      demandChargeVoltageBand: resolution.voltageBand,
      demandSavingIncludedInBaseNpv: false
    });
  }

  return resolveQuickSizingDemandCharge({
    ...assumptions,
    voltageLevel: resolution.voltageLevel,
    demandChargeApplicability: "applicable",
    demandChargeMode: "reference",
    detailedVoltageBand: "unknown",
    demandChargeInputVndPerKwMonth: null,
    demandChargeReferenceVndPerKwMonth: resolution.priceVndPerKwMonth,
    effectiveDemandChargeVndPerKwMonth: resolution.priceVndPerKwMonth,
    demandChargeStatus: resolution.status,
    demandChargeSource: resolution.source,
    demandChargeVoltageBand: resolution.voltageBand,
    demandSavingIncludedInBaseNpv: true
  });
}

export function markDemandChargeUserInput(
  assumptions: QuickSizingAssumptions,
  value: number
): QuickSizingAssumptions {
  const bounded = Math.min(
    DEMAND_CHARGE_SLIDER_MAX_VND_PER_KW_MONTH,
    Math.max(DEMAND_CHARGE_SLIDER_MIN_VND_PER_KW_MONTH, Number.isFinite(value) ? value : 0)
  );

  return resolveQuickSizingDemandCharge({
    ...assumptions,
    demandChargeApplicability: "applicable",
    demandChargeMode: "manual",
    demandChargeInputVndPerKwMonth: bounded,
    effectiveDemandChargeVndPerKwMonth: bounded,
    demandChargeStatus: bounded > 0 ? "manual_unconfirmed" : "invalid_input",
    demandChargeSource: "user_input",
    demandSavingIncludedInBaseNpv: bounded > 0
  });
}

export function isDemandChargeAssumptionKey(key: keyof QuickSizingAssumptions) {
  return DEMAND_CHARGE_ASSUMPTION_KEYS.has(key);
}

export function resolveQuickSizingDemandCharge(assumptions: QuickSizingAssumptions): QuickSizingAssumptions {
  const referenceBand = assumptions.detailedVoltageBand === "unknown"
    ? null
    : assumptions.demandChargeReferenceBands.find((band) => band.code === assumptions.detailedVoltageBand) ?? null;
  const referenceValue = referenceBand?.priceVndPerKwMonth ?? null;
  const inputValue = typeof assumptions.demandChargeInputVndPerKwMonth === "number" && Number.isFinite(assumptions.demandChargeInputVndPerKwMonth)
    ? Math.max(0, assumptions.demandChargeInputVndPerKwMonth)
    : null;

  if (assumptions.demandChargeApplicability === "not_applicable") {
    return {
      ...assumptions,
      demandChargeReferenceVndPerKwMonth: referenceValue,
      effectiveDemandChargeVndPerKwMonth: 0,
      demandChargeStatus: "not_applicable",
      demandChargeSource: "not_applicable",
      demandSavingIncludedInBaseNpv: false
    };
  }

  if (assumptions.demandChargeApplicability === "unknown") {
    return {
      ...assumptions,
      demandChargeReferenceVndPerKwMonth: referenceValue,
      effectiveDemandChargeVndPerKwMonth: 0,
      demandChargeStatus: assumptions.demandChargeStatus === "legacy_unconfirmed" ? "legacy_unconfirmed" : "unknown",
      demandChargeSource: assumptions.demandChargeSource === "legacy_unconfirmed" ? "legacy_unconfirmed" : "not_confirmed",
      demandSavingIncludedInBaseNpv: false
    };
  }

  if (assumptions.demandChargeSource === "step1_voltage_auto") {
    const voltageReference = resolveDemandChargeFromStep1Voltage(assumptions.voltageLevel);
    const effective = voltageReference.priceVndPerKwMonth;

    return {
      ...assumptions,
      demandChargeApplicability: effective > 0 ? "applicable" : "unknown",
      demandChargeMode: "reference",
      detailedVoltageBand: "unknown",
      demandChargeInputVndPerKwMonth: null,
      demandChargeReferenceVndPerKwMonth: effective > 0 ? effective : null,
      effectiveDemandChargeVndPerKwMonth: effective,
      demandChargeStatus: effective > 0 ? "preliminary_reference" : "unknown",
      demandChargeSource: effective > 0 ? "step1_voltage_auto" : "not_confirmed",
      demandChargeVoltageBand: voltageReference.voltageBand,
      demandSavingIncludedInBaseNpv: effective > 0
    };
  }

  if (assumptions.demandChargeMode === "invoice" || assumptions.demandChargeMode === "manual") {
    const effective = inputValue && inputValue > 0 ? inputValue : 0;
    return {
      ...assumptions,
      demandChargeInputVndPerKwMonth: inputValue,
      demandChargeReferenceVndPerKwMonth: referenceValue,
      effectiveDemandChargeVndPerKwMonth: effective,
      demandChargeStatus: effective > 0
        ? (assumptions.demandChargeMode === "invoice" ? "invoice_confirmed" : "manual_unconfirmed")
        : "invalid_input",
      demandChargeSource: assumptions.demandChargeMode === "invoice" ? "invoice" : "user_input",
      demandSavingIncludedInBaseNpv: effective > 0
    };
  }

  const effective = referenceValue ?? 0;
  return {
    ...assumptions,
    demandChargeReferenceVndPerKwMonth: referenceValue,
    effectiveDemandChargeVndPerKwMonth: assumptions.detailedVoltageBand === "unknown" ? 0 : effective,
    demandChargeStatus: DEFAULT_DEMAND_CHARGE_CATALOG.status,
    demandChargeSource: "evn_trial_reference",
    demandChargeVoltageBand: assumptions.detailedVoltageBand,
    demandSavingIncludedInBaseNpv: assumptions.detailedVoltageBand !== "unknown" && effective > 0
  };
}

export function buildStep2AssumptionsForResult(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): Step2Assumptions {
  const demandCharge = resolveQuickSizingDemandCharge(assumptions);
  return {
    powerKw: demandCharge.powerKw,
    energyKwh: demandCharge.energyKwh,
    dodPct: demandCharge.dodPct,
    rtePct: demandCharge.rtePct,
    degradationPct: demandCharge.degradationPct,
    cyclesPerDay: demandCharge.cyclesPerDay,
    operatingDaysPerYear: demandCharge.operatingDaysPerYear,
    peakEventDurationHours: demandCharge.peakEventDurationHours,
    peakEventFrequencyPerOperatingDay: demandCharge.peakEventFrequencyPerOperatingDay,
    minimumPeakCoveragePct: demandCharge.minimumPeakCoveragePct,
    batteryCostPerKwh: demandCharge.batteryCostVndPerKwh,
    batteryCostMetadata: withUnitCostValue(demandCharge.batteryCostMetadata, demandCharge.batteryCostVndPerKwh),
    pcsCostPerKw: demandCharge.pcsCostVndPerKw,
    pcsCostMetadata: withUnitCostValue(demandCharge.pcsCostMetadata, demandCharge.pcsCostVndPerKw),
    epcMode: demandCharge.epcMode,
    epcManualRatePct: demandCharge.epcManualRatePct,
    epcRateBands: demandCharge.epcRateBands,
    epcVoltageAdjustmentsPct: demandCharge.epcVoltageAdjustmentsPct,
    epcMinRatePct: demandCharge.epcMinRatePct,
    epcMaxRatePct: demandCharge.epcMaxRatePct,
    epcScopeItems: demandCharge.epcScopeItems,
    costModelStatus: demandCharge.costModelStatus,
    costCatalogVersion: demandCharge.costCatalogVersion,
    costModelSourceName: demandCharge.costModelSourceName,
    voltageLevel: demandCharge.voltageLevel || basicInfo?.voltageLevel || "Chưa xác định",
    vatPct: demandCharge.vatPct,
    includeVatInCapex: demandCharge.includeVatInCapex,
    omPct: demandCharge.omPct,
    omGrowthPct: demandCharge.omGrowthPct,
    offPeakPrice: demandCharge.offPeakPrice,
    normalPrice: demandCharge.normalPrice,
    peakPrice: demandCharge.peakPrice,
    demandChargeApplicability: demandCharge.demandChargeApplicability,
    demandChargeMode: demandCharge.demandChargeMode,
    detailedVoltageBand: demandCharge.detailedVoltageBand,
    demandChargeInputVndPerKwMonth: demandCharge.demandChargeInputVndPerKwMonth,
    demandChargeReferenceVndPerKwMonth: demandCharge.demandChargeReferenceVndPerKwMonth,
    effectiveDemandChargeVndPerKwMonth: demandCharge.effectiveDemandChargeVndPerKwMonth,
    demandChargeStatus: demandCharge.demandChargeStatus,
    demandChargeSource: demandCharge.demandChargeSource,
    demandChargeVoltageBand: demandCharge.demandChargeVoltageBand,
    demandChargeCatalogVersion: demandCharge.demandChargeCatalogVersion,
    demandChargeEvidenceNote: demandCharge.demandChargeEvidenceNote,
    demandChargeReferenceBands: demandCharge.demandChargeReferenceBands,
    demandSavingIncludedInBaseNpv: demandCharge.demandSavingIncludedInBaseNpv,
    exportTariff: demandCharge.exportTariff,
    priceEscalationPct: demandCharge.priceEscalationPct,
    demandTariffEscalationPct: demandCharge.demandTariffEscalationPct,
    exportTariffEscalationPct: demandCharge.exportTariffEscalationPct,
    debtPct: demandCharge.debtPct,
    interestPct: demandCharge.interestPct,
    loanTenorYears: demandCharge.loanTenorYears,
    waccPct: demandCharge.waccPct,
    taxPct: demandCharge.taxPct,
    analysisYears: demandCharge.analysisYears,
    budgetMax: demandCharge.budgetMaxVnd ?? resolveBudgetMaxVnd(basicInfo ?? null),
    finalPeakDemandKw: demandCharge.finalPeakDemandKw ?? basicInfo?.estimatedPeakDemandKw ?? null,
    targetPeakReductionType: basicInfo?.targetPeakReductionType ?? null,
    targetPeakReductionValue: basicInfo?.targetPeakReductionValue ?? null,
    solarCapacityKw: demandCharge.solarCapacityKw ?? normalizeSolarCapacityKw(basicInfo ?? null),
    solarMonthlyGenerationKwh: demandCharge.solarMonthlyGenerationKwh ?? normalizeSolarMonthlyGenerationKwh(basicInfo ?? null),
    pvSurplusRatio: demandCharge.pvSurplusRatio,
    exportPolicy: basicInfo?.exportPolicy ?? null,
    touShares: {
      low: demandCharge.touShareLow,
      normal: demandCharge.touShareNormal,
      peak: demandCharge.touSharePeak
    },
    selectedObjectives: basicInfo?.bessObjectives ?? []
  };
}

export function buildQuickSizingResultFromAssumptions(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): QuickSizingResult {
  return buildQuickSizingResult(
    buildStep2AssumptionsForResult(assumptions, basicInfo),
    basicInfo as BasicInfoForResult | null | undefined
  );
}

export function calculateBaseAssumptionCapex(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): CapexBreakdown {
  const step2Assumptions = buildStep2AssumptionsForResult(assumptions, basicInfo);
  const baseCandidate: GeneratedCandidate = {
    id: "base-assumption-candidate",
    powerKw: step2Assumptions.powerKw,
    energyKwh: step2Assumptions.energyKwh,
    nominalDurationHours: step2Assumptions.powerKw > 0 ? step2Assumptions.energyKwh / step2Assumptions.powerKw : 0,
    designObjective: "base_assumption",
    designPeakEventDurationHours: step2Assumptions.peakEventDurationHours,
    targetPeakReductionKw: null,
    usableAcEnergyPerEventKwh: null,
    energyLimitedPeakReductionKw: null,
    powerLimitedPeakReductionKw: null,
    effectivePeakReductionKw: null,
    technicalCoveragePct: null,
    meetsPeakReductionTarget: null,
    deliverableDurationAtReducedPeakHours: null,
    warnings: []
  };
  const baseScenario = DEFAULT_RESULT_CALCULATION_CONFIG.scenarios.find((item) => item.id === "base")
    ?? DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[0];

  return calculateCapex(
    baseCandidate,
    step2Assumptions,
    DEFAULT_RESULT_CALCULATION_CONFIG,
    baseScenario
  ).capex;
}

export function calculateQuickSizingMetrics(
  assumptions: QuickSizingAssumptions,
  _basicInfo?: QuickSizingStep1FormValues | null
): QuickSizingMetrics {
  void _basicInfo;
  return emptyMetrics(assumptions);
}

export function calculateQuickSizingCandidateMetrics(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): QuickSizingMetrics {
  const result = buildQuickSizingResultFromAssumptions(assumptions, basicInfo);
  const selected = result.recommendedOption ?? result.lowCostOption ?? result.candidates[0] ?? null;
  return selected ? metricsFromCandidate(selected) : emptyMetrics(assumptions);
}

export function buildSizingOptions(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): QuickSizingOption[] {
  const result = buildQuickSizingResultFromAssumptions(assumptions, basicInfo);
  const representativeOptions = [
    result.lowCostOption,
    result.recommendedOption,
    result.highBenefitOption
  ].filter((option): option is SizingOptionResult => Boolean(option));

  return representativeOptions.map(optionFromCandidate);
}

function metricsFromCandidate(candidate: SizingCandidateResult): QuickSizingMetrics {
  return {
    powerKw: candidate.powerKw,
    energyKwh: candidate.energyKwh,
    durationHours: candidate.nominalDurationHours,
    usableEnergyKwh: candidate.usableDurationHours ? candidate.usableDurationHours * candidate.powerKw : 0,
    capexVnd: candidate.capex.totalCapexVnd,
    annualSavingVnd: candidate.netOperatingSavingYear1Vnd,
    paybackYears: candidate.paybackYears,
    npvVnd: candidate.npvVnd,
    irrPct: candidate.irrPct,
    debtAmountVnd: candidate.debtAmountVnd,
    equityInvestmentVnd: candidate.equityInvestmentVnd,
    totalInterestVnd: candidate.totalInterestVnd,
    minimumDscr: candidate.minimumDscr,
    costOfEquityPct: candidate.costOfEquityPct,
    equityNpvVnd: candidate.equityNpvVnd,
    equityIrrPct: candidate.equityIrrPct,
    equityPaybackYears: candidate.equityPaybackYears,
    cashFlowVnd: candidate.yearlyResults.map((row) => row.fcffVnd),
    equityCashFlowVnd: candidate.yearlyResults.map((row) => row.equityCashFlowVnd)
  };
}

function optionFromCandidate(option: SizingOptionResult): QuickSizingOption {
  return {
    ...metricsFromCandidate(option),
    id: option.role,
    candidateId: option.id,
    title: option.title,
    badge: option.badge,
    paybackStatus: option.paybackStatus,
    irrStatus: option.irrStatus,
    npvPerCapex: option.npvPerCapex,
    budgetStatus: option.budgetEvaluation.status,
    recommendationScore: option.recommendationScore
  };
}

function emptyMetrics(assumptions: QuickSizingAssumptions): QuickSizingMetrics {
  return {
    powerKw: assumptions.powerKw,
    energyKwh: assumptions.energyKwh,
    durationHours: assumptions.powerKw > 0 ? assumptions.energyKwh / assumptions.powerKw : 0,
    usableEnergyKwh: assumptions.energyKwh * assumptions.dodPct / 100,
    capexVnd: 0,
    annualSavingVnd: 0,
    paybackYears: null,
    npvVnd: 0,
    irrPct: null,
    debtAmountVnd: 0,
    equityInvestmentVnd: 0,
    totalInterestVnd: 0,
    minimumDscr: null,
    costOfEquityPct: assumptions.waccPct,
    equityNpvVnd: 0,
    equityIrrPct: null,
    equityPaybackYears: null,
    cashFlowVnd: [],
    equityCashFlowVnd: []
  };
}

function normalizeSolarCapacityKw(values?: QuickSizingStep1FormValues | null) {
  if (!values || values.solarStatus === "none" || values.solarStatus === "unknown" || !values.solarCapacityValue) {
    return null;
  }

  return values.solarCapacityUnit === "MWp" ? values.solarCapacityValue * 1000 : values.solarCapacityValue;
}

function normalizeSolarMonthlyGenerationKwh(values?: QuickSizingStep1FormValues | null) {
  if (!values || values.solarStatus === "none" || values.solarStatus === "unknown" || !values.solarMonthlyGenerationValue) {
    return null;
  }

  return values.solarMonthlyGenerationUnit === "MWh/tháng" ? values.solarMonthlyGenerationValue * 1000 : values.solarMonthlyGenerationValue;
}

function resolveBudgetMaxVnd(values?: QuickSizingStep1FormValues | null) {
  if (!values) {
    return null;
  }
  if (values.budgetRange === "Nhập ngân sách tùy chỉnh") {
    return values.customBudgetVnd ?? null;
  }
  if (values.budgetRange.includes("Trên 50")) {
    return null;
  }
  if (values.budgetRange.includes("20") && values.budgetRange.includes("50")) {
    return 50_000_000_000;
  }
  if (values.budgetRange.includes("10") && values.budgetRange.includes("20")) {
    return 20_000_000_000;
  }
  if (values.budgetRange.includes("5") && values.budgetRange.includes("10")) {
    return 10_000_000_000;
  }
  if (values.budgetRange.includes("5")) {
    return 5_000_000_000;
  }

  return null;
}

export function formatVnd(value: number) {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value / 1_000_000_000)} tỷ`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000)} triệu`;
  }
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} VND`;
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(value);
}
