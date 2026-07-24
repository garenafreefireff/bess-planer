from dataclasses import replace

import pytest

from app.modules.analyses.engine.quick_sizing.calculate_capex import (
    calculate_capex,
    calculate_epc_rate,
    select_epc_base_rate,
)
from app.modules.analyses.engine.quick_sizing.config import DEFAULT_QUICK_SIZING_CONFIG
from app.modules.analyses.engine.quick_sizing import QuickSizingCalculator, QuickSizingInput
from app.modules.analyses.engine.quick_sizing.models import CombinedSizingResult


def _input(**overrides: object) -> QuickSizingInput:
    payload = {
        "industry": "Thực phẩm và đồ uống",
        "estimated_load_range": "1 MW – 5 MW",
        "monthly_electricity_bill": 1_000_000_000,
        "voltage_level": "Trung áp",
        "operating_hours_per_day": 18,
        "operating_days_per_week": 6,
        "shift_pattern": "2 ca",
        "solar_status": "yes",
        "solar_capacity_value": 850,
        "solar_capacity_unit": "kWp",
        "solar_monthly_generation_value": 95_000,
        "solar_monthly_generation_unit": "kWh/tháng",
        "export_policy": "Hạn chế công suất phát ngược",
        "solar_objectives": ("Tăng tỷ lệ tự dùng",),
        "bess_objectives": ("saving", "peak_shaving", "solar_optimization"),
        "estimated_peak_demand_kw": 1_800,
        "target_peak_reduction_type": "percent",
        "target_peak_reduction_value": 15,
        "budget_range": "10–20 tỷ VNĐ",
    }
    payload.update(overrides)
    return QuickSizingInput(**payload)


def _calculate(inputs: QuickSizingInput):
    return QuickSizingCalculator().calculate(inputs)


def _sizing(power_kw: float, energy_kwh: float, duration_hours: float = 2) -> CombinedSizingResult:
    return CombinedSizingResult(
        power_kw=power_kw,
        energy_kwh=energy_kwh,
        duration_hours=duration_hours,
        usable_energy_kwh=energy_kwh * DEFAULT_QUICK_SIZING_CONFIG.scenario.dod_pct / 100,
        cycles_per_day=1,
        dominant_power_objective=None,
        dominant_energy_objective=None,
        selected_objectives=(),
        objective_sizing_results=(),
    )


def test_converts_pv_capacity_mwp_to_kw_and_generation_mwh_to_kwh() -> None:
    result = _calculate(
        _input(
            solar_capacity_value=1.2,
            solar_capacity_unit="MWp",
            solar_monthly_generation_value=2.5,
            solar_monthly_generation_unit="MWh/tháng",
            budget_range="Nhập ngân sách tùy chỉnh",
            custom_budget=12_000_000_000,
        )
    )

    assert result.normalized_input.solar_capacity_kw == 1_200
    assert result.normalized_input.solar_monthly_generation_kwh == 2_500
    assert result.normalized_input.budget_max == 12_000_000_000


def test_calculates_operating_days_and_monthly_hours() -> None:
    result = _calculate(_input())

    assert result.load_estimation.operating_days_per_year == pytest.approx(299.52)
    assert result.load_estimation.operating_days_per_month == pytest.approx(24.96)
    assert result.load_estimation.operating_hours_per_month == pytest.approx(449.28)


def test_calculates_weighted_average_tariff() -> None:
    result = _calculate(_input())

    assert result.load_estimation.tou_shares.low == pytest.approx(0.10)
    assert result.load_estimation.tou_shares.normal == pytest.approx(0.60)
    assert result.load_estimation.tou_shares.peak == pytest.approx(0.30)
    assert result.load_estimation.tariff_average == pytest.approx(2080)


