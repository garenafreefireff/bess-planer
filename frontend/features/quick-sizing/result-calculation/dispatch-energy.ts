import { normalizePercent, safeDiv } from "./math";
import { createWarning } from "./validation";
import type {
  DispatchAllocation,
  EnergyYearResult,
  GeneratedCandidate,
  ResultCalculationConfig,
  ResultScenarioConfig,
  Step2Assumptions
} from "./types";

function getTargetPeakReductionKw(assumptions: Step2Assumptions, peakDemandKw: number) {
  const value = assumptions.targetPeakReductionValue ?? 0;
  if (value <= 0) {
    return 0;
  }

  if (assumptions.targetPeakReductionType === "percent") {
    return peakDemandKw * normalizePercent(value);
  }

  return value;
}

function annualPvSurplusKwh(assumptions: Step2Assumptions, config: ResultCalculationConfig, scenario: ResultScenarioConfig) {
  const hasPvObjective = (assumptions.selectedObjectives ?? []).includes("solar_optimization");
  if (!hasPvObjective) {
    return 0;
  }

  const monthlyGeneration = assumptions.solarMonthlyGenerationKwh
    ?? (assumptions.solarCapacityKw ? assumptions.solarCapacityKw * 120 : 0);
  if (monthlyGeneration <= 0) {
    return 0;
  }

  const surplusRatio = assumptions.pvSurplusRatio ?? config.dispatch.defaultPvSurplusRatio;
  return monthlyGeneration * 12 * surplusRatio * scenario.pvRealizationFactor;
}

function emptyAllocation(): DispatchAllocation {
  return {
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
    warnings: []
  };
}

function evaluatePeakShavingDispatch(
  candidate: GeneratedCandidate,
  year: EnergyYearResult,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig,
  rte: number
) {
  const hasPeakShaving = (assumptions.selectedObjectives ?? []).includes("peak_shaving");
  if (!hasPeakShaving || year.year === 0) {
    return {
      perEventDischargeKwh: 0,
      annualDischargeKwh: 0,
      annualGridChargeKwh: 0,
      effectivePeakReductionKw: 0,
      annualPeakEventCount: 0,
      warnings: []
    };
  }

  const peakEventDurationHours = assumptions.peakEventDurationHours || config.dispatch.defaultPeakEventDurationHours;
  const peakEventFrequencyPerOperatingDay = Math.max(
    0,
    assumptions.peakEventFrequencyPerOperatingDay ?? config.dispatch.defaultPeakEventFrequencyPerOperatingDay
  );
  const annualPeakEventCount = assumptions.operatingDaysPerYear * peakEventFrequencyPerOperatingDay;
  const peakDemandKw = assumptions.finalPeakDemandKw ?? Math.max(assumptions.powerKw, candidate.powerKw);
  const targetPeakReductionKw = getTargetPeakReductionKw(assumptions, peakDemandKw);
  const etaDischarge = Math.sqrt(rte);
  const usableAcEnergyPerEventKwh = year.usableBatteryEnergyDcKwh * etaDischarge;
  const energyLimitedPeakReductionKw = safeDiv(usableAcEnergyPerEventKwh, peakEventDurationHours);
  const powerLimitedPeakReductionKw = candidate.powerKw * scenario.peakShavingRealizationFactor;
  const effectivePeakReductionKw = Math.max(
    0,
    Math.min(
      targetPeakReductionKw,
      powerLimitedPeakReductionKw,
      energyLimitedPeakReductionKw,
      peakDemandKw
    )
  );
  const perEventDischargeKwh = effectivePeakReductionKw * peakEventDurationHours;
  const annualDischargeKwh = perEventDischargeKwh * annualPeakEventCount;
  const annualGridChargeKwh = rte > 0 ? annualDischargeKwh / rte : 0;
  const warnings = [];

  if (perEventDischargeKwh - usableAcEnergyPerEventKwh > 1) {
    warnings.push(
      createWarning("PEAK_EVENT_ENERGY_EXCEEDED", "Peak event discharge exceeds usable AC energy for the candidate.", {
        candidateId: candidate.id,
        field: "peakShavingDischargeEnergyPerEventKwh"
      })
    );
  }

  return {
    perEventDischargeKwh,
    annualDischargeKwh,
    annualGridChargeKwh,
    effectivePeakReductionKw,
    annualPeakEventCount,
    warnings
  };
}

