export type ResultSeverity = "info" | "warning" | "error";
export type ResultSource = "user_input" | "calculated" | "lookup" | "scenario_default" | "fallback";
export type BudgetStatus = "within_budget" | "slightly_over" | "materially_over" | "not_defined";
export type IrrStatus = "available" | "not_available";
export type PaybackStatus = "within_horizon" | "beyond_analysis_horizon" | "not_available";
export type ConfidenceLevel = "high" | "medium" | "preliminary" | "low";
export type ScenarioId = "conservative" | "base" | "optimistic";
export type EpcMode = "auto" | "manual";
export type DemandChargeApplicability = "applicable" | "not_applicable" | "unknown";
export type DemandChargeMode = "invoice" | "manual" | "reference";
export type DetailedVoltageBand =
  | "gte_110kv"
  | "22_to_lt_110kv"
  | "6_to_lt_22kv"
  | "lt_6kv"
  | "low_voltage_step1_default"
  | "medium_voltage_broad_default"
  | "high_voltage_step1_default"
  | "unknown";

export type TraceValue = string | number | boolean | null | TraceValue[] | { [key: string]: TraceValue };

export type CalculationTraceItem = {
  formulaId: string;
  title: string;
  formula: string;
  inputs: Record<string, TraceValue>;
  output: TraceValue;
  unit?: string;
  source: ResultSource;
  configVersion?: string;
};

export type ResultWarning = {
  code: string;
  severity: ResultSeverity;
  field?: string;
  candidateId?: string;
  message: string;
  blocking: boolean;
};

export type EpcRateBand = {
  minEquipmentCostVnd: number;
  maxEquipmentCostVnd: number | null;
  ratePct: number;
};

export type EquipmentCostCatalogItem = {
  unit: string;
  optimistic: number;
  base: number;
  conservative: number;
  scopeIncluded: string[];
  scopeExcluded: string[];
  notes: string[];
};

export type EquipmentUnitCostMetadata = {
  value: number;
  unit: string;
  status: string;
  source: string;
  scopeIncluded: string[];
  scopeExcluded: string[];
  notes: string[];
  catalogVersion: string;
  scenarioValues: {
    optimistic: number;
    base: number;
    conservative: number;
  };
};

export type DemandChargeReferenceBand = {
  code: Exclude<DetailedVoltageBand, "unknown">;
  label: string;
  minVoltageKv: number | null;
  maxVoltageKv: number | null;
  priceVndPerKwMonth: number;
  status: string;
  sourceName: string;
  sourceDate: string | null;
  notes: string[];
};

export type Step2Assumptions = {
  powerKw: number;
  energyKwh: number;
  dodPct: number;
  rtePct: number;
  degradationPct: number;
  cyclesPerDay: number;
  operatingDaysPerYear: number;
  peakEventDurationHours: number;
  peakEventFrequencyPerOperatingDay: number;
  minimumPeakCoveragePct: number;
  batteryCostPerKwh: number;
  batteryCostMetadata: EquipmentUnitCostMetadata;
  pcsCostPerKw: number;
  pcsCostMetadata: EquipmentUnitCostMetadata;
  epcMode: EpcMode;
  epcManualRatePct: number | null;
  epcRateBands: EpcRateBand[];
  epcVoltageAdjustmentsPct: Record<string, number>;
  epcMinRatePct: number;
  epcMaxRatePct: number;
  epcScopeItems: string[];
  costModelStatus: string;
  costCatalogVersion: string;
  costModelSourceName: string;
  voltageLevel: string;
  vatPct?: number;
  includeVatInCapex: boolean;
  omPct: number;
  omGrowthPct: number;
  offPeakPrice: number;
  normalPrice: number;
  peakPrice: number;
  demandChargeApplicability: DemandChargeApplicability;
  demandChargeMode: DemandChargeMode;
  detailedVoltageBand: DetailedVoltageBand;
  demandChargeInputVndPerKwMonth: number | null;
  demandChargeReferenceVndPerKwMonth: number | null;
  effectiveDemandChargeVndPerKwMonth: number;
  demandChargeStatus: string;
  demandChargeSource: string;
  demandChargeVoltageBand?: DetailedVoltageBand;
  demandChargeCatalogVersion: string;
  demandChargeEvidenceNote: string | null;
  demandChargeReferenceBands: DemandChargeReferenceBand[];
  demandSavingIncludedInBaseNpv: boolean;
  exportTariff?: number;
  priceEscalationPct: number;
  demandTariffEscalationPct?: number;
  exportTariffEscalationPct?: number;
  debtPct: number;
  interestPct: number;
  loanTenorYears: number;
  waccPct: number;
  taxPct: number;
  analysisYears: number;
  budgetMax?: number | null;
  finalPeakDemandKw?: number | null;
  targetPeakReductionType?: "percent" | "kw" | null;
  targetPeakReductionValue?: number | null;
  solarCapacityKw?: number | null;
  solarMonthlyGenerationKwh?: number | null;
  pvSurplusRatio?: number | null;
  exportPolicy?: string | null;
  touShares?: {
    low: number;
    normal: number;
    peak: number;
  };
  selectedObjectives?: string[];
};

