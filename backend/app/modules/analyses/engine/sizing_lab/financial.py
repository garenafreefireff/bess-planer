from typing import Any

from app.modules.analyses.engine.sizing_lab.models import SizingAssumptions


def calculate_capex_vnd(energy_kwh: float, power_kw: float, assumptions: SizingAssumptions) -> float:
    equipment = (
        energy_kwh * assumptions.battery_cost_vnd_per_kwh
        + power_kw * assumptions.pcs_cost_vnd_per_kw
    )
    return equipment * (1 + (assumptions.epc_pct + assumptions.other_cost_pct) / 100)


def discounted_cashflow(
    *,
    capex_vnd: float,
    annual_saving_vnd: float,
    assumptions: SizingAssumptions,
    saving_multiplier: float = 1.0,
    capex_multiplier: float = 1.0,
    discount_rate: float | None = None,
) -> dict[str, Any]:
    adjusted_capex = capex_vnd * capex_multiplier
    annual_opex = adjusted_capex * assumptions.annual_opex_pct / 100
    rate = assumptions.discount_rate if discount_rate is None else discount_rate
    cumulative = -adjusted_capex
    npv = -adjusted_capex
    payback_years: float | None = None
    cashflows: list[dict[str, float]] = [{"year": 0, "net_cashflow_vnd": -adjusted_capex, "cumulative_vnd": cumulative}]

    for year in range(1, assumptions.analysis_years + 1):
        saving = annual_saving_vnd * saving_multiplier * ((1 + assumptions.electricity_escalation) ** (year - 1))
        net = saving - annual_opex
        previous = cumulative
        cumulative += net
        npv += net / ((1 + rate) ** year)
        if payback_years is None and cumulative >= 0 and net > 0:
            fraction = max(0.0, min(1.0, -previous / net))
            payback_years = (year - 1) + fraction
        cashflows.append({"year": year, "net_cashflow_vnd": net, "cumulative_vnd": cumulative})

    roi = npv / adjusted_capex if adjusted_capex else 0
    return {
        "capex_vnd": round(adjusted_capex, 2),
        "annual_opex_vnd": round(annual_opex, 2),
        "npv_vnd": round(npv, 2),
        "roi": round(roi, 6),
        "payback_years": round(payback_years, 3) if payback_years is not None else None,
        "cashflows": [
            {
                "year": int(item["year"]),
                "net_cashflow_vnd": round(item["net_cashflow_vnd"], 2),
                "cumulative_vnd": round(item["cumulative_vnd"], 2),
            }
            for item in cashflows
        ],
    }
