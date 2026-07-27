import { normalizedValue } from "./math";
import type {
  ConfidenceResult,
  FinancingRecommendationResult,
  ResultCalculationConfig,
  ResultScenarioConfig,
  SizingCandidateResult,
  SizingOptionResult,
  Step2Assumptions
} from "./types";

function hasPeakShaving(assumptions: Step2Assumptions) {
  return (assumptions.selectedObjectives ?? []).includes("peak_shaving");
}

function isFinanciallyEligible(
  candidate: SizingCandidateResult,
  assumptions: Step2Assumptions,
  scenario: ResultScenarioConfig
) {
  if (candidate.capex.totalCapexVnd <= 0 || candidate.warnings.some((warning) => warning.blocking)) {
    return false;
  }
  if (hasPeakShaving(assumptions) && candidate.meetsPeakReductionTarget !== true) {
    return false;
  }
  if (candidate.npvVnd <= 0) {
    return false;
  }
  if (candidate.irrPct === null || candidate.irrPct < assumptions.waccPct + scenario.waccDeltaPct) {
    return false;
  }
  if (candidate.paybackYears === null || candidate.paybackYears > assumptions.analysisYears) {
    return false;
  }
  if (candidate.budgetEvaluation.status === "materially_over") {
    return false;
  }

  return true;
}

function budgetPenalty(candidate: SizingCandidateResult, config: ResultCalculationConfig) {
  if (candidate.budgetEvaluation.status === "materially_over") {
    return config.recommendation.materiallyOverBudgetPenalty;
  }
  if (candidate.budgetEvaluation.status === "slightly_over") {
    return config.recommendation.slightlyOverBudgetPenalty;
  }
  return 0;
}

export function scoreCandidates(
  candidates: SizingCandidateResult[],
  assumptions: Step2Assumptions,
  confidence: ConfidenceResult,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig
) {
  const scoringPool = candidates.filter((candidate) => isFinanciallyEligible(candidate, assumptions, scenario));
  if (scoringPool.length === 0) {
    return candidates.map((candidate) => ({ ...candidate, recommendationScore: null }));
  }

  const npvs = scoringPool.map((candidate) => candidate.npvVnd);
  const irrs = scoringPool.map((candidate) => candidate.irrPct ?? 0);
  const savings = scoringPool.map((candidate) => candidate.netOperatingSavingYear1Vnd);
  const capexes = scoringPool.map((candidate) => candidate.capex.totalCapexVnd);
  const paybacks = scoringPool.map((candidate) => candidate.paybackYears ?? assumptions.analysisYears * 2);
  const ranges = {
    npv: [Math.min(...npvs), Math.max(...npvs)] as const,
    irr: [Math.min(...irrs), Math.max(...irrs)] as const,
    saving: [Math.min(...savings), Math.max(...savings)] as const,
    capex: [Math.min(...capexes), Math.max(...capexes)] as const,
    payback: [Math.min(...paybacks), Math.max(...paybacks)] as const
  };

  return candidates.map((candidate) => {
    if (!scoringPool.some((item) => item.id === candidate.id)) {
      return { ...candidate, recommendationScore: null };
    }

    const weights = config.recommendation.weights;
    const score = weights.npv * normalizedValue(candidate.npvVnd, ranges.npv[0], ranges.npv[1])
      + weights.irr * normalizedValue(candidate.irrPct ?? 0, ranges.irr[0], ranges.irr[1])
      + weights.saving * normalizedValue(candidate.netOperatingSavingYear1Vnd, ranges.saving[0], ranges.saving[1])
      - weights.capex * normalizedValue(candidate.capex.totalCapexVnd, ranges.capex[0], ranges.capex[1])
      - weights.payback * normalizedValue(candidate.paybackYears ?? assumptions.analysisYears * 2, ranges.payback[0], ranges.payback[1])
      - budgetPenalty(candidate, config)
      - (1 - confidence.score / 100) * 0.1;

    return { ...candidate, recommendationScore: score };
  });
}

function optionFromCandidate(candidate: SizingCandidateResult, role: SizingOptionResult["role"], title: string, badge: string): SizingOptionResult {
  return {
    ...candidate,
    role,
    title,
    badge
  };
}

function pickDistinct(sorted: SizingCandidateResult[], used: Set<string>) {
  const picked = sorted.find((candidate) => !used.has(candidate.id)) ?? sorted[0] ?? null;
  if (picked) {
    used.add(picked.id);
  }
  return picked;
}

function isFinancingEligible(candidate: SizingCandidateResult, assumptions: Step2Assumptions) {
  if (candidate.warnings.some((warning) => warning.blocking)) {
    return false;
  }
  if (candidate.budgetEvaluation.status === "materially_over") {
    return false;
  }
  if (candidate.equityNpvVnd <= 0) {
    return false;
  }
  if (candidate.equityIrrPct === null || candidate.equityIrrPct < candidate.costOfEquityPct) {
    return false;
  }
  if (candidate.equityPaybackYears === null || candidate.equityPaybackYears > assumptions.analysisYears) {
    return false;
  }
  if (candidate.minimumDscr !== null && candidate.minimumDscr < 1) {
    return false;
  }
  return true;
}

export function selectFinancingRecommendation(
  candidates: SizingCandidateResult[],
  assumptions: Step2Assumptions
): FinancingRecommendationResult | null {
  const candidate = [...candidates]
    .filter((item) => isFinancingEligible(item, assumptions))
    .sort((left, right) => (
      right.equityNpvVnd - left.equityNpvVnd
      || (right.equityIrrPct ?? -Infinity) - (left.equityIrrPct ?? -Infinity)
      || (right.minimumDscr ?? Infinity) - (left.minimumDscr ?? Infinity)
      || left.equityInvestmentVnd - right.equityInvestmentVnd
    ))[0];

  return candidate
    ? {
      ...candidate,
      role: "financing",
      title: "Khuyến nghị tài trợ vốn",
      badge: "Equity & DSCR đạt"
    }
    : null;
}

export function selectRepresentativeOptions(candidates: SizingCandidateResult[]) {
  const candidatesWithScores = candidates.filter((candidate) => candidate.recommendationScore !== null);
  const referencePool = candidates.filter((candidate) => !candidate.warnings.some((warning) => warning.blocking));
  const used = new Set<string>();
  const recommended = pickDistinct(
    [...candidatesWithScores].sort((left, right) => (right.recommendationScore ?? -Infinity) - (left.recommendationScore ?? -Infinity)),
    used
  );
  const lowCost = pickDistinct([...referencePool].sort((left, right) => left.capex.totalCapexVnd - right.capex.totalCapexVnd), used);
  const highBenefit = pickDistinct(
    [...referencePool].sort((left, right) => right.netOperatingSavingYear1Vnd - left.netOperatingSavingYear1Vnd || right.npvVnd - left.npvVnd),
    used
  );

  return {
    lowCostOption: lowCost ? optionFromCandidate(lowCost, "low", "Chi phí thấp", "Tham khảo CAPEX") : null,
    recommendedOption: recommended ? optionFromCandidate(recommended, "recommended", "Khuyến nghị tài chính", "Đạt tiêu chí") : null,
    highBenefitOption: highBenefit ? optionFromCandidate(highBenefit, "high", "Hiệu quả cao", "Tham khảo saving") : null
  };
}
