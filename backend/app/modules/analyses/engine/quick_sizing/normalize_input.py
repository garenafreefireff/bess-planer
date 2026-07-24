from __future__ import annotations

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    NormalizedQuickSizingInput,
    QuickSizingInput,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning

VALID_OBJECTIVES = {
    "saving",
    "peak_shaving",
    "solar_optimization",
    "backup",
    "power_quality",
    "investment",
}


def normalize_quick_sizing_input(
    inputs: QuickSizingInput,
    config: QuickSizingConfig,
) -> tuple[
    NormalizedQuickSizingInput,
    tuple[CalculationWarning, ...],
    tuple[CalculationTraceItem, ...],
]:
    warnings: list[CalculationWarning] = []
    trace: list[CalculationTraceItem] = []

    selected_objectives = _normalize_objectives(inputs.bess_objectives, warnings)
    effective_industry = (
        inputs.custom_industry.strip()
        if inputs.industry == "Khác" and inputs.custom_industry and inputs.custom_industry.strip()
        else inputs.industry
    )

    solar_is_active = inputs.solar_status in {"yes", "planned"}
    solar_capacity_kw = _normalize_solar_capacity_kw(inputs, solar_is_active, warnings)
    solar_monthly_generation_kwh = _normalize_solar_generation_kwh(
        inputs,
        solar_is_active,
        warnings,
    )
    budget_max = _normalize_budget_max(inputs, config, warnings)

    if not solar_is_active and _has_solar_detail(inputs):
        warnings.append(
            make_warning(
                "solar_fields_ignored",
                "Thông tin PV bị bỏ qua vì trạng thái PV không bật.",
                severity=WarningSeverity.INFO,
                field="solar_status",
            )
        )

    if "backup" not in selected_objectives and (
        inputs.backup_critical_load_pct is not None or inputs.backup_duration_hours is not None
    ):
        warnings.append(
            make_warning(
                "backup_fields_ignored",
                "Thông tin backup cũ bị bỏ qua vì không chọn mục tiêu dự phòng.",
                severity=WarningSeverity.INFO,
                field="bess_objectives",
            )
        )

    if "peak_shaving" not in selected_objectives and (
        inputs.estimated_peak_demand_kw is not None
        or inputs.target_peak_reduction_value is not None
        or inputs.target_peak_reduction_type is not None
    ):
        warnings.append(
            make_warning(
                "peak_shaving_fields_ignored",
                "Thông tin cắt đỉnh cũ không tham gia sizing vì không chọn mục tiêu cắt đỉnh.",
                severity=WarningSeverity.INFO,
                field="bess_objectives",
            )
        )

    if inputs.budget_range != "Nhập ngân sách tùy chỉnh" and inputs.custom_budget is not None:
        warnings.append(
            make_warning(
                "custom_budget_ignored",
                "Ngân sách tùy chỉnh bị bỏ qua vì người dùng không chọn khoảng tùy chỉnh.",
                severity=WarningSeverity.INFO,
                field="custom_budget",
            )
        )

    normalized = NormalizedQuickSizingInput(
        industry=inputs.industry,
        effective_industry=effective_industry,
        estimated_load_range=inputs.estimated_load_range,
        monthly_electricity_bill=inputs.monthly_electricity_bill,
        currency=inputs.currency.upper(),
        voltage_level=inputs.voltage_level,
        operating_hours_per_day=inputs.operating_hours_per_day,
        operating_days_per_week=inputs.operating_days_per_week,
        shift_pattern=inputs.shift_pattern,
        solar_status=inputs.solar_status,
        solar_capacity_kw=solar_capacity_kw,
        solar_monthly_generation_kwh=solar_monthly_generation_kwh,
        export_policy=inputs.export_policy if solar_is_active else None,
        solar_objectives=inputs.solar_objectives if solar_is_active else (),
        bess_objectives=selected_objectives,
        backup_critical_load_pct=(
            inputs.backup_critical_load_pct if "backup" in selected_objectives else None
        ),
        backup_duration_hours=(
            inputs.backup_duration_hours if "backup" in selected_objectives else None
        ),
        estimated_peak_demand_kw=(
            inputs.estimated_peak_demand_kw if "peak_shaving" in selected_objectives else None
        ),
        target_peak_reduction_type=(
            inputs.target_peak_reduction_type if "peak_shaving" in selected_objectives else None
        ),
        target_peak_reduction_value=(
            inputs.target_peak_reduction_value if "peak_shaving" in selected_objectives else None
        ),
        budget_range=inputs.budget_range,
        custom_budget=(
            inputs.custom_budget if inputs.budget_range == "Nhập ngân sách tùy chỉnh" else None
        ),
        budget_max=budget_max,
        demand_charge_applicability=inputs.demand_charge_applicability,
        demand_charge_mode=inputs.demand_charge_mode,
        detailed_voltage_band=inputs.detailed_voltage_band,
        demand_charge_input_vnd_per_kw_month=inputs.demand_charge_input_vnd_per_kw_month,
        demand_charge_evidence_note=inputs.demand_charge_evidence_note,
    )

    trace.append(
        CalculationTraceItem(
            formula_id="F01-F03",
            description="Chuẩn hóa PV, sản lượng PV và ngân sách.",
            inputs={
                "solar_capacity_value": inputs.solar_capacity_value,
                "solar_capacity_unit": inputs.solar_capacity_unit,
                "solar_monthly_generation_value": inputs.solar_monthly_generation_value,
                "solar_monthly_generation_unit": inputs.solar_monthly_generation_unit,
                "budget_range": inputs.budget_range,
                "custom_budget": inputs.custom_budget,
            },
            output={
                "solar_capacity_kw": solar_capacity_kw,
                "solar_monthly_generation_kwh": solar_monthly_generation_kwh,
                "budget_max": budget_max,
            },
        )
    )
    return normalized, tuple(warnings), tuple(trace)


