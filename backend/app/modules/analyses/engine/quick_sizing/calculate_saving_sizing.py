from __future__ import annotations

import math

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.lookup_data import get_shiftable_energy_ratio
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    LoadEstimation,
    NormalizedQuickSizingInput,
    ObjectiveSizingResult,
)


def calculate_saving_sizing(
    inputs: NormalizedQuickSizingInput,
    load: LoadEstimation,
    config: QuickSizingConfig,
) -> tuple[ObjectiveSizingResult, tuple[CalculationTraceItem, ...]]:
    dod = config.scenario.dod_pct / 100
    eta_discharge = math.sqrt(config.scenario.rte_pct / 100)
    shiftable_ratio = get_shiftable_energy_ratio(inputs.effective_industry, config)
    peak_energy_day = (
        load.monthly_electricity_kwh
        * load.tou_shares.peak
        / load.operating_days_per_month
    )
    shifted_energy = peak_energy_day * shiftable_ratio
    power_kw = shifted_energy / config.scenario.discharge_window_saving_hours
    energy_kwh = shifted_energy / (dod * eta_discharge)
    duration_hours = energy_kwh / power_kw if power_kw > 0 else 0

    return (
        ObjectiveSizingResult(
            objective="saving",
            applicable=True,
            power_kw=power_kw,
            energy_kwh=energy_kwh,
            duration_hours=duration_hours,
            assumptions_used=(
                "F17",
                "F18",
                "F19",
                "F20",
                config.lookup_catalog.version,
                config.scenario.version,
            ),
            source="tariff_arbitrage",
        ),
        (
            CalculationTraceItem(
                formula_id="F17-F20",
                description="Sizing tiết kiệm chi phí điện theo năng lượng giờ cao điểm.",
                inputs={
                    "monthly_electricity_kwh": load.monthly_electricity_kwh,
                    "share_peak": load.tou_shares.peak,
                    "operating_days_per_month": load.operating_days_per_month,
                    "shiftable_energy_ratio": shiftable_ratio,
                    "discharge_window_hours": config.scenario.discharge_window_saving_hours,
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
