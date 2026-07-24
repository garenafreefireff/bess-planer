from __future__ import annotations

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.lookup_data import (
    get_load_factor,
    get_load_range_bounds,
    get_tariff_plan,
    get_tou_shares,
)
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    LoadEstimation,
    NormalizedQuickSizingInput,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning, safe_divide


def infer_load_profile(
    inputs: NormalizedQuickSizingInput,
    config: QuickSizingConfig,
) -> tuple[LoadEstimation, tuple[CalculationWarning, ...], tuple[CalculationTraceItem, ...]]:
    warnings: list[CalculationWarning] = []
    trace: list[CalculationTraceItem] = []

    operating_days_per_year = _operating_days_per_year(inputs, config, warnings)
    operating_days_per_month = operating_days_per_year / 12
    operating_hours_per_month = _operating_hours_per_month(
        inputs,
        operating_days_per_month,
        warnings,
    )
    operating_hours_per_year = (inputs.operating_hours_per_day or 0) * operating_days_per_year

    tou_shares, tou_warnings = get_tou_shares(inputs.shift_pattern, config)
    tariff_plan, tariff_warnings = get_tariff_plan(
        voltage_level=inputs.voltage_level,
        industry=inputs.effective_industry,
        currency=inputs.currency,
        config=config,
        demand_charge_applicability=inputs.demand_charge_applicability,
        demand_charge_mode=inputs.demand_charge_mode,
        detailed_voltage_band=inputs.detailed_voltage_band,
        demand_charge_input_vnd_per_kw_month=inputs.demand_charge_input_vnd_per_kw_month,
        demand_charge_evidence_note=inputs.demand_charge_evidence_note,
    )
    load_factor, lf_warnings = get_load_factor(
        industry=inputs.effective_industry,
        shift_pattern=inputs.shift_pattern,
        config=config,
    )
    warnings.extend(tou_warnings)
    warnings.extend(tariff_warnings)
    warnings.extend(lf_warnings)

    tariff_average = (
        tariff_plan.low_price * tou_shares.low
        + tariff_plan.normal_price * tou_shares.normal
        + tariff_plan.peak_price * tou_shares.peak
    )

    bill_energy = _bill_energy(inputs, warnings)
    if bill_energy > 0 and tariff_average > 0:
        monthly_electricity_kwh = bill_energy / tariff_average
    else:
        monthly_electricity_kwh = _fallback_monthly_energy_kwh(
            inputs,
            operating_hours_per_month,
            load_factor,
            config,
            warnings,
        )

    average_power_kw = safe_divide(
        monthly_electricity_kwh,
        operating_hours_per_month,
    )
    calculated_peak_demand_kw = safe_divide(average_power_kw, load_factor)
    final_peak_demand_kw = inputs.estimated_peak_demand_kw or calculated_peak_demand_kw

    _check_peak_against_load_range(final_peak_demand_kw, inputs, config, warnings)
    _check_user_peak_against_bill_peak(
        user_peak_kw=inputs.estimated_peak_demand_kw,
        calculated_peak_kw=calculated_peak_demand_kw,
        warnings=warnings,
    )

    trace.extend(
        [
            CalculationTraceItem(
                formula_id="F04-F06",
                description="Tính ngày và giờ vận hành.",
                inputs={
                    "operating_days_per_week": inputs.operating_days_per_week,
                    "operating_hours_per_day": inputs.operating_hours_per_day,
                    "availability": config.scenario.availability,
                },
                output={
                    "operating_days_per_year": operating_days_per_year,
                    "operating_days_per_month": operating_days_per_month,
                    "operating_hours_per_month": operating_hours_per_month,
                    "operating_hours_per_year": operating_hours_per_year,
                },
            ),
            CalculationTraceItem(
                formula_id="F07-F08",
                description="Tra tỷ trọng TOU và tính giá điện bình quân.",
                inputs={
                    "low_price": tariff_plan.low_price,
                    "normal_price": tariff_plan.normal_price,
                    "peak_price": tariff_plan.peak_price,
                    "share_low": tou_shares.low,
                    "share_normal": tou_shares.normal,
                    "share_peak": tou_shares.peak,
                },
                output={"tariff_average": tariff_average},
            ),
            CalculationTraceItem(
                formula_id="F09-F15",
                description="Suy luận điện năng tháng, công suất trung bình và Pmax.",
                inputs={
                    "monthly_electricity_bill": inputs.monthly_electricity_bill,
                    "tariff_average": tariff_average,
                    "operating_hours_per_month": operating_hours_per_month,
                    "load_factor": load_factor,
                    "estimated_peak_demand_kw": inputs.estimated_peak_demand_kw,
                    "estimated_load_range": inputs.estimated_load_range,
                },
                output={
                    "monthly_electricity_kwh": monthly_electricity_kwh,
                    "average_power_kw": average_power_kw,
                    "calculated_peak_demand_kw": calculated_peak_demand_kw,
                    "final_peak_demand_kw": final_peak_demand_kw,
                },
            ),
        ]
    )

    return (
        LoadEstimation(
            monthly_electricity_kwh=monthly_electricity_kwh,
            operating_days_per_year=operating_days_per_year,
            operating_days_per_month=operating_days_per_month,
            operating_hours_per_month=operating_hours_per_month,
            operating_hours_per_year=operating_hours_per_year,
            average_power_kw=average_power_kw,
            calculated_peak_demand_kw=calculated_peak_demand_kw,
            final_peak_demand_kw=final_peak_demand_kw,
            load_factor=load_factor,
            tariff_average=tariff_average,
            bill_energy=bill_energy,
            tou_shares=tou_shares,
            tariff_plan=tariff_plan,
        ),
        tuple(warnings),
        tuple(trace),
    )


