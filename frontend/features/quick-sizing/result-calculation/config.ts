import type { DemandChargeReferenceBand, EpcRateBand, EquipmentCostCatalogItem, ResultCalculationConfig } from "./types";

export const DEFAULT_EPC_RATE_BANDS: EpcRateBand[] = [
  { minEquipmentCostVnd: 0, maxEquipmentCostVnd: 5_000_000_000, ratePct: 22 },
  { minEquipmentCostVnd: 5_000_000_000, maxEquipmentCostVnd: 10_000_000_000, ratePct: 18 },
  { minEquipmentCostVnd: 10_000_000_000, maxEquipmentCostVnd: 20_000_000_000, ratePct: 15 },
  { minEquipmentCostVnd: 20_000_000_000, maxEquipmentCostVnd: 50_000_000_000, ratePct: 12 },
  { minEquipmentCostVnd: 50_000_000_000, maxEquipmentCostVnd: null, ratePct: 10 }
];

export const DEFAULT_EPC_VOLTAGE_ADJUSTMENTS_PCT: Record<string, number> = {
  "Hạ áp": 0,
  "Trung áp": 2,
  "Cao áp": 4,
  "Chưa xác định": 2
};

export const DEFAULT_EPC_SCOPE_ITEMS = [
  "BOS",
  "EMS cơ bản",
  "Đấu nối điện cơ bản",
  "Hệ thống PCCC",
  "Móng và xây dựng cơ bản",
  "Vận chuyển và lắp đặt",
  "Testing và commissioning",
  "Hồ sơ nghiệm thu cơ bản",
  "Contingency"
];

export const DEFAULT_BATTERY_DC_PACKAGE_COST: EquipmentCostCatalogItem = {
  unit: "VND/kWh danh định",
  optimistic: 2_400_000,
  base: 3_000_000,
  conservative: 3_600_000,
  scopeIncluded: [
    "Cell pin",
    "Module hoặc rack",
    "Battery Management System - BMS",
    "Container hoặc cabinet pin",
    "HVAC bên trong container/cabinet",
    "Bảo vệ điện nội bộ",
    "Hệ thống phát hiện và chữa cháy bên trong container pin",
    "Giám sát nội bộ của battery package",
    "Bảo hành thiết bị tiêu chuẩn",
    "Đóng gói và vận chuyển cơ bản đến dự án nếu catalog quy định"
  ],
  scopeExcluded: [
    "PCS",
    "Máy biến áp",
    "Tủ trung áp",
    "Cáp và đấu nối ngoài hiện trường",
    "EMS cấp nhà máy",
    "SCADA",
    "Móng và xây dựng",
    "Lắp đặt",
    "Testing/commissioning toàn hệ thống",
    "EPC ngoài hiện trường"
  ],
  notes: [
    "Ước tính sơ bộ cho Quick Sizing, chưa phải báo giá nhà cung cấp.",
    "Không cộng lại BMS, container, HVAC hoặc chữa cháy nội bộ container trong EPC."
  ]
};

export const DEFAULT_PCS_EQUIPMENT_COST: EquipmentCostCatalogItem = {
  unit: "VND/kW AC",
  optimistic: 1_100_000,
  base: 1_500_000,
  conservative: 2_000_000,
  scopeIncluded: [
    "Bộ biến đổi công suất hai chiều",
    "Tủ điều khiển cơ bản của PCS",
    "Bảo vệ nội bộ PCS",
    "Giao tiếp cơ bản của PCS",
    "Bảo hành thiết bị tiêu chuẩn"
  ],
  scopeExcluded: [
    "Máy biến áp",
    "Tủ đóng cắt trung áp",
    "Cáp ngoài hiện trường",
    "EMS/SCADA cấp nhà máy",
    "Đấu nối lưới",
    "Lắp đặt",
    "Commissioning toàn hệ thống",
    "EPC"
  ],
  notes: [
    "Ước tính sơ bộ cho Quick Sizing, chưa phải báo giá nhà cung cấp.",
    "Không cộng lại PCS equipment trong EPC."
  ]
};

export const DEFAULT_FRONTEND_COST_MODEL = {
  version: "equipment-cost-catalog-preliminary-v1",
  effectiveDate: "2026-07-22",
  status: "preliminary",
  sourceName: "frontend_fallback",
  currency: "VND",
  batteryDcPackage: DEFAULT_BATTERY_DC_PACKAGE_COST,
  pcsEquipment: DEFAULT_PCS_EQUIPMENT_COST,
  epcMinRatePct: 8,
  epcMaxRatePct: 30,
  includeVatInCapexDefault: false,
  vatPctFallback: 10,
  rateBands: DEFAULT_EPC_RATE_BANDS,
  voltageAdjustmentsPct: DEFAULT_EPC_VOLTAGE_ADJUSTMENTS_PCT,
  scopeItems: DEFAULT_EPC_SCOPE_ITEMS
};

