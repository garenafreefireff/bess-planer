from __future__ import annotations

from collections import defaultdict
from typing import Any

import numpy as np

from app.core.exceptions import AppError
from app.modules.analyses.engine.sizing_lab.dataset_adapter import quality_warnings
from app.modules.analyses.engine.sizing_lab.oracle_engine import (
    MonthProfile,
    base_config,
    compare_billing,
    detail_for_candidate,
    evaluate_candidate,
    pareto_front,
    scenario_matrix,
    slsm_select,
)
from app.modules.analyses.engine.sizing_lab.profile_loader import load_profile_months


EMS_PARITY_VERSION = "tool-c-tariff-config-2026-07-25"
EMS_PARITY_CONFIGURATION = {
    "emsParityVersion": EMS_PARITY_VERSION,
    "billingMode": "2tc",
    "sundayNoPeak": True,
    "peakPriceVndPerKwh": 3640.0,
    "normalPriceVndPerKwh": 1987.0,
    "offpeakPriceVndPerKwh": 1300.0,
    "demandChargeVndPerKwMonth": 285_414.0,
    "peakWindows": "17:30-22:30",
    "offpeakWindows": "00:00-06:00",
    "socMinPct": 10.0,
    "socMaxPct": 93.0,
    "socSafetyPct": 5.0,
    "chargeEfficiencyPct": 95.0,
    "dischargeEfficiencyPct": 95.0,
    "batteryCostVndPerKwh": 5_000_000.0,
    "pcsCostVndPerKw": 4_000_000.0,
    "epcPct": 0.0,
    "otherCostPct": 0.0,
    "annualOpexPct": 2.0,
    "discountRatePct": 8.0,
    "analysisYears": 10,
    "realizationRatePct": 60.0,
    "loadValueUnit": "kw",
    "pvValueUnit": "kw",
}