def _operating_days_per_year(
    inputs: NormalizedQuickSizingInput,
    config: QuickSizingConfig,
    warnings: list[CalculationWarning],
) -> float:
    if inputs.operating_days_per_week is None:
        warnings.append(
            make_warning(
                "missing_operating_days",
                "Thiếu ngày vận hành/tuần; dùng 6 ngày/tuần làm fallback.",
                severity=WarningSeverity.ERROR,
                field="operating_days_per_week",
                blocking=True,
            )
        )
        operating_days_per_week = 6.0
    else:
        operating_days_per_week = inputs.operating_days_per_week

    if operating_days_per_week <= 0 or operating_days_per_week > 7:
        warnings.append(
            make_warning(
                "invalid_operating_days",
                "Ngày vận hành/tuần phải nằm trong khoảng 1-7.",
                severity=WarningSeverity.ERROR,
                field="operating_days_per_week",
                blocking=True,
            )
        )
        operating_days_per_week = min(max(operating_days_per_week, 1), 7)

    return operating_days_per_week * 52 * config.scenario.availability


def _operating_hours_per_month(
    inputs: NormalizedQuickSizingInput,
    operating_days_per_month: float,
    warnings: list[CalculationWarning],
) -> float:
    if inputs.operating_hours_per_day is None:
        warnings.append(
            make_warning(
                "missing_operating_hours",
                "Thiếu giờ vận hành/ngày; dùng 12 giờ/ngày làm fallback.",
                severity=WarningSeverity.ERROR,
                field="operating_hours_per_day",
                blocking=True,
            )
        )
        operating_hours_per_day = 12.0
    else:
        operating_hours_per_day = inputs.operating_hours_per_day

    if operating_hours_per_day <= 0 or operating_hours_per_day > 24:
        warnings.append(
            make_warning(
                "invalid_operating_hours",
                "Giờ vận hành/ngày phải nằm trong khoảng 1-24.",
                severity=WarningSeverity.ERROR,
                field="operating_hours_per_day",
                blocking=True,
            )
        )
        operating_hours_per_day = min(max(operating_hours_per_day, 1), 24)

    return operating_hours_per_day * operating_days_per_month