def test_inferrs_monthly_energy_average_power_and_final_peak() -> None:
    result = _calculate(_input())

    assert result.load_estimation.monthly_electricity_kwh == pytest.approx(
        1_000_000_000 / 2080
    )
    assert result.load_estimation.average_power_kw == pytest.approx(
        result.load_estimation.monthly_electricity_kwh / 449.28
    )
    assert result.load_estimation.calculated_peak_demand_kw == pytest.approx(
        result.load_estimation.average_power_kw / 0.66
    )
    assert result.load_estimation.final_peak_demand_kw == 1_800


def test_warns_when_peak_is_far_outside_selected_load_range() -> None:
    result = _calculate(
        _input(
            estimated_load_range="Dưới 500 kW",
            estimated_peak_demand_kw=3_000,
        )
    )

    assert any(
        warning.code == "peak_demand_outside_load_range_error"
        for warning in result.warnings
    )


def test_saving_sizing_uses_peak_energy_shift_not_load_range_preset() -> None:
    result = _calculate(_input(bess_objectives=("saving",)))
    saving = result.objective_sizing[0]

    assert saving.objective == "saving"
    assert saving.applicable
    assert saving.power_kw > 0
    assert saving.energy_kwh > saving.power_kw
    assert "F17" in saving.assumptions_used


def test_peak_shaving_supports_percent_target() -> None:
    result = _calculate(_input(bess_objectives=("peak_shaving",)))
    peak = result.objective_sizing[0]

    assert peak.power_kw == pytest.approx(1_800 * 0.15 * 1.15)
    assert peak.energy_kwh > 0


def test_peak_shaving_supports_kw_target() -> None:
    result = _calculate(
        _input(
            bess_objectives=("peak_shaving",),
            target_peak_reduction_type="kw",
            target_peak_reduction_value=250,
        )
    )
    peak = result.objective_sizing[0]

    assert peak.power_kw == pytest.approx(250 * 1.15)


def test_peak_event_frequency_is_exposed_but_does_not_change_peak_sizing() -> None:
    base_config = DEFAULT_QUICK_SIZING_CONFIG
    higher_frequency_config = replace(
        base_config,
        scenario=replace(
            base_config.scenario,
            peak_event_frequency_per_operating_day=1.0,
        ),
    )

    base = QuickSizingCalculator(base_config).calculate(_input(bess_objectives=("peak_shaving",)))
    higher_frequency = QuickSizingCalculator(higher_frequency_config).calculate(
        _input(bess_objectives=("peak_shaving",))
    )

    assert base.technical_assumptions.peak_event_duration_hours == pytest.approx(2.0)
    assert base.technical_assumptions.peak_event_frequency_per_operating_day == pytest.approx(0.6)
    assert base.technical_assumptions.minimum_peak_coverage_pct == pytest.approx(95.0)
    assert higher_frequency.technical_assumptions.peak_event_frequency_per_operating_day == pytest.approx(1.0)
    assert higher_frequency.technical_assumptions.power_kw == pytest.approx(
        base.technical_assumptions.power_kw
    )
    assert higher_frequency.technical_assumptions.energy_kwh == pytest.approx(
        base.technical_assumptions.energy_kwh
    )


def test_pv_sizing_uses_pv_inputs_when_pv_exists() -> None:
    result = _calculate(_input(bess_objectives=("solar_optimization",)))
    solar = result.objective_sizing[0]

    assert solar.objective == "solar_optimization"
    assert solar.applicable
    assert solar.power_kw == pytest.approx(850 * 0.6)
    assert solar.energy_kwh > 0


def test_pv_sizing_is_skipped_when_solar_status_is_none() -> None:
    result = _calculate(
        _input(
            bess_objectives=("solar_optimization",),
            solar_status="none",
            solar_capacity_value=850,
            solar_monthly_generation_value=95_000,
        )
    )
    solar = result.objective_sizing[0]

    assert not solar.applicable
    assert any(warning.code == "solar_objective_without_pv" for warning in result.warnings)


def test_backup_uses_critical_load_percent_and_duration() -> None:
    result = _calculate(
        _input(
            bess_objectives=("backup",),
            backup_critical_load_pct=30,
            backup_duration_hours=2,
        )
    )
    backup = result.objective_sizing[0]

    assert backup.power_kw == pytest.approx(result.load_estimation.final_peak_demand_kw * 0.3)
    assert backup.energy_kwh > backup.power_kw


