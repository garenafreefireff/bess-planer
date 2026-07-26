from datetime import datetime, timedelta

from app.modules.datasets.enums import DatasetStatus, DatasetType
from app.modules.datasets.service import _analyze_rows, _normalize_name, _parse_number


def test_analyze_rows_detects_interval_and_columns() -> None:
    start = datetime(2026, 1, 1, 0, 0)
    rows = [
        {
            "Thời gian": (start + timedelta(minutes=15 * index)).isoformat(),
            "Công suất (kW)": str(100 + index),
        }
        for index in range(4)
    ]

    result = _analyze_rows(["Thời gian", "Công suất (kW)"], rows)

    assert result["status"] == DatasetStatus.READY
    assert result["row_count"] == 4
    assert result["valid_row_count"] == 4
    assert result["interval_minutes"] == 15
    assert result["timestamp_column"] == "Thời gian"
    assert result["value_column"] == "Công suất (kW)"
    assert result["quality_summary"]["value_min"] == 100
    assert result["quality_summary"]["value_max"] == 103
    assert result["quality_summary"]["value_mean"] == 101.5
    assert result["quality_summary"]["value_sum"] == 406
    assert result["quality_summary"]["observed_hours"] == 1


def test_analyze_rows_marks_duplicates_and_invalid_rows_as_warning() -> None:
    rows = [
        {"timestamp": "2026-01-01 00:00", "power": "100"},
        {"timestamp": "2026-01-01 00:00", "power": "101"},
        {"timestamp": "invalid", "power": "102"},
    ]

    result = _analyze_rows(["timestamp", "power"], rows)

    assert result["status"] == DatasetStatus.WARNING
    assert result["valid_row_count"] == 2
    assert result["quality_summary"]["duplicate_timestamps"] == 1
    assert result["quality_summary"]["invalid_rows"] == 1


def test_analyze_rows_supports_ems_day_index_step_schema() -> None:
    rows = [
        {
            "day_index": "1",
            "step": str(step),
            "P_load_kW": str(100 + step),
            "P_pv_kW": str(step / 10),
            "day_type": "working",
        }
        for step in range(96)
    ]
    columns = ["day_index", "step", "P_load_kW", "P_pv_kW", "day_type"]

    load_result = _analyze_rows(
        columns,
        rows,
        dataset_type=DatasetType.LOAD_PROFILE,
    )
    pv_result = _analyze_rows(
        columns,
        rows,
        dataset_type=DatasetType.PV_PROFILE,
    )

    assert load_result["status"] == DatasetStatus.READY
    assert load_result["timestamp_column"] == "day_index+step"
    assert load_result["value_column"] == "P_load_kW"
    assert load_result["interval_minutes"] == 15
    assert load_result["valid_row_count"] == 96
    assert load_result["quality_summary"]["source_schema"] == "day_index_step"
    assert load_result["quality_summary"]["indexed_days"] == 1
    assert load_result["quality_summary"]["incomplete_days"] == 0
    assert pv_result["value_column"] == "P_pv_kW"
    assert pv_result["quality_summary"]["value_max"] == 9.5


def test_analyze_rows_supports_ems_date_iso_step_schema() -> None:
    rows = [
        {
            "date_iso": "2025-07-26",
            "day_type": "weekend",
            "step": str(step),
            "P_load_kW": str(200 + step),
            "P_pv_kW": "0",
        }
        for step in range(96)
    ]
    columns = ["date_iso", "day_type", "step", "P_load_kW", "P_pv_kW"]

    result = _analyze_rows(
        columns,
        rows,
        dataset_type=DatasetType.LOAD_PROFILE,
    )

    assert result["status"] == DatasetStatus.READY
    assert result["timestamp_column"] == "date_iso+step"
    assert result["start_at"].isoformat() == "2025-07-26T00:00:00"
    assert result["end_at"].isoformat() == "2025-07-26T23:45:00"
    assert result["quality_summary"]["source_schema"] == "date_iso_step"


def test_vietnamese_column_and_number_normalization() -> None:
    assert _normalize_name("Công suất (kW)") == "cong_suat_kw"
    assert _parse_number("1.234,5") == 1234.5
    assert _parse_number("1,234.5") == 1234.5
