from __future__ import annotations

import math

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    LoadEstimation,
    NormalizedQuickSizingInput,
    ObjectiveSizingResult,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning


def calculate_peak_shaving_sizing(
    inputs: NormalizedQuickSizingInput,
    load: LoadEstimation,
    config: QuickSizingConfig,
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    warnings: list[CalculationWarning] = []
    target_type = inputs.target_peak_reduction_type
    target_value = inputs.target_peak_reduction_value

    if target_type not in {"percent", "kw"} or target_value is None or target_value <= 0:
        warnings.append(
            make_warning(
                "missing_peak_reduction_target",
                "Chọn cắt đỉnh nhưng thiếu loại hoặc giá trị giảm Pmax.",
                severity=WarningSeverity.ERROR,
                field="target_peak_reduction_value",
                blocking=True,
            )
        )
        return (
            ObjectiveSizingResult(
                objective="peak_shaving",
                applicable=False,
                power_kw=0,
                energy_kwh=0,
                duration_hours=0,
                assumptions_used=("F21",),
                warnings=tuple(warnings),
            ),
            (),
        )

    if target_type == "percent":
        power_reduction_kw = load.final_peak_demand_kw * target_value / 100
    else:
        power_reduction_kw = target_value

    if power_reduction_kw > load.final_peak_demand_kw:
        warnings.append(
            make_warning(
                "peak_reduction_exceeds_peak_demand",
                "Mức giảm Pmax lớn hơn Pmax hiện tại; cần kiểm tra lại dữ liệu.",
                severity=WarningSeverity.ERROR,
                field="target_peak_reduction_value",
                blocking=True,
            )
        )

    dod = config.scenario.dod_pct / 100
    eta_discharge = math.sqrt(config.scenario.rte_pct / 100)
    power_kw = power_reduction_kw * config.scenario.control_reserve
    energy_kwh = power_reduction_kw * config.scenario.peak_duration_hours / (dod * eta_discharge)
    duration_hours = energy_kwh / power_kw if power_kw > 0 else 0

    return (
        ObjectiveSizingResult(
            objective="peak_shaving",
            applicable=True,
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=duration_hours,
            assumptions_used=("F21", "F22", "F23", config.scenario.version),
            warnings=tuple(warnings),
            source="peak_reduction_target",
        ),
        (
            CalculationTraceItem(
                formula_id="F21-F23",
                description="Sizing cắt giảm công suất đỉnh.",
                inputs={
                    "final_peak_demand_kw": load.final_peak_demand_kw,
                    "target_peak_reduction_type": target_type,
                    "target_peak_reduction_value": target_value,
                    "control_reserve": config.scenario.control_reserve,
                    "peak_duration_hours": config.scenario.peak_duration_hours,
                    "peak_event_frequency_per_operating_day": (
                        config.scenario.peak_event_frequency_per_operating_day
                    ),
                    "dod": dod,
                    "eta_discharge": eta_discharge,
                },
                output={
                    "power_reduction_kw": power_reduction_kw,
                    "power_kw": power_kw,
                    "energy_kwh": energy_kwh,
                    "duration_hours": duration_hours,
                },
            ),
        ),
    )