export const DEFAULT_DEMAND_CHARGE_REFERENCE_BANDS: DemandChargeReferenceBand[] = [
  {
    code: "gte_110kv",
    label: "U >= 110 kV",
    minVoltageKv: 110,
    maxVoltageKv: null,
    priceVndPerKwMonth: 209_459,
    status: "trial_reference",
    sourceName: "EVN two-component retail tariff paper pilot",
    sourceDate: null,
    notes: ["Trial paper reference; verify against invoice or contract before use."]
  },
  {
    code: "22_to_lt_110kv",
    label: "22 kV <= U < 110 kV",
    minVoltageKv: 22,
    maxVoltageKv: 110,
    priceVndPerKwMonth: 235_414,
    status: "trial_reference",
    sourceName: "EVN two-component retail tariff paper pilot",
    sourceDate: null,
    notes: ["Trial paper reference; verify against invoice or contract before use."]
  },
  {
    code: "6_to_lt_22kv",
    label: "6 kV <= U < 22 kV",
    minVoltageKv: 6,
    maxVoltageKv: 22,
    priceVndPerKwMonth: 240_050,
    status: "trial_reference",
    sourceName: "EVN two-component retail tariff paper pilot",
    sourceDate: null,
    notes: ["Trial paper reference; verify against invoice or contract before use."]
  },
  {
    code: "lt_6kv",
    label: "U < 6 kV",
    minVoltageKv: null,
    maxVoltageKv: 6,
    priceVndPerKwMonth: 286_153,
    status: "trial_reference",
    sourceName: "EVN two-component retail tariff paper pilot",
    sourceDate: null,
    notes: ["Trial paper reference; verify against invoice or contract before use."]
  }
];

export const DEFAULT_DEMAND_CHARGE_CATALOG = {
  catalogVersion: "evn-two-component-tariff-paper-pilot-2025-v1",
  status: "trial_reference",
  sourceName: "EVN two-component retail tariff paper pilot",
  sourceDate: null,
  notes: [
    "Trial paper reference only, not a real invoice default.",
    "Do not assume this demand charge applies without invoice, contract, or utility notice confirmation.",
    "Pmax is measured according to the two-component tariff mechanism.",
    "Not an official default for all customers."
  ],
  referenceBands: DEFAULT_DEMAND_CHARGE_REFERENCE_BANDS
};

