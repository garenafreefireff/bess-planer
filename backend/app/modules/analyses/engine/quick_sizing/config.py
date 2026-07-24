from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ScenarioProfile:
    version: str
    effective_date: str
    description: str
    availability: float
    dod_pct: float
    rte_pct: float
    degradation_pct: float
    power_margin_pct: float
    energy_margin_pct: float
    power_step_kw: float
    energy_step_kwh: float
    control_reserve: float
    peak_duration_hours: float
    peak_event_frequency_per_operating_day: float
    minimum_peak_coverage_pct: float
    discharge_window_saving_hours: float
    max_cycles_per_day: float
    backup_reserve_policy: str
    investment_default_ratio: float
    default_duration_hours: float
    quality_support_ratio: float
    quality_support_duration_hours: float
    target_duration_hours: float
    price_escalation_pct: float
    debt_pct: float
    interest_pct: float
    loan_tenor_years: int
    wacc_pct: float
    tax_pct: float
    analysis_years: int


@dataclass(frozen=True)
class EpcRateBand:
    min_equipment_cost: float
    max_equipment_cost: float | None
    rate_pct: float


@dataclass(frozen=True)
class EquipmentCostCatalogItem:
    unit: str
    optimistic: float
    base: float
    conservative: float
    scope_included: tuple[str, ...]
    scope_excluded: tuple[str, ...]
    notes: tuple[str, ...] = ()


@dataclass(frozen=True)
class CostCatalog:
    version: str
    effective_date: str
    description: str
    status: str
    source_name: str
    currency: str
    battery_dc_package: EquipmentCostCatalogItem
    pcs_equipment: EquipmentCostCatalogItem
    battery_cost_per_kwh: float
    pcs_cost_per_kw: float
    epc_rate_bands: tuple[EpcRateBand, ...]
    voltage_adjustments_pct: dict[str, float]
    epc_min_rate_pct: float
    epc_max_rate_pct: float
    epc_scope_items: tuple[str, ...]
    include_vat_in_capex_default: bool
    vat_pct: float
    om_pct: float


@dataclass(frozen=True)
class TariffReference:
    low_price: float
    normal_price: float
    peak_price: float
    vat_pct: float
    energy_tariff_status: str
    source_name: str


@dataclass(frozen=True)
class DemandChargeReferenceBand:
    code: str
    label: str
    min_voltage_kv: float | None
    max_voltage_kv: float | None
    price_vnd_per_kw_month: float
    status: str
    source_name: str
    source_date: str | None
    notes: tuple[str, ...]


@dataclass(frozen=True)
class DemandChargeCatalog:
    version: str
    status: str
    source_name: str
    source_date: str | None
    notes: tuple[str, ...]
    reference_bands: tuple[DemandChargeReferenceBand, ...]


@dataclass(frozen=True)
class LookupCatalog:
    version: str
    effective_date: str
    description: str
    industry_load_factors: dict[str, float] = field(default_factory=dict)
    shift_load_factor_adjustments: dict[str, float] = field(default_factory=dict)
    shift_tou_shares: dict[str, tuple[float, float, float]] = field(default_factory=dict)
    tariff_groups_by_industry: dict[str, str] = field(default_factory=dict)
    tariff_references_by_voltage: dict[str, TariffReference] = field(default_factory=dict)
    demand_charge_catalog: DemandChargeCatalog | None = None
    load_range_bounds_kw: dict[str, tuple[float | None, float | None]] = field(
        default_factory=dict
    )
    shiftable_energy_ratio_by_industry: dict[str, float] = field(default_factory=dict)
    pv_surplus_ratio_by_export_policy: dict[str, float] = field(default_factory=dict)
    pv_surplus_objective_adjustments: dict[str, float] = field(default_factory=dict)
    cycles_per_day_by_objective: dict[str, float] = field(default_factory=dict)
    specific_yield_month_kwh_per_kw: float = 115.0
    pv_power_ratio: float = 0.6
    load_factor_min: float = 0.35
    load_factor_max: float = 0.9


@dataclass(frozen=True)
class BudgetCatalog:
    version: str
    effective_date: str
    description: str
    range_upper_bounds: dict[str, float | None]


