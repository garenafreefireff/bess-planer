import { normalizePercent } from "./math";
import type { CapexBreakdown, ResultCalculationConfig, Step2Assumptions } from "./types";

export function calculateOm(capex: CapexBreakdown, assumptions: Step2Assumptions, year: number) {
  if (year <= 0) {
    return 0;
  }

  return capex.omBaseCapexVnd
    * normalizePercent(assumptions.omPct)
    * Math.pow(1 + normalizePercent(assumptions.omGrowthPct), year - 1);
}

export function calculateDepreciation(capex: CapexBreakdown, config: ResultCalculationConfig, year: number) {
  if (year <= 0 || year > config.finance.depreciationYears) {
    return 0;
  }

  return capex.depreciableCapexVnd / config.finance.depreciationYears;
}

export function calculateTax(grossSavingVnd: number, omVnd: number, depreciationVnd: number, taxPct: number) {
  const taxableIncomeVnd = grossSavingVnd - omVnd - depreciationVnd;
  const taxVnd = Math.max(taxableIncomeVnd, 0) * normalizePercent(taxPct);
  return { taxableIncomeVnd, taxVnd };
}