def test_power_quality_returns_preliminary_warning() -> None:
    result = _calculate(_input(bess_objectives=("power_quality",)))

    assert result.objective_sizing[0].applicable
    assert any(warning.code == "power_quality_preliminary_only" for warning in result.warnings)


def test_investment_only_creates_survey_configuration() -> None:
    result = _calculate(_input(bess_objectives=("investment",)))
    investment = result.objective_sizing[0]

    assert investment.applicable
    assert investment.power_kw == pytest.approx(result.load_estimation.final_peak_demand_kw * 0.2)
    assert investment.source == "scenario_default_survey"


def test_combines_multiple_objectives_by_max_not_sum_and_rounds_steps() -> None:
    result = _calculate(_input())

    assert result.technical_assumptions.power_kw == pytest.approx(575)
    assert result.technical_assumptions.energy_kwh == pytest.approx(1_800)
    assert result.derived_values["energy_kwh"].formula_id == "F35-F38"
    assert result.derived_values["power_kw"].formula_id == "F34-F38"


def test_capex_total_equals_sum_of_components() -> None:
    result = _calculate(_input())
    capex = result.cost_assumptions
    expected = (
        capex.battery_cost
        + capex.pcs_cost
        + capex.epc_all_in_cost
        + capex.vat_amount
    )

    assert capex.total_capex == pytest.approx(expected)
    assert capex.equipment_cost == pytest.approx(capex.battery_cost + capex.pcs_cost)
    assert not hasattr(capex, "epc_fixed_cost")
    assert not hasattr(capex, "bos_cost")


def test_equipment_cost_catalog_defaults_and_metadata_are_returned() -> None:
    result = _calculate(_input())
    capex = result.cost_assumptions
    catalog = DEFAULT_QUICK_SIZING_CONFIG.cost_catalog

    assert catalog.battery_dc_package.base == pytest.approx(3_000_000)
    assert catalog.pcs_equipment.base == pytest.approx(1_500_000)
    assert capex.battery_unit_cost.value == pytest.approx(3_000_000)
    assert capex.pcs_unit_cost.value == pytest.approx(1_500_000)
    assert capex.battery_unit_cost.unit == "VND/kWh nominal"
    assert capex.pcs_unit_cost.unit == "VND/kW AC"
    assert capex.battery_unit_cost.status == "preliminary"
    assert capex.pcs_unit_cost.catalog_version == "equipment-cost-catalog-preliminary-v1"
    assert "Battery Management System - BMS" in capex.battery_unit_cost.scope_included
    assert "May bien ap" in capex.pcs_unit_cost.scope_excluded
    api_payload = result.to_dict()
    cost_payload = api_payload["cost_assumptions"]
    assert isinstance(cost_payload, dict)
    assert cost_payload["battery_unit_cost"]["value"] == pytest.approx(3_000_000)
    assert cost_payload["pcs_unit_cost"]["catalog_version"] == "equipment-cost-catalog-preliminary-v1"


def test_equipment_cost_catalog_scenario_presets_are_explicit() -> None:
    catalog = DEFAULT_QUICK_SIZING_CONFIG.cost_catalog

    assert catalog.battery_dc_package.optimistic == pytest.approx(2_400_000)
    assert catalog.battery_dc_package.base == pytest.approx(3_000_000)
    assert catalog.battery_dc_package.conservative == pytest.approx(3_600_000)
    assert catalog.pcs_equipment.optimistic == pytest.approx(1_100_000)
    assert catalog.pcs_equipment.base == pytest.approx(1_500_000)
    assert catalog.pcs_equipment.conservative == pytest.approx(2_000_000)