class SizingLabPlanner:
    engine_version = "ems-sizing-lab-oracle-lp-pf-1.0.1"

    def run(
        self,
        *,
        configuration: dict[str, Any],
        datasets: list[dict[str, Any]],
    ) -> dict[str, Any]:
        migrated_legacy_configuration = (
            configuration.get("emsParityVersion") != EMS_PARITY_VERSION
        )
        configuration = _effective_configuration(configuration)
        if not any(item.get("dataset_type") == "load_profile" for item in datasets):
            return {
                "stage": "sizing_lab",
                "ready_for_optimization": False,
                "optimizer_executed": False,
                "optimizer_status": "blocked",
                "blockers": ["Cần có dataset phụ tải trước khi chạy Sizing Lab."],
                "warnings": [],
            }
        if str(configuration.get("loadValueUnit", "kw")).lower() != "kw":
            raise AppError(
                "Oracle LP-PF của EMS yêu cầu dữ liệu Load theo kW.",
                code="oracle_load_unit_required",
            )
        if str(configuration.get("pvValueUnit", "kw")).lower() != "kw":
            raise AppError(
                "Oracle LP-PF của EMS yêu cầu dữ liệu PV theo kW.",
                code="oracle_pv_unit_required",
            )
        months, profile_summary = load_profile_months(datasets)
        cfg = base_config(configuration)
        finance = _finance(configuration)
        candidate_sizes = _candidate_grid(configuration, profile_summary["load_peak_kw"])
        candidates = [
            evaluate_candidate(energy, power, cfg, months, finance)
            for energy, power in candidate_sizes
        ]
        front = pareto_front(candidates)
        selected = slsm_select(front)
        for candidate in candidates:
            candidate["on_pareto"] = candidate in front
            candidate["selected"] = candidate is selected

        investable = [
            item
            for item in candidates
            if item is not selected and item["npv_vnd"] > 0
        ]
        investable.sort(key=lambda item: -float(item["annual_saving_vnd"]))
        planning_candidates = [selected, *investable[:2]]
        planning_details = []
        for item in planning_candidates:
            detail = detail_for_candidate(item, cfg, months)
            item_scenarios, item_break_even = scenario_matrix(item, finance)
            planning_details.append(
                {
                    "candidate_id": item["id"],
                    "energy_kwh": item["energy_kwh"],
                    "power_kw": item["power_kw"],
                    "annual_saving_vnd": item["annual_saving_vnd"],
                    "npv_vnd": item["npv_vnd"],
                    "payback_years": item["payback_years"],
                    "scenarios": item_scenarios,
                    "break_even_capex_vnd": item_break_even,
                    "pmax_risk": detail["pmax_risk"],
                    "longevity": {
                        **detail["longevity"],
                        "remaining_capacity_pct_at_horizon": round(
                            max(
                                0.0,
                                100.0
                                - 15.0 * min(1.0, finance["years"] / 10.0),
                            ),
                            2,
                        ),
                    },
                    "day_types": detail["day_types"],
                    "monthly": detail["monthly"],
                }
            )
        selected_detail = planning_details[0]
        planning = {
            "candidate_id": selected["id"],
            "scenarios": selected_detail["scenarios"],
            "break_even_capex_vnd": selected_detail["break_even_capex_vnd"],
            "pmax_risk": selected_detail["pmax_risk"],
            "longevity": selected_detail["longevity"],
            "day_types": selected_detail["day_types"],
            "details": planning_details,
        }
        comparison = compare_billing(selected, configuration, months, finance)
        monthly = (
            _monthly_sizing(months, cfg, finance, candidate_sizes)
            if profile_summary["has_calendar_dates"]
            else selected_detail["monthly"]
        )
        selected_monthly = (
            _selected_pmax_monthly(months, cfg, selected)
            if profile_summary["has_calendar_dates"]
            else selected_detail["monthly"]
        )

        warnings = quality_warnings(datasets)
        if profile_summary["rejected_days"]:
            warnings.append(
                f"Đã bỏ qua {len(profile_summary['rejected_days'])} ngày không đủ 96 bước."
            )
        if not profile_summary["has_calendar_dates"]:
            warnings.append(
                "File không có ngày lịch; giống EMS, phân tích tháng dùng một block dữ liệu và "
                "quy đổi thành tháng 30 ngày."
            )

        annual_factor = 365.0 / max(1, profile_summary["n_days"])
        return {
            "stage": "sizing_lab",
            "ready_for_optimization": True,
            "optimizer_executed": True,
            "optimizer_status": "completed",
            "calculation_method": "oracle_lp_pf_pareto_slsm",
            "summary": {
                "site_peak_kw": profile_summary["load_peak_kw"],
                "net_peak_kw": round(
                    max(
                        float(np.max(np.maximum(0.0, day.load - day.pv)))
                        for month in months
                        for day in month.days
                    ),
                    3,
                ),
                "annual_load_energy_kwh": round(profile_summary["load_energy_kwh"] * annual_factor, 3),
                "annual_pv_energy_kwh": round(profile_summary["pv_energy_kwh"] * annual_factor, 3),
                "base_annual_bill_vnd": selected["base_bill_vnd"],
                "candidate_count": len(candidates),
                "pareto_count": len(front),
                "analysis_years": int(finance["years"]),
            },
            "selected": selected,
            "candidates": sorted(
                candidates,
                key=lambda item: (
                    not item["selected"],
                    not item["on_pareto"],
                    item["energy_kwh"],
                    item["power_kw"],
                ),
            ),
            "pareto_candidate_ids": [item["id"] for item in front],
            "planning": planning,
            "comparison": comparison,
            "monthly": monthly,
            "selected_monthly": selected_monthly,
            "input_quality": {
                "load": {
                    "source": profile_summary["source"],
                    "peak_kw": profile_summary["load_peak_kw"],
                    "average_kw": profile_summary["load_average_kw"],
                    "observed_energy_kwh": profile_summary["load_energy_kwh"],
                    "days": profile_summary["n_days"],
                    "steps_per_day": profile_summary["steps_per_day"],
                },
                "pv": {
                    "peak_kw": profile_summary["pv_peak_kw"],
                    "observed_energy_kwh": profile_summary["pv_energy_kwh"],
                },
                "timezone": configuration.get("timezone", "Asia/Ho_Chi_Minh"),
                "configured_units": {"load": "kw", "pv": "kw"},
            },
            "parity": {
                "profile": EMS_PARITY_VERSION,
                "migrated_legacy_configuration": migrated_legacy_configuration,
                "billing_mode": configuration.get("billingMode"),
                "peak_price_vnd_per_kwh": configuration.get("peakPriceVndPerKwh"),
                "normal_price_vnd_per_kwh": configuration.get("normalPriceVndPerKwh"),
                "offpeak_price_vnd_per_kwh": configuration.get("offpeakPriceVndPerKwh"),
                "demand_charge_vnd_per_kw_month": configuration.get("demandChargeVndPerKwMonth"),
                "peak_windows": configuration.get("peakWindows"),
                "offpeak_windows": configuration.get("offpeakWindows"),
                "battery_cost_vnd_per_kwh": configuration.get("batteryCostVndPerKwh"),
                "pcs_cost_vnd_per_kw": configuration.get("pcsCostVndPerKw"),
                "opex_pct": configuration.get("annualOpexPct"),
                "discount_rate_pct": configuration.get("discountRatePct"),
                "analysis_years": configuration.get("analysisYears"),
                "realization_rate_pct": configuration.get("realizationRatePct"),
            },
            "assumptions": {
                "soc_min_pct": cfg.soc_min * 100,
                "soc_max_pct": cfg.soc_max * 100,
                "charge_efficiency_pct": cfg.eta_ch * 100,
                "discharge_efficiency_pct": cfg.eta_dis * 100,
                "discount_rate_pct": finance["discount"] * 100,
                "realization_rate_pct": finance["realization"] * 100,
                "demand_charge_vnd_per_kw_month": cfg.demand_charge,
                "peak_price_vnd_per_kwh": cfg.price_peak,
                "normal_price_vnd_per_kwh": cfg.price_mid,
                "offpeak_price_vnd_per_kwh": cfg.price_off,
            },
            "warnings": warnings,
            "blockers": [],
            "next_step": "Kiểm tra Pareto/SLSM và áp dụng sizing đã chọn vào dự án.",
        }


