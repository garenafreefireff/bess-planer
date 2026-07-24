from __future__ import annotations

from app.modules.analyses.engine.quick_sizing.calculate_capex import calculate_capex
from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.models import (
    BudgetEvaluation,
    BudgetOption,
    CalculationTraceItem,
    CalculationWarning,
    CapexBreakdown,
    CombinedSizingResult,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import make_warning, round_down


def evaluate_budget(
    *,
    sizing: CombinedSizingResult,
    capex: CapexBreakdown,
    budget_max: float | None,
    currency: str,
    config: QuickSizingConfig,
    voltage_level: str,
) -> tuple[BudgetEvaluation, tuple[CalculationWarning, ...], tuple[CalculationTraceItem, ...]]:
    technical_option = BudgetOption(
        power_kw=sizing.power_kw,
        energy_kwh=sizing.energy_kwh,
        duration_hours=sizing.duration_hours,
        capex=capex.total_capex,
        feasible=True,
    )

    if budget_max is None:
        return (
            BudgetEvaluation(
                budget_max=None,
                technical_capex=capex.total_capex,
                budget_gap=None,
                overrun_pct=None,
                status="unbounded",
                technical_option=technical_option,
                budget_option=None,
                currency=currency,
            ),
            (),
            (
                CalculationTraceItem(
                    formula_id="F47",
                    description="Không đánh giá vượt ngân sách vì không có trần ngân sách.",
                    inputs={"budget_max": None, "capex": capex.total_capex},
                    output={"status": "unbounded"},
                ),
            ),
        )

    budget_gap = capex.total_capex - budget_max
    overrun_pct = max(budget_gap, 0) / budget_max if budget_max > 0 else None
    if budget_gap <= 0:
        return (
            BudgetEvaluation(
                budget_max=budget_max,
                technical_capex=capex.total_capex,
                budget_gap=budget_gap,
                overrun_pct=0,
                status="within_budget",
                technical_option=technical_option,
                budget_option=None,
                currency=currency,
            ),
            (),
            (
                CalculationTraceItem(
                    formula_id="F47",
                    description="CAPEX nằm trong ngân sách.",
                    inputs={"budget_max": budget_max, "capex": capex.total_capex},
                    output={"budget_gap": budget_gap, "overrun_pct": 0},
                ),
            ),
        )

    budget_option = _calculate_budget_option(
        budget_max=budget_max,
        target_duration_hours=sizing.duration_hours or config.scenario.target_duration_hours,
        max_power_kw=sizing.power_kw,
        currency=currency,
        config=config,
        voltage_level=voltage_level,
    )
    warning = make_warning(
        "capex_over_budget",
        "CAPEX kỹ thuật vượt ngân sách; trả thêm cấu hình phù hợp ngân sách.",
        severity=WarningSeverity.WARNING,
        field="budget_range",
    )
    return (
        BudgetEvaluation(
            budget_max=budget_max,
            technical_capex=capex.total_capex,
            budget_gap=budget_gap,
            overrun_pct=overrun_pct,
            status="over_budget",
            technical_option=technical_option,
            budget_option=budget_option,
            currency=currency,
        ),
        (warning,),
        (
            CalculationTraceItem(
                formula_id="F47-F48",
                description="Đánh giá vượt ngân sách và tạo cấu hình theo ngân sách.",
                inputs={
                    "budget_max": budget_max,
                    "technical_capex": capex.total_capex,
                    "target_duration_hours": sizing.duration_hours
                    or config.scenario.target_duration_hours,
                    "power_step_kw": config.scenario.power_step_kw,
                    "energy_step_kwh": config.scenario.energy_step_kwh,
                },
                output={
                    "budget_gap": budget_gap,
                    "overrun_pct": overrun_pct,
                    "budget_option_power_kw": budget_option.power_kw,
                    "budget_option_energy_kwh": budget_option.energy_kwh,
                    "budget_option_capex": budget_option.capex,
                },
            ),
        ),
    )


def _calculate_budget_option(
    *,
    budget_max: float,
    target_duration_hours: float,
    max_power_kw: float,
    currency: str,
    config: QuickSizingConfig,
    voltage_level: str,
) -> BudgetOption:
    power_kw = round_down(max_power_kw, config.scenario.power_step_kw)
    best_option: BudgetOption | None = None

    while power_kw > 0:
        energy_kwh = round_down(
            power_kw * target_duration_hours,
            config.scenario.energy_step_kwh,
        )
        if energy_kwh <= 0:
            power_kw = max(power_kw - config.scenario.power_step_kw, 0)
            continue

        budget_sizing = CombinedSizingResult(
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=target_duration_hours,
            usable_energy_kwh=energy_kwh * config.scenario.dod_pct / 100,
            cycles_per_day=0,
            dominant_power_objective=None,
            dominant_energy_objective=None,
            selected_objectives=(),
            objective_sizing_results=(),
        )
        budget_capex, _, _ = calculate_capex(
            budget_sizing,
            currency=currency,
            config=config,
            voltage_level=voltage_level,
        )

        if budget_capex.total_capex <= budget_max:
            best_option = BudgetOption(
                power_kw=power_kw,
                energy_kwh=energy_kwh,
                duration_hours=target_duration_hours,
                capex=budget_capex.total_capex,
                feasible=True,
            )
            break

        power_kw = max(power_kw - config.scenario.power_step_kw, 0)

    if best_option is not None:
        return best_option

    return BudgetOption(
        power_kw=0,
        energy_kwh=0,
        duration_hours=0,
        capex=0,
        feasible=False,
    )
