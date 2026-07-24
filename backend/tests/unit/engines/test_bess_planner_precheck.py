from app.modules.analyses.engine.bess_planner.optimizer import BessPlannerOptimizer


def test_precheck_ready_with_valid_load_dataset() -> None:
    result = BessPlannerOptimizer().precheck(
        configuration={"powerKw": 500, "energyKwh": 1000},
        datasets=[
            {
                "dataset_type": "load_profile",
                "status": "ready",
                "row_count": 35040,
                "valid_row_count": 35040,
                "interval_minutes": 15,
            }
        ],
    )

    assert result["stage"] == "data_precheck"
    assert result["ready_for_optimization"] is True
    assert result["optimizer_executed"] is False
    assert result["configured_system"]["duration_hours"] == 2
    assert result["configured_system"]["c_rate"] == 0.5


def test_precheck_blocks_without_load_dataset() -> None:
    result = BessPlannerOptimizer().precheck(
        configuration={"powerKw": 500, "energyKwh": 1000},
        datasets=[],
    )

    assert result["ready_for_optimization"] is False
    assert "Cần có dataset phụ tải trước khi tối ưu." in result["blockers"]
