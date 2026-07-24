import {
  applyStep1VoltageDemandCharge,
  defaultQuickSizingAssumptions,
  type QuickSizingAssumptions
} from "./quick-sizing-model";
import type { QuickSizingAnalysisRun, QuickSizingStep2Result, QuickSizingTariffAssumptions, QuickSizingUnitCostMetadata } from "./quick-sizing-api-types";
import {
  DEFAULT_DEMAND_CHARGE_CATALOG,
  type DemandChargeReferenceBand,
  type DetailedVoltageBand,
  type EquipmentUnitCostMetadata
} from "../result-calculation";

export function assumptionsFromAnalysisRun(run: QuickSizingAnalysisRun): QuickSizingAssumptions {
  return assumptionsFromStep2Result(run.result);
}

export function assumptionsFromStep2Result(result: QuickSizingStep2Result): QuickSizingAssumptions {
  const technical = result.technical_assumptions;
  const cost = result.cost_assumptions;
  const tariff = result.tariff_assumptions;
  const finance = result.financial_assumptions;
  const load = result.load_estimation;
  const normalized = result.normalized_input;
  const batteryCostVndPerKwh = safeUnitCost(cost.battery_cost, technical.energy_kwh);
  const pcsCostVndPerKw = safeUnitCost(cost.pcs_cost, technical.power_kw);
  const epcRateBands = Array.isArray(cost.epc_rate_bands) && cost.epc_rate_bands.length > 0
    ? cost.epc_rate_bands.map((band) => ({
      minEquipmentCostVnd: band.min_equipment_cost,
      maxEquipmentCostVnd: band.max_equipment_cost,
      ratePct: band.rate_pct
    }))
    : defaultQuickSizingAssumptions.epcRateBands;

  const mapped: QuickSizingAssumptions = {
    ...defaultQuickSizingAssumptions,
    energyKwh: technical.energy_kwh,
    powerKw: technical.power_kw,
    dodPct: technical.dod_pct,
    rtePct: technical.rte_pct,
    degradationPct: technical.degradation_pct,
    cyclesPerDay: technical.cycles_per_day,
    operatingDaysPerYear: technical.operating_days_per_year,
    peakEventDurationHours: technical.peak_event_duration_hours
      ?? defaultQuickSizingAssumptions.peakEventDurationHours,
    peakEventFrequencyPerOperatingDay: technical.peak_event_frequency_per_operating_day
      ?? defaultQuickSizingAssumptions.peakEventFrequencyPerOperatingDay,
    minimumPeakCoveragePct: technical.minimum_peak_coverage_pct
      ?? defaultQuickSizingAssumptions.minimumPeakCoveragePct,
    batteryCostVndPerKwh,
    batteryCostMetadata: mapUnitCostMetadata(
      cost.battery_unit_cost,
      defaultQuickSizingAssumptions.batteryCostMetadata,
      batteryCostVndPerKwh,
      cost.cost_catalog_version,
      cost.cost_model_status,
      cost.cost_model_source_name
    ),
    pcsCostVndPerKw,
    pcsCostMetadata: mapUnitCostMetadata(
      cost.pcs_unit_cost,
      defaultQuickSizingAssumptions.pcsCostMetadata,
      pcsCostVndPerKw,
      cost.cost_catalog_version,
      cost.cost_model_status,
      cost.cost_model_source_name
    ),
    epcMode: cost.epc_mode,
    epcManualRatePct: cost.epc_manual_rate_pct,
    epcRateBands,
    epcVoltageAdjustmentsPct: cost.epc_voltage_adjustments_pct ?? defaultQuickSizingAssumptions.epcVoltageAdjustmentsPct,
    epcMinRatePct: cost.epc_min_rate_pct ?? defaultQuickSizingAssumptions.epcMinRatePct,
    epcMaxRatePct: cost.epc_max_rate_pct ?? defaultQuickSizingAssumptions.epcMaxRatePct,
    epcScopeItems: cost.epc_scope_items ?? defaultQuickSizingAssumptions.epcScopeItems,
    costModelStatus: cost.cost_model_status ?? defaultQuickSizingAssumptions.costModelStatus,
    costCatalogVersion: cost.cost_catalog_version ?? defaultQuickSizingAssumptions.costCatalogVersion,
    costModelSourceName: cost.cost_model_source_name ?? defaultQuickSizingAssumptions.costModelSourceName,
    voltageLevel: tariff.voltage_level,
    vatPct: tariff.vat_pct,
    omPct: safePercent(cost.first_year_om, cost.capex_excluding_vat),
    offPeakPrice: tariff.low_price,
    normalPrice: tariff.normal_price,
    peakPrice: tariff.peak_price,
    demandChargeApplicability: tariff.demand_charge_applicability ?? "unknown",
    demandChargeMode: tariff.demand_charge_mode ?? "reference",
    detailedVoltageBand: tariff.detailed_voltage_band ?? "unknown",
    demandChargeInputVndPerKwMonth: tariff.demand_charge_input_vnd_per_kw_month ?? legacyDemandChargeInput(tariff.demand_charge_per_kw),
    demandChargeReferenceVndPerKwMonth: tariff.demand_charge_reference_vnd_per_kw_month ?? null,
    effectiveDemandChargeVndPerKwMonth: tariff.effective_demand_charge_vnd_per_kw_month ?? 0,
    demandChargeStatus: tariff.demand_charge_status ?? legacyDemandChargeStatus(tariff.demand_charge_per_kw),
    demandChargeSource: tariff.demand_charge_source ?? legacyDemandChargeSource(tariff.demand_charge_per_kw),
    demandChargeVoltageBand: (tariff.demand_charge_voltage_band as QuickSizingAssumptions["demandChargeVoltageBand"] | undefined)
      ?? defaultQuickSizingAssumptions.demandChargeVoltageBand,
    demandChargeCatalogVersion: tariff.demand_charge_catalog_version ?? DEFAULT_DEMAND_CHARGE_CATALOG.catalogVersion,
    demandChargeEvidenceNote: tariff.demand_charge_evidence_note ?? null,
    demandChargeReferenceBands: mapDemandChargeReferenceBands(tariff.demand_charge_reference_bands),
    demandSavingIncludedInBaseNpv: tariff.demand_saving_included_in_base_npv ?? false,
    exportTariff: 0,
    priceEscalationPct: finance.price_escalation_pct,
    demandTariffEscalationPct: finance.price_escalation_pct,
    exportTariffEscalationPct: finance.price_escalation_pct,
    debtPct: finance.debt_pct,
    interestPct: finance.interest_pct,
    loanTenorYears: finance.loan_tenor_years,
    waccPct: finance.wacc_pct,
    taxPct: finance.tax_pct,
    analysisYears: finance.analysis_years,
    includeVatInCapex: cost.include_vat_in_capex,
    budgetMaxVnd: result.budget_evaluation.budget_max,
    finalPeakDemandKw: load.final_peak_demand_kw,
    tariffAverage: load.tariff_average,
    touShareLow: load.tou_shares.low,
    touShareNormal: load.tou_shares.normal,
    touSharePeak: load.tou_shares.peak,
    solarCapacityKw: numberFromRecord(normalized, "solar_capacity_kw"),
    solarMonthlyGenerationKwh: numberFromRecord(normalized, "solar_monthly_generation_kwh"),
    pvSurplusRatio: null
  };

  if (mapped.demandChargeSource === "user_input" || mapped.demandChargeSource === "invoice") {
    return mapped;
  }

  return applyStep1VoltageDemandCharge(mapped, mapped.voltageLevel);
}

