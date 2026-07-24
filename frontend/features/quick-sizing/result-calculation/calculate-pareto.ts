import type { ParetoPoint, SizingCandidateResult } from "./types";

const epsilon = 1e-9;

export function markParetoCandidates(candidates: SizingCandidateResult[]) {
  return candidates.map((candidate) => {
    const dominated = candidates.some((other) => {
      if (other.id === candidate.id) {
        return false;
      }

      const savingsBetterOrEqual = other.netOperatingSavingYear1Vnd + epsilon >= candidate.netOperatingSavingYear1Vnd;
      const roiBetterOrEqual = other.npvPerCapex + epsilon >= candidate.npvPerCapex;
      const oneClearlyBetter = other.netOperatingSavingYear1Vnd > candidate.netOperatingSavingYear1Vnd + epsilon
        || other.npvPerCapex > candidate.npvPerCapex + epsilon;
      return savingsBetterOrEqual && roiBetterOrEqual && oneClearlyBetter;
    });

    return { ...candidate, isPareto: !dominated };
  });
}

export function buildParetoPoints(candidates: SizingCandidateResult[], recommendedId?: string | null): ParetoPoint[] {
  return candidates.map((candidate) => ({
    candidateId: candidate.id,
    powerKw: candidate.powerKw,
    energyKwh: candidate.energyKwh,
    annualSavingMillionVnd: candidate.netOperatingSavingYear1Vnd / 1_000_000,
    npvOverCapex: candidate.npvPerCapex,
    isPareto: candidate.isPareto,
    isRecommended: candidate.id === recommendedId
  }));
}
