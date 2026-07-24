import { calculateEnergyYears } from "./calculate-energy";
import { allocateDispatchEnergy } from "./dispatch-energy";
import { calculateSavings } from "./calculate-savings";
import { calculateDepreciation, calculateOm, calculateTax } from "./calculate-tax";
import { presentValue } from "./math";
import type {
  CapexBreakdown,
  GeneratedCandidate,
  ResultCalculationConfig,
  ResultScenarioConfig,
  ResultWarning,
  Step2Assumptions,
  YearlyResult
} from "./types";

function replacementValue(capex: CapexBreakdown, config: ResultCalculationConfig, scenario: ResultScenarioConfig, year: number) {
  if (!config.finance.replacementYear || config.finance.replacementYear !== year) {
    return 0;
  }

  const configuredReplacement = config.finance.replacementCostVnd > 0
    ? config.finance.replacementCostVnd
    : capex.batteryCostVnd * config.finance.replacementRateOfInitialBatteryCost;
  return configuredReplacement * scenario.replacementCostMultiplier;
}

function terminalValue(capex: CapexBreakdown, config: ResultCalculationConfig, year: number, analysisYears: number) {
  if (year !== analysisYears) {
    return 0;
  }

  return config.finance.terminalValueVnd
    + capex.totalCapexVnd * config.finance.salvageValueRate
    - config.finance.decommissioningCostVnd;
}

export function calculateCashFlow(
  candidate: GeneratedCandidate,
  capex: CapexBreakdown,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig
): { yearlyResults: YearlyResult[]; warnings: ResultWarning[] } {
  const energyYears = calculateEnergyYears(candidate, assumptions, scenario);
  const warnings: ResultWarning[] = [];
  const yearlyResults: YearlyResult[] = [];
  let cumulativeCashFlowVnd = 0;

  for (const energyYear of energyYears) {
    if (energyYear.year === 0) {
      const fcffVnd = -capex.totalCapexVnd;
      cumulativeCashFlowVnd += fcffVnd;
      yearlyResults.push({
        year: 0,
        availableCapacityKwh: energyYear.availableCapacityKwh,
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
        fcffVnd,
        cumulativeCashFlowVnd,
        discountedCashFlowVnd: fcffVnd
      });
      continue;
    }

    const allocation = allocateDispatchEnergy(candidate, energyYear, assumptions, config, scenario);
    warnings.push(...allocation.warnings);
    const savings = calculateSavings(allocation, energyYear.year, assumptions, config, scenario, candidate.id);
    warnings.push(...savings.warnings);
    const omVnd = calculateOm(capex, assumptions, energyYear.year);
    const depreciationVnd = calculateDepreciation(capex, config, energyYear.year);
    const { taxableIncomeVnd, taxVnd } = calculateTax(savings.grossSavingVnd, omVnd, depreciationVnd, assumptions.taxPct);
    const replacementVnd = replacementValue(capex, config, scenario, energyYear.year);
    const terminalValueVnd = terminalValue(capex, config, energyYear.year, assumptions.analysisYears);
    const fcffVnd = savings.grossSavingVnd - omVnd - taxVnd - replacementVnd + terminalValueVnd;
    cumulativeCashFlowVnd += fcffVnd;
    const dischargedEnergyAcKwh = allocation.pvChargedEnergyKwh
      + allocation.peakShavingDischargeEnergyAnnualKwh
      + allocation.arbitrageDischargeEnergyKwh;
    const chargedEnergyAcKwh = allocation.pvChargedEnergyKwh + allocation.gridChargedEnergyKwh;

    yearlyResults.push({
      year: energyYear.year,
      availableCapacityKwh: energyYear.availableCapacityKwh,
      dischargedEnergyAcKwh,
      chargedEnergyAcKwh,
      backupReserveEnergyKwh: allocation.backupReserveEnergyKwh,
      pvChargedEnergyKwh: allocation.pvChargedEnergyKwh,
      gridChargedEnergyKwh: allocation.gridChargedEnergyKwh,
      peakShavingDischargeEnergyKwh: allocation.peakShavingDischargeEnergyKwh,
      peakShavingDischargeEnergyPerEventKwh: allocation.peakShavingDischargeEnergyPerEventKwh,
      peakShavingDischargeEnergyAnnualKwh: allocation.peakShavingDischargeEnergyAnnualKwh,
      peakShavingGridChargeEnergyAnnualKwh: allocation.peakShavingGridChargeEnergyAnnualKwh,
      effectivePeakReductionKw: allocation.effectivePeakReductionKw,
      annualPeakEventCount: allocation.annualPeakEventCount,
      arbitrageGridChargeEnergyAnnualKwh: allocation.arbitrageGridChargeEnergyAnnualKwh,
      arbitrageDischargeEnergyKwh: allocation.arbitrageDischargeEnergyKwh,
      arbitrageSavingVnd: savings.arbitrageSavingVnd,
      peakShavingAvoidedEnergyCostVnd: savings.peakShavingAvoidedEnergyCostVnd,
      peakShavingChargingCostVnd: savings.peakShavingChargingCostVnd,
      peakShavingEnergySavingVnd: savings.peakShavingEnergySavingVnd,
      demandSavingVnd: savings.demandSavingVnd,
      potentialDemandSavingVnd: savings.potentialDemandSavingVnd,
      demandSavingIncludedInBaseNpv: savings.demandSavingIncludedInBaseNpv,
      pvSavingVnd: savings.pvSavingVnd,
      nonEnergyBenefitVnd: savings.nonEnergyBenefitVnd,
      grossSavingVnd: savings.grossSavingVnd,
      omVnd,
      depreciationVnd,
      taxableIncomeVnd,
      taxVnd,
      replacementVnd,
      terminalValueVnd,
      chargingCostVnd: savings.chargingCostVnd,
      fcffVnd,
      cumulativeCashFlowVnd,
      discountedCashFlowVnd: presentValue(fcffVnd, assumptions.waccPct + scenario.waccDeltaPct, energyYear.year)
    });
  }

  return { yearlyResults, warnings };
}
