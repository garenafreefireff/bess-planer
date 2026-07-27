import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  allocateDispatchEnergy,
  buildQuickSizingResult,
  buildParetoPoints,
  calculateBudgetEvaluation,
  calculateCapex,
  calculateCashFlow,
  calculateConfidence,
  calculateEpcRate,
  calculateEnergyYears,
  calculateIrr,
  calculateLcos,
  calculateNpv,
  calculatePayback,
  calculateSavings,
  DEFAULT_RESULT_CALCULATION_CONFIG,
  generateCandidates,
  markParetoCandidates,
  scoreCandidates,
  selectRepresentativeOptions
} from "../features/quick-sizing/result-calculation";
import { calculateDepreciation, calculateOm, calculateTax } from "../features/quick-sizing/result-calculation/calculate-tax";
import {
  applyScenarioPreset,
  applyStep1VoltageDemandCharge,
  buildQuickSizingResultFromAssumptions,
  buildStep2AssumptionsForResult,
  buildSizingOptions,
  calculateQuickSizingCandidateMetrics,
  calculateQuickSizingMetrics,
  defaultQuickSizingAssumptions,
  markDemandChargeUserInput,
  resolveDemandChargeFromStep1Voltage
} from "../features/quick-sizing/data/quick-sizing-model";
import { assumptionsFromStep2Result } from "../features/quick-sizing/data/quick-sizing-backend-mapper";
import { migrateQuickSizingPersistedData } from "../features/quick-sizing/data/quick-sizing-store-migration";
import { defaultQuickSizingStep1Values } from "../features/quick-sizing/data/quick-sizing-step1-schema";
import type { QuickSizingStep2Result } from "../features/quick-sizing/data/quick-sizing-api-types";
import type { QuickSizingAssumptions } from "../features/quick-sizing/data/quick-sizing-model";
import type {
  GeneratedCandidate,
  ResultCalculationConfig,
  SizingCandidateResult,
  Step2Assumptions,
  YearlyResult
} from "../features/quick-sizing/result-calculation";

const baseBatteryCostMetadata = {
  ...defaultQuickSizingAssumptions.batteryCostMetadata,
  value: 1_000_000,
  status: "confirmed",
  source: "unit_test",
  catalogVersion: "test-cost-model-v1"
};

const basePcsCostMetadata = {
  ...defaultQuickSizingAssumptions.pcsCostMetadata,
  value: 500_000,
  status: "confirmed",
  source: "unit_test",
  catalogVersion: "test-cost-model-v1"
};

const baseAssumptions: Step2Assumptions = {
  powerKw: 100,
  energyKwh: 200,
  dodPct: 90,
  rtePct: 90,
  degradationPct: 2,
  cyclesPerDay: 1,
  operatingDaysPerYear: 300,
  peakEventDurationHours: 2,
  peakEventFrequencyPerOperatingDay: 0.6,
  minimumPeakCoveragePct: 95,
  batteryCostPerKwh: 1_000_000,
  batteryCostMetadata: baseBatteryCostMetadata,
  pcsCostPerKw: 500_000,
  pcsCostMetadata: basePcsCostMetadata,
  epcMode: "auto",
  epcManualRatePct: null,
  epcRateBands: DEFAULT_RESULT_CALCULATION_CONFIG.cost.epcRateBands,
  epcVoltageAdjustmentsPct: DEFAULT_RESULT_CALCULATION_CONFIG.cost.epcVoltageAdjustmentsPct,
  epcMinRatePct: DEFAULT_RESULT_CALCULATION_CONFIG.cost.epcMinRatePct,
  epcMaxRatePct: DEFAULT_RESULT_CALCULATION_CONFIG.cost.epcMaxRatePct,
  epcScopeItems: DEFAULT_RESULT_CALCULATION_CONFIG.cost.epcScopeItems,
  costModelStatus: "confirmed",
  costCatalogVersion: "test-cost-model-v1",
  costModelSourceName: "unit_test",
  voltageLevel: "Trung áp",
  includeVatInCapex: false,
  omPct: 2,
  omGrowthPct: 2,
  offPeakPrice: 1000,
  normalPrice: 2000,
  peakPrice: 5000,
  demandChargeApplicability: "applicable",
  demandChargeMode: "manual",
  detailedVoltageBand: "unknown",
  demandChargeInputVndPerKwMonth: 150_000,
  demandChargeReferenceVndPerKwMonth: null,
  effectiveDemandChargeVndPerKwMonth: 150_000,
  demandChargeStatus: "manual_unconfirmed",
  demandChargeSource: "user_input",
  demandChargeCatalogVersion: DEFAULT_RESULT_CALCULATION_CONFIG.demandCharge.catalogVersion,
  demandChargeEvidenceNote: null,
  demandChargeReferenceBands: DEFAULT_RESULT_CALCULATION_CONFIG.demandCharge.referenceBands,
  demandSavingIncludedInBaseNpv: true,
  exportTariff: 0,
  priceEscalationPct: 5,
  debtPct: 70,
  interestPct: 9,
  loanTenorYears: 7,
  waccPct: 10,
  taxPct: 20,
  analysisYears: 10,
  budgetMax: 500_000_000,
  finalPeakDemandKw: 400,
  targetPeakReductionType: "percent",
  targetPeakReductionValue: 10,
  solarCapacityKw: 200,
  solarMonthlyGenerationKwh: 24_000,
  pvSurplusRatio: 0.2,
  touShares: { low: 0.2, normal: 0.5, peak: 0.3 },
  selectedObjectives: ["saving", "peak_shaving", "solar_optimization"]
};

const candidate: GeneratedCandidate = {
  id: "candidate-100-200",
  powerKw: 100,
  energyKwh: 200,
  nominalDurationHours: 2,
  warnings: []
};

const demandSavingAllocation = {
  backupReserveEnergyKwh: 0,
  pvChargedEnergyKwh: 0,
  gridChargedEnergyKwh: 0,
  peakShavingDischargeEnergyKwh: 18_000,
  peakShavingDischargeEnergyPerEventKwh: 100,
  peakShavingDischargeEnergyAnnualKwh: 18_000,
  peakShavingGridChargeEnergyAnnualKwh: 20_000,
  effectivePeakReductionKw: 50,
  annualPeakEventCount: 180,
  arbitrageGridChargeEnergyAnnualKwh: 0,
  arbitrageDischargeEnergyKwh: 0,
  warnings: []
};

function withManualDemandCharge(assumptions: Step2Assumptions, value: number): Step2Assumptions {
  return {
    ...assumptions,
    demandChargeApplicability: "applicable",
    demandChargeMode: "manual",
    demandChargeInputVndPerKwMonth: value,
    effectiveDemandChargeVndPerKwMonth: value,
    demandChargeStatus: value > 0 ? "manual_unconfirmed" : "invalid_input",
    demandChargeSource: "user_input",
    demandSavingIncludedInBaseNpv: value > 0
  };
}

function withUnknownDemandCharge(assumptions: Step2Assumptions): Step2Assumptions {
  return {
    ...assumptions,
    demandChargeApplicability: "unknown",
    demandChargeMode: "reference",
    detailedVoltageBand: assumptions.detailedVoltageBand,
    demandChargeInputVndPerKwMonth: null,
    demandChargeReferenceVndPerKwMonth: assumptions.demandChargeReferenceVndPerKwMonth,
    effectiveDemandChargeVndPerKwMonth: 0,
    demandChargeStatus: "unknown",
    demandChargeSource: "not_confirmed",
    demandSavingIncludedInBaseNpv: false
  };
}

function withNotApplicableDemandCharge(assumptions: Step2Assumptions): Step2Assumptions {
  return {
    ...assumptions,
    demandChargeApplicability: "not_applicable",
    demandChargeMode: "reference",
    effectiveDemandChargeVndPerKwMonth: 0,
    demandChargeStatus: "not_applicable",
    demandChargeSource: "not_applicable",
    demandSavingIncludedInBaseNpv: false
  };
}

function withReferenceDemandCharge(assumptions: Step2Assumptions, bandCode: Exclude<Step2Assumptions["detailedVoltageBand"], "unknown">): Step2Assumptions {
  const band = DEFAULT_RESULT_CALCULATION_CONFIG.demandCharge.referenceBands.find((item) => item.code === bandCode);
  assert.ok(band);
  return {
    ...assumptions,
    demandChargeApplicability: "applicable",
    demandChargeMode: "reference",
    detailedVoltageBand: bandCode,
    demandChargeInputVndPerKwMonth: null,
    demandChargeReferenceVndPerKwMonth: band.priceVndPerKwMonth,
    effectiveDemandChargeVndPerKwMonth: band.priceVndPerKwMonth,
    demandChargeStatus: "trial_reference",
    demandChargeSource: "evn_trial_reference",
    demandSavingIncludedInBaseNpv: true
  };
}

test("candidate grid creates many valid candidates and removes duplicates", () => {
  const candidates = generateCandidates(baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG);
  const keys = new Set(candidates.map((item) => `${item.powerKw}:${item.energyKwh}`));

  assert.ok(candidates.length >= 10);
  assert.equal(keys.size, candidates.length);
});

test("candidate grid removes duplicated rounded P/E pairs", () => {
  const config: ResultCalculationConfig = {
    ...DEFAULT_RESULT_CALCULATION_CONFIG,
    candidate: {
      ...DEFAULT_RESULT_CALCULATION_CONFIG.candidate,
      powerMultipliers: [1, 1.01],
      energyMultipliers: [1, 1.01]
    }
  };
  const candidates = generateCandidates(baseAssumptions, config);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.powerKw, 100);
  assert.equal(candidates[0]?.energyKwh, 200);
});

test("candidate grid rounds power and energy to configured steps", () => {
  const candidates = generateCandidates({ ...baseAssumptions, powerKw: 53, energyKwh: 111 }, DEFAULT_RESULT_CALCULATION_CONFIG);

  assert.ok(candidates.every((item) => item.powerKw % DEFAULT_RESULT_CALCULATION_CONFIG.candidate.powerStepKw === 0));
  assert.ok(candidates.every((item) => item.energyKwh % DEFAULT_RESULT_CALCULATION_CONFIG.candidate.energyStepKwh === 0));
});

