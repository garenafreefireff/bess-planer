from __future__ import annotations

from dataclasses import asdict, dataclass, field, is_dataclass
from enum import StrEnum
from typing import TypeAlias, TypeVar

JSONScalar: TypeAlias = str | int | float | bool | None
JSONValue: TypeAlias = JSONScalar | list["JSONValue"] | dict[str, "JSONValue"]
T = TypeVar("T")


class ValueSource(StrEnum):
    USER_INPUT = "user_input"
    CALCULATED = "calculated"
    LOOKUP = "lookup"
    SCENARIO_DEFAULT = "scenario_default"


class WarningSeverity(StrEnum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class DemandChargeApplicability(StrEnum):
    APPLICABLE = "applicable"
    NOT_APPLICABLE = "not_applicable"
    UNKNOWN = "unknown"


class DemandChargeMode(StrEnum):
    INVOICE = "invoice"
    MANUAL = "manual"
    REFERENCE = "reference"


class DetailedVoltageBand(StrEnum):
    GTE_110KV = "gte_110kv"
    BAND_22_TO_LT_110KV = "22_to_lt_110kv"
    BAND_6_TO_LT_22KV = "6_to_lt_22kv"
    LT_6KV = "lt_6kv"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class CalculationWarning:
    code: str
    severity: WarningSeverity
    message: str
    blocking: bool = False
    field: str | None = None


@dataclass(frozen=True)
class CalculationTraceItem:
    formula_id: str
    description: str
    inputs: dict[str, JSONValue]
    output: dict[str, JSONValue]


@dataclass(frozen=True)
class DerivedValue:
    value: JSONValue
    source: ValueSource
    formula_id: str | None = None
    dependencies: tuple[str, ...] = ()
    config_version: str | None = None


@dataclass(frozen=True)
class QuickSizingInput:
    industry: str
    estimated_load_range: str
    monthly_electricity_bill: float | None
    voltage_level: str
    operating_hours_per_day: float | None
    operating_days_per_week: float | None
    shift_pattern: str
    bess_objectives: tuple[str, ...]
    currency: str = "VND"
    custom_industry: str | None = None
    solar_status: str = "unknown"
    solar_capacity_value: float | None = None
    solar_capacity_unit: str | None = None
    solar_monthly_generation_value: float | None = None
    solar_monthly_generation_unit: str | None = None
    export_policy: str | None = None
    solar_objectives: tuple[str, ...] = ()
    backup_critical_load_pct: float | None = None
    backup_duration_hours: float | None = None
    estimated_peak_demand_kw: float | None = None
    target_peak_reduction_type: str | None = None
    target_peak_reduction_value: float | None = None
    budget_range: str = "Chưa xác định"
    custom_budget: float | None = None
    demand_charge_applicability: str = DemandChargeApplicability.UNKNOWN.value
    demand_charge_mode: str = DemandChargeMode.REFERENCE.value
    detailed_voltage_band: str = DetailedVoltageBand.UNKNOWN.value
    demand_charge_input_vnd_per_kw_month: float | None = None
    demand_charge_evidence_note: str | None = None


@dataclass(frozen=True)
class NormalizedQuickSizingInput:
    industry: str
    effective_industry: str
    estimated_load_range: str
    monthly_electricity_bill: float | None
    currency: str
    voltage_level: str
    operating_hours_per_day: float | None
    operating_days_per_week: float | None
    shift_pattern: str
    solar_status: str
    solar_capacity_kw: float | None
    solar_monthly_generation_kwh: float | None
    export_policy: str | None
    solar_objectives: tuple[str, ...]
    bess_objectives: tuple[str, ...]
    backup_critical_load_pct: float | None
    backup_duration_hours: float | None
    estimated_peak_demand_kw: float | None
    target_peak_reduction_type: str | None
    target_peak_reduction_value: float | None
    budget_range: str
    custom_budget: float | None
    budget_max: float | None
    demand_charge_applicability: str
    demand_charge_mode: str
    detailed_voltage_band: str
    demand_charge_input_vnd_per_kw_month: float | None
    demand_charge_evidence_note: str | None


@dataclass(frozen=True)
class TouShares:
    low: float
    normal: float
    peak: float
    source: ValueSource = ValueSource.LOOKUP
    config_version: str | None = None


@dataclass(frozen=True)
class TariffPlan:
    customer_group: str
    voltage_level: str
    tariff_plan_code: str
    currency: str
    low_price: float
    normal_price: float
    peak_price: float
    demand_charge_per_kw: float
    demand_charge_applicability: str
    demand_charge_mode: str
    detailed_voltage_band: str
    demand_charge_input_vnd_per_kw_month: float | None
    demand_charge_reference_vnd_per_kw_month: float | None
    effective_demand_charge_vnd_per_kw_month: float
    demand_charge_status: str
    demand_charge_source: str
    demand_charge_catalog_version: str
    demand_charge_evidence_note: str | None
    demand_charge_reference_bands: tuple[dict[str, JSONValue], ...]
    demand_saving_included_in_base_npv: bool
    vat_pct: float
    confidence: str
    source: ValueSource = ValueSource.LOOKUP
    config_version: str | None = None


@dataclass(frozen=True)
class LoadEstimation:
    monthly_electricity_kwh: float
    operating_days_per_year: float
    operating_days_per_month: float
    operating_hours_per_month: float
    operating_hours_per_year: float
    average_power_kw: float
    calculated_peak_demand_kw: float
    final_peak_demand_kw: float
    load_factor: float
    tariff_average: float
    bill_energy: float
    tou_shares: TouShares
    tariff_plan: TariffPlan


@dataclass(frozen=True)
class ObjectiveSizingResult:
    objective: str
    applicable: bool
    power_kw: float
    energy_kwh: float
    duration_hours: float
    assumptions_used: tuple[str, ...]
    warnings: tuple[CalculationWarning, ...] = ()
    source: str | None = None


@dataclass(frozen=True)
class CombinedSizingResult:
    power_kw: float
    energy_kwh: float
    duration_hours: float
    usable_energy_kwh: float
    cycles_per_day: float
    dominant_power_objective: str | None
    dominant_energy_objective: str | None
    selected_objectives: tuple[str, ...]
    objective_sizing_results: tuple[ObjectiveSizingResult, ...]


@dataclass(frozen=True)
class TechnicalAssumptions:
    power_kw: float
    energy_kwh: float
    duration_hours: float
    usable_energy_kwh: float
    peak_event_duration_hours: float
    peak_event_frequency_per_operating_day: float
    minimum_peak_coverage_pct: float
    dod_pct: float
    rte_pct: float
    degradation_pct: float
    cycles_per_day: float
    operating_days_per_year: float
    power_margin_pct: float
    energy_margin_pct: float
    backup_reserve_policy: str


@dataclass(frozen=True)
class UnitCostMetadata:
    value: float
    unit: str
    status: str
    source: str
    scope_included: tuple[str, ...]
    scope_excluded: tuple[str, ...]
    notes: tuple[str, ...]
    catalog_version: str
    scenario_values: dict[str, float]


@dataclass(frozen=True)
class CapexBreakdown:
    battery_cost: float
    battery_unit_cost: UnitCostMetadata
    pcs_cost: float
    pcs_unit_cost: UnitCostMetadata
    equipment_cost: float
    epc_base_rate_pct: float
    epc_voltage_adjustment_pct: float
    epc_applied_rate_pct: float
    epc_all_in_cost: float
    epc_scope_items: tuple[str, ...]
    epc_rate_bands: tuple[dict[str, float | None], ...]
    epc_voltage_adjustments_pct: dict[str, float]
    epc_min_rate_pct: float
    epc_max_rate_pct: float
    epc_mode: str
    epc_manual_rate_pct: float | None
    include_vat_in_capex: bool
    vat_amount: float
    capex_excluding_vat: float
    total_capex: float
    first_year_om: float
    currency: str
    cost_model_status: str
    cost_catalog_version: str
    cost_model_source_name: str


@dataclass(frozen=True)
class BudgetOption:
    power_kw: float
    energy_kwh: float
    duration_hours: float
    capex: float
    feasible: bool


@dataclass(frozen=True)
class BudgetEvaluation:
    budget_max: float | None
    technical_capex: float
    budget_gap: float | None
    overrun_pct: float | None
    status: str
    technical_option: BudgetOption
    budget_option: BudgetOption | None
    currency: str


@dataclass(frozen=True)
class QuickSizingResult:
    normalized_input: NormalizedQuickSizingInput
    inherited_data: dict[str, JSONValue]
    load_estimation: LoadEstimation
    objective_sizing: tuple[ObjectiveSizingResult, ...]
    technical_assumptions: TechnicalAssumptions
    cost_assumptions: CapexBreakdown
    tariff_assumptions: TariffPlan
    financial_assumptions: dict[str, JSONValue]
    budget_evaluation: BudgetEvaluation
    warnings: tuple[CalculationWarning, ...]
    calculation_trace: tuple[CalculationTraceItem, ...]
    config_versions: dict[str, JSONValue]
    derived_values: dict[str, DerivedValue] = field(default_factory=dict)

    def to_dict(self) -> dict[str, JSONValue]:
        return _jsonable(asdict(self))


def _jsonable(value: object) -> JSONValue:
    if isinstance(value, StrEnum):
        return value.value
    if is_dataclass(value):
        return _jsonable(asdict(value))
    if isinstance(value, tuple | list):
        return [_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _jsonable(item) for key, item in value.items()}
    if isinstance(value, int | float | str | bool) or value is None:
        return value
    return str(value)
