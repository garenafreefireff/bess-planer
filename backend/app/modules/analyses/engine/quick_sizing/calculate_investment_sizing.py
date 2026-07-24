from __future__ import annotations

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

OPERATIONAL_OBJECTIVES = {
    "saving",
    "peak_shaving",
    "solar_optimization",
    "backup",
    "power_quality",
}


def calculate_investment_sizing(
    inputs: NormalizedQuickSizingInput,
    load: LoadEstimation,
    config: QuickSizingConfig,
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    warnings: list[CalculationWarning] = []
    has_operational_objective = any(
        objective in OPERATIONAL_OBJECTIVES for objective in inputs.bess_objectives
    )
    if has_operational_objective:
        warnings.append(
            make_warning(
                "investment_kpi_only",
                "Mục tiêu đầu tư chỉ bật KPI tài chính vì đã có mục tiêu vận hành khác.",
                severity=WarningSeverity.INFO,
                field="bess_objectives",
            )
        )
        return (
            ObjectiveSizingResult(
                objective="investment",
                applicable=False,
                power_kw=0,
                energy_kwh=0,
                duration_hours=0,
                assumptions_used=("F33",),
                warnings=tuple(warnings),
                source="financial_kpi_only",
            ),
            (),
        )

    power_kw = load.final_peak_demand_kw * config.scenario.investment_default_ratio
    energy_kwh = power_kw * config.scenario.default_duration_hours
    return (
        ObjectiveSizingResult(
            objective="investment",
            applicable=True,
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=config.scenario.default_duration_hours,
            assumptions_used=("F33", config.scenario.version),
            source="scenario_default_survey",
        ),
        (
            CalculationTraceItem(
                formula_id="F33",
                description="Cấu hình khảo sát cơ sở khi chỉ chọn đầu tư.",
                inputs={
                    "final_peak_demand_kw": load.final_peak_demand_kw,
                    "investment_default_ratio": config.scenario.investment_default_ratio,
                    "default_duration_hours": config.scenario.default_duration_hours,
                },
                output={
                    "power_kw": power_kw,
                    "energy_kwh": energy_kwh,
                    "duration_hours": config.scenario.default_duration_hours,
                },
            ),
        ),
    )
