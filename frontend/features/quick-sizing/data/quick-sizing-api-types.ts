export type CalculationWarning = {
  code: string;
  severity: "info" | "warning" | "error";
  field?: string | null;
  message: string;
  blocking: boolean;
};

export type DerivedValue<T> = {
  value: T;
  source: "user_input" | "calculated" | "lookup" | "scenario_default";
  formula_id?: string | null;
  dependencies?: string[];
  config_version?: string | null;
};

export type QuickSizingUnitCostMetadata = {
  value: number;
  unit: string;
  status: string;
  source: string;
  scope_included: string[];
  scope_excluded: string[];
  notes: string[];
  catalog_version: string;
  scenario_values?: {
    optimistic?: number;
    base?: number;
    conservative?: number;
  };
};

export type QuickSizingStep2Result = {
  normalized_input: Record<string, unknown>;
  inherited_data: Record<string, unknown>;
  load_estimation: {
    monthly_electricity_kwh: number;
    operating_days_per_year: number;
    operating_days_per_month: number;
    operating_hours_per_month: number;
    operating_hours_per_year: number;
    average_power_kw: number;
    calculated_peak_demand_kw: number;
    final_peak_demand_kw: number;
    load_factor: number;
    tariff_average: number;
    bill_energy: number;
    tou_shares: {
      low: number;
      normal: number;
      peak: number;
      source: string;
      config_version?: string | null;
    };
    tariff_plan: QuickSizingTariffAssumptions;
  };
  objective_sizing: ObjectiveSizingResult[];
  technical_assumptions: {
    power_kw: number;
    energy_kwh: number;
    duration_hours: number;
    usable_energy_kwh: number;
    peak_event_duration_hours?: number;
    peak_event_frequency_per_operating_day?: number;
    minimum_peak_coverage_pct?: number;
    dod_pct: number;
    rte_pct: number;
    degradation_pct: number;
    cycles_per_day: number;
    operating_days_per_year: number;
    power_margin_pct: number;
    energy_margin_pct: number;
    backup_reserve_policy: string;
  };
  cost_assumptions: {
    battery_cost: number;
    battery_unit_cost?: QuickSizingUnitCostMetadata | null;
    pcs_cost: number;
    pcs_unit_cost?: QuickSizingUnitCostMetadata | null;
    equipment_cost: number;
    epc_base_rate_pct: number;
    epc_voltage_adjustment_pct: number;
    epc_applied_rate_pct: number;
    epc_all_in_cost: number;
    epc_scope_items: string[];
    epc_rate_bands: Array<{
      min_equipment_cost: number;
      max_equipment_cost: number | null;
      rate_pct: number;
    }>;
    epc_voltage_adjustments_pct: Record<string, number>;
    epc_min_rate_pct: number;
    epc_max_rate_pct: number;
    epc_mode: "auto" | "manual";
    epc_manual_rate_pct: number | null;
    include_vat_in_capex: boolean;
    vat_amount: number;
    capex_excluding_vat: number;
    total_capex: number;
    first_year_om: number;
    currency: string;
    cost_model_status: string;
    cost_catalog_version: string;
    cost_model_source_name: string;
  };
  tariff_assumptions: QuickSizingTariffAssumptions;
  financial_assumptions: {
    price_escalation_pct: number;
    debt_pct: number;
    interest_pct: number;
    loan_tenor_years: number;
    wacc_pct: number;
    tax_pct: number;
    analysis_years: number;
    source: string;
    config_version: string;
  };
  budget_evaluation: {
    budget_max: number | null;
    technical_capex: number;
    budget_gap: number | null;
    overrun_pct: number | null;
    status: "unbounded" | "within_budget" | "over_budget";
    technical_option: BudgetOption;
    budget_option: BudgetOption | null;
    currency: string;
  };
  warnings: CalculationWarning[];
  calculation_trace: Array<Record<string, unknown>>;
  config_versions: Record<string, string>;
  derived_values: {
    power_kw?: DerivedValue<number>;
    energy_kwh?: DerivedValue<number>;
    final_peak_demand_kw?: DerivedValue<number>;
    tariff_average?: DerivedValue<number>;
    total_capex?: DerivedValue<number>;
  };
};

export type QuickSizingTariffAssumptions = {
  customer_group: string;
  voltage_level: string;
  tariff_plan_code: string;
  currency: string;
  low_price: number;
  normal_price: number;
  peak_price: number;
  demand_charge_per_kw?: number;
  demand_charge_applicability?: "applicable" | "not_applicable" | "unknown";
  demand_charge_mode?: "invoice" | "manual" | "reference";
  detailed_voltage_band?: "gte_110kv" | "22_to_lt_110kv" | "6_to_lt_22kv" | "lt_6kv" | "low_voltage_step1_default" | "medium_voltage_broad_default" | "high_voltage_step1_default" | "unknown";
  demand_charge_input_vnd_per_kw_month?: number | null;
  demand_charge_reference_vnd_per_kw_month?: number | null;
  effective_demand_charge_vnd_per_kw_month?: number;
  demand_charge_status?: string;
  demand_charge_source?: string;
  demand_charge_voltage_band?: "gte_110kv" | "22_to_lt_110kv" | "6_to_lt_22kv" | "lt_6kv" | "low_voltage_step1_default" | "medium_voltage_broad_default" | "high_voltage_step1_default" | "unknown";
  demand_charge_catalog_version?: string;
  demand_charge_evidence_note?: string | null;
  demand_charge_reference_bands?: Array<{
    code: "gte_110kv" | "22_to_lt_110kv" | "6_to_lt_22kv" | "lt_6kv";
    label: string;
    min_voltage_kv: number | null;
    max_voltage_kv: number | null;
    price_vnd_per_kw_month: number;
    status: string;
    source_name: string;
    source_date: string | null;
    notes: string[];
  }>;
  demand_saving_included_in_base_npv?: boolean;
  vat_pct: number;
  confidence: string;
  source: string;
  config_version?: string | null;
};

export type ObjectiveSizingResult = {
  objective: string;
  applicable: boolean;
  power_kw: number;
  energy_kwh: number;
  duration_hours: number;
  assumptions_used: string[];
  warnings: CalculationWarning[];
  source?: string | null;
};

export type BudgetOption = {
  power_kw: number;
  energy_kwh: number;
  duration_hours: number;
  capex: number;
  feasible: boolean;
};

export type QuickSizingAnalysisRun = {
  id: string | null;
  user_id: string | null;
  project_id?: string | null;
  bess_catalog_id?: string | null;
  analysis_type: "quick_sizing";
  status: "queued" | "running" | "completed" | "failed";
  progress_pct: number;
  input_snapshot: Record<string, unknown>;
  result: QuickSizingStep2Result;
  artifacts: Record<string, unknown>;
  engine_version: string;
  error?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};
