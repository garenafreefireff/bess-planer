from __future__ import annotations

import math

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    LoadEstimation,
    ObjectiveSizingResult,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning


def calculate_power_quality_sizing(
    load: LoadEstimation,
    config: QuickSizingConfig,
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    dod = config.scenario.dod_pct / 100
    eta_discharge = math.sqrt(config.scenario.rte_pct / 100)
    power_kw = load.final_peak_demand_kw * config.scenario.quality_support_ratio
    energy_kwh = power_kw * config.scenario.quality_support_duration_hours / (dod * eta_discharge)
    duration_hours = energy_kwh / power_kw if power_kw > 0 else 0
    warning = make_warning(
        "power_quality_preliminary_only",
        "Sizing chất lượng điện chỉ là ước tính sơ bộ, không thay thế khảo sát thực tế.",
        severity=WarningSeverity.INFO,
        field="bess_objectives",
    )

    return (
        ObjectiveSizingResult(
            objective="power_quality",
            applicable=True,
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=duration_hours,
            assumptions_used=("F31", "F32", config.scenario.version),
            warnings=(warning,),
            source="preliminary_power_quality_support",
        ),
        (
            CalculationTraceItem(
                formula_id="F31-F32",
                description="Sizing cải thiện chất lượng điện sơ bộ.",
                inputs={
                    "final_peak_demand_kw": load.final_peak_demand_kw,
                    "quality_support_ratio": config.scenario.quality_support_ratio,
                    "quality_support_duration_hours": (
                        config.scenario.quality_support_duration_hours
                    ),
                    "dod": dod,
                    "eta_discharge": eta_discharge,
                },
                output={
                    "power_kw": power_kw,
                    "energy_kwh": energy_kwh,
                    "duration_hours": duration_hours,
                },
            ),
        ),
    )
