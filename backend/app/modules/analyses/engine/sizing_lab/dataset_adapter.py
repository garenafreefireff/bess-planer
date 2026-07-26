from datetime import datetime
from typing import Any

from app.modules.analyses.engine.sizing_lab.models import ProfileSummary


def _as_float(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def _as_iso(value: object) -> str | None:
    if isinstance(value, datetime):
        return value.isoformat()
    return value if isinstance(value, str) and value else None


def summarize_dataset(
    dataset: dict[str, Any] | None,
    *,
    fallback_peak_kw: float,
    configured_unit: str = "kw",
) -> ProfileSummary:
    if dataset is None:
        return ProfileSummary(
            peak_kw=fallback_peak_kw,
            average_kw=fallback_peak_kw * 0.62,
            annual_energy_kwh=fallback_peak_kw * 0.62 * 8760,
            interval_minutes=15,
            coverage_pct=0,
            start_at=None,
            end_at=None,
            valid_rows=0,
            row_count=0,
        )

    interval = _as_float(dataset.get("interval_minutes")) or 15.0
    quality = dataset.get("quality_summary")
    quality = quality if isinstance(quality, dict) else {}
    raw_peak = _as_float(quality.get("value_max"))
    raw_average = _as_float(quality.get("value_mean"))
    raw_sum = _as_float(quality.get("value_sum"))
    observed_hours = _as_float(quality.get("observed_hours"))

    preview = dataset.get("preview")
    values: list[float] = []
    if isinstance(preview, list):
        for item in preview:
            if not isinstance(item, dict):
                continue
            value = _as_float(item.get("value"))
            if value is not None and value >= 0:
                values.append(value)

    unit = configured_unit.lower()
    if unit == "kwh" and interval > 0:
        peak = (
            raw_peak * 60 / interval
            if raw_peak is not None
            else max(values, default=fallback_peak_kw) * 60 / interval
        )
        average = (
            raw_average * 60 / interval
            if raw_average is not None
            else (sum(values) / len(values) * 60 / interval if values else peak * 0.62)
        )
        observed_energy = raw_sum
    else:
        peak = raw_peak if raw_peak is not None else max(values, default=fallback_peak_kw)
        average = (
            raw_average
            if raw_average is not None
            else (sum(values) / len(values) if values else peak * 0.62)
        )
        observed_energy = average * observed_hours if observed_hours else None

    row_count = int(_as_float(dataset.get("row_count")) or 0)
    valid_rows = int(_as_float(dataset.get("valid_row_count")) or 0)
    coverage = (valid_rows / row_count * 100) if row_count else 0
    annual_energy = (
        observed_energy * 8760 / observed_hours
        if observed_energy is not None and observed_hours
        else average * 8760
    )

    return ProfileSummary(
        peak_kw=max(peak, 0.0),
        average_kw=max(average, 0.0),
        annual_energy_kwh=max(annual_energy, 0.0),
        interval_minutes=interval,
        coverage_pct=min(100.0, max(0.0, coverage)),
        start_at=_as_iso(dataset.get("start_at")),
        end_at=_as_iso(dataset.get("end_at")),
        valid_rows=valid_rows,
        row_count=row_count,
    )


def quality_warnings(datasets: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    for dataset in datasets:
        dataset_type = str(dataset.get("dataset_type", "dataset"))
        label = "Phụ tải" if dataset_type == "load_profile" else "Điện mặt trời"
        status = str(dataset.get("status", ""))
        if status == "warning":
            warnings.append(f"{label} có cảnh báo chất lượng dữ liệu.")
        interval = _as_float(dataset.get("interval_minutes"))
        if interval is not None and abs(interval - 15) > 0.01:
            warnings.append(
                f"{label} có chu kỳ {interval:g} phút; Oracle LP-PF yêu cầu đúng 15 phút."
            )
        quality = dataset.get("quality_summary")
        if isinstance(quality, dict):
            raw = quality.get("warnings")
            if isinstance(raw, list):
                warnings.extend(f"{label}: {item}" for item in raw if isinstance(item, str))
    return list(dict.fromkeys(warnings))