export type BasicInfoForResult = {
  bessObjectives?: string[];
  solarStatus?: "yes" | "none" | "planned" | "unknown";
  solarCapacityValue?: number | null;
  solarCapacityUnit?: string | null;
  solarMonthlyGenerationValue?: number | null;
  solarMonthlyGenerationUnit?: string | null;
  exportPolicy?: string | null;
  solarObjectives?: string[];
  estimatedPeakDemandKw?: number | null;
  targetPeakReductionType?: "percent" | "kw";
  targetPeakReductionValue?: number | null;
  budgetRange?: string;
  customBudgetVnd?: number | null;
};

export type GeneratedCandidate = {
  id: string;
  powerKw: number;
  energyKwh: number;
  nominalDurationHours: number;
  designObjective?: string | null;
  designPeakEventDurationHours?: number | null;
  targetPeakReductionKw?: number | null;
  usableAcEnergyPerEventKwh?: number | null;
  energyLimitedPeakReductionKw?: number | null;
  powerLimitedPeakReductionKw?: number | null;
  effectivePeakReductionKw?: number | null;
  technicalCoveragePct?: number | null;
  meetsPeakReductionTarget?: boolean | null;
  deliverableDurationAtReducedPeakHours?: number | null;
  warnings: ResultWarning[];
};

export type CapexBreakdown = {
  batteryCostVnd: number;
  batteryUnitCost: EquipmentUnitCostMetadata;
  pcsCostVnd: number;
  pcsUnitCost: EquipmentUnitCostMetadata;
  equipmentCostVnd: number;
  epcBaseRatePct: number;
  epcVoltageAdjustmentPct: number;
  epcAppliedRatePct: number;
  epcAllInVnd: number;
  vatVnd: number;
  capexExcludingVatVnd: number;
  totalCapexVnd: number;
  epcScopeItems: string[];
  costModelStatus: string;
  costCatalogVersion: string;
  costModelSourceName: string;
  includeVatInCapex: boolean;
  omBaseCapexVnd: number;
  depreciableCapexVnd: number;
  currency: string;
};

export type EnergyYearResult = {
  year: number;
  availableCapacityKwh: number;
  usableBatteryEnergyDcKwh: number;
  dischargedEnergyAcKwh: number;
  chargedEnergyAcKwh: number;
};

export type DispatchAllocation = {
  backupReserveEnergyKwh: number;
  pvChargedEnergyKwh: number;
  gridChargedEnergyKwh: number;
  peakShavingDischargeEnergyKwh: number;
  peakShavingDischargeEnergyPerEventKwh: number;
  peakShavingDischargeEnergyAnnualKwh: number;
  peakShavingGridChargeEnergyAnnualKwh: number;
  effectivePeakReductionKw: number;
  annualPeakEventCount: number;
  arbitrageGridChargeEnergyAnnualKwh: number;
  arbitrageDischargeEnergyKwh: number;
  warnings: ResultWarning[];
};

