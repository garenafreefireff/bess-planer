from __future__ import annotations

from app.modules.analyses.engine.quick_sizing.calculate_backup_sizing import (
    calculate_backup_sizing,
)
from app.modules.analyses.engine.quick_sizing.calculate_budget_option import (
    evaluate_budget,
)
from app.modules.analyses.engine.quick_sizing.calculate_capex import calculate_capex
from app.modules.analyses.engine.quick_sizing.calculate_investment_sizing import (
    calculate_investment_sizing,
)
from app.modules.analyses.engine.quick_sizing.calculate_peak_shaving_sizing import (
    calculate_peak_shaving_sizing,
)
from app.modules.analyses.engine.quick_sizing.calculate_power_quality_sizing import (
    calculate_power_quality_sizing,
)
from app.modules.analyses.engine.quick_sizing.calculate_saving_sizing import (
    calculate_saving_sizing,
)
from app.modules.analyses.engine.quick_sizing.calculate_solar_sizing import (
    calculate_solar_sizing,
)
from app.modules.analyses.engine.quick_sizing.combine_objectives import (
    combine_objective_sizing,
)
from app.modules.analyses.engine.quick_sizing.config import (
    DEFAULT_QUICK_SIZING_CONFIG,
    QuickSizingConfig,
)
from app.modules.analyses.engine.quick_sizing.infer_load import infer_load_profile
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    DerivedValue,
    ObjectiveSizingResult,
    QuickSizingInput,
    QuickSizingResult,
    TechnicalAssumptions,
    ValueSource,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.normalize_input import (
    normalize_quick_sizing_input,
)