def test_demand_charge_reference_catalog_contains_trial_metadata() -> None:
    catalog = DEFAULT_QUICK_SIZING_CONFIG.lookup_catalog.demand_charge_catalog

    assert catalog is not None
    assert catalog.version == "evn-two-component-tariff-paper-pilot-2025-v1"
    assert catalog.status == "trial_reference"
    assert catalog.source_name == "EVN two-component retail tariff paper pilot"
    assert catalog.source_date is None
    assert len(catalog.notes) >= 4
    prices = {band.code: band.price_vnd_per_kw_month for band in catalog.reference_bands}
    assert prices["gte_110kv"] == pytest.approx(209_459)
    assert prices["22_to_lt_110kv"] == pytest.approx(235_414)
    assert prices["6_to_lt_22kv"] == pytest.approx(240_050)
    assert prices["lt_6kv"] == pytest.approx(286_153)


def test_demand_charge_defaults_unknown_and_does_not_choose_broad_medium_voltage() -> None:
    result = _calculate(_input(demand_charge_applicability="unknown"))
    tariff = result.tariff_assumptions

    assert tariff.demand_charge_applicability == "unknown"
    assert tariff.detailed_voltage_band == "unknown"
    assert tariff.effective_demand_charge_vnd_per_kw_month == 0
    assert not tariff.demand_saving_included_in_base_npv
    assert any(warning.code == "broad_voltage_level" for warning in result.warnings)
    assert any(
        "Cần xác nhận cấp điện áp chi tiết" in warning.message
        for warning in result.warnings
    )


def test_demand_charge_not_applicable_effective_zero() -> None:
    result = _calculate(_input(demand_charge_applicability="not_applicable"))

    assert result.tariff_assumptions.effective_demand_charge_vnd_per_kw_month == 0
    assert result.tariff_assumptions.demand_charge_source == "not_applicable"
    assert not result.tariff_assumptions.demand_saving_included_in_base_npv


@pytest.mark.parametrize(
    ("band", "expected"),
    [
        ("22_to_lt_110kv", 235_414),
        ("6_to_lt_22kv", 240_050),
    ],
)
def test_reference_demand_charge_requires_selected_detailed_band(
    band: str,
    expected: float,
) -> None:
    result = _calculate(
        _input(
            demand_charge_applicability="applicable",
            demand_charge_mode="reference",
            detailed_voltage_band=band,
        )
    )

    assert result.tariff_assumptions.effective_demand_charge_vnd_per_kw_month == pytest.approx(
        expected
    )
    assert result.tariff_assumptions.demand_charge_status == "trial_reference"
    assert result.tariff_assumptions.demand_charge_source == "evn_trial_reference"
    assert result.tariff_assumptions.demand_saving_included_in_base_npv


def test_reference_demand_charge_unknown_band_warns_and_keeps_effective_zero() -> None:
    result = _calculate(
        _input(
            demand_charge_applicability="applicable",
            demand_charge_mode="reference",
            detailed_voltage_band="unknown",
        )
    )

    assert result.tariff_assumptions.effective_demand_charge_vnd_per_kw_month == 0
    assert not result.tariff_assumptions.demand_saving_included_in_base_npv
    assert any(warning.code == "demand_charge_voltage_band_required" for warning in result.warnings)


@pytest.mark.parametrize("mode", ["manual", "invoice"])
def test_confirmed_input_demand_charge_uses_user_or_invoice_value(mode: str) -> None:
    result = _calculate(
        _input(
            demand_charge_applicability="applicable",
            demand_charge_mode=mode,
            demand_charge_input_vnd_per_kw_month=200_000,
        )
    )

    assert result.tariff_assumptions.effective_demand_charge_vnd_per_kw_month == pytest.approx(
        200_000
    )
    assert result.tariff_assumptions.demand_charge_source == (
        "invoice" if mode == "invoice" else "user_input"
    )
    assert result.tariff_assumptions.demand_saving_included_in_base_npv


