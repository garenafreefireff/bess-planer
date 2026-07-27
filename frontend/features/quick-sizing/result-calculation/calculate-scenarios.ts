import { minMax } from "./math";
import type { ScenarioMetricRanges, SizingCandidateResult } from "./types";

function validPaybackYears(candidate: SizingCandidateResult | null) {
  if (!candidate || candidate.paybackYears === null || candidate.paybackStatus !== "within_horizon") {
    return null;
  }

  const horizon = Math.max(...candidate.yearlyResults.map((row) => row.year));
  return Number.isFinite(candidate.paybackYears) && candidate.paybackYears >= 0 && candidate.paybackYears <= horizon
    ? candidate.paybackYears
    : null;
}

function validEquityPaybackYears(candidate: SizingCandidateResult | null) {
  if (!candidate || candidate.equityPaybackYears === null) {
    return null;
  }
  const horizon = Math.max(...candidate.yearlyResults.map((row) => row.year));
  return Number.isFinite(candidate.equityPaybackYears)
    && candidate.equityPaybackYears >= 0
    && candidate.equityPaybackYears <= horizon
    ? candidate.equityPaybackYears
    : null;
}

export function buildScenarioRanges(candidates: Array<SizingCandidateResult | null>): ScenarioMetricRanges {
  return {
    npvVnd: minMax(candidates.map((candidate) => candidate?.npvVnd ?? null)),
    irrPct: minMax(candidates.map((candidate) => candidate?.irrPct ?? null)),
    paybackYears: minMax(candidates.map(validPaybackYears)),
    equityNpvVnd: minMax(candidates.map((candidate) => candidate?.equityNpvVnd ?? null)),
    equityIrrPct: minMax(candidates.map((candidate) => candidate?.equityIrrPct ?? null)),
    equityPaybackYears: minMax(candidates.map(validEquityPaybackYears)),
    minimumDscr: minMax(candidates.map((candidate) => candidate?.minimumDscr ?? null)),
    netOperatingSavingYear1Vnd: minMax(candidates.map((candidate) => candidate?.netOperatingSavingYear1Vnd ?? null)),
    capexVnd: minMax(candidates.map((candidate) => candidate?.capex.totalCapexVnd ?? null))
  };
}
