import { normalizePercent } from "./math";
import { createWarning } from "./validation";
import type {
  DispatchAllocation,
  ResultCalculationConfig,
  ResultScenarioConfig,
  ResultWarning,
  Step2Assumptions
} from "./types";

export type YearSavings = {
  arbitrageSavingVnd: number;
  peakShavingAvoidedEnergyCostVnd: number;
  peakShavingChargingCostVnd: number;
  peakShavingEnergySavingVnd: number;
  demandSavingVnd: number;
  potentialDemandSavingVnd: number;
  demandSavingIncludedInBaseNpv: boolean;
  pvSavingVnd: number;
  nonEnergyBenefitVnd: number;
  grossSavingVnd: number;
  chargingCostVnd: number;
  warnings: ResultWarning[];
};

function escalated(value: number, escalationPct: number, year: number) {
  return value * Math.pow(1 + normalizePercent(escalationPct), Math.max(0, year - 1));
}

function weightedTariff(
  lowPrice: number,
  normalPrice: number,
  peakPrice: number,
  shares: { low: number; normal: number; peak: number }
) {
  return lowPrice * shares.low + normalPrice * shares.normal + peakPrice * shares.peak;
}

export function calculateSavings(
  allocation: DispatchAllocation,
  year: number,
  assumptions: Step2Assumptions,
  config: ResultCalculationConfig,
  scenario: ResultScenarioConfig,
  candidateId: string
): YearSavings {
  const warnings: ResultWarning[] = [];
  const energyEscalation = assumptions.priceEscalationPct + scenario.energyTariffEscalationDeltaPct;
  const demandEscalation = (assumptions.demandTariffEscalationPct ?? assumptions.priceEscalationPct) + scenario.demandTariffEscalationDeltaPct;
  const exportEscalation = assumptions.exportTariffEscalationPct ?? assumptions.priceEscalationPct;
  const offPeakTariff = escalated(assumptions.offPeakPrice, energyEscalation, year);
  const normalTariff = escalated(assumptions.normalPrice, energyEscalation, year);
  const peakTariff = escalated(assumptions.peakPrice, energyEscalation, year);
  const effectiveDemandTariff = escalated(assumptions.effectiveDemandChargeVndPerKwMonth, demandEscalation, year);
  const referenceDemandTariff = assumptions.demandChargeReferenceVndPerKwMonth !== null
    ? escalated(assumptions.demandChargeReferenceVndPerKwMonth, demandEscalation, year)
    : 0;
  const exportTariff = escalated(assumptions.exportTariff ?? config.dispatch.defaultExportTariff, exportEscalation, year);
  const arbitrageChargeTariff = weightedTariff(offPeakTariff, normalTariff, peakTariff, config.dispatch.arbitrageChargeShares);
  const arbitrageDischargeTariff = weightedTariff(offPeakTariff, normalTariff, peakTariff, config.dispatch.arbitrageDischargeShares);
  const peakChargeTariff = weightedTariff(offPeakTariff, normalTariff, peakTariff, config.dispatch.peakShavingChargeShares);

  const arbitrageChargeEnergyKwh = allocation.arbitrageGridChargeEnergyAnnualKwh ?? allocation.gridChargedEnergyKwh ?? 0;
  const arbitrageChargeCostVnd = arbitrageChargeEnergyKwh * arbitrageChargeTariff;
  const arbitrageDischargeValueVnd = allocation.arbitrageDischargeEnergyKwh * arbitrageDischargeTariff;
  const arbitrageSavingVnd = Math.max(arbitrageDischargeValueVnd - arbitrageChargeCostVnd, 0);
  if (allocation.arbitrageDischargeEnergyKwh > 0 && arbitrageSavingVnd <= 0) {
    warnings.push(createWarning("ARBITRAGE_NOT_ECONOMIC", "Arbitrage does not create a positive spread.", { candidateId, severity: "info" }));
  }

  const peakShavingDischargeEnergyAnnualKwh = allocation.peakShavingDischargeEnergyAnnualKwh ?? allocation.peakShavingDischargeEnergyKwh ?? 0;
  const peakShavingGridChargeEnergyAnnualKwh = allocation.peakShavingGridChargeEnergyAnnualKwh ?? 0;
  const peakShavingChargingCostVnd = peakShavingGridChargeEnergyAnnualKwh * peakChargeTariff;
  const peakShavingAvoidedEnergyCostVnd = peakShavingDischargeEnergyAnnualKwh * peakTariff;
  const peakShavingEnergySavingVnd = Math.max(peakShavingAvoidedEnergyCostVnd - peakShavingChargingCostVnd, 0);

  const reducedPeakKw = allocation.effectivePeakReductionKw ?? 0;
  const hasPeakShaving = (assumptions.selectedObjectives ?? []).includes("peak_shaving");
  const canIncludeDemandSaving = hasPeakShaving
    && assumptions.demandChargeApplicability === "applicable"
    && assumptions.demandSavingIncludedInBaseNpv
    && effectiveDemandTariff > 0;
  const demandSavingVnd = canIncludeDemandSaving
    ? reducedPeakKw * effectiveDemandTariff * config.dispatch.demandChargeMonthsPerYear
    : 0;
  const potentialDemandSavingVnd = hasPeakShaving && referenceDemandTariff > 0
    ? reducedPeakKw * referenceDemandTariff * config.dispatch.demandChargeMonthsPerYear
    : 0;
  if (hasPeakShaving && !canIncludeDemandSaving) {
    warnings.push(createWarning("DEMAND_CHARGE_NOT_CONFIRMED", "Demand charge is not confirmed, so demand-charge savings are not included in base NPV.", { candidateId, field: "demandChargeApplicability", severity: "info" }));
  }

  const hasPvData = Boolean(assumptions.solarMonthlyGenerationKwh || assumptions.solarCapacityKw);
  const avoidedPurchaseTariff = weightedTariff(offPeakTariff, normalTariff, peakTariff, assumptions.touShares ?? { low: 0.2, normal: 0.5, peak: 0.3 });
  const pvSavingVnd = hasPvData
    ? Math.max(allocation.pvChargedEnergyKwh * (avoidedPurchaseTariff - exportTariff), 0)
    : 0;
  if ((assumptions.selectedObjectives ?? []).includes("solar_optimization") && !hasPvData) {
    warnings.push(createWarning("PV_BENEFIT_NOT_CALCULATED", "PV data is missing, so PV benefit is not monetized.", { candidateId, field: "solarMonthlyGenerationKwh" }));
  }

  const nonEnergyBenefitVnd = 0;
  const grossSavingVnd = arbitrageSavingVnd
    + peakShavingEnergySavingVnd
    + demandSavingVnd
    + pvSavingVnd
    + nonEnergyBenefitVnd;

  return {
    arbitrageSavingVnd,
    peakShavingAvoidedEnergyCostVnd,
    peakShavingChargingCostVnd,
    peakShavingEnergySavingVnd,
    demandSavingVnd,
    potentialDemandSavingVnd,
    demandSavingIncludedInBaseNpv: canIncludeDemandSaving,
    pvSavingVnd,
    nonEnergyBenefitVnd,
    grossSavingVnd,
    chargingCostVnd: arbitrageChargeCostVnd + peakShavingChargingCostVnd,
    warnings
  };
}
