import { normalizePercent, presentValue } from "./math";
import { createWarning } from "./validation";
import type {
  CapexBreakdown,
  ResultWarning,
  Step2Assumptions,
  YearlyResult
} from "./types";

function npvAtRate(cashFlows: number[], rate: number) {
  return cashFlows.reduce((sum, value, year) => sum + value / Math.pow(1 + rate, year), 0);
}

export function calculateNpv(yearlyResults: YearlyResult[], waccPct: number) {
  return yearlyResults.reduce((sum, row) => sum + presentValue(row.fcffVnd, waccPct, row.year), 0);
}

function calculateIrrFromCashFlows(cashFlows: number[]) {
  const hasPositive = cashFlows.some((value) => value > 0);
  const hasNegative = cashFlows.some((value) => value < 0);
  if (!hasPositive || !hasNegative) {
    return null;
  }

  let low = -0.95;
  let high = 2;
  let lowValue = npvAtRate(cashFlows, low);
  let highValue = npvAtRate(cashFlows, high);

  for (let attempt = 0; attempt < 8 && lowValue * highValue > 0; attempt += 1) {
    high += 2;
    highValue = npvAtRate(cashFlows, high);
  }

  if (lowValue * highValue > 0) {
    return null;
  }

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const midValue = npvAtRate(cashFlows, mid);
    if (Math.abs(midValue) < 1) {
      return mid * 100;
    }
    if (lowValue * midValue <= 0) {
      high = mid;
      highValue = midValue;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  void highValue;
  return ((low + high) / 2) * 100;
}

export function calculateIrr(yearlyResults: YearlyResult[]) {
  return calculateIrrFromCashFlows(yearlyResults.map((row) => row.fcffVnd));
}

export function calculatePayback(yearlyResults: YearlyResult[]) {
  for (let index = 1; index < yearlyResults.length; index += 1) {
    const previous = yearlyResults[index - 1];
    const current = yearlyResults[index];
    if (!previous || !current) {
      continue;
    }
    if (previous.cumulativeCashFlowVnd < 0 && current.cumulativeCashFlowVnd >= 0 && current.fcffVnd > 0) {
      const paybackYears = (current.year - 1) + Math.abs(previous.cumulativeCashFlowVnd) / current.fcffVnd;
      return Number.isFinite(paybackYears) && paybackYears >= 0 && paybackYears <= current.year
        ? paybackYears
        : null;
    }
  }

  return null;
}

export function resolveCostOfEquityPct(assumptions: Step2Assumptions) {
  const debtWeight = Math.min(Math.max(normalizePercent(assumptions.debtPct), 0), 1);
  const equityWeight = 1 - debtWeight;
  const wacc = normalizePercent(assumptions.waccPct);
  const afterTaxDebtCost = normalizePercent(assumptions.interestPct) * (1 - normalizePercent(assumptions.taxPct));
  if (equityWeight <= 0.0001) {
    return Math.max(assumptions.waccPct, 0);
  }
  return Math.max(((wacc - debtWeight * afterTaxDebtCost) / equityWeight) * 100, 0);
}

export function calculateEquityNpv(yearlyResults: YearlyResult[], costOfEquityPct: number) {
  return yearlyResults.reduce(
    (sum, row) => sum + presentValue(row.equityCashFlowVnd, costOfEquityPct, row.year),
    0
  );
}

export function calculateEquityIrr(yearlyResults: YearlyResult[]) {
  return calculateIrrFromCashFlows(yearlyResults.map((row) => row.equityCashFlowVnd));
}

export function calculateEquityPayback(yearlyResults: YearlyResult[]) {
  for (let index = 1; index < yearlyResults.length; index += 1) {
    const previous = yearlyResults[index - 1];
    const current = yearlyResults[index];
    if (!previous || !current) {
      continue;
    }
    if (
      previous.cumulativeEquityCashFlowVnd < 0
      && current.cumulativeEquityCashFlowVnd >= 0
      && current.equityCashFlowVnd > 0
    ) {
      const paybackYears = (current.year - 1)
        + Math.abs(previous.cumulativeEquityCashFlowVnd) / current.equityCashFlowVnd;
      return Number.isFinite(paybackYears) && paybackYears >= 0 && paybackYears <= current.year
        ? paybackYears
        : null;
    }
  }
  return null;
}

export function calculateDebtSummary(yearlyResults: YearlyResult[]) {
  const debtYears = yearlyResults.filter((row) => row.debtServiceVnd > 0);
  const dscrValues = debtYears
    .map((row) => row.dscr)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return {
    debtAmountVnd: yearlyResults[0]?.debtDrawdownVnd ?? 0,
    equityInvestmentVnd: Math.abs(yearlyResults[0]?.equityCashFlowVnd ?? 0),
    totalInterestVnd: yearlyResults.reduce((sum, row) => sum + row.interestExpenseVnd, 0),
    minimumDscr: dscrValues.length > 0 ? Math.min(...dscrValues) : null,
    averageDscr: dscrValues.length > 0
      ? dscrValues.reduce((sum, value) => sum + value, 0) / dscrValues.length
      : null
  };
}

export function calculateLcos(capex: CapexBreakdown, yearlyResults: YearlyResult[], assumptions: Step2Assumptions) {
  const numerator = capex.totalCapexVnd
    + yearlyResults
      .filter((row) => row.year > 0)
      .reduce((sum, row) => sum + presentValue(row.omVnd + row.replacementVnd + row.chargingCostVnd, assumptions.waccPct, row.year), 0);
  const denominator = yearlyResults
    .filter((row) => row.year > 0)
    .reduce((sum, row) => sum + presentValue(row.dischargedEnergyAcKwh, assumptions.waccPct, row.year), 0);

  return denominator > 0 ? numerator / denominator : null;
}

export function financialWarnings(candidateId: string, irrPct: number | null, paybackYears: number | null): ResultWarning[] {
  const warnings: ResultWarning[] = [];
  if (irrPct === null) {
    warnings.push(createWarning("IRR_NOT_AVAILABLE", "IRR không có nghiệm hợp lệ cho dòng tiền này.", { candidateId, severity: "info" }));
  }
  if (paybackYears === null) {
    warnings.push(createWarning("PAYBACK_BEYOND_HORIZON", "Chưa hoàn vốn trong thời hạn phân tích.", { candidateId, severity: "info" }));
  }
  return warnings;
}
