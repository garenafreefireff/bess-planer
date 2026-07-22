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
  batteryCostVndPerKwh: number;
  pcsCostVndPerKw: number;
  epcFixedVnd: number;
  omPct: number;
  omGrowthPct: number;
  offPeakPrice: number;
  normalPrice: number;
  peakPrice: number;
  demandPrice: number;
  priceEscalationPct: number;
  debtPct: number;
  interestPct: number;
  loanTenorYears: number;
  waccPct: number;
  taxPct: number;
  analysisYears: number;
  vatIncluded: boolean;
};

export type QuickSizingMetrics = {
  powerKw: number;
  energyKwh: number;
  durationHours: number;
  usableEnergyKwh: number;
  capexVnd: number;
  annualSavingVnd: number;
  paybackYears: number;
  npvVnd: number;
  irrPct: number;
  cashFlowVnd: number[];
};

export type QuickSizingOption = QuickSizingMetrics & {
  id: "low" | "recommended" | "high";
  title: string;
  badge: string;
};

export const defaultQuickSizingAssumptions: QuickSizingAssumptions = {
  energyKwh: 1000,
  powerKw: 500,
  dodPct: 90,
  rtePct: 90,
  degradationPct: 2,
  cyclesPerDay: 1,
  operatingDaysPerYear: 300,
  batteryCostVndPerKwh: 6_000_000,
  pcsCostVndPerKw: 2_000_000,
  epcFixedVnd: 1_500_000_000,
  omPct: 2,
  omGrowthPct: 2,
  offPeakPrice: 1028,
  normalPrice: 1666,
  peakPrice: 2797,
  demandPrice: 150_000,
  priceEscalationPct: 5,
  debtPct: 70,
  interestPct: 9,
  loanTenorYears: 7,
  waccPct: 10,
  taxPct: 20,
  analysisYears: 10,
  vatIncluded: false
};

const scenarioOverrides: Record<Exclude<QuickSizingScenario, "custom">, Partial<QuickSizingAssumptions>> = {
  default: {},
  optimistic: {
    batteryCostVndPerKwh: 5_400_000,
    pcsCostVndPerKw: 1_850_000,
    rtePct: 93,
    degradationPct: 1.5,
    priceEscalationPct: 7,
    waccPct: 8,
    interestPct: 8
  },
  conservative: {
    batteryCostVndPerKwh: 6_600_000,
    pcsCostVndPerKw: 2_200_000,
    rtePct: 86,
    degradationPct: 2.5,
    priceEscalationPct: 3,
    waccPct: 12,
    interestPct: 11
  }
};

export function createAssumptionsFromBasicInfo(values?: QuickSizingStep1FormValues | null): QuickSizingAssumptions {
  if (!values) {
    return { ...defaultQuickSizingAssumptions };
  }

  const loadPreset: Record<string, { powerKw: number; energyKwh: number }> = {
    "Dưới 500 kW": { powerKw: 250, energyKwh: 500 },
    "500 kW – 1 MW": { powerKw: 500, energyKwh: 1000 },
    "1 MW – 5 MW": { powerKw: 1000, energyKwh: 2000 },
    "5 MW – 10 MW": { powerKw: 2000, energyKwh: 4000 },
    "Trên 10 MW": { powerKw: 3000, energyKwh: 6000 },
    "Chưa xác định": { powerKw: 500, energyKwh: 1000 }
  };

  const preset = loadPreset[values.estimatedLoadRange] ?? loadPreset["Chưa xác định"];
  const operatingDaysPerYear = Math.round((values.operatingDaysPerWeek ?? 6) * 52);
  const cyclesPerDay = values.bessObjectives.includes("backup") ? 0.7 : values.bessObjectives.includes("saving") ? 1 : 0.8;
  const powerKw = values.estimatedPeakDemandKw && values.estimatedPeakDemandKw > 0
    ? Math.max(100, Math.round(values.estimatedPeakDemandKw * 0.28))
    : preset.powerKw;
  const backupEnergy = values.bessObjectives.includes("backup")
    ? powerKw * (values.backupDurationHours && values.backupDurationHours > 0 ? values.backupDurationHours : 1)
    : 0;
  const energyKwh = Math.max(preset.energyKwh, Math.round(backupEnergy));

  return {
    ...defaultQuickSizingAssumptions,
    powerKw,
    energyKwh,
    operatingDaysPerYear: Math.min(365, Math.max(200, operatingDaysPerYear)),
    cyclesPerDay
  };
}

export function applyScenarioPreset(
  scenario: Exclude<QuickSizingScenario, "custom">,
  current: QuickSizingAssumptions
): QuickSizingAssumptions {
  return {
    ...current,
    ...scenarioOverrides[scenario]
  };
}