def _bill_energy(
    inputs: NormalizedQuickSizingInput,
    warnings: list[CalculationWarning],
) -> float:
    if inputs.monthly_electricity_bill is None or inputs.monthly_electricity_bill <= 0:
        warnings.append(
            make_warning(
                "invalid_monthly_bill",
                "Tiền điện tháng không hợp lệ; phải dùng fallback từ khoảng phụ tải.",
                severity=WarningSeverity.ERROR,
                field="monthly_electricity_bill",
                blocking=True,
            )
        )
        return 0.0

    warnings.append(
        make_warning(
            "bill_structure_unknown",
            "Chưa biết hóa đơn gồm VAT/giá công suất/phí khác; dùng hóa đơn trực tiếp.",
            severity=WarningSeverity.INFO,
            field="monthly_electricity_bill",
        )
    )
    return inputs.monthly_electricity_bill


def _fallback_monthly_energy_kwh(
    inputs: NormalizedQuickSizingInput,
    operating_hours_per_month: float,
    load_factor: float,
    config: QuickSizingConfig,
    warnings: list[CalculationWarning],
) -> float:
    lower, upper = get_load_range_bounds(inputs.estimated_load_range, config)
    if lower is not None and upper is not None:
        fallback_peak_kw = (lower + upper) / 2
    elif lower is not None:
        fallback_peak_kw = lower * 1.25
    else:
        fallback_peak_kw = 500.0
        warnings.append(
            make_warning(
                "load_range_unknown_fallback",
                "Không đủ dữ liệu phụ tải; dùng fallback 500 kW cần xác nhận nghiệp vụ.",
                field="estimated_load_range",
            )
        )

    warnings.append(
        make_warning(
            "fallback_load_range_used",
            "Khoảng phụ tải chỉ được dùng làm fallback vì thiếu hóa đơn hợp lệ.",
            field="estimated_load_range",
        )
    )
    return fallback_peak_kw * load_factor * operating_hours_per_month


def _check_peak_against_load_range(
    peak_kw: float,
    inputs: NormalizedQuickSizingInput,
    config: QuickSizingConfig,
    warnings: list[CalculationWarning],
) -> None:
    lower, upper = get_load_range_bounds(inputs.estimated_load_range, config)
    if lower is None and upper is None:
        return

    if lower is not None and peak_kw < lower:
        distance = lower - peak_kw
    elif upper is not None and peak_kw > upper:
        distance = peak_kw - upper
    else:
        return

    if lower is not None and upper is not None:
        midpoint = (lower + upper) / 2
    elif lower is not None:
        midpoint = lower * 1.25
    else:
        midpoint = upper or peak_kw

    deviation = safe_divide(distance, midpoint)
    if deviation > 0.30:
        warnings.append(
            make_warning(
                "peak_demand_outside_load_range_error",
                "Pmax lệch trên 30% so với khoảng phụ tải đã chọn; cần sửa dữ liệu Bước 1.",
                severity=WarningSeverity.ERROR,
                field="estimated_load_range",
                blocking=True,
            )
        )
    elif deviation > 0.15:
        warnings.append(
            make_warning(
                "peak_demand_outside_load_range_warning",
                "Pmax lệch 15-30% so với khoảng phụ tải đã chọn.",
                field="estimated_load_range",
            )
        )


def _check_user_peak_against_bill_peak(
    *,
    user_peak_kw: float | None,
    calculated_peak_kw: float,
    warnings: list[CalculationWarning],
) -> None:
    if user_peak_kw is None or calculated_peak_kw <= 0:
        return

    deviation = abs(user_peak_kw - calculated_peak_kw) / calculated_peak_kw
    if deviation > 0.30:
        warnings.append(
            make_warning(
                "user_peak_differs_from_bill_peak",
                "Pmax nhập tay lệch trên 30% so với Pmax suy luận từ hóa đơn.",
                field="estimated_peak_demand_kw",
            )
        )
