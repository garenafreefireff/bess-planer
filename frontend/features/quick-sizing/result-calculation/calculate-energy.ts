import { normalizePercent } from "./math";
import type { EnergyYearResult, GeneratedCandidate, ResultScenarioConfig, Step2Assumptions } from "./types";

export function calculateEnergyYears(
  candidate: GeneratedCandidate,
  assumptions: Step2Assumptions,
  scenario: ResultScenarioConfig
): EnergyYearResult[] {
  const years: EnergyYearResult[] = [];
  const dod = normalizePercent(assumptions.dodPct);
  const rte = normalizePercent(Math.min(100, Math.max(1, assumptions.rtePct + scenario.rteDeltaPct)));
  const degradation = normalizePercent(Math.max(0, assumptions.degradationPct + scenario.degradationDeltaPct));

  for (let year = 0; year <= assumptions.analysisYears; year += 1) {
    if (year === 0) {
      years.push({
        year,
        availableCapacityKwh: candidate.energyKwh,
        usableBatteryEnergyDcKwh: 0,
        dischargedEnergyAcKwh: 0,
        chargedEnergyAcKwh: 0
      });
      continue;
    }

    const availableCapacityKwh = candidate.energyKwh * Math.pow(1 - degradation, year - 1);
    const usableBatteryEnergyDcKwh = availableCapacityKwh * dod;
    const dischargedEnergyAcKwh = usableBatteryEnergyDcKwh * assumptions.cyclesPerDay * assumptions.operatingDaysPerYear;
    const chargedEnergyAcKwh = rte > 0 ? dischargedEnergyAcKwh / rte : 0;

    years.push({
      year,
      availableCapacityKwh,
      usableBatteryEnergyDcKwh,
      dischargedEnergyAcKwh,
      chargedEnergyAcKwh
    });
  }

  return years;
}