export const DEFAULT_RESULT_CALCULATION_CONFIG: ResultCalculationConfig = {
  version: "quick-sizing-step3-result-engine-v2-financing",
  effectiveDate: "2026-07-26",
  description: "Quick Sizing result engine with project FCFF, debt schedule, FCFE, equity metrics and DSCR.",
  candidate: {
    version: "candidate-grid-v2",
    powerMultipliers: [0.5, 0.75, 1, 1.25, 1.5],
    energyMultipliers: [0.5, 0.75, 1, 1.25, 1.5],
    powerStepKw: 25,
    energyStepKwh: 50,
    minDurationHours: 0.5,
    maxDurationHours: 8,
    minimumCandidateCount: 10
  },
  cost: {
    version: DEFAULT_FRONTEND_COST_MODEL.version,
    effectiveDate: DEFAULT_FRONTEND_COST_MODEL.effectiveDate,
    currency: DEFAULT_FRONTEND_COST_MODEL.currency,
    batteryDcPackage: DEFAULT_FRONTEND_COST_MODEL.batteryDcPackage,
    pcsEquipment: DEFAULT_FRONTEND_COST_MODEL.pcsEquipment,
    epcRateBands: DEFAULT_FRONTEND_COST_MODEL.rateBands,
    epcVoltageAdjustmentsPct: DEFAULT_FRONTEND_COST_MODEL.voltageAdjustmentsPct,
    epcMinRatePct: DEFAULT_FRONTEND_COST_MODEL.epcMinRatePct,
    epcMaxRatePct: DEFAULT_FRONTEND_COST_MODEL.epcMaxRatePct,
    epcScopeItems: DEFAULT_FRONTEND_COST_MODEL.scopeItems,
    costModelStatus: DEFAULT_FRONTEND_COST_MODEL.status,
    costModelSourceName: DEFAULT_FRONTEND_COST_MODEL.sourceName,
    includeVatInCapexDefault: DEFAULT_FRONTEND_COST_MODEL.includeVatInCapexDefault,
    vatPctFallback: DEFAULT_FRONTEND_COST_MODEL.vatPctFallback
  },
  dispatch: {
    version: "dispatch-allocation-v2",
    // TODO: business confirmation required. Use Step 1/2 peak profile when available.
    defaultPeakEventDurationHours: 2,
    // TODO: business confirmation required. Peak event frequency drives annual event count only.
    defaultPeakEventFrequencyPerOperatingDay: 0.6,
    minimumPeakCoveragePct: 95,
    demandChargeMonthsPerYear: 12,
    peakShavingRealizationFactor: 0.85,
    pvRealizationFactor: 0.9,
    defaultPvSurplusRatio: 0.2,
    defaultExportTariff: 0,
    backupReserveRatioOfEnergy: 0,
    // TODO: business confirmation required. Peak shaving recharge mix should come from dispatch profile.
    peakShavingChargeShares: { low: 0.8, normal: 0.2, peak: 0 },
    arbitrageChargeShares: { low: 0.8, normal: 0.2, peak: 0 },
    arbitrageDischargeShares: { low: 0, normal: 0.2, peak: 0.8 }
  },
  demandCharge: DEFAULT_DEMAND_CHARGE_CATALOG,
  finance: {
    depreciationYears: 10,
    replacementYear: null,
    replacementCostVnd: 0,
    replacementRateOfInitialBatteryCost: 0,
    terminalValueVnd: 0,
    salvageValueRate: 0,
    decommissioningCostVnd: 0
  },
  recommendation: {
    version: "recommendation-score-v1",
    weights: {
      npv: 0.3,
      irr: 0.2,
      saving: 0.25,
      capex: 0.15,
      payback: 0.1
    },
    requirePositiveNpv: true,
    requireIrrAboveWacc: true,
    requirePayback: true,
    materiallyOverBudgetPenalty: 0.35,
    slightlyOverBudgetPenalty: 0.12,
    missingIrrPenalty: 0.2,
    missingPaybackPenalty: 0.25
  },
  budget: {
    slightlyOverThreshold: 0.1
  },
  confidence: {
    missingLoadPenalty: 18,
    missingPvPenalty: 10,
    missingPmaxPenalty: 12,
    fallbackPenalty: 8,
    dataConflictPenalty: 15
  },
  scenarios: [
    {
      id: "conservative",
      batteryCostMultiplier: DEFAULT_BATTERY_DC_PACKAGE_COST.conservative / DEFAULT_BATTERY_DC_PACKAGE_COST.base,
      pcsCostMultiplier: DEFAULT_PCS_EQUIPMENT_COST.conservative / DEFAULT_PCS_EQUIPMENT_COST.base,
      rteDeltaPct: -3,
      degradationDeltaPct: 0.5,
      energyTariffEscalationDeltaPct: -2,
      demandTariffEscalationDeltaPct: -2,
      waccDeltaPct: 2,
      peakShavingRealizationFactor: 0.75,
      pvRealizationFactor: 0.75,
      replacementCostMultiplier: 1.1
    },
    {
      id: "base",
      batteryCostMultiplier: 1,
      pcsCostMultiplier: 1,
      rteDeltaPct: 0,
      degradationDeltaPct: 0,
      energyTariffEscalationDeltaPct: 0,
      demandTariffEscalationDeltaPct: 0,
      waccDeltaPct: 0,
      peakShavingRealizationFactor: 0.85,
      pvRealizationFactor: 0.9,
      replacementCostMultiplier: 1
    },
    {
      id: "optimistic",
      batteryCostMultiplier: DEFAULT_BATTERY_DC_PACKAGE_COST.optimistic / DEFAULT_BATTERY_DC_PACKAGE_COST.base,
      pcsCostMultiplier: DEFAULT_PCS_EQUIPMENT_COST.optimistic / DEFAULT_PCS_EQUIPMENT_COST.base,
      rteDeltaPct: 2,
      degradationDeltaPct: -0.4,
      energyTariffEscalationDeltaPct: 2,
      demandTariffEscalationDeltaPct: 2,
      waccDeltaPct: -1.5,
      peakShavingRealizationFactor: 0.95,
      pvRealizationFactor: 1,
      replacementCostMultiplier: 0.9
    }
  ]
};
