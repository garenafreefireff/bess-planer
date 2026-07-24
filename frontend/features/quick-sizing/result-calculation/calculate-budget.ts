import type { BudgetEvaluation, ResultCalculationConfig } from "./types";

export function calculateBudgetEvaluation(totalCapexVnd: number, budgetMaxVnd: number | null | undefined, config: ResultCalculationConfig): BudgetEvaluation {
  if (!budgetMaxVnd || budgetMaxVnd <= 0) {
    return {
      budgetMaxVnd: null,
      budgetGapVnd: null,
      overrunPercent: null,
      status: "not_defined"
    };
  }

  const budgetGapVnd = totalCapexVnd - budgetMaxVnd;
  const overrunPercent = Math.max(budgetGapVnd, 0) / budgetMaxVnd;
  const status = budgetGapVnd <= 0
    ? "within_budget"
    : overrunPercent <= config.budget.slightlyOverThreshold
      ? "slightly_over"
      : "materially_over";

  return {
    budgetMaxVnd,
    budgetGapVnd,
    overrunPercent,
    status
  };
}
