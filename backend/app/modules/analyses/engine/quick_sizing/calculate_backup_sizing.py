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


def calculate_backup_sizing(
    inputs: NormalizedQuickSizingInput,
    load: LoadEstimation,
    config: QuickSizingConfig,
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    warnings: list[CalculationWarning] = []
    critical_load_pct = inputs.backup_critical_load_pct
    backup_duration_hours = inputs.backup_duration_hours

    if critical_load_pct is None or critical_load_pct <= 0:
        warnings.append(
            make_warning(
                "missing_backup_critical_load",
                "Chọn backup nhưng thiếu tỷ lệ tải quan trọng.",
                severity=WarningSeverity.ERROR,
                field="backup_critical_load_pct",
                blocking=True,
            )
        )
    if backup_duration_hours is None or backup_duration_hours <= 0:
        warnings.append(
            make_warning(
                "missing_backup_duration",
                "Chọn backup nhưng thiếu thời gian dự phòng hợp lệ.",
                severity=WarningSeverity.ERROR,
                field="backup_duration_hours",
                blocking=True,
            )
        )

    if warnings:
        return (
            ObjectiveSizingResult(
                objective="backup",
                applicable=False,
                power_kw=0,
                energy_kwh=0,
                duration_hours=0,
                assumptions_used=("F28", "F29", "F30"),
                warnings=tuple(warnings),
            ),
            (),
        )

    dod = config.scenario.dod_pct / 100
    eta_discharge = math.sqrt(config.scenario.rte_pct / 100)
    power_critical_kw = load.final_peak_demand_kw * (critical_load_pct or 0) / 100
    power_kw = power_critical_kw
    energy_kwh = power_critical_kw * (backup_duration_hours or 0) / (dod * eta_discharge)
    duration_hours = energy_kwh / power_kw if power_kw > 0 else 0

    return (
        ObjectiveSizingResult(
            objective="backup",
            applicable=True,
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=duration_hours,
            assumptions_used=("F28", "F29", "F30", config.scenario.version),
            source="critical_load_backup",
        ),
        (
            CalculationTraceItem(
                formula_id="F28-F30",
                description="Sizing dự phòng nguồn điện theo tải quan trọng.",
                inputs={
                    "final_peak_demand_kw": load.final_peak_demand_kw,
                    "backup_critical_load_pct": critical_load_pct,
                    "backup_duration_hours": backup_duration_hours,
                    "dod": dod,
                    "eta_discharge": eta_discharge,
                },
                output={
                    "power_critical_kw": power_critical_kw,
                    "power_kw": power_kw,
                    "energy_kwh": energy_kwh,
                    "duration_hours": duration_hours,
                },
            ),
        ),
    )