export type YearlyResult = {
  year: number;
  availableCapacityKwh: number;
  dischargedEnergyAcKwh: number;
  chargedEnergyAcKwh: number;
  backupReserveEnergyKwh: number;
  pvChargedEnergyKwh: number;
  gridChargedEnergyKwh: number;
  peakShavingDischargeEnergyKwh: number;
  peakShavingDischargeEnergyPerEventKwh: number;
  peakShavingDischargeEnergyAnnualKwh: number;
  peakShavingGridChargeEnergyAnnualKwh: number;
  effectivePeakReductionKw: number;
  annualPeakEventCount: number;
  arbitrageGridChargeEnergyAnnualKwh: number;
  arbitrageDischargeEnergyKwh: number;
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
  omVnd: number;
  depreciationVnd: number;
  taxableIncomeVnd: number;
  taxVnd: number;
  replacementVnd: number;
  terminalValueVnd: number;
  chargingCostVnd: number;
  debtDrawdownVnd: number;
  openingDebtVnd: number;
  scheduledPrincipalRepaymentVnd: number;
  balloonRepaymentVnd: number;
  principalRepaymentVnd: number;
  interestExpenseVnd: number;
  debtServiceVnd: number;
  closingDebtVnd: number;
  taxAfterInterestVnd: number;
  interestTaxShieldVnd: number;
  cfadsVnd: number;
  dscr: number | null;
  equityCashFlowVnd: number;
  cumulativeEquityCashFlowVnd: number;
  discountedEquityCashFlowVnd: number;
  fcffVnd: number;
  cumulativeCashFlowVnd: number;
  discountedCashFlowVnd: number;
};

export type BudgetEvaluation = {
  budgetMaxVnd: number | null;
  budgetGapVnd: number | null;
  overrunPercent: number | null;
  status: BudgetStatus;
};

export type SizingCandidateResult = {
  id: string;
  powerKw: number;
  energyKwh: number;
  nominalDurationHours: number;
  usableDurationHours?: number;
  designObjective: string | null;
  designPeakEventDurationHours: number | null;
  targetPeakReductionKw: number | null;
  usableAcEnergyPerEventKwh: number | null;
  energyLimitedPeakReductionKw: number | null;
  powerLimitedPeakReductionKw: number | null;
  effectivePeakReductionKw: number | null;
  technicalCoveragePct: number | null;
  meetsPeakReductionTarget: boolean | null;
  deliverableDurationAtReducedPeakHours: number | null;
  capex: CapexBreakdown;
  yearlyResults: YearlyResult[];
  grossSavingYear1Vnd: number;
  netOperatingSavingYear1Vnd: number;
  npvVnd: number;
  irrPct: number | null;
  irrStatus: IrrStatus;
  paybackYears: number | null;
  paybackStatus: PaybackStatus;
  debtAmountVnd: number;
  equityInvestmentVnd: number;
  costOfEquityPct: number;
  totalInterestVnd: number;
  minimumDscr: number | null;
  averageDscr: number | null;
  equityNpvVnd: number;
  equityIrrPct: number | null;
  equityPaybackYears: number | null;
  npvPerCapex: number;
  lcosVndPerKwh: number | null;
  budgetEvaluation: BudgetEvaluation;
  isPareto: boolean;
  recommendationScore: number | null;
  warnings: ResultWarning[];
};

export type SizingOptionResult = SizingCandidateResult & {
  title: string;
  badge: string;
  role: "low" | "recommended" | "high";
};

export type FinancingRecommendationResult = SizingCandidateResult & {
  title: string;
  badge: string;
  role: "financing";
};

export type ParetoPoint = {
  candidateId: string;
  powerKw: number;
  energyKwh: number;
  annualSavingMillionVnd: number;
  npvOverCapex: number;
  isPareto: boolean;
  isRecommended: boolean;
};

export type MetricRange = {
  min: number | null;
  max: number | null;
};

export type ScenarioMetricRanges = {
  npvVnd: MetricRange;
  irrPct: MetricRange;
  paybackYears: MetricRange;
  equityNpvVnd: MetricRange;
  equityIrrPct: MetricRange;
  equityPaybackYears: MetricRange;
  minimumDscr: MetricRange;
  netOperatingSavingYear1Vnd: MetricRange;
  capexVnd: MetricRange;
};