function mapDemandChargeReferenceBands(
  bands: QuickSizingTariffAssumptions["demand_charge_reference_bands"]
): DemandChargeReferenceBand[] {
  if (!Array.isArray(bands) || bands.length === 0) {
    return DEFAULT_DEMAND_CHARGE_CATALOG.referenceBands;
  }

  return bands.map((band) => ({
    code: band.code as Exclude<DetailedVoltageBand, "unknown">,
    label: band.label,
    minVoltageKv: band.min_voltage_kv,
    maxVoltageKv: band.max_voltage_kv,
    priceVndPerKwMonth: band.price_vnd_per_kw_month,
    status: band.status,
    sourceName: band.source_name,
    sourceDate: band.source_date,
    notes: Array.isArray(band.notes) ? band.notes : []
  }));
}

function legacyDemandChargeInput(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function legacyDemandChargeStatus(value: number | undefined) {
  return legacyDemandChargeInput(value) ? "legacy_unconfirmed" : "unknown";
}

function legacyDemandChargeSource(value: number | undefined) {
  return legacyDemandChargeInput(value) ? "legacy_unconfirmed" : "not_confirmed";
}

function mapUnitCostMetadata(
  metadata: QuickSizingUnitCostMetadata | null | undefined,
  fallback: EquipmentUnitCostMetadata,
  value: number,
  catalogVersion?: string | null,
  status?: string | null,
  source?: string | null
): EquipmentUnitCostMetadata {
  return {
    value: finiteOrFallback(metadata?.value, value),
    unit: metadata?.unit || fallback.unit,
    status: metadata?.status || status || fallback.status,
    source: metadata?.source || source || fallback.source,
    scopeIncluded: arrayOrFallback(metadata?.scope_included, fallback.scopeIncluded),
    scopeExcluded: arrayOrFallback(metadata?.scope_excluded, fallback.scopeExcluded),
    notes: arrayOrFallback(metadata?.notes, fallback.notes),
    catalogVersion: metadata?.catalog_version || catalogVersion || fallback.catalogVersion,
    scenarioValues: {
      optimistic: finiteOrFallback(metadata?.scenario_values?.optimistic, fallback.scenarioValues.optimistic),
      base: finiteOrFallback(metadata?.scenario_values?.base, fallback.scenarioValues.base),
      conservative: finiteOrFallback(metadata?.scenario_values?.conservative, fallback.scenarioValues.conservative)
    }
  };
}

function arrayOrFallback(value: string[] | undefined, fallback: string[]) {
  return Array.isArray(value) && value.length > 0 ? value : fallback;
}

function finiteOrFallback(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function safeUnitCost(total: number, base: number) {
  if (base <= 0) {
    return 0;
  }

  return total / base;
}

function safePercent(value: number, base: number) {
  if (base <= 0) {
    return 0;
  }

  return (value / base) * 100;
}

function numberFromRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