function calculateIrr(cashFlows: number[]) {
  let low = -0.9;
  let high = 2;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const rate = (low + high) / 2;
    const npv = cashFlows.reduce((sum, value, index) => sum + value / Math.pow(1 + rate, index), 0);
    if (npv > 0) {
      low = rate;
    } else {
      high = rate;
    }
  }

  return Math.max(0, ((low + high) / 2) * 100);
}

export function calculateQuickSizingMetrics(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): QuickSizingMetrics {
  const energyKwh = Math.max(1, assumptions.energyKwh);
  const powerKw = Math.max(1, assumptions.powerKw);
  const usableEnergyKwh = energyKwh * assumptions.dodPct / 100;
  const durationHours = energyKwh / powerKw;
  const vatFactor = assumptions.vatIncluded ? 1.1 : 1;
  const capexVnd = (
    energyKwh * assumptions.batteryCostVndPerKwh
    + powerKw * assumptions.pcsCostVndPerKw
    + assumptions.epcFixedVnd
  ) * vatFactor;

  const annualDischargedEnergy = usableEnergyKwh
    * assumptions.cyclesPerDay
    * assumptions.operatingDaysPerYear
    * assumptions.rtePct / 100;
  const priceSpread = Math.max(0, assumptions.peakPrice - assumptions.offPeakPrice);
  const arbitrageSaving = annualDischargedEnergy * priceSpread;
  const peakReductionFactor = basicInfo?.bessObjectives.includes("peak_shaving") ? 0.22 : 0.08;
  const demandSaving = powerKw * peakReductionFactor * assumptions.demandPrice * 12;
  const solarSaving = basicInfo?.bessObjectives.includes("solar_optimization") ? annualDischargedEnergy * 180 : 0;
  const sizingCoverage = Math.min(1.25, Math.max(0.5, (powerKw / 500) * 0.55 + (energyKwh / 1000) * 0.45));
  const billSaving = basicInfo?.monthlyElectricityBillVnd
    ? basicInfo.monthlyElectricityBillVnd * 12 * (basicInfo.bessObjectives.includes("saving") ? 0.1 : 0.04) * sizingCoverage
    : 0;
  const firstYearOm = capexVnd * assumptions.omPct / 100;
  const grossSaving = Math.max(arbitrageSaving + demandSaving + solarSaving, billSaving + demandSaving + solarSaving);
  const annualSavingVnd = Math.max(1, grossSaving - firstYearOm);
  const paybackYears = capexVnd / annualSavingVnd;

  const cashFlowVnd = [-capexVnd];
  let npvVnd = -capexVnd;
  for (let year = 1; year <= assumptions.analysisYears; year += 1) {
    const degradationFactor = Math.pow(1 - assumptions.degradationPct / 100, year - 1);
    const escalationFactor = Math.pow(1 + assumptions.priceEscalationPct / 100, year - 1);
    const omGrowthFactor = Math.pow(1 + assumptions.omGrowthPct / 100, year - 1);
    const annualGross = grossSaving * degradationFactor * escalationFactor;
    const annualOm = firstYearOm * omGrowthFactor;
    const afterTaxCash = Math.max(0, annualGross - annualOm) * (1 - assumptions.taxPct / 100);
    cashFlowVnd.push(afterTaxCash);
    npvVnd += afterTaxCash / Math.pow(1 + assumptions.waccPct / 100, year);
  }

  return {
    powerKw,
    energyKwh,
    durationHours,
    usableEnergyKwh,
    capexVnd,
    annualSavingVnd,
    paybackYears,
    npvVnd,
    irrPct: calculateIrr(cashFlowVnd),
    cashFlowVnd
  };
}

export function buildSizingOptions(
  assumptions: QuickSizingAssumptions,
  basicInfo?: QuickSizingStep1FormValues | null
): QuickSizingOption[] {
  const definitions = [
    { id: "low" as const, title: "Chi phí thấp", badge: "CAPEX thấp", factor: 0.75 },
    { id: "recommended" as const, title: "Khuyến nghị", badge: "Cân bằng tốt", factor: 1 },
    { id: "high" as const, title: "Hiệu quả cao", badge: "Tiết kiệm cao", factor: 1.25 }
  ];

  return definitions.map(({ factor, ...definition }) => ({
    ...definition,
    ...calculateQuickSizingMetrics({
      ...assumptions,
      powerKw: Math.max(50, Math.round(assumptions.powerKw * factor / 25) * 25),
      energyKwh: Math.max(100, Math.round(assumptions.energyKwh * factor / 50) * 50)
    }, basicInfo)
  }));
}

export function formatVnd(value: number) {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value / 1_000_000_000)} tỷ`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000)} triệu`;
  }
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(value);
}