def build_quick_sizing_step2_assumptions(
    inputs: QuickSizingInput,
    config: QuickSizingConfig | None = None,
) -> QuickSizingResult:
    active_config = config or DEFAULT_QUICK_SIZING_CONFIG
    warnings: list[CalculationWarning] = []
    trace: list[CalculationTraceItem] = []

    if active_config.cost_catalog.status != "confirmed":
        warnings.append(
            CalculationWarning(
                code="cost_catalog_preliminary",
                severity=WarningSeverity.INFO,
                message=(
                    "Cost catalog đang là mô hình sơ bộ, chưa phải báo giá nhà cung cấp "
                    "hoặc catalog chi phí đã được nghiệp vụ xác nhận."
                ),
                field="cost_assumptions",
            )
        )

    normalized, normalize_warnings, normalize_trace = normalize_quick_sizing_input(
        inputs,
        active_config,
    )
    warnings.extend(normalize_warnings)
    trace.extend(normalize_trace)

    load, load_warnings, load_trace = infer_load_profile(normalized, active_config)
    warnings.extend(load_warnings)
    trace.extend(load_trace)
    trace.append(
        CalculationTraceItem(
            formula_id="DEMAND-CHARGE-RESOLVE-V1",
            description="Xác định giá công suất hiệu lực cho lợi ích cắt đỉnh.",
            inputs={
                "demand_charge_applicability": load.tariff_plan.demand_charge_applicability,
                "demand_charge_mode": load.tariff_plan.demand_charge_mode,
                "detailed_voltage_band": load.tariff_plan.detailed_voltage_band,
                "demand_charge_input_vnd_per_kw_month": (
                    load.tariff_plan.demand_charge_input_vnd_per_kw_month
                ),
                "demand_charge_reference_vnd_per_kw_month": (
                    load.tariff_plan.demand_charge_reference_vnd_per_kw_month
                ),
                "demand_charge_source": load.tariff_plan.demand_charge_source,
                "demand_charge_status": load.tariff_plan.demand_charge_status,
                "demand_charge_catalog_version": (
                    load.tariff_plan.demand_charge_catalog_version
                ),
            },
            output={
                "effective_demand_charge_vnd_per_kw_month": (
                    load.tariff_plan.effective_demand_charge_vnd_per_kw_month
                ),
                "demand_saving_included_in_base_npv": (
                    load.tariff_plan.demand_saving_included_in_base_npv
                ),
            },
        )
    )

    objective_results, objective_trace = _calculate_objectives(
        normalized,
        load,
        active_config,
    )
    for result in objective_results:
        warnings.extend(result.warnings)
    trace.extend(objective_trace)

    combined, combine_warnings, combine_trace = combine_objective_sizing(
        objective_results,
        normalized.bess_objectives,
        active_config,
    )
    warnings.extend(combine_warnings)
    trace.extend(combine_trace)

    capex, capex_warnings, capex_trace = calculate_capex(
        combined,
        currency=normalized.currency,
        config=active_config,
        voltage_level=normalized.voltage_level,
    )
    warnings.extend(capex_warnings)
    trace.extend(capex_trace)

    budget, budget_warnings, budget_trace = evaluate_budget(
        sizing=combined,
        capex=capex,
        budget_max=normalized.budget_max,
        currency=normalized.currency,
        config=active_config,
        voltage_level=normalized.voltage_level,
    )
    warnings.extend(budget_warnings)
    trace.extend(budget_trace)

    technical = TechnicalAssumptions(
        power_kw=combined.power_kw,
        energy_kwh=combined.energy_kwh,
        duration_hours=combined.duration_hours,
        usable_energy_kwh=combined.usable_energy_kwh,
        peak_event_duration_hours=active_config.scenario.peak_duration_hours,
        peak_event_frequency_per_operating_day=(
            active_config.scenario.peak_event_frequency_per_operating_day
        ),
        minimum_peak_coverage_pct=active_config.scenario.minimum_peak_coverage_pct,
        dod_pct=active_config.scenario.dod_pct,
        rte_pct=active_config.scenario.rte_pct,
        degradation_pct=active_config.scenario.degradation_pct,
        cycles_per_day=combined.cycles_per_day,
        operating_days_per_year=load.operating_days_per_year,
        power_margin_pct=active_config.scenario.power_margin_pct,
        energy_margin_pct=active_config.scenario.energy_margin_pct,
        backup_reserve_policy=active_config.scenario.backup_reserve_policy,
    )

    derived_values = {
        "power_kw": DerivedValue(
            value=combined.power_kw,
            source=ValueSource.CALCULATED,
            formula_id="F34-F38",
            dependencies=("objective_sizing", "power_margin_pct", "power_step_kw"),
            config_version=active_config.scenario.version,
        ),
        "energy_kwh": DerivedValue(
            value=combined.energy_kwh,
            source=ValueSource.CALCULATED,
            formula_id="F35-F38",
            dependencies=("objective_sizing", "energy_margin_pct", "energy_step_kwh"),
            config_version=active_config.scenario.version,
        ),
        "final_peak_demand_kw": DerivedValue(
            value=load.final_peak_demand_kw,
            source=(
                ValueSource.USER_INPUT
                if normalized.estimated_peak_demand_kw is not None
                else ValueSource.CALCULATED
            ),
            formula_id="F14",
            dependencies=("estimated_peak_demand_kw", "calculated_peak_demand_kw"),
        ),
        "tariff_average": DerivedValue(
            value=load.tariff_average,
            source=ValueSource.LOOKUP,
            formula_id="F08",
            dependencies=("tariff_plan", "tou_shares"),
            config_version=active_config.lookup_catalog.version,
        ),
        "total_capex": DerivedValue(
            value=capex.total_capex,
            source=ValueSource.CALCULATED,
            formula_id="CAPEX-EPC-ALL-IN-V1",
            dependencies=(
                "power_kw",
                "energy_kwh",
                "battery_cost_per_kwh",
                "pcs_cost_per_kw",
                "epc_rate_model",
                "voltage_level",
                "include_vat_in_capex",
                "vat_pct",
            ),
            config_version=active_config.cost_catalog.version,
        ),
    }

    return QuickSizingResult(
        normalized_input=normalized,
        inherited_data=_build_inherited_data(inputs),
        load_estimation=load,
        objective_sizing=objective_results,
        technical_assumptions=technical,
        cost_assumptions=capex,
        tariff_assumptions=load.tariff_plan,
        financial_assumptions=_build_financial_assumptions(active_config),
        budget_evaluation=budget,
        warnings=tuple(warnings),
        calculation_trace=tuple(trace),
        config_versions=active_config.version_map(),
        derived_values=derived_values,
    )