test("duration is calculated from nominal energy over power", () => {
  const candidates = generateCandidates(baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG);
  const selected = candidates.find((item) => item.powerKw === 100 && item.energyKwh === 200);

  assert.equal(selected?.nominalDurationHours, 2);
});

test("peak-only candidate grid couples power and energy multipliers", () => {
  const assumptions: Step2Assumptions = {
    ...baseAssumptions,
    powerKw: 1600,
    energyKwh: 3250,
    operatingDaysPerYear: 300,
    peakEventDurationHours: 2,
    peakEventFrequencyPerOperatingDay: 0.6,
    selectedObjectives: ["peak_shaving"],
    finalPeakDemandKw: 8000,
    targetPeakReductionType: "kw",
    targetPeakReductionValue: 1600,
    solarCapacityKw: null,
    solarMonthlyGenerationKwh: null
  };
  const candidates = generateCandidates(assumptions, DEFAULT_RESULT_CALCULATION_CONFIG);
  const baseDuration = assumptions.energyKwh / assumptions.powerKw;

  assert.equal(candidates.some((item) => item.powerKw === 1200 && item.energyKwh === 4050), false);
  assert.ok(candidates.some((item) => item.powerKw === 1600 && item.energyKwh === 3250));
  assert.ok(candidates.every((item) => Math.abs(item.nominalDurationHours - baseDuration) / baseDuration < 0.05));
});

test("peak frequency drives annual events but not per-event usable energy", () => {
  const assumptions: Step2Assumptions = withManualDemandCharge({
    ...baseAssumptions,
    powerKw: 1600,
    energyKwh: 3250,
    operatingDaysPerYear: 300,
    peakEventDurationHours: 2,
    peakEventFrequencyPerOperatingDay: 0.6,
    selectedObjectives: ["peak_shaving"],
    finalPeakDemandKw: 8000,
    targetPeakReductionType: "kw",
    targetPeakReductionValue: 500,
    batteryCostPerKwh: 3_600_000,
    pcsCostPerKw: 1_300_000,
    solarCapacityKw: null,
    solarMonthlyGenerationKwh: null
  }, 200_000);
  const result = buildQuickSizingResult(assumptions);
  const reference = result.candidates.find((item) => item.powerKw === 1600 && item.energyKwh === 3250);
  assert.ok(reference);
  const year1 = reference.yearlyResults[1];
  assert.ok(year1);

  assert.equal(reference.nominalDurationHours, 3250 / 1600);
  assert.equal(year1.annualPeakEventCount, 180);
  assert.equal(year1.effectivePeakReductionKw, 500);
  assert.equal(year1.peakShavingDischargeEnergyPerEventKwh, 1000);
  assert.ok((reference.usableAcEnergyPerEventKwh ?? 0) > year1.peakShavingDischargeEnergyPerEventKwh);
  assert.ok(year1.peakShavingGridChargeEnergyAnnualKwh > 0);
  assert.ok(year1.peakShavingChargingCostVnd > 0);
  assert.ok(year1.peakShavingEnergySavingVnd > 0);
});

test("negative financial peak-only case has no recommended option", () => {
  const result = buildQuickSizingResult(withUnknownDemandCharge({
    ...baseAssumptions,
    powerKw: 1600,
    energyKwh: 3250,
    selectedObjectives: ["peak_shaving"],
    finalPeakDemandKw: 8000,
    targetPeakReductionType: "kw",
    targetPeakReductionValue: 500,
    batteryCostPerKwh: 20_000_000,
    pcsCostPerKw: 5_000_000,
    solarCapacityKw: null,
    solarMonthlyGenerationKwh: null
  }));

  assert.equal(result.recommendedOption, null);
  assert.ok(result.candidates.every((item) => item.recommendationScore === null));
});