export type ConfidenceResult = {
  score: number;
  level: ConfidenceLevel;
  reasons: string[];
};

export type ConfigVersionInfo = {
  resultEngine: string;
  candidate: string;
  cost: string;
  dispatch: string;
  recommendation: string;
  scenario: string;
};

export type QuickSizingResult = {
  generatedAt: string;
  analysisYears: number;
  scenario: ScenarioId;
  candidates: SizingCandidateResult[];
  paretoPoints: ParetoPoint[];
  lowCostOption: SizingOptionResult | null;
  recommendedOption: SizingOptionResult | null;
  financingRecommendedOption: FinancingRecommendationResult | null;
  highBenefitOption: SizingOptionResult | null;
  scenarioRanges: ScenarioMetricRanges;
  confidence: ConfidenceResult;
  warnings: ResultWarning[];
  calculationTrace: CalculationTraceItem[];
  configVersions: ConfigVersionInfo;
};

export type ResultScenarioConfig = {
  id: ScenarioId;
  batteryCostMultiplier: number;
  pcsCostMultiplier: number;
  rteDeltaPct: number;
  degradationDeltaPct: number;
  energyTariffEscalationDeltaPct: number;
  demandTariffEscalationDeltaPct: number;
  waccDeltaPct: number;
  peakShavingRealizationFactor: number;
  pvRealizationFactor: number;
  replacementCostMultiplier: number;
};

export type ResultCalculationConfig = {
  version: string;
  effectiveDate: string;
  description: string;
  candidate: {
    version: string;
    powerMultipliers: number[];
    energyMultipliers: number[];
    powerStepKw: number;
    energyStepKwh: number;
    minDurationHours: number;
    maxDurationHours: number;
    minimumCandidateCount: number;
  };
  cost: {
    version: string;
    effectiveDate: string;
    currency: string;
    batteryDcPackage: EquipmentCostCatalogItem;
    pcsEquipment: EquipmentCostCatalogItem;
    epcRateBands: EpcRateBand[];
    epcVoltageAdjustmentsPct: Record<string, number>;
    epcMinRatePct: number;
    epcMaxRatePct: number;
    epcScopeItems: string[];
    costModelStatus: string;
    costModelSourceName: string;
    includeVatInCapexDefault: boolean;
    vatPctFallback: number;
  };
  dispatch: {
    version: string;
    defaultPeakEventDurationHours: number;
    defaultPeakEventFrequencyPerOperatingDay: number;
    minimumPeakCoveragePct: number;
    demandChargeMonthsPerYear: number;
    peakShavingRealizationFactor: number;
    pvRealizationFactor: number;
    defaultPvSurplusRatio: number;
    defaultExportTariff: number;
    backupReserveRatioOfEnergy: number;
    peakShavingChargeShares: { low: number; normal: number; peak: number };
    arbitrageChargeShares: { low: number; normal: number; peak: number };
    arbitrageDischargeShares: { low: number; normal: number; peak: number };
  };
  demandCharge: {
    catalogVersion: string;
    status: string;
    sourceName: string;
    sourceDate: string | null;
    notes: string[];
    referenceBands: DemandChargeReferenceBand[];
  };
  finance: {
    depreciationYears: number;
    replacementYear: number | null;
    replacementCostVnd: number;
    replacementRateOfInitialBatteryCost: number;
    terminalValueVnd: number;
    salvageValueRate: number;
    decommissioningCostVnd: number;
  };
  recommendation: {
    version: string;
    weights: {
      npv: number;
      irr: number;
      saving: number;
      capex: number;
      payback: number;
    };
    requirePositiveNpv: boolean;
    requireIrrAboveWacc: boolean;
    requirePayback: boolean;
    materiallyOverBudgetPenalty: number;
    slightlyOverBudgetPenalty: number;
    missingIrrPenalty: number;
    missingPaybackPenalty: number;
  };
  budget: {
    slightlyOverThreshold: number;
  };
  confidence: {
    missingLoadPenalty: number;
    missingPvPenalty: number;
    missingPmaxPenalty: number;
    fallbackPenalty: number;
    dataConflictPenalty: number;
  };
  scenarios: ResultScenarioConfig[];
};