def _effective_configuration(configuration: dict[str, Any]) -> dict[str, Any]:
    if configuration.get("emsParityVersion") == EMS_PARITY_VERSION:
        return dict(configuration)
    sizing_keys = {
        "sizingMode",
        "energyKwh",
        "powerKw",
        "energyMinKwh",
        "energyMaxKwh",
        "energyStepKwh",
        "powerMinKw",
        "powerMaxKw",
        "powerStepKw",
    }
    retained = {key: value for key, value in configuration.items() if key in sizing_keys}
    return {**configuration, **EMS_PARITY_CONFIGURATION, **retained}


def _finance(configuration: dict[str, Any]) -> dict[str, float]:
    return {
        "battery_cost": _numeric(configuration.get("batteryCostVndPerKwh"), 5_000_000.0),
        "pcs_cost": _numeric(configuration.get("pcsCostVndPerKw"), 4_000_000.0),
        "epc_pct": _numeric(configuration.get("epcPct"), 0.0) / 100.0,
        "other_pct": _numeric(configuration.get("otherCostPct"), 0.0) / 100.0,
        "opex_pct": _numeric(configuration.get("annualOpexPct"), 2.0) / 100.0,
        "discount": _numeric(configuration.get("discountRatePct"), 8.0) / 100.0,
        "years": max(1.0, _numeric(configuration.get("analysisYears"), 10.0)),
        "realization": min(
            1.0,
            max(0.1, _numeric(configuration.get("realizationRatePct"), 60.0) / 100.0),
        ),
    }


