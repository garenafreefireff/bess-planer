from datetime import datetime, timedelta

from app.modules.datasets.enums import DatasetStatus
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


def test_vietnamese_column_and_number_normalization() -> None:
    assert _normalize_name("Công suất (kW)") == "cong_suat_kw"
    assert _parse_number("1.234,5") == 1234.5
    assert _parse_number("1,234.5") == 1234.5