test("energy years apply degradation from year two onward", () => {
  const energy = calculateEnergyYears(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(energy[1]?.availableCapacityKwh, 200);
  assert.equal(Math.round(energy[2]?.availableCapacityKwh ?? 0), 196);
});

test("annual discharge does not multiply RTE again and charge divides by RTE", () => {
  const energy = calculateEnergyYears(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(energy[1]?.dischargedEnergyAcKwh, 54_000);
  assert.equal(energy[1]?.chargedEnergyAcKwh, 60_000);
});

test("tariff escalation applies to yearly savings", () => {
  const allocation = {
    backupReserveEnergyKwh: 0,
    pvChargedEnergyKwh: 0,
    gridChargedEnergyKwh: 100,
    peakShavingDischargeEnergyKwh: 0,
    peakShavingDischargeEnergyPerEventKwh: 0,
    peakShavingDischargeEnergyAnnualKwh: 0,
    peakShavingGridChargeEnergyAnnualKwh: 0,
    effectivePeakReductionKw: 0,
    annualPeakEventCount: 0,
    arbitrageGridChargeEnergyAnnualKwh: 100,
    arbitrageDischargeEnergyKwh: 90,
    warnings: []
  };
  const assumptions = withUnknownDemandCharge({ ...baseAssumptions, selectedObjectives: ["saving"], solarCapacityKw: null, solarMonthlyGenerationKwh: null });
  const year1 = calculateSavings(allocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);
  const year2 = calculateSavings(allocation, 2, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.ok(year1.arbitrageSavingVnd > 0);
  assert.equal(Math.round(year2.arbitrageSavingVnd), Math.round(year1.arbitrageSavingVnd * 1.05));
});

test("CAPEX breakdown sums to total", () => {
  const { capex, warnings } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const total = capex.batteryCostVnd + capex.pcsCostVnd + capex.epcAllInVnd + capex.vatVnd;

  assert.equal(warnings.length, 0);
  assert.equal(capex.totalCapexVnd, total);
});

test("CAPEX for same P/E is independent from demand charge", () => {
  const acceptanceCandidate: GeneratedCandidate = {
    ...candidate,
    id: "base-assumption-candidate",
    powerKw: 500,
    energyKwh: 1000,
    nominalDurationHours: 2
  };
  const capexAssumptions: Step2Assumptions = {
    ...baseAssumptions,
    powerKw: 500,
    energyKwh: 1000,
    batteryCostPerKwh: 3_000_000,
    batteryCostMetadata: { ...baseAssumptions.batteryCostMetadata, value: 3_000_000 },
    pcsCostPerKw: 1_500_000,
    pcsCostMetadata: { ...baseAssumptions.pcsCostMetadata, value: 1_500_000 },
    epcMode: "manual",
    epcManualRatePct: 20,
    includeVatInCapex: false
  };
  const withoutDemandCharge = calculateCapex(
    acceptanceCandidate,
    withUnknownDemandCharge(capexAssumptions),
    DEFAULT_RESULT_CALCULATION_CONFIG,
    DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]
  ).capex;
  const withDemandCharge = calculateCapex(
    acceptanceCandidate,
    withManualDemandCharge(capexAssumptions, 240_050),
    DEFAULT_RESULT_CALCULATION_CONFIG,
    DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]
  ).capex;

  assert.equal(withoutDemandCharge.totalCapexVnd, 4_500_000_000);
  assert.equal(withDemandCharge.totalCapexVnd, 4_500_000_000);
  assert.equal(withoutDemandCharge.batteryCostVnd, withDemandCharge.batteryCostVnd);
  assert.equal(withoutDemandCharge.pcsCostVnd, withDemandCharge.pcsCostVnd);
  assert.equal(withoutDemandCharge.epcAllInVnd, withDemandCharge.epcAllInVnd);
});

test("VAT is calculated from candidate CAPEX only when included", () => {
  const excluded = calculateCapex({ ...candidate, id: "vat-excluded" }, { ...baseAssumptions, includeVatInCapex: false }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const included = calculateCapex({ ...candidate, id: "vat-included" }, { ...baseAssumptions, includeVatInCapex: true, vatPct: 10 }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;

  assert.equal(excluded.vatVnd, 0);
  assert.equal(included.vatVnd, included.capexExcludingVatVnd * 0.1);
});

test("EPC is recalculated independently for each candidate", () => {
  const small = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const half = calculateCapex({ ...candidate, id: "candidate-half", powerKw: 50, energyKwh: 100 }, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;

  assert.notEqual(half.epcAllInVnd, small.epcAllInVnd);
  assert.equal(half.epcAllInVnd, half.equipmentCostVnd * half.epcAppliedRatePct / 100);
});

test("EPC applied rate changes across rate bands", () => {
  const small = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const large = calculateCapex({ ...candidate, id: "candidate-large-band", powerKw: 1000, energyKwh: 5000 }, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;

  assert.equal(small.epcBaseRatePct, 22);
  assert.equal(large.epcBaseRatePct, 18);
  assert.notEqual(small.epcAppliedRatePct, large.epcAppliedRatePct);
});

test("manual EPC rate overrides auto rate with clamp", () => {
  const manual = calculateCapex(candidate, { ...baseAssumptions, epcMode: "manual", epcManualRatePct: 12.3 }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const clamped = calculateCapex(candidate, { ...baseAssumptions, epcMode: "manual", epcManualRatePct: 99 }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const auto = calculateEpcRate(manual.equipmentCostVnd, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG);

  assert.notEqual(manual.epcAppliedRatePct, auto.appliedRatePct);
  assert.equal(manual.epcAppliedRatePct, 12.3);
  assert.equal(clamped.epcAppliedRatePct, baseAssumptions.epcMaxRatePct);
});

test("reference all-in CAPEX math does not add legacy fixed components", () => {
  const reference = calculateCapex(
    { id: "reference-400-800", powerKw: 400, energyKwh: 800, nominalDurationHours: 2, warnings: [] },
    {
      ...baseAssumptions,
      batteryCostPerKwh: DEFAULT_RESULT_CALCULATION_CONFIG.cost.batteryDcPackage.base,
      batteryCostMetadata: defaultQuickSizingAssumptions.batteryCostMetadata,
      pcsCostPerKw: DEFAULT_RESULT_CALCULATION_CONFIG.cost.pcsEquipment.base,
      pcsCostMetadata: defaultQuickSizingAssumptions.pcsCostMetadata,
      includeVatInCapex: false
    },
    DEFAULT_RESULT_CALCULATION_CONFIG,
    DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]
  ).capex;

  assert.equal(reference.batteryCostVnd, 2_400_000_000);
  assert.equal(reference.pcsCostVnd, 600_000_000);
  assert.equal(reference.equipmentCostVnd, 3_000_000_000);
  assert.equal(reference.epcAppliedRatePct, 24);
  assert.equal(reference.epcAllInVnd, 720_000_000);
  assert.equal(reference.capexExcludingVatVnd, 3_720_000_000);
});

test("acceptance CAPEX uses base equipment unit costs for 1600 kW and 3250 kWh", () => {
  const reference = calculateCapex(
    { id: "acceptance-1600-3250", powerKw: 1_600, energyKwh: 3_250, nominalDurationHours: 3_250 / 1_600, warnings: [] },
    {
      ...baseAssumptions,
      batteryCostPerKwh: DEFAULT_RESULT_CALCULATION_CONFIG.cost.batteryDcPackage.base,
      batteryCostMetadata: defaultQuickSizingAssumptions.batteryCostMetadata,
      pcsCostPerKw: DEFAULT_RESULT_CALCULATION_CONFIG.cost.pcsEquipment.base,
      pcsCostMetadata: defaultQuickSizingAssumptions.pcsCostMetadata,
      epcMode: "manual",
      epcManualRatePct: 17,
      includeVatInCapex: false
    },
    DEFAULT_RESULT_CALCULATION_CONFIG,
    DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]
  ).capex;

  assert.equal(reference.batteryCostVnd, 9_750_000_000);
  assert.equal(reference.pcsCostVnd, 2_400_000_000);
  assert.equal(reference.equipmentCostVnd, 12_150_000_000);
  assert.equal(reference.epcAllInVnd, 2_065_500_000);
  assert.equal(reference.capexExcludingVatVnd, 14_215_500_000);
});

test("custom equipment unit costs are not multiplied by result scenarios", () => {
  const customAssumptions: Step2Assumptions = {
    ...baseAssumptions,
    batteryCostPerKwh: 4_000_000,
    batteryCostMetadata: { ...baseAssumptions.batteryCostMetadata, source: "user_input" },
    pcsCostPerKw: 1_700_000,
    pcsCostMetadata: { ...baseAssumptions.pcsCostMetadata, source: "user_input" }
  };
  const optimistic = calculateCapex(candidate, customAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[2]).capex;
  const base = calculateCapex(candidate, customAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;

  assert.equal(optimistic.batteryCostVnd, candidate.energyKwh * 4_000_000);
  assert.equal(optimistic.pcsCostVnd, candidate.powerKw * 1_700_000);
  assert.equal(optimistic.equipmentCostVnd, base.equipmentCostVnd);
  assert.equal(optimistic.batteryUnitCost.source, "user_input");
  assert.equal(optimistic.pcsUnitCost.source, "user_input");
});

test("equipment unit cost changes update CAPEX and recalculate EPC", () => {
  const base = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const higherBattery = calculateCapex(
    candidate,
    { ...baseAssumptions, batteryCostPerKwh: baseAssumptions.batteryCostPerKwh + 500_000 },
    DEFAULT_RESULT_CALCULATION_CONFIG,
    DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]
  ).capex;
  const higherPcs = calculateCapex(
    candidate,
    { ...baseAssumptions, pcsCostPerKw: baseAssumptions.pcsCostPerKw + 250_000 },
    DEFAULT_RESULT_CALCULATION_CONFIG,
    DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]
  ).capex;

  assert.ok(higherBattery.batteryCostVnd > base.batteryCostVnd);
  assert.ok(higherBattery.totalCapexVnd > base.totalCapexVnd);
  assert.equal(higherBattery.epcAllInVnd, higherBattery.equipmentCostVnd * higherBattery.epcAppliedRatePct / 100);
  assert.ok(higherPcs.pcsCostVnd > base.pcsCostVnd);
  assert.ok(higherPcs.totalCapexVnd > base.totalCapexVnd);
  assert.equal(higherPcs.epcAllInVnd, higherPcs.equipmentCostVnd * higherPcs.epcAppliedRatePct / 100);
});

test("arbitrage saving is positive when discharge tariff exceeds charge cost", () => {
  const allocation = {
    backupReserveEnergyKwh: 0,
    pvChargedEnergyKwh: 0,
    gridChargedEnergyKwh: 100,
    peakShavingDischargeEnergyKwh: 0,
    peakShavingDischargeEnergyPerEventKwh: 0,
    peakShavingDischargeEnergyAnnualKwh: 0,
    peakShavingGridChargeEnergyAnnualKwh: 0,
    effectivePeakReductionKw: 0,
    annualPeakEventCount: 0,
    arbitrageGridChargeEnergyAnnualKwh: 100,
    arbitrageDischargeEnergyKwh: 90,
    warnings: []
  };
  const savings = calculateSavings(allocation, 1, { ...baseAssumptions, selectedObjectives: ["saving"] }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.arbitrageSavingVnd, 276_000);
});

test("dispatch allocates PV before arbitrage without exceeding capability", () => {
  const energy = calculateEnergyYears(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);

  const allocation = allocateDispatchEnergy(candidate, energy, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const dischargeTotal = allocation.pvChargedEnergyKwh + allocation.peakShavingDischargeEnergyKwh + allocation.arbitrageDischargeEnergyKwh;

  assert.ok(allocation.pvChargedEnergyKwh > 0);
  assert.ok(dischargeTotal <= energy.dischargedEnergyAcKwh + 1);
});

test("peak shaving is limited by candidate power", () => {
  const assumptions = { ...baseAssumptions, dodPct: 100, selectedObjectives: ["peak_shaving"], targetPeakReductionType: "kw" as const, targetPeakReductionValue: 1000 };
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(allocation.peakShavingDischargeEnergyKwh, 30_600);
});

test("peak shaving is limited by available energy over event duration", () => {
  const energyLimitedCandidate: GeneratedCandidate = { id: "energy-limited", powerKw: 500, energyKwh: 100, nominalDurationHours: 0.2, warnings: [] };
  const assumptions = { ...baseAssumptions, selectedObjectives: ["peak_shaving"], finalPeakDemandKw: 1000, targetPeakReductionType: "kw" as const, targetPeakReductionValue: 1000 };
  const energy = calculateEnergyYears(energyLimitedCandidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(energyLimitedCandidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(Math.round(allocation.peakShavingDischargeEnergyKwh), 15_369);
});

test("peak shaving percent target converts from peak demand", () => {
  const assumptions = { ...baseAssumptions, selectedObjectives: ["peak_shaving"], finalPeakDemandKw: 400, targetPeakReductionType: "percent" as const, targetPeakReductionValue: 10 };
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(allocation.peakShavingDischargeEnergyKwh, 14_400);
});

test("peak shaving kW target uses direct kW input", () => {
  const assumptions = { ...baseAssumptions, selectedObjectives: ["peak_shaving"], finalPeakDemandKw: 400, targetPeakReductionType: "kw" as const, targetPeakReductionValue: 50 };
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(allocation.peakShavingDischargeEnergyKwh, 18_000);
});

test("arbitrage saving is never negative and emits warning when not economic", () => {
  const assumptions: Step2Assumptions = withUnknownDemandCharge({
    ...baseAssumptions,
    offPeakPrice: 5000,
    normalPrice: 5000,
    peakPrice: 1000,
    solarCapacityKw: null,
    solarMonthlyGenerationKwh: null,
    pvSurplusRatio: 0,
    selectedObjectives: ["saving"]
  });
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const savings = calculateSavings(allocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.arbitrageSavingVnd, 0);
  assert.ok(savings.warnings.some((warning) => warning.code === "ARBITRAGE_NOT_ECONOMIC"));
});

test("demand saving uses reduced peak and demand tariff months", () => {
  const allocation = {
    backupReserveEnergyKwh: 0,
    pvChargedEnergyKwh: 0,
    gridChargedEnergyKwh: 0,
    peakShavingDischargeEnergyKwh: 18_000,
    peakShavingDischargeEnergyPerEventKwh: 100,
    peakShavingDischargeEnergyAnnualKwh: 18_000,
    peakShavingGridChargeEnergyAnnualKwh: 20_000,
    effectivePeakReductionKw: 50,
    annualPeakEventCount: 180,
    arbitrageGridChargeEnergyAnnualKwh: 0,
    arbitrageDischargeEnergyKwh: 0,
    warnings: []
  };
  const savings = calculateSavings(allocation, 1, { ...baseAssumptions, selectedObjectives: ["peak_shaving"] }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.demandSavingVnd, 90_000_000);
});

test("demand saving is zero when demand tariff is not applicable", () => {
  const assumptions = withUnknownDemandCharge(baseAssumptions);
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const savings = calculateSavings(allocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.demandSavingVnd, 0);
  assert.ok(savings.warnings.some((warning) => warning.code === "DEMAND_CHARGE_NOT_CONFIRMED"));
});

test("not applicable demand charge keeps demand saving at zero", () => {
  const assumptions = withNotApplicableDemandCharge({ ...baseAssumptions, selectedObjectives: ["peak_shaving"] });
  const savings = calculateSavings(demandSavingAllocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.demandSavingVnd, 0);
  assert.equal(savings.demandSavingIncludedInBaseNpv, false);
});

test("manual demand charge uses effective input value", () => {
  const assumptions = withManualDemandCharge({ ...baseAssumptions, selectedObjectives: ["peak_shaving"] }, 200_000);
  const savings = calculateSavings(demandSavingAllocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.demandSavingVnd, 50 * 200_000 * 12);
  assert.equal(savings.demandSavingIncludedInBaseNpv, true);
});

test("reference demand charge uses selected detailed voltage band", () => {
  const band22 = withReferenceDemandCharge({ ...baseAssumptions, selectedObjectives: ["peak_shaving"] }, "22_to_lt_110kv");
  const band6 = withReferenceDemandCharge({ ...baseAssumptions, selectedObjectives: ["peak_shaving"] }, "6_to_lt_22kv");
  const savings22 = calculateSavings(demandSavingAllocation, 1, band22, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);
  const savings6 = calculateSavings(demandSavingAllocation, 1, band6, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(band22.effectiveDemandChargeVndPerKwMonth, 235_414);
  assert.equal(band6.effectiveDemandChargeVndPerKwMonth, 240_050);
  assert.equal(savings22.demandSavingVnd, 50 * 235_414 * 12);
  assert.equal(savings6.demandSavingVnd, 50 * 240_050 * 12);
});

test("step 1 voltage auto maps demand charge from one centralized resolver", () => {
  assert.equal(resolveDemandChargeFromStep1Voltage("Hạ áp").priceVndPerKwMonth, 286_153);
  assert.equal(resolveDemandChargeFromStep1Voltage("Trung áp").priceVndPerKwMonth, 240_050);
  assert.equal(resolveDemandChargeFromStep1Voltage("Cao áp").priceVndPerKwMonth, 209_459);

  const medium = applyStep1VoltageDemandCharge({
    ...defaultQuickSizingAssumptions,
    voltageLevel: "Trung áp"
  });

  assert.equal(medium.demandChargeApplicability, "applicable");
  assert.equal(medium.demandChargeMode, "reference");
  assert.equal(medium.demandChargeSource, "step1_voltage_auto");
  assert.equal(medium.demandChargeStatus, "preliminary_reference");
  assert.equal(medium.demandChargeVoltageBand, "medium_voltage_broad_default");
  assert.equal(medium.effectiveDemandChargeVndPerKwMonth, 240_050);
  assert.equal(medium.demandSavingIncludedInBaseNpv, true);
});

test("manual demand charge updates savings without changing configured CAPEX or EPC", () => {
  const autoDemand = applyStep1VoltageDemandCharge({
    ...defaultQuickSizingAssumptions,
    powerKw: 100,
    energyKwh: 200,
    batteryCostVndPerKwh: 1_000_000,
    pcsCostVndPerKw: 500_000,
    epcMode: "manual",
    epcManualRatePct: 22,
    includeVatInCapex: false,
    finalPeakDemandKw: 400,
    voltageLevel: "Trung áp"
  });
  const customDemand = markDemandChargeUserInput(autoDemand, 260_000);
  const peakBasicInfo = {
    ...defaultQuickSizingStep1Values,
    bessObjectives: ["peak_shaving"],
    estimatedPeakDemandKw: 400,
    targetPeakReductionType: "percent" as const,
    targetPeakReductionValue: 10,
    voltageLevel: "Trung áp"
  };
  const autoStep2 = buildStep2AssumptionsForResult(autoDemand, peakBasicInfo);
  const customStep2 = buildStep2AssumptionsForResult(customDemand, peakBasicInfo);
  const autoCapex = calculateCapex(candidate, autoStep2, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const customCapex = calculateCapex(candidate, customStep2, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]).capex;
  const autoSavings = calculateSavings(demandSavingAllocation, 1, autoStep2, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);
  const customSavings = calculateSavings(demandSavingAllocation, 1, customStep2, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(customDemand.demandChargeSource, "user_input");
  assert.equal(customDemand.demandChargeStatus, "manual_unconfirmed");
  assert.equal(customDemand.effectiveDemandChargeVndPerKwMonth, 260_000);
  assert.equal(customCapex.batteryCostVnd, autoCapex.batteryCostVnd);
  assert.equal(customCapex.pcsCostVnd, autoCapex.pcsCostVnd);
  assert.equal(customCapex.epcAllInVnd, autoCapex.epcAllInVnd);
  assert.equal(customCapex.totalCapexVnd, autoCapex.totalCapexVnd);
  assert.notEqual(customSavings.demandSavingVnd, autoSavings.demandSavingVnd);
});

test("potential demand saving is not added to gross saving when applicability is unknown", () => {
  const assumptions = withUnknownDemandCharge({
    ...baseAssumptions,
    selectedObjectives: ["peak_shaving"],
    detailedVoltageBand: "6_to_lt_22kv",
    demandChargeReferenceVndPerKwMonth: 240_050
  });
  const savings = calculateSavings(demandSavingAllocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.demandSavingVnd, 0);
  assert.equal(savings.potentialDemandSavingVnd, 50 * 240_050 * 12);
  assert.equal(savings.grossSavingVnd, savings.arbitrageSavingVnd + savings.peakShavingEnergySavingVnd + savings.pvSavingVnd + savings.nonEnergyBenefitVnd);
});

test("PV shifted is limited by PV surplus", () => {
  const assumptions = {
    ...baseAssumptions,
    selectedObjectives: ["solar_optimization"],
    solarMonthlyGenerationKwh: 1000,
    pvSurplusRatio: 0.1
  };
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(allocation.pvChargedEnergyKwh, 1080);
});

test("PV shifted is limited by available discharge capacity", () => {
  const smallCandidate: GeneratedCandidate = { id: "small-pv-capacity", powerKw: 25, energyKwh: 50, nominalDurationHours: 2, warnings: [] };
  const assumptions = {
    ...baseAssumptions,
    selectedObjectives: ["solar_optimization"],
    solarMonthlyGenerationKwh: 1_000_000,
    pvSurplusRatio: 1
  };
  const energy = calculateEnergyYears(smallCandidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(smallCandidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(allocation.pvChargedEnergyKwh, energy.dischargedEnergyAcKwh);
});

test("PV and arbitrage buckets do not double count the same kWh", () => {
  const assumptions = { ...baseAssumptions, selectedObjectives: ["solar_optimization", "saving"], solarMonthlyGenerationKwh: 1000, pvSurplusRatio: 0.1 };
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(allocation.pvChargedEnergyKwh + allocation.arbitrageDischargeEnergyKwh, energy.dischargedEnergyAcKwh);
  assert.ok(allocation.gridChargedEnergyKwh <= allocation.arbitrageDischargeEnergyKwh / 0.9 + 1);
});

test("PV benefit is not calculated without PV data", () => {
  const assumptions = { ...baseAssumptions, solarCapacityKw: null, solarMonthlyGenerationKwh: null };
  const energy = calculateEnergyYears(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1])[1];
  assert.ok(energy);
  const allocation = allocateDispatchEnergy(candidate, energy, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const savings = calculateSavings(allocation, 1, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1], candidate.id);

  assert.equal(savings.pvSavingVnd, 0);
  assert.ok(savings.warnings.some((warning) => warning.code === "PV_BENEFIT_NOT_CALCULATED"));
});

test("O&M year one and growth use OM base CAPEX", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(calculateOm(capex, baseAssumptions, 1), capex.omBaseCapexVnd * 0.02);
  assert.equal(Math.round(calculateOm(capex, baseAssumptions, 2)), Math.round(capex.omBaseCapexVnd * 0.02 * 1.02));
});

test("depreciation uses straight-line schedule and stops after configured years", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(calculateDepreciation(capex, DEFAULT_RESULT_CALCULATION_CONFIG, 1), capex.depreciableCapexVnd / DEFAULT_RESULT_CALCULATION_CONFIG.finance.depreciationYears);
  assert.equal(calculateDepreciation(capex, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.finance.depreciationYears + 1), 0);
});

test("tax uses positive taxable income only", () => {
  const positive = calculateTax(200, 50, 50, 20);
  const negative = calculateTax(50, 100, 100, 20);

  assert.equal(positive.taxableIncomeVnd, 100);
  assert.equal(positive.taxVnd, 20);
  assert.equal(negative.taxVnd, 0);
});

test("cash flow year zero is negative CAPEX", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const cashFlow = calculateCashFlow(candidate, capex, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(cashFlow.yearlyResults[0]?.fcffVnd, -capex.totalCapexVnd);
  assert.equal(cashFlow.yearlyResults[0]?.cumulativeCashFlowVnd, -capex.totalCapexVnd);
});

test("loan schedule uses equal principal and declining interest", () => {
  const assumptions = { ...baseAssumptions, debtPct: 70, interestPct: 9, loanTenorYears: 7 };
  const { capex } = calculateCapex(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const { yearlyResults } = calculateCashFlow(candidate, capex, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const year0 = yearlyResults[0];
  const year1 = yearlyResults[1];
  const year2 = yearlyResults[2];
  assert.ok(year0 && year1 && year2);

  const expectedDebt = capex.totalCapexVnd * 0.7;
  assert.equal(Math.round(year0.debtDrawdownVnd), Math.round(expectedDebt));
  assert.equal(Math.round(year0.equityCashFlowVnd), Math.round(-(capex.totalCapexVnd - expectedDebt)));
  assert.equal(Math.round(year1.principalRepaymentVnd), Math.round(expectedDebt / 7));
  assert.equal(Math.round(year1.interestExpenseVnd), Math.round(expectedDebt * 0.09));
  assert.ok(year2.interestExpenseVnd < year1.interestExpenseVnd);
  assert.equal(Math.round(year1.closingDebtVnd), Math.round(year1.openingDebtVnd - year1.principalRepaymentVnd));
  assert.equal(year1.dscr, year1.cfadsVnd / year1.debtServiceVnd);
});

test("loan longer than analysis horizon is settled with balloon repayment", () => {
  const assumptions = { ...baseAssumptions, analysisYears: 5, loanTenorYears: 10 };
  const { capex } = calculateCapex(candidate, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const { yearlyResults } = calculateCashFlow(candidate, capex, assumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const finalYear = yearlyResults[5];
  assert.ok(finalYear);

  assert.ok(finalYear.balloonRepaymentVnd > 0);
  assert.equal(Math.round(finalYear.closingDebtVnd), 0);
  assert.equal(
    Math.round(finalYear.principalRepaymentVnd),
    Math.round(finalYear.scheduledPrincipalRepaymentVnd + finalYear.balloonRepaymentVnd)
  );
});

test("replacement is applied on configured replacement year", () => {
  const config: ResultCalculationConfig = {
    ...DEFAULT_RESULT_CALCULATION_CONFIG,
    finance: {
      ...DEFAULT_RESULT_CALCULATION_CONFIG.finance,
      replacementYear: 2,
      replacementRateOfInitialBatteryCost: 0.5
    }
  };
  const { capex } = calculateCapex(candidate, baseAssumptions, config, config.scenarios[1]);
  const cashFlow = calculateCashFlow(candidate, capex, baseAssumptions, config, config.scenarios[1]);

  assert.equal(cashFlow.yearlyResults[2]?.replacementVnd, capex.batteryCostVnd * 0.5);
});

test("terminal value is applied in the final analysis year", () => {
  const config: ResultCalculationConfig = {
    ...DEFAULT_RESULT_CALCULATION_CONFIG,
    finance: {
      ...DEFAULT_RESULT_CALCULATION_CONFIG.finance,
      terminalValueVnd: 10_000,
      salvageValueRate: 0.1,
      decommissioningCostVnd: 1000
    }
  };
  const assumptions = { ...baseAssumptions, analysisYears: 3 };
  const { capex } = calculateCapex(candidate, assumptions, config, config.scenarios[1]);
  const cashFlow = calculateCashFlow(candidate, capex, assumptions, config, config.scenarios[1]);

  assert.equal(cashFlow.yearlyResults[3]?.terminalValueVnd, 10_000 + capex.totalCapexVnd * 0.1 - 1000);
});

test("FCFF in operating years subtracts O&M, tax and replacement then adds terminal value", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const cashFlow = calculateCashFlow(candidate, capex, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const year1 = cashFlow.yearlyResults[1];
  assert.ok(year1);

  assert.equal(year1.fcffVnd, year1.grossSavingVnd - year1.omVnd - year1.taxVnd - year1.replacementVnd + year1.terminalValueVnd);
});

test("NPV uses FCFF and WACC", () => {
  const result = buildQuickSizingResult(baseAssumptions);
  const selected = result.recommendedOption ?? result.candidates[0];
  assert.ok(selected);

  assert.equal(Math.round(selected.npvVnd), Math.round(calculateNpv(selected.yearlyResults, baseAssumptions.waccPct)));
});

test("IRR returns a valid positive value when cash flow has a positive root", () => {
  const rows: YearlyResult[] = [
    { ...emptyYear(0), fcffVnd: -100, cumulativeCashFlowVnd: -100, discountedCashFlowVnd: -100 },
    { ...emptyYear(1), fcffVnd: 60, cumulativeCashFlowVnd: -40, discountedCashFlowVnd: 55 },
    { ...emptyYear(2), fcffVnd: 60, cumulativeCashFlowVnd: 20, discountedCashFlowVnd: 50 }
  ];

  assert.ok((calculateIrr(rows) ?? 0) > 0);
});

test("debt parameters preserve project metrics but change equity metrics", () => {
  const lowDebt = buildQuickSizingResult({ ...baseAssumptions, debtPct: 0, interestPct: 1, loanTenorYears: 5 });
  const highDebt = buildQuickSizingResult({ ...baseAssumptions, debtPct: 90, interestPct: 20, loanTenorYears: 10 });
  const lowCandidate = lowDebt.recommendedOption ?? lowDebt.candidates[0];
  const highCandidate = highDebt.recommendedOption ?? highDebt.candidates[0];
  assert.ok(lowCandidate);
  assert.ok(highCandidate);

  assert.equal(Math.round(lowCandidate.npvVnd), Math.round(highCandidate.npvVnd));
  assert.equal(Math.round(lowCandidate.irrPct ?? 0), Math.round(highCandidate.irrPct ?? 0));
  assert.notEqual(Math.round(lowCandidate.equityNpvVnd), Math.round(highCandidate.equityNpvVnd));
  assert.notEqual(Math.round(lowCandidate.equityIrrPct ?? 0), Math.round(highCandidate.equityIrrPct ?? 0));
  assert.equal(lowCandidate.debtAmountVnd, 0);
  assert.ok(highCandidate.debtAmountVnd > 0);
  assert.ok(highCandidate.totalInterestVnd > 0);
  assert.notEqual(highCandidate.minimumDscr, null);
});

test("debt ratio changes debt drawdown and initial equity", () => {
  const low = buildQuickSizingResult({ ...baseAssumptions, debtPct: 20 });
  const high = buildQuickSizingResult({ ...baseAssumptions, debtPct: 80 });
  const lowCandidate = low.recommendedOption ?? low.candidates[0];
  const highCandidate = high.recommendedOption ?? high.candidates[0];
  assert.ok(lowCandidate && highCandidate);

  assert.ok(highCandidate.debtAmountVnd > lowCandidate.debtAmountVnd);
  assert.ok(highCandidate.equityInvestmentVnd < lowCandidate.equityInvestmentVnd);
});

test("interest rate changes total interest and equity value", () => {
  const low = buildQuickSizingResult({ ...baseAssumptions, interestPct: 5 });
  const high = buildQuickSizingResult({ ...baseAssumptions, interestPct: 15 });
  const lowCandidate = low.recommendedOption ?? low.candidates[0];
  const highCandidate = high.recommendedOption ?? high.candidates[0];
  assert.ok(lowCandidate && highCandidate);

  assert.ok(highCandidate.totalInterestVnd > lowCandidate.totalInterestVnd);
  assert.notEqual(Math.round(highCandidate.equityNpvVnd), Math.round(lowCandidate.equityNpvVnd));
});

test("loan tenor changes annual principal and DSCR", () => {
  const short = buildQuickSizingResult({ ...baseAssumptions, loanTenorYears: 5 });
  const long = buildQuickSizingResult({ ...baseAssumptions, loanTenorYears: 10 });
  const shortCandidate = short.recommendedOption ?? short.candidates[0];
  const longCandidate = long.recommendedOption ?? long.candidates[0];
  assert.ok(shortCandidate && longCandidate);
  const shortYear1 = shortCandidate.yearlyResults[1];
  const longYear1 = longCandidate.yearlyResults[1];
  assert.ok(shortYear1 && longYear1);

  assert.ok(shortYear1.principalRepaymentVnd > longYear1.principalRepaymentVnd);
  assert.notEqual(shortCandidate.minimumDscr, longCandidate.minimumDscr);
});

test("IRR returns null when cash flow has no sign change", () => {
  const rows: YearlyResult[] = [
    { ...emptyYear(0), fcffVnd: -100, cumulativeCashFlowVnd: -100, discountedCashFlowVnd: -100 },
    { ...emptyYear(1), fcffVnd: -10, cumulativeCashFlowVnd: -110, discountedCashFlowVnd: -9 }
  ];

  assert.equal(calculateIrr(rows), null);
});

test("payback uses interpolation and returns null beyond horizon", () => {
  const rows: YearlyResult[] = [
    { ...emptyYear(0), fcffVnd: -100, cumulativeCashFlowVnd: -100, discountedCashFlowVnd: -100 },
    { ...emptyYear(1), fcffVnd: 40, cumulativeCashFlowVnd: -60, discountedCashFlowVnd: 36 },
    { ...emptyYear(2), fcffVnd: 80, cumulativeCashFlowVnd: 20, discountedCashFlowVnd: 66 }
  ];

  assert.equal(calculatePayback(rows), 1.75);
  assert.equal(calculatePayback(rows.slice(0, 2)), null);
});

test("payback rejects impossible values larger than the crossing year", () => {
  const rows: YearlyResult[] = [
    { ...emptyYear(0), fcffVnd: -4_233_326_000, cumulativeCashFlowVnd: -4_233_326_000, discountedCashFlowVnd: -4_233_326_000 },
    { ...emptyYear(1), fcffVnd: 1, cumulativeCashFlowVnd: 0, discountedCashFlowVnd: 1 }
  ];

  assert.equal(calculatePayback(rows), null);
});

test("cumulative cash flow accumulates FCFF year by year", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const { yearlyResults } = calculateCashFlow(candidate, capex, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(yearlyResults[2]?.cumulativeCashFlowVnd, (yearlyResults[1]?.cumulativeCashFlowVnd ?? 0) + (yearlyResults[2]?.fcffVnd ?? 0));
});

test("discounted cash flow uses WACC for each operating year", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const { yearlyResults } = calculateCashFlow(candidate, capex, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const year1 = yearlyResults[1];
  assert.ok(year1);

  assert.equal(Math.round(year1.discountedCashFlowVnd), Math.round(year1.fcffVnd / 1.1));
});

test("budget gap and slightly over threshold are calculated", () => {
  const evaluation = calculateBudgetEvaluation(110, 100, DEFAULT_RESULT_CALCULATION_CONFIG);

  assert.equal(evaluation.budgetGapVnd, 10);
  assert.equal(evaluation.overrunPercent, 0.1);
  assert.equal(evaluation.status, "slightly_over");
});

test("budget handles undefined budget without divide by zero", () => {
  const result = buildQuickSizingResult({ ...baseAssumptions, budgetMax: null });

  assert.equal(result.recommendedOption?.budgetEvaluation.status, "not_defined");
  assert.equal(result.recommendedOption?.budgetEvaluation.overrunPercent, null);
});

test("Pareto marks dominated candidates", () => {
  const result = buildQuickSizingResult(baseAssumptions);
  const marked = markParetoCandidates(result.candidates);
  const points = buildParetoPoints(marked, result.recommendedOption?.id);

  assert.ok(points.some((point) => point.isPareto));
  assert.ok(points.some((point) => !point.isPareto));
});

test("Pareto dominance uses epsilon for near-equal values", () => {
  const result = buildQuickSizingResult(baseAssumptions);
  const seed = result.candidates[0];
  assert.ok(seed);
  const nearEqual: SizingCandidateResult[] = [
    { ...seed, id: "near-a", netOperatingSavingYear1Vnd: 100, npvPerCapex: 1 },
    { ...seed, id: "near-b", netOperatingSavingYear1Vnd: 100 + 1e-10, npvPerCapex: 1 + 1e-10 }
  ];
  const marked = markParetoCandidates(nearEqual);

  assert.ok(marked.every((item) => item.isPareto));
});

test("recommendation score is assigned to eligible candidates", () => {
  const result = buildQuickSizingResult(baseAssumptions);

  assert.ok(result.candidates.some((item) => typeof item.recommendationScore === "number"));
  assert.equal(result.recommendedOption?.recommendationScore, Math.max(...result.candidates.map((item) => item.recommendationScore ?? -Infinity)));
});

test("candidate over budget receives recommendation score penalty", () => {
  const result = buildQuickSizingResult(baseAssumptions);
  const seed = result.candidates[0];
  assert.ok(seed);
  const withinBudget: SizingCandidateResult = {
    ...seed,
    id: "within-budget",
    npvVnd: 100,
    irrPct: 15,
    paybackYears: 5,
    meetsPeakReductionTarget: true,
    warnings: [],
    budgetEvaluation: { budgetMaxVnd: 100, budgetGapVnd: -10, overrunPercent: 0, status: "within_budget" }
  };
  const overBudget: SizingCandidateResult = {
    ...withinBudget,
    id: "over-budget",
    budgetEvaluation: { budgetMaxVnd: 100, budgetGapVnd: 50, overrunPercent: 0.5, status: "materially_over" }
  };
  const scored = scoreCandidates([withinBudget, overBudget], baseAssumptions, { score: 100, level: "high", reasons: [] }, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.equal(scored.find((item) => item.id === "over-budget")?.recommendationScore, null);
  assert.equal(typeof scored.find((item) => item.id === "within-budget")?.recommendationScore, "number");
});

test("recommendation scoring assigns three distinct representative options", () => {
  const result = buildQuickSizingResult(baseAssumptions);
  const confidence = calculateConfidence(baseAssumptions, { bessObjectives: baseAssumptions.selectedObjectives }, result.warnings, DEFAULT_RESULT_CALCULATION_CONFIG);
  const scored = scoreCandidates(result.candidates, baseAssumptions, confidence, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const options = selectRepresentativeOptions(scored);
  const ids = new Set([options.lowCostOption?.id, options.recommendedOption?.id, options.highBenefitOption?.id].filter(Boolean));

  assert.equal(ids.size, 3);
});

test("scenario ranges are calculated from actual scenarios", () => {
  const result = buildQuickSizingResult(baseAssumptions);

  assert.notEqual(result.scenarioRanges.npvVnd.min, null);
  assert.notEqual(result.scenarioRanges.npvVnd.max, null);
  assert.ok((result.scenarioRanges.capexVnd.max ?? 0) >= (result.scenarioRanges.capexVnd.min ?? 0));
});

test("scenario payback range is null when no scenario pays back inside horizon", () => {
  const result = buildQuickSizingResult(withUnknownDemandCharge({
    ...baseAssumptions,
    powerKw: 50,
    energyKwh: 150,
    batteryCostPerKwh: 7_500_000,
    pcsCostPerKw: 4_000_000,
    epcMode: "manual",
    epcManualRatePct: 30,
    solarCapacityKw: null,
    solarMonthlyGenerationKwh: null,
    selectedObjectives: ["saving"],
    offPeakPrice: 1000,
    normalPrice: 1000,
    peakPrice: 1000
  }));

  assert.equal(result.scenarioRanges.paybackYears.min, null);
  assert.equal(result.scenarioRanges.paybackYears.max, null);
});

test("confidence score returns level and reasons", () => {
  const result = buildQuickSizingResult({ ...baseAssumptions, finalPeakDemandKw: null, solarCapacityKw: null, solarMonthlyGenerationKwh: null });

  assert.ok(result.confidence.score < 100);
  assert.ok(result.confidence.reasons.length > 0);
});

test("fallback cost model emits preliminary warnings", () => {
  const result = buildQuickSizingResult({
    ...baseAssumptions,
    costModelStatus: "preliminary",
    costModelSourceName: "frontend_fallback",
    costCatalogVersion: "equipment-cost-catalog-preliminary-v1"
  });

  assert.ok(result.warnings.some((warning) => warning.code === "COST_MODEL_PRELIMINARY"));
  assert.ok(result.warnings.some((warning) => warning.code === "COST_MODEL_FALLBACK"));
});

test("scenario preset preserves backend cost model", () => {
  const current: QuickSizingAssumptions = {
    ...defaultQuickSizingAssumptions,
    costCatalogVersion: "backend-cost-v1",
    costModelStatus: "confirmed",
    costModelSourceName: "backend",
    batteryCostMetadata: {
      ...defaultQuickSizingAssumptions.batteryCostMetadata,
      status: "confirmed",
      source: "backend",
      catalogVersion: "backend-cost-v1"
    },
    pcsCostMetadata: {
      ...defaultQuickSizingAssumptions.pcsCostMetadata,
      status: "confirmed",
      source: "backend",
      catalogVersion: "backend-cost-v1"
    },
    epcRateBands: [
      { minEquipmentCostVnd: 0, maxEquipmentCostVnd: null, ratePct: 17 }
    ],
    epcVoltageAdjustmentsPct: { "Trung áp": 3 },
    voltageLevel: "Trung áp"
  };
  const next = applyScenarioPreset("optimistic", current);

  assert.equal(next.costCatalogVersion, "backend-cost-v1");
  assert.equal(next.costModelStatus, "confirmed");
  assert.deepEqual(next.epcRateBands, current.epcRateBands);
  assert.equal(next.batteryCostVndPerKwh, 2_400_000);
  assert.equal(next.pcsCostVndPerKw, 1_100_000);
  assert.equal(next.batteryCostMetadata.catalogVersion, "backend-cost-v1");
  assert.equal(next.pcsCostMetadata.source, "backend");
});

test("scenario presets apply direct equipment catalog values", () => {
  const base = applyScenarioPreset("default", defaultQuickSizingAssumptions);
  const optimistic = applyScenarioPreset("optimistic", defaultQuickSizingAssumptions);
  const conservative = applyScenarioPreset("conservative", defaultQuickSizingAssumptions);

  assert.equal(base.batteryCostVndPerKwh, 3_000_000);
  assert.equal(base.pcsCostVndPerKw, 1_500_000);
  assert.equal(optimistic.batteryCostVndPerKwh, 2_400_000);
  assert.equal(optimistic.pcsCostVndPerKw, 1_100_000);
  assert.equal(conservative.batteryCostVndPerKwh, 3_600_000);
  assert.equal(conservative.pcsCostVndPerKw, 2_000_000);
});

test("persist migration replaces legacy default equipment costs", () => {
  const migrated = migrateQuickSizingPersistedData({
    assumptions: {
      ...defaultQuickSizingAssumptions,
      batteryCostVndPerKwh: 6_000_000,
      pcsCostVndPerKw: 2_000_000
    },
    dirtyFields: [],
    scenario: "default"
  });

  assert.equal(migrated.assumptions.batteryCostVndPerKwh, 3_000_000);
  assert.equal(migrated.assumptions.pcsCostVndPerKw, 1_500_000);
  assert.equal(migrated.scenario, "default");
  assert.deepEqual(migrated.dirtyFields, []);
});

test("persist migration preserves user custom equipment costs", () => {
  const migrated = migrateQuickSizingPersistedData({
    assumptions: {
      ...defaultQuickSizingAssumptions,
      batteryCostVndPerKwh: 4_200_000,
      pcsCostVndPerKw: 1_900_000
    },
    dirtyFields: ["batteryCostVndPerKwh", "pcsCostVndPerKw"],
    scenario: "custom"
  });

  assert.equal(migrated.assumptions.batteryCostVndPerKwh, 4_200_000);
  assert.equal(migrated.assumptions.pcsCostVndPerKw, 1_900_000);
  assert.equal(migrated.assumptions.batteryCostMetadata.source, "user_input");
  assert.equal(migrated.assumptions.pcsCostMetadata.source, "user_input");
  assert.equal(migrated.scenario, "custom");
});

test("persist migration auto maps legacy demand price unless dirty", () => {
  const unconfirmed = migrateQuickSizingPersistedData({
    basicInfo: { ...defaultQuickSizingStep1Values, voltageLevel: "Trung áp" },
    assumptions: {
      ...defaultQuickSizingAssumptions,
      voltageLevel: "Trung áp",
      demandPrice: 240_050
    },
    dirtyFields: [],
    scenario: "default"
  });
  const dirty = migrateQuickSizingPersistedData({
    assumptions: {
      ...defaultQuickSizingAssumptions,
      demandPrice: 240_050
    },
    dirtyFields: ["demandPrice"],
    scenario: "custom"
  });

  assert.equal(unconfirmed.assumptions.demandChargeApplicability, "applicable");
  assert.equal(unconfirmed.assumptions.demandChargeInputVndPerKwMonth, null);
  assert.equal(unconfirmed.assumptions.effectiveDemandChargeVndPerKwMonth, 240_050);
  assert.equal(unconfirmed.assumptions.demandChargeSource, "step1_voltage_auto");
  assert.equal(unconfirmed.assumptions.demandChargeStatus, "preliminary_reference");
  assert.equal(dirty.assumptions.demandChargeApplicability, "applicable");
  assert.equal(dirty.assumptions.demandChargeMode, "manual");
  assert.equal(dirty.assumptions.effectiveDemandChargeVndPerKwMonth, 240_050);
  assert.equal(dirty.assumptions.demandChargeSource, "user_input");
});

test("assumption UI exposes equipment scope and preliminary warning", () => {
  const source = readFileSync("features/quick-sizing/components/quick-sizing-assumption-flow.tsx", "utf8");

  assert.match(source, /Chi phí hệ thống pin DC/);
  assert.match(source, /Chi phí thiết bị PCS/);
  assert.match(source, /VND\/kWh danh định/);
  assert.match(source, /VND\/kW AC/);
  assert.match(source, /Các đơn giá đang là ước tính sơ bộ/);
  assert.match(source, /scopeIncluded/);
  assert.match(source, /scopeExcluded/);
  assert.match(source, /Phạm vi đơn giá gồm những gì/);
  assert.match(source, /Tỷ lệ EPC tổng hợp/);
  assert.match(source, /EPC tổng hợp/);
  assert.match(source, /Xem chi tiết EPC/);
  assert.match(source, /Xem nguồn và trạng thái/);
  assert.match(source, /Giá công suất/);
  assert.match(source, /Khôi phục theo cấp điện áp/);
  assert.match(source, /step1_voltage_auto/);
  assert.match(source, /calculateBaseAssumptionCapex/);
  assert.equal(source.includes("Cấp điện áp chi tiết"), false);
  assert.equal(source.includes("demandPrice"), false);
  assert.equal(source.includes("financialPreviewOption?.capex"), false);
  assert.equal(source.includes("Candidate ID"), false);
  assert.equal(source.includes("AC khả dụng/event"), false);
  assert.equal(source.includes("MetricLine"), false);
  assert.equal(source.includes("Biểu giá chính thức"), false);
  assert.equal(source.includes(`giả định ${"place"}${"holder"}`), false);
});

test("backend mapper maps EPC all-in cost model", () => {
  const tariff = {
    customer_group: "industrial",
    voltage_level: "Trung áp",
    tariff_plan_code: "industrial:Trung áp",
    currency: "VND",
    low_price: 1000,
    normal_price: 2000,
    peak_price: 3000,
    demand_charge_per_kw: 0,
    demand_charge_applicability: "applicable" as const,
    demand_charge_mode: "reference" as const,
    detailed_voltage_band: "22_to_lt_110kv" as const,
    demand_charge_input_vnd_per_kw_month: null,
    demand_charge_reference_vnd_per_kw_month: 235_414,
    effective_demand_charge_vnd_per_kw_month: 235_414,
    demand_charge_status: "trial_reference",
    demand_charge_source: "evn_trial_reference",
    demand_charge_catalog_version: "evn-two-component-tariff-paper-pilot-2025-v1",
    demand_charge_evidence_note: null,
    demand_charge_reference_bands: [
      {
        code: "22_to_lt_110kv" as const,
        label: "22 kV <= U < 110 kV",
        min_voltage_kv: 22,
        max_voltage_kv: 110,
        price_vnd_per_kw_month: 235_414,
        status: "trial_reference",
        source_name: "EVN two-component retail tariff paper pilot",
        source_date: null,
        notes: ["Trial paper reference"]
      }
    ],
    demand_saving_included_in_base_npv: true,
    vat_pct: 8,
    confidence: "preliminary",
    source: "lookup",
    config_version: "tariff-v1"
  };
  const apiResult: QuickSizingStep2Result = {
    normalized_input: { solar_capacity_kw: 100, solar_monthly_generation_kwh: 12_000 },
    inherited_data: {},
    load_estimation: {
      monthly_electricity_kwh: 1000,
      operating_days_per_year: 300,
      operating_days_per_month: 25,
      operating_hours_per_month: 450,
      operating_hours_per_year: 5400,
      average_power_kw: 100,
      calculated_peak_demand_kw: 200,
      final_peak_demand_kw: 200,
      load_factor: 0.5,
      tariff_average: 2000,
      bill_energy: 2_000_000,
      tou_shares: { low: 0.2, normal: 0.5, peak: 0.3, source: "lookup", config_version: "tou-v1" },
      tariff_plan: tariff
    },
    objective_sizing: [],
    technical_assumptions: {
      power_kw: 400,
      energy_kwh: 800,
      duration_hours: 2,
      usable_energy_kwh: 720,
      dod_pct: 90,
      rte_pct: 90,
      degradation_pct: 2,
      cycles_per_day: 1,
      operating_days_per_year: 300,
      power_margin_pct: 10,
      energy_margin_pct: 10,
      backup_reserve_policy: "shared"
    },
    cost_assumptions: {
      battery_cost: 2_400_000_000,
      battery_unit_cost: {
        value: 3_000_000,
        unit: "VND/kWh nominal",
        status: "preliminary",
        source: "backend",
        scope_included: ["Cell pin", "Battery Management System - BMS"],
        scope_excluded: ["PCS", "EPC ngoài hiện trường"],
        notes: ["Ước tính sơ bộ."],
        catalog_version: "equipment-cost-catalog-preliminary-v1",
        scenario_values: { optimistic: 2_400_000, base: 3_000_000, conservative: 3_600_000 }
      },
      pcs_cost: 600_000_000,
      pcs_unit_cost: {
        value: 1_500_000,
        unit: "VND/kW AC",
        status: "preliminary",
        source: "backend",
        scope_included: ["Bộ biến đổi công suất hai chiều"],
        scope_excluded: ["Máy biến áp", "EPC"],
        notes: ["Ước tính sơ bộ."],
        catalog_version: "equipment-cost-catalog-preliminary-v1",
        scenario_values: { optimistic: 1_100_000, base: 1_500_000, conservative: 2_000_000 }
      },
      equipment_cost: 3_000_000_000,
      epc_base_rate_pct: 22,
      epc_voltage_adjustment_pct: 2,
      epc_applied_rate_pct: 24,
      epc_all_in_cost: 720_000_000,
      epc_scope_items: ["BOS", "EMS cơ bản"],
      epc_rate_bands: [{ min_equipment_cost: 0, max_equipment_cost: null, rate_pct: 22 }],
      epc_voltage_adjustments_pct: { "Trung áp": 2 },
      epc_min_rate_pct: 8,
      epc_max_rate_pct: 30,
      epc_mode: "auto",
      epc_manual_rate_pct: null,
      include_vat_in_capex: false,
      vat_amount: 0,
      capex_excluding_vat: 3_720_000_000,
      total_capex: 3_720_000_000,
      first_year_om: 74_400_000,
      currency: "VND",
      cost_model_status: "preliminary",
      cost_catalog_version: "equipment-cost-catalog-preliminary-v1",
      cost_model_source_name: "backend"
    },
    tariff_assumptions: tariff,
    financial_assumptions: {
      price_escalation_pct: 5,
      debt_pct: 70,
      interest_pct: 9,
      loan_tenor_years: 7,
      wacc_pct: 10,
      tax_pct: 20,
      analysis_years: 10,
      source: "scenario_default",
      config_version: "finance-v1"
    },
    budget_evaluation: {
      budget_max: null,
      technical_capex: 3_720_000_000,
      budget_gap: null,
      overrun_pct: null,
      status: "unbounded",
      technical_option: { power_kw: 400, energy_kwh: 800, duration_hours: 2, capex: 3_720_000_000, feasible: true },
      budget_option: null,
      currency: "VND"
    },
    warnings: [],
    calculation_trace: [],
    config_versions: { cost_catalog: "equipment-cost-catalog-preliminary-v1" },
    derived_values: {}
  };
  const assumptions = assumptionsFromStep2Result(apiResult);

  assert.equal(assumptions.costCatalogVersion, "equipment-cost-catalog-preliminary-v1");
  assert.equal(assumptions.costModelSourceName, "backend");
  assert.equal(assumptions.epcRateBands[0]?.ratePct, 22);
  assert.deepEqual(assumptions.epcScopeItems, ["BOS", "EMS cơ bản"]);
  assert.equal(assumptions.includeVatInCapex, false);
  assert.equal(assumptions.voltageLevel, "Trung áp");
  assert.equal(assumptions.batteryCostVndPerKwh, 3_000_000);
  assert.equal(assumptions.pcsCostVndPerKw, 1_500_000);
  assert.equal(assumptions.batteryCostMetadata.source, "backend");
  assert.deepEqual(assumptions.batteryCostMetadata.scopeIncluded, ["Cell pin", "Battery Management System - BMS"]);
  assert.equal(assumptions.pcsCostMetadata.catalogVersion, "equipment-cost-catalog-preliminary-v1");
  assert.equal(assumptions.demandChargeApplicability, "applicable");
  assert.equal(assumptions.demandChargeMode, "reference");
  assert.equal(assumptions.detailedVoltageBand, "unknown");
  assert.equal(assumptions.effectiveDemandChargeVndPerKwMonth, 240_050);
  assert.equal(assumptions.demandChargeSource, "step1_voltage_auto");
  assert.equal(assumptions.demandChargeStatus, "preliminary_reference");
  assert.equal(assumptions.demandChargeVoltageBand, "medium_voltage_broad_default");
  assert.equal(assumptions.demandChargeReferenceBands[0]?.priceVndPerKwMonth, 235_414);
  assert.equal(assumptions.demandSavingIncludedInBaseNpv, true);
});

test("CAPEX trace exposes equipment unit cost metadata", () => {
  const result = buildQuickSizingResult(baseAssumptions);
  const capexTrace = result.calculationTrace.find((trace) => trace.formulaId === "F13");

  assert.ok(capexTrace);
  assert.equal(capexTrace.inputs.batteryUnitCostSource, "unit_test");
  assert.equal(capexTrace.inputs.pcsUnitCostSource, "unit_test");
  assert.equal(capexTrace.inputs.batteryUnitCostStatus, "confirmed");
  assert.equal(capexTrace.inputs.batteryUnitCostCatalogVersion, "test-cost-model-v1");
  assert.equal(capexTrace.inputs.batteryUserOverride, false);
  assert.ok(typeof capexTrace.output === "object" && capexTrace.output !== null && !Array.isArray(capexTrace.output));
  assert.match(String(capexTrace.output.batteryCostFormula), /Battery|kWh|VND/);
  assert.equal(typeof capexTrace.output.capexExcludingVatVnd, "number");
});

test("invalid assumptions produce blocking warnings and no valid candidate", () => {
  const result = buildQuickSizingResult({ ...baseAssumptions, powerKw: 0 });

  assert.ok(result.warnings.some((warning) => warning.code === "INVALID_POWER" && warning.blocking));
  assert.ok(result.warnings.some((warning) => warning.code === "NO_VALID_CANDIDATE"));
  assert.equal(result.candidates.length, 0);
});

test("backup and power quality objectives are not monetized without input data", () => {
  const result = buildQuickSizingResult({ ...baseAssumptions, selectedObjectives: ["backup", "power_quality"] });

  assert.ok(result.warnings.some((warning) => warning.code === "BACKUP_BENEFIT_NOT_MONETIZED"));
  assert.ok(result.warnings.some((warning) => warning.code === "POWER_QUALITY_BENEFIT_NOT_MONETIZED"));
});

test("LCOS is calculated when discharged energy exists", () => {
  const { capex } = calculateCapex(candidate, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);
  const cashFlow = calculateCashFlow(candidate, capex, baseAssumptions, DEFAULT_RESULT_CALCULATION_CONFIG, DEFAULT_RESULT_CALCULATION_CONFIG.scenarios[1]);

  assert.ok((calculateLcos(capex, cashFlow.yearlyResults, baseAssumptions) ?? 0) > 0);
});

test("UI adapter returns the same recommended metrics as the result engine", () => {
  const uiAssumptions: QuickSizingAssumptions = {
    ...defaultQuickSizingAssumptions,
    powerKw: baseAssumptions.powerKw,
    energyKwh: baseAssumptions.energyKwh,
    dodPct: baseAssumptions.dodPct,
    rtePct: baseAssumptions.rtePct,
    degradationPct: baseAssumptions.degradationPct,
    cyclesPerDay: baseAssumptions.cyclesPerDay,
    operatingDaysPerYear: baseAssumptions.operatingDaysPerYear,
    batteryCostVndPerKwh: baseAssumptions.batteryCostPerKwh,
    batteryCostMetadata: baseAssumptions.batteryCostMetadata,
    pcsCostVndPerKw: baseAssumptions.pcsCostPerKw,
    pcsCostMetadata: baseAssumptions.pcsCostMetadata,
    epcMode: baseAssumptions.epcMode,
    epcManualRatePct: baseAssumptions.epcManualRatePct,
    epcRateBands: baseAssumptions.epcRateBands,
    epcVoltageAdjustmentsPct: baseAssumptions.epcVoltageAdjustmentsPct,
    epcMinRatePct: baseAssumptions.epcMinRatePct,
    epcMaxRatePct: baseAssumptions.epcMaxRatePct,
    epcScopeItems: baseAssumptions.epcScopeItems,
    costModelStatus: baseAssumptions.costModelStatus,
    costCatalogVersion: baseAssumptions.costCatalogVersion,
    costModelSourceName: baseAssumptions.costModelSourceName,
    voltageLevel: baseAssumptions.voltageLevel,
    includeVatInCapex: baseAssumptions.includeVatInCapex,
    omPct: baseAssumptions.omPct,
    omGrowthPct: baseAssumptions.omGrowthPct,
    offPeakPrice: baseAssumptions.offPeakPrice,
    normalPrice: baseAssumptions.normalPrice,
    peakPrice: baseAssumptions.peakPrice,
    demandChargeApplicability: baseAssumptions.demandChargeApplicability,
    demandChargeMode: baseAssumptions.demandChargeMode,
    detailedVoltageBand: baseAssumptions.detailedVoltageBand,
    demandChargeInputVndPerKwMonth: baseAssumptions.demandChargeInputVndPerKwMonth,
    demandChargeReferenceVndPerKwMonth: baseAssumptions.demandChargeReferenceVndPerKwMonth,
    effectiveDemandChargeVndPerKwMonth: baseAssumptions.effectiveDemandChargeVndPerKwMonth,
    demandChargeStatus: baseAssumptions.demandChargeStatus,
    demandChargeSource: baseAssumptions.demandChargeSource,
    demandChargeCatalogVersion: baseAssumptions.demandChargeCatalogVersion,
    demandChargeEvidenceNote: baseAssumptions.demandChargeEvidenceNote,
    demandChargeReferenceBands: baseAssumptions.demandChargeReferenceBands,
    demandSavingIncludedInBaseNpv: baseAssumptions.demandSavingIncludedInBaseNpv,
    priceEscalationPct: baseAssumptions.priceEscalationPct,
    debtPct: baseAssumptions.debtPct,
    interestPct: baseAssumptions.interestPct,
    loanTenorYears: baseAssumptions.loanTenorYears,
    waccPct: baseAssumptions.waccPct,
    taxPct: baseAssumptions.taxPct,
    analysisYears: baseAssumptions.analysisYears,
    budgetMaxVnd: baseAssumptions.budgetMax ?? null,
    finalPeakDemandKw: baseAssumptions.finalPeakDemandKw ?? null,
    solarCapacityKw: baseAssumptions.solarCapacityKw ?? null,
    solarMonthlyGenerationKwh: baseAssumptions.solarMonthlyGenerationKwh ?? null,
    pvSurplusRatio: baseAssumptions.pvSurplusRatio ?? null,
    touShareLow: baseAssumptions.touShares?.low ?? defaultQuickSizingAssumptions.touShareLow,
    touShareNormal: baseAssumptions.touShares?.normal ?? defaultQuickSizingAssumptions.touShareNormal,
    touSharePeak: baseAssumptions.touShares?.peak ?? defaultQuickSizingAssumptions.touSharePeak
  };
  const basicInfo = {
    ...defaultQuickSizingStep1Values,
    bessObjectives: baseAssumptions.selectedObjectives ?? [],
    estimatedPeakDemandKw: baseAssumptions.finalPeakDemandKw ?? null,
    targetPeakReductionType: baseAssumptions.targetPeakReductionType ?? defaultQuickSizingStep1Values.targetPeakReductionType,
    targetPeakReductionValue: baseAssumptions.targetPeakReductionValue ?? null,
    solarStatus: "yes" as const,
    solarCapacityValue: baseAssumptions.solarCapacityKw ?? null,
    solarCapacityUnit: "kWp",
    solarMonthlyGenerationValue: baseAssumptions.solarMonthlyGenerationKwh ?? null,
    solarMonthlyGenerationUnit: "kWh/tháng",
    budgetRange: "Nhập ngân sách tùy chỉnh",
    customBudgetVnd: baseAssumptions.budgetMax ?? null
  };
  const result = buildQuickSizingResultFromAssumptions(uiAssumptions, basicInfo);
  const metrics = calculateQuickSizingMetrics(uiAssumptions, basicInfo);
  const candidateMetrics = calculateQuickSizingCandidateMetrics(uiAssumptions, basicInfo);
  const options = buildSizingOptions(uiAssumptions, basicInfo);

  assert.equal(metrics.powerKw, uiAssumptions.powerKw);
  assert.equal(metrics.energyKwh, uiAssumptions.energyKwh);
  assert.equal(metrics.capexVnd, 0);
  assert.equal(candidateMetrics.capexVnd, result.recommendedOption?.capex.totalCapexVnd);
  assert.equal(options.length, 3);
  assert.deepEqual(new Set(options.map((option) => option.id)), new Set(["low", "recommended", "high"]));
});

test("output contract contains candidates, pareto, options, warnings and trace", () => {
  const result = buildQuickSizingResult(baseAssumptions);

  assert.ok(result.candidates.length >= 10);
  assert.equal(result.paretoPoints.length, result.candidates.length);
  assert.ok(result.lowCostOption);
  assert.ok(result.recommendedOption);
  assert.ok(result.highBenefitOption);
  assert.ok(result.calculationTrace.some((trace) => trace.formulaId === "F18"));
  assert.ok(result.calculationTrace.some((trace) => trace.formulaId === "F16-DEMAND"));
  assert.ok(result.calculationTrace.some((trace) => trace.formulaId === "F17-FINANCING"));
});

function emptyYear(year: number): YearlyResult {
  return {
    year,
    availableCapacityKwh: 0,
    dischargedEnergyAcKwh: 0,
    chargedEnergyAcKwh: 0,
    backupReserveEnergyKwh: 0,
    pvChargedEnergyKwh: 0,
    gridChargedEnergyKwh: 0,
    peakShavingDischargeEnergyKwh: 0,
    peakShavingDischargeEnergyPerEventKwh: 0,
    peakShavingDischargeEnergyAnnualKwh: 0,
    peakShavingGridChargeEnergyAnnualKwh: 0,
    effectivePeakReductionKw: 0,
    annualPeakEventCount: 0,
    arbitrageGridChargeEnergyAnnualKwh: 0,
    arbitrageDischargeEnergyKwh: 0,
    arbitrageSavingVnd: 0,
    peakShavingAvoidedEnergyCostVnd: 0,
    peakShavingChargingCostVnd: 0,
    peakShavingEnergySavingVnd: 0,
    demandSavingVnd: 0,
    potentialDemandSavingVnd: 0,
    demandSavingIncludedInBaseNpv: false,
    pvSavingVnd: 0,
    nonEnergyBenefitVnd: 0,
    grossSavingVnd: 0,
    omVnd: 0,
    depreciationVnd: 0,
    taxableIncomeVnd: 0,
    taxVnd: 0,
    replacementVnd: 0,
    terminalValueVnd: 0,
    chargingCostVnd: 0,
    debtDrawdownVnd: 0,
    openingDebtVnd: 0,
    scheduledPrincipalRepaymentVnd: 0,
    balloonRepaymentVnd: 0,
    principalRepaymentVnd: 0,
    interestExpenseVnd: 0,
    debtServiceVnd: 0,
    closingDebtVnd: 0,
    taxAfterInterestVnd: 0,
    interestTaxShieldVnd: 0,
    cfadsVnd: 0,
    dscr: null,
    equityCashFlowVnd: 0,
    cumulativeEquityCashFlowVnd: 0,
    discountedEquityCashFlowVnd: 0,
    fcffVnd: 0,
    cumulativeCashFlowVnd: 0,
    discountedCashFlowVnd: 0
  };
}