def test_api_payload_includes_demand_charge_metadata() -> None:
    payload = _calculate(
        _input(
            demand_charge_applicability="applicable",
            demand_charge_mode="reference",
            detailed_voltage_band="22_to_lt_110kv",
        )
    ).to_dict()
    tariff = payload["tariff_assumptions"]

    assert isinstance(tariff, dict)
    assert tariff["demand_charge_applicability"] == "applicable"
    assert tariff["demand_charge_mode"] == "reference"
    assert tariff["detailed_voltage_band"] == "22_to_lt_110kv"
    assert tariff["effective_demand_charge_vnd_per_kw_month"] == pytest.approx(235_414)
    assert tariff["demand_charge_catalog_version"] == "evn-two-component-tariff-paper-pilot-2025-v1"
    assert len(tariff["demand_charge_reference_bands"]) == 4


@pytest.mark.parametrize(
    ("equipment_cost", "expected_rate"),
    [
        (4_999_999_999, 22),
        (5_000_000_000, 18),
        (10_000_000_000, 15),
        (20_000_000_000, 12),
        (50_000_000_000, 10),
    ],
)
def test_epc_rate_band_boundaries(equipment_cost: float, expected_rate: float) -> None:
    assert select_epc_base_rate(
        equipment_cost,
        DEFAULT_QUICK_SIZING_CONFIG.cost_catalog,
    ) == expected_rate


def test_epc_voltage_adjustment_and_manual_clamp() -> None:
    catalog = DEFAULT_QUICK_SIZING_CONFIG.cost_catalog
    base, adjustment, applied = calculate_epc_rate(
        equipment_cost=5_600_000_000,
        voltage_level="Trung áp",
        catalog=catalog,
    )

    assert base == 18
    assert adjustment == 2
    assert applied == 20

    _, _, max_clamped = calculate_epc_rate(
        equipment_cost=5_600_000_000,
        voltage_level="Trung áp",
        catalog=catalog,
        epc_mode="manual",
        epc_manual_rate_pct=99,
    )
    _, _, min_clamped = calculate_epc_rate(
        equipment_cost=5_600_000_000,
        voltage_level="Trung áp",
        catalog=catalog,
        epc_mode="manual",
        epc_manual_rate_pct=2,
    )

    assert max_clamped == catalog.epc_max_rate_pct
    assert min_clamped == catalog.epc_min_rate_pct


def test_auto_epc_rate_clamps_to_catalog_min_and_max() -> None:
    catalog = DEFAULT_QUICK_SIZING_CONFIG.cost_catalog
    min_catalog = replace(
        catalog,
        epc_rate_bands=tuple(
            replace(band, rate_pct=1.0) for band in catalog.epc_rate_bands
        ),
        voltage_adjustments_pct={key: 0.0 for key in catalog.voltage_adjustments_pct},
    )
    max_catalog = replace(
        catalog,
        epc_rate_bands=tuple(
            replace(band, rate_pct=99.0) for band in catalog.epc_rate_bands
        ),
        voltage_adjustments_pct={key: 0.0 for key in catalog.voltage_adjustments_pct},
    )

    assert calculate_epc_rate(
        equipment_cost=5_600_000_000,
        voltage_level="Trung áp",
        catalog=min_catalog,
    )[2] == catalog.epc_min_rate_pct
    assert calculate_epc_rate(
        equipment_cost=5_600_000_000,
        voltage_level="Trung áp",
        catalog=max_catalog,
    )[2] == catalog.epc_max_rate_pct


def test_all_in_capex_math_for_reference_candidate() -> None:
    capex, warnings, _ = calculate_capex(
        _sizing(power_kw=400, energy_kwh=800),
        currency="VND",
        config=DEFAULT_QUICK_SIZING_CONFIG,
        voltage_level="Trung áp",
    )

    assert warnings == ()
    assert capex.battery_cost == pytest.approx(2_400_000_000)
    assert capex.pcs_cost == pytest.approx(600_000_000)
    assert capex.equipment_cost == pytest.approx(3_000_000_000)
    assert capex.epc_applied_rate_pct == pytest.approx(24)
    assert capex.epc_all_in_cost == pytest.approx(720_000_000)
    assert capex.capex_excluding_vat == pytest.approx(3_720_000_000)
    assert capex.total_capex == pytest.approx(3_720_000_000)


