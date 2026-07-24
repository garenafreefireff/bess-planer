from __future__ import annotations

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.lookup_data import get_cycle_requirement
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    CombinedSizingResult,
    ObjectiveSizingResult,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning, round_up

BACKUP_OBJECTIVE = "backup"


def combine_objective_sizing(
    objective_results: tuple[ObjectiveSizingResult, ...],
    selected_objectives: tuple[str, ...],
    config: QuickSizingConfig,
) -> tuple[CombinedSizingResult, tuple[CalculationWarning, ...], tuple[CalculationTraceItem, ...]]:
    warnings: list[CalculationWarning] = []
    applicable_results = tuple(result for result in objective_results if result.applicable)
    if not applicable_results:
        warnings.append(
            make_warning(
                "no_applicable_objective",
                "Không có mục tiêu nào đủ dữ liệu để tạo cấu hình kỹ thuật.",
                severity=WarningSeverity.ERROR,
                field="bess_objectives",
                blocking=True,
            )
        )

    dominant_power = _max_result(applicable_results, by="power")
    dominant_energy_operational = _max_result(
        tuple(result for result in applicable_results if result.objective != BACKUP_OBJECTIVE),
        by="energy",
    )
    backup_result = next(
        (result for result in applicable_results if result.objective == BACKUP_OBJECTIVE),
        None,
    )

    power_raw = dominant_power.power_kw if dominant_power else 0
    energy_operational = (
        dominant_energy_operational.energy_kwh if dominant_energy_operational else 0
    )
    energy_backup = backup_result.energy_kwh if backup_result else 0
    if config.scenario.backup_reserve_policy == "separate":
        energy_raw = energy_operational + energy_backup
    else:
        energy_raw = max(energy_operational, energy_backup)

    power_margin = power_raw * (1 + config.scenario.power_margin_pct / 100)
    energy_margin = energy_raw * (1 + config.scenario.energy_margin_pct / 100)
    power_kw = round_up(power_margin, config.scenario.power_step_kw)
    energy_kwh = round_up(energy_margin, config.scenario.energy_step_kwh)
    duration_hours = energy_kwh / power_kw if power_kw > 0 else 0
    usable_energy_kwh = energy_kwh * config.scenario.dod_pct / 100
    cycle_requirements = (
        get_cycle_requirement(objective, config) for objective in selected_objectives
    )
    cycles_per_day = min(
        max(cycle_requirements, default=0),
        config.scenario.max_cycles_per_day,
    )

    if duration_hours > 8:
        warnings.append(
            make_warning(
                "unusual_bess_duration_high",
                "Thời lượng BESS trên 8 giờ, cần kiểm tra lại mục tiêu và giả định.",
                field="technical_assumptions.duration_hours",
            )
        )
    if duration_hours > 0 and duration_hours < 0.25:
        warnings.append(
            make_warning(
                "unusual_bess_duration_low",
                "Thời lượng BESS dưới 15 phút, cần kiểm tra lại mục tiêu và giả định.",
                field="technical_assumptions.duration_hours",
            )
        )

    trace = (
        CalculationTraceItem(
            formula_id="F34-F41",
            description="Kết hợp các mục tiêu, áp dụng margin, làm tròn và tính usable energy.",
            inputs={
                "power_raw": power_raw,
                "energy_operational": energy_operational,
                "energy_backup": energy_backup,
                "backup_reserve_policy": config.scenario.backup_reserve_policy,
                "power_margin_pct": config.scenario.power_margin_pct,
                "energy_margin_pct": config.scenario.energy_margin_pct,
                "power_step_kw": config.scenario.power_step_kw,
                "energy_step_kwh": config.scenario.energy_step_kwh,
                "dod_pct": config.scenario.dod_pct,
            },
            output={
                "power_kw": power_kw,
                "energy_kwh": energy_kwh,
                "duration_hours": duration_hours,
                "usable_energy_kwh": usable_energy_kwh,
                "cycles_per_day": cycles_per_day,
            },
        ),
    )

    return (
        CombinedSizingResult(
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=duration_hours,
            usable_energy_kwh=usable_energy_kwh,
            cycles_per_day=cycles_per_day,
            dominant_power_objective=dominant_power.objective if dominant_power else None,
            dominant_energy_objective=(
                _dominant_energy_objective(dominant_energy_operational, backup_result)
            ),
            selected_objectives=selected_objectives,
            objective_sizing_results=objective_results,
        ),
        tuple(warnings),
        trace,
    )


def _max_result(
    results: tuple[ObjectiveSizingResult, ...],
    *,
    by: str,
) -> ObjectiveSizingResult | None:
    if not results:
        return None
    if by == "power":
        return max(results, key=lambda result: result.power_kw)
    return max(results, key=lambda result: result.energy_kwh)


def _dominant_energy_objective(
    operational: ObjectiveSizingResult | None,
    backup: ObjectiveSizingResult | None,
) -> str | None:
    candidates = tuple(result for result in (operational, backup) if result is not None)
    if not candidates:
        return None
    return max(candidates, key=lambda result: result.energy_kwh).objective
