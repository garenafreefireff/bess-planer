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

export function buildScenarioRanges(candidates: Array<SizingCandidateResult | null>): ScenarioMetricRanges {
  return {
    npvVnd: minMax(candidates.map((candidate) => candidate?.npvVnd ?? null)),
    irrPct: minMax(candidates.map((candidate) => candidate?.irrPct ?? null)),
    paybackYears: minMax(candidates.map(validPaybackYears)),
    netOperatingSavingYear1Vnd: minMax(candidates.map((candidate) => candidate?.netOperatingSavingYear1Vnd ?? null)),
    capexVnd: minMax(candidates.map((candidate) => candidate?.capex.totalCapexVnd ?? null))
  };
}
