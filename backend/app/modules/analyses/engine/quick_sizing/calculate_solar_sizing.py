from __future__ import annotations

import math

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.lookup_data import get_pv_surplus_ratio
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    LoadEstimation,
    NormalizedQuickSizingInput,
    ObjectiveSizingResult,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning


def calculate_solar_sizing(
    inputs: NormalizedQuickSizingInput,
    load: LoadEstimation,
    config: QuickSizingConfig,
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    warnings: list[CalculationWarning] = []
    if inputs.solar_status == "none":
        warnings.append(
            make_warning(
                "solar_objective_without_pv",
                "Chọn tối ưu PV nhưng trạng thái PV là không có; bỏ qua sizing PV.",
                severity=WarningSeverity.WARNING,
                field="solar_status",
            )
        )
        return _not_applicable(tuple(warnings))

    if inputs.solar_capacity_kw is None or inputs.solar_capacity_kw <= 0:
        warnings.append(
            make_warning(
                "missing_solar_capacity",
                "Thiếu công suất PV nên không thể sizing tối ưu PV.",
                severity=WarningSeverity.ERROR,
                field="solar_capacity_value",
                blocking=True,
            )
        )
        return _not_applicable(tuple(warnings))

    if inputs.solar_monthly_generation_kwh is None:
        pv_month_kwh = (
            inputs.solar_capacity_kw
            * config.lookup_catalog.specific_yield_month_kwh_per_kw
        )
        warnings.append(
            make_warning(
                "solar_generation_fallback",
                "Thiếu sản lượng PV tháng; dùng specific yield từ config và giảm độ tin cậy.",
                field="solar_monthly_generation_value",
            )
        )
    else:
        pv_month_kwh = inputs.solar_monthly_generation_kwh

    surplus_ratio = get_pv_surplus_ratio(inputs.export_policy, inputs.solar_objectives, config)
    pv_surplus_day = pv_month_kwh * surplus_ratio / load.operating_days_per_month
    dod = config.scenario.dod_pct / 100
    eta_discharge = math.sqrt(config.scenario.rte_pct / 100)
    power_kw = min(
        inputs.solar_capacity_kw * config.lookup_catalog.pv_power_ratio,
        load.final_peak_demand_kw,
    )
    energy_kwh = pv_surplus_day / (dod * eta_discharge)
    duration_hours = energy_kwh / power_kw if power_kw > 0 else 0

    return (
        ObjectiveSizingResult(
            objective="solar_optimization",
            applicable=True,
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=duration_hours,
            assumptions_used=(
                "F24",
                "F25",
                "F26",
                "F27",
                config.lookup_catalog.version,
                config.scenario.version,
            ),
            warnings=tuple(warnings),
            source="pv_surplus_storage",
        ),
        (
            CalculationTraceItem(
                formula_id="F24-F27",
                description="Sizing tối ưu điện mặt trời.",
                inputs={
                    "solar_capacity_kw": inputs.solar_capacity_kw,
                    "solar_monthly_generation_kwh": inputs.solar_monthly_generation_kwh,
                    "specific_yield_month_kwh_per_kw": (
                        config.lookup_catalog.specific_yield_month_kwh_per_kw
                    ),
                    "pv_surplus_ratio": surplus_ratio,
                    "pv_power_ratio": config.lookup_catalog.pv_power_ratio,
                    "final_peak_demand_kw": load.final_peak_demand_kw,
                    "dod": dod,
                    "eta_discharge": eta_discharge,
                },
                output={
                    "pv_month_kwh": pv_month_kwh,
                    "pv_surplus_day": pv_surplus_day,
                    "power_kw": power_kw,
                    "energy_kwh": energy_kwh,
                    "duration_hours": duration_hours,
                },
            ),
        ),
    )


def _not_applicable(
    warnings: tuple[CalculationWarning, ...],
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    return (
        ObjectiveSizingResult(
            objective="solar_optimization",
            applicable=False,
            power_kw=0,
            energy_kwh=0,
            duration_hours=0,
            assumptions_used=("F24", "F25", "F26", "F27"),
            warnings=warnings,
        ),
        (),
    )