@dataclass(frozen=True)
class QuickSizingConfig:
    version: str
    effective_date: str
    description: str
    scenario: ScenarioProfile
    cost_catalog: CostCatalog
    lookup_catalog: LookupCatalog
    budget_catalog: BudgetCatalog

    def version_map(self) -> dict[str, str]:
        return {
            "engine": self.version,
            "scenario": self.scenario.version,
            "cost_catalog": self.cost_catalog.version,
            "lookup_catalog": self.lookup_catalog.version,
            "budget_catalog": self.budget_catalog.version,
            "demand_charge_catalog": (
                self.lookup_catalog.demand_charge_catalog.version
                if self.lookup_catalog.demand_charge_catalog
                else ""
            ),
        }


# TODO: business confirmation required for all catalog values below.
# The Word specification defines formulas and catalog categories, but it does
# not lock the numeric values. They are centralized here so business can replace
# them without changing the calculation code.
DEFAULT_QUICK_SIZING_CONFIG = QuickSizingConfig(
    version="quick-sizing-step2-formulas-v1",
    effective_date="2026-07-22",
    description="Quick Sizing Step 1 to Step 2 formulas F01-F48.",
    scenario=ScenarioProfile(
        version="scenario-default-v1",
        effective_date="2026-07-22",
        description="Default editable Step 2 assumptions; business confirmation required.",
        availability=0.96,
        dod_pct=90.0,
        rte_pct=90.0,
        degradation_pct=2.0,
        power_margin_pct=10.0,
        energy_margin_pct=10.0,
        power_step_kw=25.0,
        energy_step_kwh=50.0,
        control_reserve=1.15,
        peak_duration_hours=2.0,
        peak_event_frequency_per_operating_day=0.6,
        minimum_peak_coverage_pct=95.0,
        discharge_window_saving_hours=3.0,
        max_cycles_per_day=2.0,
        backup_reserve_policy="shared",
        investment_default_ratio=0.2,
        default_duration_hours=2.0,
        quality_support_ratio=0.1,
        quality_support_duration_hours=0.25,
        target_duration_hours=2.0,
        price_escalation_pct=5.0,
        debt_pct=70.0,
        interest_pct=9.0,
        loan_tenor_years=7,
        wacc_pct=10.0,
        tax_pct=20.0,
        analysis_years=10,
    ),
    cost_catalog=CostCatalog(
        version="equipment-cost-catalog-preliminary-v1",
        effective_date="2026-07-22",
        description="Preliminary Quick Sizing equipment unit costs and EPC all-in rate model; business confirmation required.",
        status="preliminary",
        source_name="business_rule_prompt_preliminary",
        currency="VND",
        battery_dc_package=EquipmentCostCatalogItem(
            unit="VND/kWh nominal",
            optimistic=2_400_000.0,
            base=3_000_000.0,
            conservative=3_600_000.0,
            scope_included=(
                "Cell pin",
                "Module hoac rack",
                "Battery Management System - BMS",
                "Container hoac cabinet pin",
                "HVAC ben trong container/cabinet",
                "Bao ve dien noi bo",
                "He thong phat hien va chua chay ben trong container pin",
                "Giam sat noi bo cua battery package",
                "Bao hanh thiet bi tieu chuan",
                "Dong goi va van chuyen co ban den du an neu catalog quy dinh",
            ),
            scope_excluded=(
                "PCS",
                "May bien ap",
                "Tu trung ap",
                "Cap va dau noi ngoai hien truong",
                "EMS cap nha may",
                "SCADA",
                "Mong va xay dung",
                "Lap dat",
                "Testing/commissioning toan he thong",
                "EPC ngoai hien truong",
            ),
            notes=(
                "Preliminary Quick Sizing business assumption, not a supplier quote.",
                "Do not double count battery package internals in EPC all-in.",
            ),
        ),
        pcs_equipment=EquipmentCostCatalogItem(
            unit="VND/kW AC",
            optimistic=1_100_000.0,
            base=1_500_000.0,
            conservative=2_000_000.0,
            scope_included=(
                "Bo bien doi cong suat hai chieu",
                "Tu dieu khien co ban cua PCS",
                "Bao ve noi bo PCS",
                "Giao tiep co ban cua PCS",
                "Bao hanh thiet bi tieu chuan",
            ),
            scope_excluded=(
                "May bien ap",
                "Tu dong cat trung ap",
                "Cap ngoai hien truong",
                "EMS/SCADA cap nha may",
                "Dau noi luoi",
                "Lap dat",
                "Commissioning toan he thong",
                "EPC",
            ),
            notes=(
                "Preliminary Quick Sizing business assumption, not a supplier quote.",
                "Do not double count PCS equipment in EPC all-in.",
            ),
        ),
        battery_cost_per_kwh=3_000_000.0,
        pcs_cost_per_kw=1_500_000.0,
        epc_rate_bands=(
            EpcRateBand(min_equipment_cost=0.0, max_equipment_cost=5_000_000_000.0, rate_pct=22.0),
            EpcRateBand(min_equipment_cost=5_000_000_000.0, max_equipment_cost=10_000_000_000.0, rate_pct=18.0),
            EpcRateBand(min_equipment_cost=10_000_000_000.0, max_equipment_cost=20_000_000_000.0, rate_pct=15.0),
            EpcRateBand(min_equipment_cost=20_000_000_000.0, max_equipment_cost=50_000_000_000.0, rate_pct=12.0),
            EpcRateBand(min_equipment_cost=50_000_000_000.0, max_equipment_cost=None, rate_pct=10.0),
        ),
        voltage_adjustments_pct={
            "Hạ áp": 0.0,
            "Trung áp": 2.0,
            "Cao áp": 4.0,
            "Chưa xác định": 2.0,
        },
        epc_min_rate_pct=8.0,
        epc_max_rate_pct=30.0,
        epc_scope_items=(
            "BOS",
            "EMS cơ bản",
            "Đấu nối điện cơ bản",
            "Hệ thống PCCC",
            "Móng và xây dựng cơ bản",
            "Vận chuyển và lắp đặt",
            "Testing và commissioning",
            "Hồ sơ nghiệm thu cơ bản",
            "Contingency",
        ),
        include_vat_in_capex_default=False,
        vat_pct=8.0,
        om_pct=2.0,
    ),
    lookup_catalog=LookupCatalog(
        version="lookup-catalog-placeholder-v1",
        effective_date="2026-07-22",
        description="Tariff/profile lookup placeholders; business confirmation required.",
        industry_load_factors={
            "Dệt may": 0.65,
            "Thép và kim loại": 0.72,
            "Nhựa và bao bì": 0.68,
            "Thực phẩm và đồ uống": 0.64,
            "Điện tử": 0.70,
            "Kho lạnh": 0.78,
            "Logistics": 0.55,
            "Khu công nghiệp": 0.60,
            "Tòa nhà thương mại": 0.50,
            "Năng lượng": 0.75,
            "Khác": 0.62,
        },
        shift_load_factor_adjustments={
            "Giờ hành chính": -0.08,
            "1 ca": -0.04,
            "2 ca": 0.02,
            "3 ca": 0.06,
            "Hoạt động 24/7": 0.10,
            "Không cố định": -0.02,
        },
        shift_tou_shares={
            "Giờ hành chính": (0.05, 0.75, 0.20),
            "1 ca": (0.05, 0.70, 0.25),
            "2 ca": (0.10, 0.60, 0.30),
            "3 ca": (0.25, 0.45, 0.30),
            "Hoạt động 24/7": (0.35, 0.40, 0.25),
            "Không cố định": (0.20, 0.55, 0.25),
        },
        tariff_groups_by_industry={
            "Tòa nhà thương mại": "commercial",
            "Khu công nghiệp": "industrial",
            "Năng lượng": "energy",
        },
        tariff_references_by_voltage={
            "Hạ áp": TariffReference(
                low_price=1_250.0,
                normal_price=1_850.0,
                peak_price=3_200.0,
                vat_pct=8.0,
                energy_tariff_status="placeholder",
                source_name="lookup_placeholder",
            ),
            "Trung áp": TariffReference(
                low_price=1_150.0,
                normal_price=1_750.0,
                peak_price=3_050.0,
                vat_pct=8.0,
                energy_tariff_status="placeholder",
                source_name="lookup_placeholder",
            ),
            "Cao áp": TariffReference(
                low_price=1_050.0,
                normal_price=1_650.0,
                peak_price=2_900.0,
                vat_pct=8.0,
                energy_tariff_status="placeholder",
                source_name="lookup_placeholder",
            ),
            "Chưa xác định": TariffReference(
                low_price=1_150.0,
                normal_price=1_750.0,
                peak_price=3_050.0,
                vat_pct=8.0,
                energy_tariff_status="placeholder",
                source_name="lookup_placeholder",
            ),
        },
        demand_charge_catalog=DemandChargeCatalog(
            version="evn-two-component-tariff-paper-pilot-2025-v1",
            status="trial_reference",
            source_name="EVN two-component retail tariff paper pilot",
            source_date=None,
            notes=(
                "Trial paper reference only, not a real invoice default.",
                "Do not assume this demand charge applies without invoice, contract, or utility notice confirmation.",
                "Pmax is measured according to the two-component tariff mechanism.",
                "Not an official default for all customers.",
            ),
            reference_bands=(
                DemandChargeReferenceBand(
                    code="gte_110kv",
                    label="U >= 110 kV",
                    min_voltage_kv=110.0,
                    max_voltage_kv=None,
                    price_vnd_per_kw_month=209_459.0,
                    status="trial_reference",
                    source_name="EVN two-component retail tariff paper pilot",
                    source_date=None,
                    notes=(
                        "Trial paper reference; verify against invoice or contract before use.",
                    ),
                ),
                DemandChargeReferenceBand(
                    code="22_to_lt_110kv",
                    label="22 kV <= U < 110 kV",
                    min_voltage_kv=22.0,
                    max_voltage_kv=110.0,
                    price_vnd_per_kw_month=235_414.0,
                    status="trial_reference",
                    source_name="EVN two-component retail tariff paper pilot",
                    source_date=None,
                    notes=(
                        "Trial paper reference; verify against invoice or contract before use.",
                    ),
                ),
                DemandChargeReferenceBand(
                    code="6_to_lt_22kv",
                    label="6 kV <= U < 22 kV",
                    min_voltage_kv=6.0,
                    max_voltage_kv=22.0,
                    price_vnd_per_kw_month=240_050.0,
                    status="trial_reference",
                    source_name="EVN two-component retail tariff paper pilot",
                    source_date=None,
                    notes=(
                        "Trial paper reference; verify against invoice or contract before use.",
                    ),
                ),
                DemandChargeReferenceBand(
                    code="lt_6kv",
                    label="U < 6 kV",
                    min_voltage_kv=None,
                    max_voltage_kv=6.0,
                    price_vnd_per_kw_month=286_153.0,
                    status="trial_reference",
                    source_name="EVN two-component retail tariff paper pilot",
                    source_date=None,
                    notes=(
                        "Trial paper reference; verify against invoice or contract before use.",
                    ),
                ),
            ),
        ),
        load_range_bounds_kw={
            "Dưới 500 kW": (0.0, 500.0),
            "500 kW – 1 MW": (500.0, 1_000.0),
            "1 MW – 5 MW": (1_000.0, 5_000.0),
            "5 MW – 10 MW": (5_000.0, 10_000.0),
            "Trên 10 MW": (10_000.0, None),
            "Chưa xác định": (None, None),
        },
        shiftable_energy_ratio_by_industry={
            "Dệt may": 0.22,
            "Thép và kim loại": 0.16,
            "Nhựa và bao bì": 0.20,
            "Thực phẩm và đồ uống": 0.24,
            "Điện tử": 0.18,
            "Kho lạnh": 0.28,
            "Logistics": 0.18,
            "Khu công nghiệp": 0.20,
            "Tòa nhà thương mại": 0.15,
            "Năng lượng": 0.15,
            "Khác": 0.20,
        },
        pv_surplus_ratio_by_export_policy={
            "Không phát ngược lên lưới": 0.30,
            "Có thể phát ngược lên lưới": 0.10,
            "Hạn chế công suất phát ngược": 0.22,
            "Chưa xác định": 0.18,
        },
        pv_surplus_objective_adjustments={
            "Tăng tỷ lệ tự dùng": 0.04,
            "Giảm điện dư": 0.06,
            "Dịch chuyển năng lượng sang giờ cao điểm": 0.05,
            "Dự phòng khi mất điện": 0.02,
        },
        cycles_per_day_by_objective={
            "saving": 1.0,
            "peak_shaving": 0.6,
            "solar_optimization": 1.0,
            "backup": 0.3,
            "power_quality": 0.2,
            "investment": 0.5,
        },
    ),
    budget_catalog=BudgetCatalog(
        version="budget-catalog-v1",
        effective_date="2026-07-22",
        description="Budget range normalization from the Word specification.",
        range_upper_bounds={
            "Chưa xác định": None,
            "Dưới 5 tỷ VNĐ": 5_000_000_000.0,
            "5–10 tỷ VNĐ": 10_000_000_000.0,
            "10–20 tỷ VNĐ": 20_000_000_000.0,
            "20–50 tỷ VNĐ": 50_000_000_000.0,
            "Trên 50 tỷ VNĐ": None,
            "Nhập ngân sách tùy chỉnh": None,
        },
    ),
)
