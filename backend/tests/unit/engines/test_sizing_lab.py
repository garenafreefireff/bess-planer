from pathlib import Path

import numpy as np

from app.modules.analyses.engine.sizing_lab import SizingLabPlanner
from app.modules.analyses.engine.sizing_lab.oracle_engine import (
    DayProfile,
    MonthProfile,
    base_config,
    pareto_front,
    run_no_bess,
    run_oracle,
    score_month,
    slsm_select,
    with_size,
)
from app.modules.analyses.engine.sizing_lab.planner import _candidate_grid
from app.modules.analyses.engine.sizing_lab.profile_loader import load_profile_months
from app.modules.analyses.service import _run_optimizer_with_transient_uploads


def _write_ems_profile(path: Path, days: int = 5) -> None:
    lines = ["day_index,step,P_load_kW,P_pv_kW,day_type"]
    for day in range(1, days + 1):
        for step in range(96):
            hour = step / 4
            load = 650.0 if 9.5 <= hour < 11.5 or 17 <= hour < 20 else 350.0
            pv = 260.0 if 9 <= hour < 16 else 0.0
            lines.append(f"{day},{step},{load},{pv},working")
    path.write_text("\n".join(lines), encoding="utf-8")


def _datasets(path: Path) -> list[dict]:
    common = {
        "status": "ready",
        "row_count": 480,
        "valid_row_count": 480,
        "interval_minutes": 15,
        "source_path": str(path),
        "original_name": path.name,
        "quality_summary": {"warnings": []},
    }
    return [
        {**common, "dataset_type": "load_profile", "value_column": "P_load_kW"},
        {**common, "dataset_type": "pv_profile", "value_column": "P_pv_kW"},
    ]


def test_sizing_lab_runs_ported_oracle_lp_pf(tmp_path: Path) -> None:
    source = tmp_path / "ems_profile.csv"
    _write_ems_profile(source)
    result = SizingLabPlanner().run(
        configuration={
            "sizingMode": "range",
            "energyMinKwh": 500,
            "energyMaxKwh": 500,
            "energyStepKwh": 250,
            "powerMinKw": 250,
            "powerMaxKw": 250,
            "powerStepKw": 250,
            "analysisYears": 10,
            "realizationRatePct": 60,
        },
        datasets=_datasets(source),
    )

    assert result["calculation_method"] == "oracle_lp_pf_pareto_slsm"
    assert result["optimizer_executed"] is True
    assert result["summary"]["candidate_count"] == 1
    assert result["summary"]["site_peak_kw"] == 650
    assert result["parity"]["migrated_legacy_configuration"] is True
    assert result["parity"]["peak_price_vnd_per_kwh"] == 3640
    assert result["parity"]["peak_windows"] == "17:30-22:30"
    assert result["selected"]["capex_vnd"] == 3_500_000_000
    assert result["selected"]["selected"] is True
    assert result["selected"]["contract_pmax_kw"] > 0
    assert len(result["planning"]["scenarios"]) == 3
    assert len(result["comparison"]["modes"]) == 3
    assert len(result["planning"]["details"]) == 1
    assert len(result["monthly"]) == 1
    assert len(result["selected_monthly"]) == 1


def test_auto_grid_matches_ems_sizing_grid() -> None:
    grid = _candidate_grid({}, 650)

    assert len(grid) == 15
    assert grid[0] == (250.0, 88.0)
    assert grid[-1] == (1250.0, 875.0)


def test_profile_loader_extracts_pv_from_combined_transient_file(tmp_path: Path) -> None:
    source = tmp_path / "combined.csv"
    _write_ems_profile(source, days=1)
    load_only = [_datasets(source)[0]]

    months, summary = load_profile_months(load_only)

    assert summary["pv_peak_kw"] == 260
    assert months[0].days[0].pv.max() == 260


def test_profile_loader_supports_ems_date_iso_step(tmp_path: Path) -> None:
    source = tmp_path / "site_youngone.csv"
    lines = ["date_iso,day_type,step,P_load_kW,P_pv_kW"]
    for step in range(96):
        lines.append(f"2025-07-26,weekend,{step},500,100")
    source.write_text("\n".join(lines), encoding="utf-8")

    months, summary = load_profile_months(_datasets(source))

    assert summary["has_calendar_dates"] is True
    assert months[0].days[0].date_iso == "2025-07-26"
    assert months[0].days[0].day_type == "weekend"
    assert months[0].days[0].load[0] == 500
    assert months[0].days[0].pv[0] == 100


def test_oracle_reduces_cost_and_peak_on_peak_day() -> None:
    load = np.full(96, 280.0)
    load[38:46] = 700.0
    load[68:80] = 760.0
    month = MonthProfile(
        source="synthetic",
        days=[DayProfile(load=load, pv=np.zeros(96), day_type="working")],
    )
    cfg = with_size(base_config({}), 750.0, 350.0)

    no_bess = run_no_bess(month)
    oracle = run_oracle(month, cfg)
    no_bess_score = score_month(no_bess["p_grid_days"], cfg, month.days)
    oracle_score = score_month(oracle["p_grid_days"], cfg, month.days)

    assert oracle_score["total_cost_vnd"] < no_bess_score["total_cost_vnd"]
    assert oracle_score["pmax_month_kw"] < no_bess_score["pmax_month_kw"]


def test_pareto_and_slsm_match_ems_selection_rule() -> None:
    rows = [
        {"id": "a", "annual_saving_vnd": 100.0, "roi": 0.8, "npv_vnd": 10.0},
        {"id": "b", "annual_saving_vnd": 150.0, "roi": 0.5, "npv_vnd": 20.0},
        {"id": "c", "annual_saving_vnd": 90.0, "roi": 0.4, "npv_vnd": 5.0},
    ]

    front = pareto_front(rows)
    selected = slsm_select(front)

    assert {item["id"] for item in front} == {"a", "b"}
    assert selected["id"] in {"a", "b"}


def test_transient_upload_is_passed_in_memory_without_source_path() -> None:
    captured: list[dict] = []

    class CapturingOptimizer:
        def optimize(self, *, configuration: dict, datasets: list[dict]) -> dict:
            del configuration
            captured.extend(datasets)
            return {"ok": True}

    content = b"day_index,step,P_load_kW\n1,0,100\n"
    result = _run_optimizer_with_transient_uploads(
        CapturingOptimizer(),
        {},
        content,
        "customer-load.csv",
        None,
        None,
    )

    assert result == {"ok": True}
    assert captured[0]["source_bytes"] == content
    assert captured[0]["source_extension"] == ".csv"
    assert "source_path" not in captured[0]


def test_sizing_lab_blocks_without_load_dataset() -> None:
    result = SizingLabPlanner().run(configuration={}, datasets=[])

    assert result["ready_for_optimization"] is False
    assert result["optimizer_status"] == "blocked"