def _calculate_objectives(
    normalized: object,
    load: object,
    config: QuickSizingConfig,
) -> tuple[tuple[ObjectiveSizingResult, ...], tuple[CalculationTraceItem, ...]]:
    # Type narrowing is kept at the call sites to keep the objective modules independent.
    from app.modules.analyses.engine.quick_sizing.models import (
        LoadEstimation,
        NormalizedQuickSizingInput,
    )

    inputs = normalized
    load_estimation = load
    assert isinstance(inputs, NormalizedQuickSizingInput)
    assert isinstance(load_estimation, LoadEstimation)

    results: list[ObjectiveSizingResult] = []
    trace: list[CalculationTraceItem] = []
    for objective in inputs.bess_objectives:
        if objective == "saving":
            result, result_trace = calculate_saving_sizing(inputs, load_estimation, config)
        elif objective == "peak_shaving":
            result, result_trace = calculate_peak_shaving_sizing(
                inputs,
                load_estimation,
                config,
            )
        elif objective == "solar_optimization":
            result, result_trace = calculate_solar_sizing(inputs, load_estimation, config)
        elif objective == "backup":
            result, result_trace = calculate_backup_sizing(inputs, load_estimation, config)
        elif objective == "power_quality":
            result, result_trace = calculate_power_quality_sizing(load_estimation, config)
        elif objective == "investment":
            result, result_trace = calculate_investment_sizing(inputs, load_estimation, config)
        else:
            continue
        results.append(result)
        trace.extend(result_trace)
    return tuple(results), tuple(trace)


def _build_inherited_data(inputs: QuickSizingInput) -> dict[str, object]:
    return {
        "industry": inputs.industry,
        "custom_industry": inputs.custom_industry,
        "estimated_load_range": inputs.estimated_load_range,
        "monthly_electricity_bill": inputs.monthly_electricity_bill,
        "currency": inputs.currency,
        "voltage_level": inputs.voltage_level,
        "operating_hours_per_day": inputs.operating_hours_per_day,
        "operating_days_per_week": inputs.operating_days_per_week,
        "shift_pattern": inputs.shift_pattern,
        "solar_status": inputs.solar_status,
        "solar_objectives": list(inputs.solar_objectives),
        "bess_objectives": list(inputs.bess_objectives),
        "budget_range": inputs.budget_range,
        "demand_charge_applicability": inputs.demand_charge_applicability,
        "demand_charge_mode": inputs.demand_charge_mode,
        "detailed_voltage_band": inputs.detailed_voltage_band,
        "demand_charge_input_vnd_per_kw_month": (
            inputs.demand_charge_input_vnd_per_kw_month
        ),
        "demand_charge_evidence_note": inputs.demand_charge_evidence_note,
    }


def _build_financial_assumptions(config: QuickSizingConfig) -> dict[str, object]:
    scenario = config.scenario
    return {
        "price_escalation_pct": scenario.price_escalation_pct,
        "debt_pct": scenario.debt_pct,
        "interest_pct": scenario.interest_pct,
        "loan_tenor_years": scenario.loan_tenor_years,
        "wacc_pct": scenario.wacc_pct,
        "tax_pct": scenario.tax_pct,
        "analysis_years": scenario.analysis_years,
        "source": ValueSource.SCENARIO_DEFAULT.value,
        "config_version": scenario.version,
    }