export function allocateDispatchEnergy(
  candidate: GeneratedCandidate,
  year: EnergyYearResult,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig
): DispatchAllocation {
  if (year.year === 0) {
    return emptyAllocation();
  }

  const warnings = [];
  const rte = normalizePercent(Math.min(100, Math.max(1, assumptions.rtePct + scenario.rteDeltaPct)));
  const hasBackup = (assumptions.selectedObjectives ?? []).includes("backup");
  const backupReserveEnergyKwh = hasBackup ? year.usableBatteryEnergyDcKwh * config.dispatch.backupReserveRatioOfEnergy : 0;
  const peakDispatch = evaluatePeakShavingDispatch(candidate, year, assumptions, config, scenario, rte);
  warnings.push(...peakDispatch.warnings);

  let remainingDischargeKwh = Math.max(
    0,
    year.dischargedEnergyAcKwh
      - backupReserveEnergyKwh * assumptions.operatingDaysPerYear
      - peakDispatch.annualDischargeKwh
  );
  let remainingChargeKwh = Math.max(0, year.chargedEnergyAcKwh - peakDispatch.annualGridChargeKwh);

  const pvAvailableKwh = annualPvSurplusKwh(assumptions, config, scenario);
  const pvChargedEnergyKwh = Math.min(pvAvailableKwh, remainingChargeKwh, remainingDischargeKwh);
  remainingChargeKwh -= pvChargedEnergyKwh;
  remainingDischargeKwh -= pvChargedEnergyKwh;

  const hasArbitrage = (assumptions.selectedObjectives ?? []).includes("saving") || (assumptions.selectedObjectives ?? []).includes("investment");
  const arbitrageDischargeEnergyKwh = hasArbitrage ? Math.max(0, remainingDischargeKwh) : 0;
  const arbitrageGridChargeEnergyAnnualKwh = Math.min(
    remainingChargeKwh,
    rte > 0 ? arbitrageDischargeEnergyKwh / rte : 0
  );
  const gridChargedEnergyKwh = peakDispatch.annualGridChargeKwh + arbitrageGridChargeEnergyAnnualKwh;

  const nonPeakAllocatedDischargeEnergy = pvChargedEnergyKwh + arbitrageDischargeEnergyKwh;
  const nonPeakAllocatedChargeEnergy = pvChargedEnergyKwh + arbitrageGridChargeEnergyAnnualKwh;
  const nonPeakDischargeLimit = Math.max(0, year.dischargedEnergyAcKwh - peakDispatch.annualDischargeKwh);
  const nonPeakChargeLimit = Math.max(0, year.chargedEnergyAcKwh - peakDispatch.annualGridChargeKwh);

  if (nonPeakAllocatedDischargeEnergy - nonPeakDischargeLimit > 1 || nonPeakAllocatedChargeEnergy - nonPeakChargeLimit > 1) {
    warnings.push(
      createWarning("ENERGY_ALLOCATION_EXCEEDED", "Non-peak energy allocation exceeds remaining annual cycle pool.", {
        candidateId: candidate.id,
        severity: "error",
        blocking: true
      })
    );
  }
  if (hasArbitrage && arbitrageDischargeEnergyKwh <= 0) {
    warnings.push(createWarning("ARBITRAGE_NOT_ECONOMIC", "No valid energy remains for arbitrage after higher-priority objectives.", { candidateId: candidate.id, severity: "info" }));
  }

  return {
    backupReserveEnergyKwh,
    pvChargedEnergyKwh,
    gridChargedEnergyKwh,
    peakShavingDischargeEnergyKwh: peakDispatch.annualDischargeKwh,
    peakShavingDischargeEnergyPerEventKwh: peakDispatch.perEventDischargeKwh,
    peakShavingDischargeEnergyAnnualKwh: peakDispatch.annualDischargeKwh,
    peakShavingGridChargeEnergyAnnualKwh: peakDispatch.annualGridChargeKwh,
    effectivePeakReductionKw: peakDispatch.effectivePeakReductionKw,
    annualPeakEventCount: peakDispatch.annualPeakEventCount,
    arbitrageGridChargeEnergyAnnualKwh,
    arbitrageDischargeEnergyKwh,
    warnings
  };
}
