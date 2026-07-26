from __future__ import annotations

import math
from dataclasses import dataclass, replace
from datetime import date
from typing import Any

import numpy as np
from scipy.optimize import linprog

STEPS_PER_DAY = 96
DT_HOURS = 0.25
ROLL_WIN = 2
WARRANTY_CYCLES = 6000


@dataclass(frozen=True)
class DayProfile:
    load: np.ndarray
    pv: np.ndarray
    day_type: str = "working"
    day_index: int = 1
    date_iso: str | None = None


@dataclass
class MonthProfile:
    source: str
    days: list[DayProfile]


@dataclass(frozen=True)
class BessConfig:
    e_cap_kwh: float
    p_rated_kw: float
    eta_ch: float
    eta_dis: float
    soc_min: float
    soc_max: float
    soc_safety: float
    soc_eod: float
    price_peak: float
    price_mid: float
    price_off: float
    demand_charge: float
    peak_steps: frozenset[int]
    off_steps: frozenset[int]
    sunday_no_peak: bool
    p_target_kw: float

    @property
    def dt(self) -> float:
        return DT_HOURS


def _number(value: object, default: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return float(default)
    return float(value)


def _ranges_to_steps(raw: object, fallback: str) -> list[int]:
    text = raw if isinstance(raw, str) and raw.strip() else fallback
    steps: list[int] = []
    for part in text.split(","):
        part = part.strip()
        if not part or "-" not in part:
            continue
        left, right = part.split("-", 1)
        h1, m1 = [int(item) for item in left.strip().split(":")]
        h2, m2 = [int(item) for item in right.strip().split(":")]
        start = h1 * 4 + m1 // 15
        end = h2 * 4 + m2 // 15
        if end <= start:
            end += STEPS_PER_DAY
        steps.extend(index % STEPS_PER_DAY for index in range(start, end))
    return sorted(set(steps))


def base_config(configuration: dict[str, Any], *, demand_enabled: bool | None = None) -> BessConfig:
    soc_min = min(0.95, max(0.0, _number(configuration.get("socMinPct"), 10.0) / 100))
    soc_max = min(
        1.0,
        max(
            soc_min + 0.01,
            _number(configuration.get("socMaxPct"), 93.0) / 100,
        ),
    )
    soc_safety = min(0.20, max(0.0, _number(configuration.get("socSafetyPct"), 5.0) / 100))
    demand_charge = max(
        0.0,
        _number(configuration.get("demandChargeVndPerKwMonth"), 285_414.0),
    )
    billing_mode = str(configuration.get("billingMode", "2tc")).lower()
    if demand_enabled is False or (demand_enabled is None and billing_mode == "tou"):
        demand_charge = 0.0
    return BessConfig(
        e_cap_kwh=max(1.0, _number(configuration.get("energyKwh"), 1000.0)),
        p_rated_kw=max(1.0, _number(configuration.get("powerKw"), 500.0)),
        eta_ch=min(1.0, max(0.5, _number(configuration.get("chargeEfficiencyPct"), 95.0) / 100)),
        eta_dis=min(1.0, max(0.5, _number(configuration.get("dischargeEfficiencyPct"), 95.0) / 100)),
        soc_min=soc_min,
        soc_max=soc_max,
        soc_safety=soc_safety,
        soc_eod=min(soc_max, soc_min + soc_safety),
        price_peak=max(
            0.0,
            _number(configuration.get("peakPriceVndPerKwh"), 3640.0),
        ),
        price_mid=max(
            0.0,
            _number(configuration.get("normalPriceVndPerKwh"), 1987.0),
        ),
        price_off=max(
            0.0,
            _number(configuration.get("offpeakPriceVndPerKwh"), 1300.0),
        ),
        demand_charge=demand_charge,
        peak_steps=frozenset(
            _ranges_to_steps(configuration.get("peakWindows"), "17:30-22:30")
        ),
        off_steps=frozenset(
            _ranges_to_steps(configuration.get("offpeakWindows"), "00:00-06:00")
        ),
        sunday_no_peak=bool(configuration.get("sundayNoPeak", True)),
        p_target_kw=max(0.0, _number(configuration.get("selectedContractPmaxKw"), _number(configuration.get("powerKw"), 500.0))),
    )


def with_size(cfg: BessConfig, energy_kwh: float, power_kw: float) -> BessConfig:
    return replace(cfg, e_cap_kwh=float(energy_kwh), p_rated_kw=float(power_kw))


def _is_sunday(day: DayProfile) -> bool:
    if not day.date_iso:
        return False
    try:
        return date.fromisoformat(day.date_iso).weekday() == 6
    except ValueError:
        return False


def tariff_vector(cfg: BessConfig, day: DayProfile | None = None) -> np.ndarray:
    values = np.full(STEPS_PER_DAY, cfg.price_mid, dtype=float)
    for step in cfg.off_steps:
        values[step] = cfg.price_off
    suppress_peak = bool(day and cfg.sunday_no_peak and _is_sunday(day))
    if not suppress_peak:
        for step in cfg.peak_steps:
            values[step] = cfg.price_peak
    return values


def rolling_pmax(grid: np.ndarray) -> float:
    values = np.maximum(0.0, np.asarray(grid, dtype=float))
    if values.size < ROLL_WIN:
        return float(values.max(initial=0.0))
    rolling = np.convolve(values, np.ones(ROLL_WIN) / ROLL_WIN, mode="valid")
    return float(rolling.max(initial=0.0))


def score_month(grids: list[np.ndarray], cfg: BessConfig, days: list[DayProfile]) -> dict[str, float]:
    energy = 0.0
    peak = 0.0
    for grid, day in zip(grids, days):
        values = np.maximum(0.0, np.asarray(grid, dtype=float))
        energy += float(np.sum(values * tariff_vector(cfg, day)) * DT_HOURS)
        peak = max(peak, rolling_pmax(values))
    demand = peak * cfg.demand_charge
    return {
        "energy_cost_vnd": energy,
        "demand_cost_vnd": demand,
        "total_cost_vnd": energy + demand,
        "pmax_month_kw": peak,
    }


def run_no_bess(month: MonthProfile) -> dict[str, list[np.ndarray]]:
    grids = [np.maximum(0.0, day.load - day.pv) for day in month.days]
    zeros = [np.zeros(STEPS_PER_DAY, dtype=float) for _ in month.days]
    return {"p_grid_days": grids, "p_bess_days": zeros}


def _solve_day_lp(
    effective_load: np.ndarray,
    pv_surplus: np.ndarray,
    cfg: BessConfig,
    *,
    soc_init: float,
    soc_end_min: float,
    peak_floor: float,
) -> dict[str, Any]:
    tariffs = tariff_vector(cfg)
    discharge_start, grid_charge_start, pv_charge_start = 0, 96, 192
    soc_start, peak_index, excess_index = 288, 384, 385
    variable_count = 386

    def soc_index(slot: int) -> int:
        return soc_start + slot - 1

    objective = np.zeros(variable_count)
    for step in range(STEPS_PER_DAY):
        objective[grid_charge_start + step] += tariffs[step] * DT_HOURS
        objective[discharge_start + step] -= tariffs[step] * DT_HOURS
    objective[excess_index] = cfg.demand_charge
    objective[peak_index] = 1e-3

    equalities = np.zeros((STEPS_PER_DAY, variable_count))
    equality_rhs = np.zeros(STEPS_PER_DAY)
    charge_gain = cfg.eta_ch * DT_HOURS / cfg.e_cap_kwh
    discharge_loss = DT_HOURS / (cfg.eta_dis * cfg.e_cap_kwh)
    for step in range(STEPS_PER_DAY):
        equalities[step, soc_index(step + 1)] = 1.0
        if step >= 1:
            equalities[step, soc_index(step)] = -1.0
        equalities[step, grid_charge_start + step] = -charge_gain
        equalities[step, pv_charge_start + step] = -charge_gain
        equalities[step, discharge_start + step] = discharge_loss
        equality_rhs[step] = soc_init if step == 0 else 0.0

    inequalities: list[np.ndarray] = []
    inequality_rhs: list[float] = []
    for step in range(STEPS_PER_DAY):
        row = np.zeros(variable_count)
        row[discharge_start + step] = 1.0
        row[grid_charge_start + step] = -1.0
        inequalities.append(row)
        inequality_rhs.append(float(effective_load[step]))
    for step in range(STEPS_PER_DAY - 1):
        row = np.zeros(variable_count)
        for slot in (step, step + 1):
            row[grid_charge_start + slot] += 0.5
            row[discharge_start + slot] -= 0.5
        row[peak_index] = -1.0
        inequalities.append(row)
        inequality_rhs.append(-0.5 * float(effective_load[step] + effective_load[step + 1]))
    for step in range(STEPS_PER_DAY):
        row = np.zeros(variable_count)
        row[grid_charge_start + step] = 1.0
        row[pv_charge_start + step] = 1.0
        inequalities.append(row)
        inequality_rhs.append(cfg.p_rated_kw)
    row = np.zeros(variable_count)
    row[peak_index] = 1.0
    row[excess_index] = -1.0
    inequalities.append(row)
    inequality_rhs.append(peak_floor)

    bounds: list[tuple[float | None, float | None]] = [(None, None)] * variable_count
    for step in range(STEPS_PER_DAY):
        bounds[discharge_start + step] = (0.0, cfg.p_rated_kw)
        bounds[grid_charge_start + step] = (0.0, cfg.p_rated_kw)
        bounds[pv_charge_start + step] = (0.0, min(cfg.p_rated_kw, float(pv_surplus[step])))
    for slot in range(1, STEPS_PER_DAY + 1):
        lower = cfg.soc_min
        if slot == STEPS_PER_DAY:
            lower = max(lower, soc_end_min)
        bounds[soc_index(slot)] = (lower, cfg.soc_max)
    bounds[peak_index] = (0.0, None)
    bounds[excess_index] = (0.0, None)

    result = linprog(
        objective,
        A_ub=np.asarray(inequalities),
        b_ub=np.asarray(inequality_rhs),
        A_eq=equalities,
        b_eq=equality_rhs,
        bounds=bounds,
        method="highs",
    )
    if not result.success:
        return {"status": "INFEAS", "message": result.message}

    values = result.x
    discharge = np.asarray([values[discharge_start + step] for step in range(STEPS_PER_DAY)])
    grid_charge = np.asarray([values[grid_charge_start + step] for step in range(STEPS_PER_DAY)])
    pv_charge = np.asarray([values[pv_charge_start + step] for step in range(STEPS_PER_DAY)])
    soc = np.asarray([soc_init] + [values[soc_index(slot)] for slot in range(1, STEPS_PER_DAY + 1)])
    p_bess = discharge - (grid_charge + pv_charge)
    p_grid = np.maximum(0.0, effective_load + grid_charge - discharge)
    return {"status": "OK", "p_grid": p_grid, "p_bess": p_bess, "soc": soc}


def run_oracle(month: MonthProfile, cfg: BessConfig) -> dict[str, list[np.ndarray]]:
    grids: list[np.ndarray] = []
    batteries: list[np.ndarray] = []
    soc = cfg.soc_eod
    peak_floor = 0.0
    for day in month.days:
        effective_load = np.maximum(0.0, day.load - day.pv)
        pv_surplus = np.maximum(0.0, day.pv - day.load)
        day_cfg = cfg
        if cfg.sunday_no_peak and _is_sunday(day):
            day_cfg = replace(cfg, peak_steps=frozenset())
        solved = _solve_day_lp(
            effective_load,
            pv_surplus,
            day_cfg,
            soc_init=soc,
            soc_end_min=cfg.soc_eod,
            peak_floor=peak_floor,
        )
        if solved["status"] != "OK":
            grids.append(effective_load)
            batteries.append(np.zeros(STEPS_PER_DAY))
            continue
        grid = np.asarray(solved["p_grid"], dtype=float)
        battery = np.asarray(solved["p_bess"], dtype=float)
        soc = float(np.asarray(solved["soc"])[-1])
        grids.append(grid)
        batteries.append(battery)
        peak_floor = max(peak_floor, rolling_pmax(grid))
    return {"p_grid_days": grids, "p_bess_days": batteries}


def _npv(annual_cashflow: float, capex: float, discount: float, years: int) -> float:
    return -capex + sum(annual_cashflow / ((1 + discount) ** year) for year in range(1, years + 1))


def evaluate_candidate(
    energy_kwh: float,
    power_kw: float,
    cfg: BessConfig,
    months: list[MonthProfile],
    finance: dict[str, float],
) -> dict[str, Any]:
    candidate_cfg = with_size(cfg, energy_kwh, power_kw)
    savings: list[float] = []
    peaks: list[float] = []
    base_totals: list[float] = []
    oracle_totals: list[float] = []
    energy_savings: list[float] = []
    demand_savings: list[float] = []
    throughput = 0.0
    total_days = 0
    for month in months:
        no_bess = run_no_bess(month)
        oracle = run_oracle(month, candidate_cfg)
        base_score = score_month(no_bess["p_grid_days"], candidate_cfg, month.days)
        oracle_score = score_month(oracle["p_grid_days"], candidate_cfg, month.days)
        n_days = max(1, len(month.days))
        energy_saving = (base_score["energy_cost_vnd"] - oracle_score["energy_cost_vnd"]) * 30.0 / n_days
        demand_saving = base_score["demand_cost_vnd"] - oracle_score["demand_cost_vnd"]
        savings.append(energy_saving + demand_saving)
        energy_savings.append(energy_saving)
        demand_savings.append(demand_saving)
        peaks.append(oracle_score["pmax_month_kw"])
        base_totals.append(
            base_score["energy_cost_vnd"] * 30.0 / n_days
            + base_score["demand_cost_vnd"]
        )
        oracle_totals.append(
            oracle_score["energy_cost_vnd"] * 30.0 / n_days
            + oracle_score["demand_cost_vnd"]
        )
        for trace in oracle["p_bess_days"]:
            throughput += float(np.sum(np.maximum(0.0, trace)) * DT_HOURS)
        total_days += n_days

    monthly_saving = float(np.mean(savings))
    annual_saving_oracle = monthly_saving * 12.0
    realization = finance["realization"]
    annual_saving_realized = annual_saving_oracle * realization
    capex = finance["battery_cost"] * energy_kwh + finance["pcs_cost"] * power_kw
    opex = finance["opex_pct"] * capex
    cashflow_oracle = annual_saving_oracle - opex
    cashflow_realized = annual_saving_realized - opex
    npv_oracle = _npv(cashflow_oracle, capex, finance["discount"], int(finance["years"]))
    npv_realized = _npv(cashflow_realized, capex, finance["discount"], int(finance["years"]))
    payback_oracle = capex / cashflow_oracle if cashflow_oracle > 0 else None
    payback_realized = capex / cashflow_realized if cashflow_realized > 0 else None
    contract_peak = math.ceil(max(peaks) * 1.05 / 10.0) * 10.0
    no_bess_peak = max(
        rolling_pmax(np.maximum(0.0, day.load - day.pv))
        for month in months
        for day in month.days
    )
    efc_per_day = throughput / max(1, total_days) / max(1.0, energy_kwh)
    lifespan = WARRANTY_CYCLES / max(efc_per_day * 365, 1e-9)
    annual_bill_equivalent = float(np.mean(base_totals)) * 12.0
    return {
        "id": f"e{int(round(energy_kwh))}-p{int(round(power_kw))}",
        "energy_kwh": round(energy_kwh, 3),
        "power_kw": round(power_kw, 3),
        "duration_hours": round(energy_kwh / power_kw, 3),
        "c_rate": round(power_kw / energy_kwh, 4),
        "usable_energy_kwh": round(energy_kwh * (cfg.soc_max - cfg.soc_min), 3),
        "capex_vnd": round(capex, 2),
        "annual_opex_vnd": round(opex, 2),
        "annual_saving_vnd": round(annual_saving_oracle, 2),
        "annual_saving_realized_vnd": round(annual_saving_realized, 2),
        "annual_saving_pct": round(annual_saving_oracle / annual_bill_equivalent * 100, 3) if annual_bill_equivalent else 0.0,
        "tou_saving_vnd": round(float(np.mean(energy_savings)) * 12.0, 2),
        "demand_saving_vnd": round(float(np.mean(demand_savings)) * 12.0, 2),
        "pv_saving_vnd": 0.0,
        "npv_vnd": round(npv_oracle, 2),
        "npv_realized_vnd": round(npv_realized, 2),
        "roi": round(npv_oracle / capex, 6) if capex else 0.0,
        "payback_years": round(payback_oracle, 3) if payback_oracle is not None else None,
        "payback_realized_years": round(payback_realized, 3) if payback_realized is not None else None,
        "pmax_kw": round(max(peaks), 3),
        "contract_pmax_kw": round(contract_peak, 3),
        "peak_reduction_kw": round(max(0.0, no_bess_peak - max(peaks)), 3),
        "peak_reduction_pct": round(max(0.0, no_bess_peak - max(peaks)) / no_bess_peak * 100, 3) if no_bess_peak else 0.0,
        "efc_per_day": round(efc_per_day, 4),
        "lifespan_years": round(min(99.0, lifespan), 2),
        "oracle_bill_vnd": round(float(np.mean(oracle_totals)) * 12.0, 2),
        "base_bill_vnd": round(annual_bill_equivalent, 2),
        "realization_factor": realization,
        "on_pareto": False,
        "selected": False,
    }


def pareto_front(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    front: list[dict[str, Any]] = []
    for row in rows:
        dominated = any(
            other["annual_saving_vnd"] >= row["annual_saving_vnd"]
            and other["roi"] >= row["roi"]
            and (
                other["annual_saving_vnd"] > row["annual_saving_vnd"]
                or other["roi"] > row["roi"]
            )
            for other in rows
            if other is not row
        )
        if not dominated:
            front.append(row)
    return front


def slsm_select(front: list[dict[str, Any]]) -> dict[str, Any]:
    investable = [row for row in front if row["npv_vnd"] > 0]
    pool = investable or front
    savings = np.asarray([row["annual_saving_vnd"] for row in pool], dtype=float)
    rois = np.asarray([row["roi"] for row in pool], dtype=float)
    normalized_savings = (savings - savings.min()) / (np.ptp(savings) + 1e-12)
    normalized_rois = (rois - rois.min()) / (np.ptp(rois) + 1e-12)
    slopes = (normalized_savings + 1e-12) / (normalized_rois + 1e-12)
    return pool[int(np.argmin(np.abs(slopes - 1.0)))]


def scenario_matrix(candidate: dict[str, Any], finance: dict[str, float]) -> tuple[list[dict[str, Any]], float]:
    scenarios = [
        ("pessimistic", "Bi quan", 0.0, 1.10, 0.25, 0.12),
        ("base", "Cơ sở", 0.05, 1.00, 0.15, 0.08),
        ("optimistic", "Lạc quan", 0.10, 0.90, 0.10, 0.07),
    ]
    rows: list[dict[str, Any]] = []
    annual = float(candidate["annual_saving_vnd"])
    base_capex = float(candidate["capex_vnd"])
    years = int(finance["years"])
    for key, label, escalation, capex_multiplier, fade_10y, discount in scenarios:
        capex = base_capex * capex_multiplier
        opex = finance["opex_pct"] * capex
        npv_value = -capex
        cumulative = -capex
        payback: float | None = None
        cashflows: list[dict[str, float]] = []
        for year in range(1, years + 1):
            fade = 1.0 - fade_10y * min(1.0, year / 10.0)
            cashflow = annual * ((1 + escalation) ** (year - 1)) * fade - opex
            npv_value += cashflow / ((1 + discount) ** year)
            previous = cumulative
            cumulative += cashflow
            if payback is None and cumulative >= 0 and cashflow > 0:
                payback = year - 1 + max(0.0, -previous / cashflow)
            cashflows.append({"year": year, "net_cashflow_vnd": round(cashflow, 2), "cumulative_vnd": round(cumulative, 2)})
        rows.append({
            "key": key,
            "label": label,
            "capex_vnd": round(capex, 2),
            "annual_opex_vnd": round(opex, 2),
            "npv_vnd": round(npv_value, 2),
            "roi": round(npv_value / capex, 6) if capex else 0.0,
            "payback_years": round(payback, 3) if payback is not None else None,
            "cashflows": cashflows,
        })
    annuity = sum(1 / ((1 + finance["discount"]) ** year) for year in range(1, years + 1))
    break_even = annual * annuity / (1 + finance["opex_pct"] * annuity)
    return rows, round(break_even, 2)


def detail_for_candidate(
    candidate: dict[str, Any],
    cfg: BessConfig,
    months: list[MonthProfile],
) -> dict[str, Any]:
    candidate_cfg = with_size(cfg, float(candidate["energy_kwh"]), float(candidate["power_kw"]))
    daily_oracle_peaks: list[float] = []
    daily_no_bess_peaks: list[float] = []
    savings_by_type: dict[str, list[float]] = {}
    monthly: list[dict[str, Any]] = []
    total_throughput = 0.0
    total_days = 0
    pv_yields = np.asarray(
        [float(np.sum(day.pv) * DT_HOURS) for month in months for day in month.days],
        dtype=float,
    )
    pv_low = float(np.percentile(pv_yields, 33.3))
    pv_high = float(np.percentile(pv_yields, 66.7))
    for month in months:
        oracle = run_oracle(month, candidate_cfg)
        no_bess = run_no_bess(month)
        base_score = score_month(no_bess["p_grid_days"], candidate_cfg, month.days)
        oracle_score = score_month(oracle["p_grid_days"], candidate_cfg, month.days)
        n_days = max(1, len(month.days))
        saving_month = (
            (base_score["energy_cost_vnd"] - oracle_score["energy_cost_vnd"])
            * 30.0
            / n_days
            + base_score["demand_cost_vnd"]
            - oracle_score["demand_cost_vnd"]
        )
        monthly.append({
            "month": month.source,
            "days": n_days,
            "peak_load_kw": round(base_score["pmax_month_kw"], 3),
            "pmax_after_bess_kw": round(oracle_score["pmax_month_kw"], 3),
            "contract_pmax_kw": math.ceil(
                oracle_score["pmax_month_kw"] * 1.05 / 10.0
            ) * 10.0,
            "saving_month_vnd": round(saving_month, 2),
            "annualized_saving_vnd": round(saving_month * 12.0, 2),
            "candidate_id": candidate["id"],
            "energy_kwh": candidate["energy_kwh"],
            "power_kw": candidate["power_kw"],
        })
        for index, day in enumerate(month.days):
            grid_oracle = oracle["p_grid_days"][index]
            grid_no_bess = no_bess["p_grid_days"][index]
            daily_oracle_peaks.append(rolling_pmax(grid_oracle))
            daily_no_bess_peaks.append(rolling_pmax(grid_no_bess))
            saving = float(
                np.sum((grid_no_bess - grid_oracle) * tariff_vector(candidate_cfg))
                * DT_HOURS
            )
            pv_yield = float(np.sum(day.pv) * DT_HOURS)
            weather = "mua" if pv_yield <= pv_low else ("nang" if pv_yield >= pv_high else "trung_binh")
            workday = "lam_viec" if day.day_type == "working" else "nghi"
            category = f"{workday}_{weather}"
            savings_by_type.setdefault(category, []).append(saving)
            total_throughput += float(np.sum(np.maximum(0.0, oracle["p_bess_days"][index])) * DT_HOURS)
            total_days += 1
    day_types = []
    for key, values in sorted(savings_by_type.items()):
        array = np.asarray(values, dtype=float)
        labels = {
            "lam_viec_mua": "Làm việc · mưa/ít PV",
            "lam_viec_trung_binh": "Làm việc · PV trung bình",
            "lam_viec_nang": "Làm việc · nắng/nhiều PV",
            "nghi_mua": "Ngày nghỉ · mưa/ít PV",
            "nghi_trung_binh": "Ngày nghỉ · PV trung bình",
            "nghi_nang": "Ngày nghỉ · nắng/nhiều PV",
        }
        day_types.append({
            "key": key,
            "label": labels.get(key, key),
            "days": len(values),
            "average_saving_vnd": round(float(np.mean(array)), 2),
            "p10_vnd": round(float(np.percentile(array, 10)), 2),
            "p90_vnd": round(float(np.percentile(array, 90)), 2),
        })
    efc_per_day = total_throughput / max(1, total_days) / max(1.0, float(candidate["energy_kwh"]))
    return {
        "monthly": monthly,
        "day_types": day_types,
        "pmax_risk": {
            "p50_kw": round(float(np.percentile(daily_oracle_peaks, 50)), 3),
            "p95_kw": round(float(np.percentile(daily_oracle_peaks, 95)), 3),
            "max_kw": round(max(daily_oracle_peaks), 3),
            "no_bess_kw": round(max(daily_no_bess_peaks), 3),
            "risk_level": "low" if float(candidate["contract_pmax_kw"]) >= float(np.percentile(daily_oracle_peaks, 95)) else "medium",
        },
        "longevity": {
            "efc_per_day": round(efc_per_day, 4),
            "efc_per_year": round(efc_per_day * 365, 2),
            "estimated_lifespan_years": round(min(99.0, WARRANTY_CYCLES / max(efc_per_day * 365, 1e-9)), 2),
        },
    }


def compare_billing(candidate: dict[str, Any], configuration: dict[str, Any], months: list[MonthProfile], finance: dict[str, float]) -> dict[str, Any]:
    results: dict[str, dict[str, Any]] = {}
    for key, label, demand_enabled in (
        ("tou_peak", "TOU + Peak shaving", True),
        ("tou_only", "Chỉ TOU", False),
    ):
        cfg = base_config(configuration, demand_enabled=demand_enabled)
        row = evaluate_candidate(float(candidate["energy_kwh"]), float(candidate["power_kw"]), cfg, months, finance)
        results[key] = {
            "key": key,
            "label": label,
            "annual_bill_vnd": row["oracle_bill_vnd"],
            "annual_saving_vnd": row["annual_saving_vnd"],
            "annual_saving_realized_vnd": row["annual_saving_realized_vnd"],
            "npv_vnd": row["npv_vnd"],
            "roi": row["roi"],
            "payback_years": row["payback_years"],
            "payback_realized_years": row["payback_realized_years"],
            "pmax_kw": row["pmax_kw"],
            "base_bill_vnd": row["base_bill_vnd"],
        }
    no_bess_bill = float(results["tou_peak"].get("base_bill_vnd", candidate["base_bill_vnd"]))
    modes = [
        {
            "key": "no_bess",
            "label": "Không BESS",
            "annual_bill_vnd": no_bess_bill,
            "annual_saving_vnd": 0.0,
            "annual_saving_realized_vnd": 0.0,
            "npv_vnd": 0.0,
            "roi": 0.0,
            "payback_years": None,
            "payback_realized_years": None,
            "pmax_kw": float(candidate["pmax_kw"])
            + float(candidate["peak_reduction_kw"]),
        }
    ]
    modes.extend([results["tou_only"], results["tou_peak"]])
    delta = results["tou_peak"]["annual_saving_vnd"] - results["tou_only"]["annual_saving_vnd"]
    return {
        "candidate_id": candidate["id"],
        "modes": modes,
        "peak_shaving_contribution_vnd": round(delta, 2),
        "peak_shaving_contribution_pct": round(delta / results["tou_peak"]["annual_saving_vnd"] * 100, 3) if results["tou_peak"]["annual_saving_vnd"] else 0.0,
    }
