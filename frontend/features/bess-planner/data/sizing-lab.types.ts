export type SizingLabCandidate = {
  id: string;
  energy_kwh: number;
  power_kw: number;
  duration_hours: number;
  c_rate: number;
  usable_energy_kwh: number;
  capex_vnd: number;
  annual_opex_vnd: number;
  annual_saving_vnd: number;
  annual_saving_realized_vnd: number;
  annual_saving_pct: number;
  tou_saving_vnd: number;
  demand_saving_vnd: number;
  pv_saving_vnd: number;
  npv_vnd: number;
  npv_realized_vnd: number;
  roi: number;
  payback_years: number | null;
  payback_realized_years: number | null;
  pmax_kw: number;
  contract_pmax_kw: number;
  peak_reduction_kw: number;
  peak_reduction_pct: number;
  efc_per_day: number;
  lifespan_years: number;
  on_pareto: boolean;
  selected: boolean;
};

export type SizingLabScenario = {
  key: string;
  label: string;
  capex_vnd: number;
  annual_opex_vnd: number;
  npv_vnd: number;
  roi: number;
  payback_years: number | null;
  cashflows: Array<{
    year: number;
    net_cashflow_vnd: number;
    cumulative_vnd: number;
  }>;
};

export type SizingLabResult = {
  stage: "sizing_lab";
  ready_for_optimization: boolean;
  optimizer_executed: boolean;
  optimizer_status: string;
  calculation_method: string;
  summary: {
    site_peak_kw: number;
    net_peak_kw: number;
    annual_load_energy_kwh: number;
    annual_pv_energy_kwh: number;
    base_annual_bill_vnd: number;
    candidate_count: number;
    pareto_count: number;
    analysis_years: number;
  };
  selected: SizingLabCandidate;
  candidates: SizingLabCandidate[];
  pareto_candidate_ids: string[];
  planning: {
    candidate_id: string;
    scenarios: SizingLabScenario[];
    break_even_capex_vnd: number;
    pmax_risk: {
      p50_kw: number;
      p95_kw: number;
      max_kw: number;
      no_bess_kw: number;
      risk_level: string;
    };
    longevity: {
      efc_per_day: number;
      efc_per_year: number;
      estimated_lifespan_years: number;
      remaining_capacity_pct_at_horizon: number;
    };
    day_types: Array<{
      key: string;
      label: string;
      days: number;
      average_saving_vnd: number;
      p10_vnd: number;
      p90_vnd: number;
    }>;
    details: Array<{
      candidate_id: string;
      energy_kwh: number;
      power_kw: number;
      annual_saving_vnd: number;
      npv_vnd: number;
      payback_years: number | null;
      scenarios: SizingLabScenario[];
      break_even_capex_vnd: number;
      pmax_risk: {
        p50_kw: number;
        p95_kw: number;
        max_kw: number;
        no_bess_kw: number;
        risk_level: string;
      };
      longevity: {
        efc_per_day: number;
        efc_per_year: number;
        estimated_lifespan_years: number;
        remaining_capacity_pct_at_horizon: number;
      };
      day_types: Array<{
        key: string;
        label: string;
        days: number;
        average_saving_vnd: number;
        p10_vnd: number;
        p90_vnd: number;
      }>;
      monthly: Array<{
        month: string | number;
        days: number;
        peak_load_kw: number;
        pmax_after_bess_kw: number;
        contract_pmax_kw: number;
        saving_month_vnd: number;
        annualized_saving_vnd: number;
        candidate_id: string;
        energy_kwh: number;
        power_kw: number;
      }>;
    }>;
  };
  comparison: {
    candidate_id: string;
    modes: Array<{
      key: string;
      label: string;
      annual_bill_vnd: number;
      annual_saving_vnd: number;
      annual_saving_realized_vnd: number;
      npv_vnd: number;
      roi: number;
      payback_years: number | null;
      payback_realized_years: number | null;
      pmax_kw: number;
    }>;
    peak_shaving_contribution_vnd: number;
    peak_shaving_contribution_pct: number;
  };
  monthly: Array<{
    month: string | number;
    days: number;
    peak_load_kw: number;
    pmax_after_bess_kw: number;
    contract_pmax_kw: number;
    saving_month_vnd: number;
    annualized_saving_vnd: number;
    candidate_id: string;
    energy_kwh: number;
    power_kw: number;
  }>;
  selected_monthly: Array<{
    month: string | number;
    days: number;
    peak_load_kw: number;
    pmax_after_bess_kw: number;
    contract_pmax_kw: number;
    saving_month_vnd: number;
    annualized_saving_vnd: number;
    candidate_id: string;
    energy_kwh: number;
    power_kw: number;
  }>;
  parity: {
    profile: string;
    migrated_legacy_configuration: boolean;
    billing_mode: string;
    peak_price_vnd_per_kwh: number;
    normal_price_vnd_per_kwh: number;
    offpeak_price_vnd_per_kwh: number;
    demand_charge_vnd_per_kw_month: number;
    peak_windows: string;
    offpeak_windows: string;
    battery_cost_vnd_per_kwh: number;
    pcs_cost_vnd_per_kw: number;
    opex_pct: number;
    discount_rate_pct: number;
    analysis_years: number;
    realization_rate_pct: number;
  };
  input_quality: {
    load: Record<string, unknown>;
    pv: Record<string, unknown> | null;
    timezone: string;
    configured_units: { load: string; pv: string };
  };
  assumptions: Record<string, number>;
  warnings: string[];
  blockers: string[];
  next_step: string;
};

export function isSizingLabResult(value: unknown): value is SizingLabResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.stage === "sizing_lab"
    && record.optimizer_executed === true
    && record.calculation_method === "oracle_lp_pf_pareto_slsm"
    && Boolean(record.parity)
    && Boolean(record.selected);
}