def _candidate_grid(
    configuration: dict[str, Any],
    load_peak_kw: float,
) -> list[tuple[float, float]]:
    if str(configuration.get("sizingMode", "auto")) == "range":
        energies = _range_values(
            configuration.get("energyMinKwh"),
            configuration.get("energyMaxKwh"),
            configuration.get("energyStepKwh"),
            fallback=1000.0,
        )
        powers = _range_values(
            configuration.get("powerMinKw"),
            configuration.get("powerMaxKw"),
            configuration.get("powerStepKw"),
            fallback=500.0,
        )
        candidates = [
            (energy, power)
            for energy in energies
            for power in powers
            if energy > 0 and power > 0 and 0.25 <= power / energy <= 2.0
        ][:120]
        if candidates:
            return candidates
        fallback_energy = max(250.0, _numeric(configuration.get("energyKwh"), 1000.0))
        fallback_power = max(25.0, _numeric(configuration.get("powerKw"), 500.0))
        return [(fallback_energy, fallback_power)]

    scale = max(1.0, round(load_peak_kw / 500.0))
    energies = [250.0 * scale, 500.0 * scale, 750.0 * scale, 1000.0 * scale, 1250.0 * scale]
    ratios = [0.35, 0.50, 0.70]
    return [(energy, float(round(energy * ratio))) for energy in energies for ratio in ratios]


def _split_by_calendar_month(month: MonthProfile) -> list[MonthProfile]:
    if not month.days or not month.days[0].date_iso:
        return [month]
    groups: dict[str, list] = defaultdict(list)
    for day in month.days:
        groups[str(day.date_iso)[:7]].append(day)
    return [MonthProfile(source=key, days=days) for key, days in sorted(groups.items())]


def _monthly_sizing(
    months: list[MonthProfile],
    cfg,
    finance: dict[str, float],
    candidate_sizes: list[tuple[float, float]],
) -> list[dict[str, Any]]:
    blocks = [block for month in months for block in _split_by_calendar_month(month)]
    results: list[dict[str, Any]] = []
    for block in blocks:
        if not block.days:
            continue
        rows = [
            evaluate_candidate(energy, power, cfg, [block], finance)
            for energy, power in candidate_sizes
        ]
        front = pareto_front(rows)
        selected = slsm_select(front)
        detail = detail_for_candidate(selected, cfg, [block])
        row = detail["monthly"][0]
        results.append({
            **row,
            "month": block.source,
            "days": len(block.days),
            "candidate_id": selected["id"],
            "energy_kwh": selected["energy_kwh"],
            "power_kw": selected["power_kw"],
        })
    return results


def _selected_pmax_monthly(
    months: list[MonthProfile],
    cfg,
    selected: dict[str, Any],
) -> list[dict[str, Any]]:
    blocks = [block for month in months for block in _split_by_calendar_month(month)]
    rows: list[dict[str, Any]] = []
    for block in blocks:
        if len(block.days) < 1:
            continue
        detail = detail_for_candidate(selected, cfg, [block])
        row = detail["monthly"][0]
        rows.append(
            {
                **row,
                "month": block.source,
                "days": len(block.days),
                "candidate_id": selected["id"],
                "energy_kwh": selected["energy_kwh"],
                "power_kw": selected["power_kw"],
            }
        )
    return rows


def _range_values(
    minimum: object,
    maximum: object,
    step: object,
    *,
    fallback: float,
) -> list[float]:
    low = _numeric(minimum, fallback * 0.5)
    high = _numeric(maximum, fallback * 1.5)
    increment = max(1.0, _numeric(step, fallback * 0.25))
    if high < low:
        low, high = high, low
    count = min(40, int((high - low) / increment) + 1)
    return [round(low + index * increment, 6) for index in range(count)]


def _numeric(value: object, default: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return float(default)
    return float(value)