def test_acceptance_capex_math_for_1600kw_3250kwh_with_17pct_epc() -> None:
    capex, warnings, _ = calculate_capex(
        _sizing(power_kw=1_600, energy_kwh=3_250),
        currency="VND",
        config=DEFAULT_QUICK_SIZING_CONFIG,
        voltage_level="Trung Ã¡p",
        epc_mode="manual",
        epc_manual_rate_pct=17,
    )

    assert warnings == ()
    assert capex.battery_cost == pytest.approx(9_750_000_000)
    assert capex.pcs_cost == pytest.approx(2_400_000_000)
    assert capex.equipment_cost == pytest.approx(12_150_000_000)
    assert capex.epc_all_in_cost == pytest.approx(2_065_500_000)
    assert capex.capex_excluding_vat == pytest.approx(14_215_500_000)
    assert capex.total_capex == pytest.approx(14_215_500_000)


def test_battery_package_scope_is_not_double_counted_in_epc_scope() -> None:
    capex, _, _ = calculate_capex(
        _sizing(power_kw=400, energy_kwh=800),
        currency="VND",
        config=DEFAULT_QUICK_SIZING_CONFIG,
        voltage_level="Trung Ã¡p",
    )
    epc_scope = " ".join(capex.epc_scope_items).lower()

    assert "bms" not in epc_scope
    assert "container pin" not in epc_scope
    assert "hvac ben trong container" not in epc_scope


def test_budget_overrun_returns_budget_fit_option() -> None:
    result = _calculate(_input(budget_range="Dưới 5 tỷ VNĐ"))

    assert result.budget_evaluation.status == "over_budget"
    assert result.budget_evaluation.budget_option is not None
    assert result.budget_evaluation.budget_option.capex <= 5_000_000_000
    assert any(warning.code == "capex_over_budget" for warning in result.warnings)


def test_budget_option_uses_new_capex_and_largest_step() -> None:
    result = _calculate(
        _input(
            budget_range="Nhập ngân sách tùy chỉnh",
            custom_budget=5_000_000_000,
        )
    )
    option = result.budget_evaluation.budget_option
    assert option is not None
    assert option.feasible

    direct_capex, _, _ = calculate_capex(
        _sizing(option.power_kw, option.energy_kwh, option.duration_hours),
        currency=result.budget_evaluation.currency,
        config=DEFAULT_QUICK_SIZING_CONFIG,
        voltage_level=result.normalized_input.voltage_level,
    )
    assert option.capex == pytest.approx(direct_capex.total_capex)

    next_power = option.power_kw + DEFAULT_QUICK_SIZING_CONFIG.scenario.power_step_kw
    if next_power <= result.technical_assumptions.power_kw:
        next_energy = next_power * option.duration_hours
        next_capex, _, _ = calculate_capex(
            _sizing(next_power, next_energy, option.duration_hours),
            currency=result.budget_evaluation.currency,
            config=DEFAULT_QUICK_SIZING_CONFIG,
            voltage_level=result.normalized_input.voltage_level,
        )
        assert next_capex.total_capex > (result.budget_evaluation.budget_max or 0)


def test_stale_peak_fields_do_not_affect_non_peak_objectives() -> None:
    base = _calculate(
        _input(
            bess_objectives=("saving",),
            estimated_peak_demand_kw=None,
            target_peak_reduction_type=None,
            target_peak_reduction_value=None,
        )
    )
    stale = _calculate(
        _input(
            bess_objectives=("saving",),
            estimated_peak_demand_kw=9_999,
            target_peak_reduction_type="percent",
            target_peak_reduction_value=90,
        )
    )

    assert stale.technical_assumptions == base.technical_assumptions
    assert any(warning.code == "peak_shaving_fields_ignored" for warning in stale.warnings)


def test_same_input_returns_same_output() -> None:
    inputs = _input()

    assert _calculate(inputs).to_dict() == _calculate(inputs).to_dict()
