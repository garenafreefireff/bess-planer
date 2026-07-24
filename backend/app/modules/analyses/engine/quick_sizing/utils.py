from __future__ import annotations

import math

from app.modules.analyses.engine.quick_sizing.models import (
    CalculationWarning,
    WarningSeverity,
)


def clamp(value: float, lower: float, upper: float) -> float:
    return min(max(value, lower), upper)


def round_up(value: float, step: float) -> float:
    if step <= 0:
        return value
    return math.ceil(value / step) * step


def round_down(value: float, step: float) -> float:
    if step <= 0:
        return value
    return math.floor(value / step) * step


def safe_divide(numerator: float, denominator: float, fallback: float = 0.0) -> float:
    if denominator == 0:
        return fallback
    return numerator / denominator


def make_warning(
    code: str,
    message: str,
    *,
    severity: WarningSeverity = WarningSeverity.WARNING,
    field: str | None = None,
    blocking: bool = False,
) -> CalculationWarning:
    return CalculationWarning(
        code=code,
        severity=severity,
        field=field,
        message=message,
        blocking=blocking,
    )