def _normalize_objectives(
    objectives: tuple[str, ...],
    warnings: list[CalculationWarning],
) -> tuple[str, ...]:
    normalized: list[str] = []
    for objective in objectives:
        if objective not in VALID_OBJECTIVES:
            warnings.append(
                make_warning(
                    "unknown_objective",
                    f"Mục tiêu '{objective}' chưa được hỗ trợ và bị bỏ qua.",
                    severity=WarningSeverity.WARNING,
                    field="bess_objectives",
                )
            )
            continue
        if objective not in normalized:
            normalized.append(objective)

    if not normalized:
        warnings.append(
            make_warning(
                "missing_objective",
                "Cần chọn ít nhất một mục tiêu BESS để sizing.",
                severity=WarningSeverity.ERROR,
                field="bess_objectives",
                blocking=True,
            )
        )
    if len(normalized) > 3:
        warnings.append(
            make_warning(
                "too_many_objectives",
                "Chỉ sử dụng tối đa 3 mục tiêu đầu tiên theo đặc tả Quick Sizing.",
                severity=WarningSeverity.WARNING,
                field="bess_objectives",
            )
        )
    return tuple(normalized[:3])


def _normalize_solar_capacity_kw(
    inputs: QuickSizingInput,
    solar_is_active: bool,
    warnings: list[CalculationWarning],
) -> float | None:
    if not solar_is_active or inputs.solar_capacity_value is None:
        return None
    if inputs.solar_capacity_value < 0:
        warnings.append(
            make_warning(
                "invalid_solar_capacity",
                "Công suất PV không được âm.",
                severity=WarningSeverity.ERROR,
                field="solar_capacity_value",
                blocking=True,
            )
        )
        return None

    unit = inputs.solar_capacity_unit or "kWp"
    if unit == "MWp":
        return inputs.solar_capacity_value * 1000
    if unit != "kWp":
        warnings.append(
            make_warning(
                "unknown_solar_capacity_unit",
                "Đơn vị công suất PV không nhận diện được, tạm hiểu là kWp.",
                field="solar_capacity_unit",
            )
        )
    return inputs.solar_capacity_value


def _normalize_solar_generation_kwh(
    inputs: QuickSizingInput,
    solar_is_active: bool,
    warnings: list[CalculationWarning],
) -> float | None:
    if not solar_is_active or inputs.solar_monthly_generation_value is None:
        return None
    if inputs.solar_monthly_generation_value < 0:
        warnings.append(
            make_warning(
                "invalid_solar_generation",
                "Sản lượng PV tháng không được âm.",
                severity=WarningSeverity.ERROR,
                field="solar_monthly_generation_value",
                blocking=True,
            )
        )
        return None

    unit = inputs.solar_monthly_generation_unit or "kWh/tháng"
    if unit == "MWh/tháng":
        return inputs.solar_monthly_generation_value * 1000
    if unit != "kWh/tháng":
        warnings.append(
            make_warning(
                "unknown_solar_generation_unit",
                "Đơn vị sản lượng PV không nhận diện được, tạm hiểu là kWh/tháng.",
                field="solar_monthly_generation_unit",
            )
        )
    return inputs.solar_monthly_generation_value


def _normalize_budget_max(
    inputs: QuickSizingInput,
    config: QuickSizingConfig,
    warnings: list[CalculationWarning],
) -> float | None:
    if inputs.budget_range == "Nhập ngân sách tùy chỉnh":
        if inputs.custom_budget is None or inputs.custom_budget <= 0:
            warnings.append(
                make_warning(
                    "missing_custom_budget",
                    "Cần nhập ngân sách tùy chỉnh hợp lệ.",
                    severity=WarningSeverity.ERROR,
                    field="custom_budget",
                    blocking=True,
                )
            )
            return None
        return inputs.custom_budget

    if inputs.budget_range == "Trên 50 tỷ VNĐ":
        warnings.append(
            make_warning(
                "budget_over_50_unbounded",
                "Khoảng trên 50 tỷ chưa đặt trần cứng; hệ thống coi là không giới hạn.",
                severity=WarningSeverity.INFO,
                field="budget_range",
            )
        )
        return None

    if inputs.budget_range not in config.budget_catalog.range_upper_bounds:
        warnings.append(
            make_warning(
                "unknown_budget_range",
                "Khoảng ngân sách chưa được nhận diện; hệ thống coi là chưa xác định.",
                field="budget_range",
            )
        )
        return None

    return config.budget_catalog.range_upper_bounds[inputs.budget_range]


def _has_solar_detail(inputs: QuickSizingInput) -> bool:
    return any(
        value is not None and value != ()
        for value in (
            inputs.solar_capacity_value,
            inputs.solar_monthly_generation_value,
            inputs.export_policy,
            inputs.solar_objectives,
        )
    )
