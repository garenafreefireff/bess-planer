from __future__ import annotations

from app.modules.analyses.engine.quick_sizing.config import QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationWarning,
    DemandChargeApplicability,
    DemandChargeMode,
    DetailedVoltageBand,
    JSONValue,
    TariffPlan,
    TouShares,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import clamp, make_warning


def get_tou_shares(
    shift_pattern: str,
    config: QuickSizingConfig,
) -> tuple[TouShares, tuple[CalculationWarning, ...]]:
    lookup = config.lookup_catalog
    warnings: list[CalculationWarning] = []
    shares = lookup.shift_tou_shares.get(shift_pattern)
    if shares is None:
        warnings.append(
            make_warning(
                "unknown_shift_pattern",
                "Không nhận diện được ca vận hành; dùng tỷ trọng TOU mặc định.",
                field="shift_pattern",
            )
        )
        shares = lookup.shift_tou_shares["Không cố định"]

    low, normal, peak = shares
    total = low + normal + peak
    if abs(total - 1) > 0.0001:
        warnings.append(
            make_warning(
                "invalid_tou_share_total",
                "Tổng tỷ trọng thấp/bình thường/cao điểm không bằng 1.",
                severity=WarningSeverity.ERROR,
                blocking=True,
            )
        )
        low, normal, peak = low / total, normal / total, peak / total

    return (
        TouShares(
            low=low,
            normal=normal,
            peak=peak,
            config_version=lookup.version,
        ),
        tuple(warnings),
    )


def get_tariff_plan(
    *,
    voltage_level: str,
    industry: str,
    currency: str,
    config: QuickSizingConfig,
    demand_charge_applicability: str = DemandChargeApplicability.UNKNOWN.value,
    demand_charge_mode: str = DemandChargeMode.REFERENCE.value,
    detailed_voltage_band: str = DetailedVoltageBand.UNKNOWN.value,
    demand_charge_input_vnd_per_kw_month: float | None = None,
    demand_charge_evidence_note: str | None = None,
) -> tuple[TariffPlan, tuple[CalculationWarning, ...]]:
    lookup = config.lookup_catalog
    warnings: list[CalculationWarning] = []
    customer_group = lookup.tariff_groups_by_industry.get(industry, "industrial")
    tariff_reference = lookup.tariff_references_by_voltage.get(voltage_level)
    confidence = "medium"

    if tariff_reference is None:
        tariff_reference = lookup.tariff_references_by_voltage["Chưa xác định"]
        confidence = "low"
        warnings.append(
            make_warning(
                "unknown_voltage_level",
                "Cấp điện áp chưa rõ; dùng tariff mặc định và cần xác nhận ở Bước 2.",
                field="voltage_level",
            )
        )
    elif voltage_level in {"Hạ áp", "Trung áp", "Cao áp", "Chưa xác định"}:
        confidence = "low" if voltage_level == "Chưa xác định" else "medium"
        warnings.append(
            make_warning(
                "broad_voltage_level",
                "Cần xác nhận cấp điện áp chi tiết trước khi áp dụng giá công suất tham chiếu.",
                severity=WarningSeverity.INFO,
                field="voltage_level",
            )
        )

    demand_fields, demand_warnings = resolve_effective_demand_charge(
        applicability=demand_charge_applicability,
        mode=demand_charge_mode,
        detailed_voltage_band=detailed_voltage_band,
        input_vnd_per_kw_month=demand_charge_input_vnd_per_kw_month,
        evidence_note=demand_charge_evidence_note,
        config=config,
    )
    warnings.extend(demand_warnings)

    return (
        TariffPlan(
            customer_group=customer_group,
            voltage_level=voltage_level,
            tariff_plan_code=f"{customer_group}:{voltage_level}",
            currency=currency,
            low_price=tariff_reference.low_price,
            normal_price=tariff_reference.normal_price,
            peak_price=tariff_reference.peak_price,
            demand_charge_per_kw=demand_fields["effective_demand_charge_vnd_per_kw_month"],
            demand_charge_applicability=str(demand_fields["demand_charge_applicability"]),
            demand_charge_mode=str(demand_fields["demand_charge_mode"]),
            detailed_voltage_band=str(demand_fields["detailed_voltage_band"]),
            demand_charge_input_vnd_per_kw_month=demand_fields[
                "demand_charge_input_vnd_per_kw_month"
            ],
            demand_charge_reference_vnd_per_kw_month=demand_fields[
                "demand_charge_reference_vnd_per_kw_month"
            ],
            effective_demand_charge_vnd_per_kw_month=demand_fields[
                "effective_demand_charge_vnd_per_kw_month"
            ],
            demand_charge_status=str(demand_fields["demand_charge_status"]),
            demand_charge_source=str(demand_fields["demand_charge_source"]),
            demand_charge_catalog_version=str(demand_fields["demand_charge_catalog_version"]),
            demand_charge_evidence_note=demand_fields["demand_charge_evidence_note"],
            demand_charge_reference_bands=tuple(
                demand_fields["demand_charge_reference_bands"]
            ),
            demand_saving_included_in_base_npv=bool(
                demand_fields["demand_saving_included_in_base_npv"]
            ),
            vat_pct=tariff_reference.vat_pct,
            confidence=confidence,
            config_version=lookup.version,
        ),
        tuple(warnings),
    )


def resolve_effective_demand_charge(
    *,
    applicability: str,
    mode: str,
    detailed_voltage_band: str,
    input_vnd_per_kw_month: float | None,
    evidence_note: str | None,
    config: QuickSizingConfig,
) -> tuple[dict[str, JSONValue], tuple[CalculationWarning, ...]]:
    catalog = config.lookup_catalog.demand_charge_catalog
    if catalog is None:
        return (
            _demand_charge_result(
                applicability=DemandChargeApplicability.UNKNOWN.value,
                mode=DemandChargeMode.REFERENCE.value,
                detailed_voltage_band=DetailedVoltageBand.UNKNOWN.value,
                input_value=None,
                reference_value=None,
                effective_value=0.0,
                status="catalog_missing",
                source="not_confirmed",
                catalog_version="",
                evidence_note=evidence_note,
                reference_bands=(),
                included=False,
            ),
            (
                make_warning(
                    "demand_charge_catalog_missing",
                    "Thiếu catalog giá công suất; chưa cộng lợi ích phí công suất vào NPV cơ sở.",
                    field="demand_charge",
                ),
            ),
        )

    warnings: list[CalculationWarning] = []
    normalized_applicability = _normalize_enum_value(
        applicability,
        {item.value for item in DemandChargeApplicability},
        DemandChargeApplicability.UNKNOWN.value,
    )
    normalized_mode = _normalize_enum_value(
        mode,
        {item.value for item in DemandChargeMode},
        DemandChargeMode.REFERENCE.value,
    )
    normalized_band = _normalize_enum_value(
        detailed_voltage_band,
        {item.value for item in DetailedVoltageBand},
        DetailedVoltageBand.UNKNOWN.value,
    )
    reference_band = next(
        (band for band in catalog.reference_bands if band.code == normalized_band),
        None,
    )
    reference_value = reference_band.price_vnd_per_kw_month if reference_band else None
    reference_bands = tuple(_reference_band_payload(band) for band in catalog.reference_bands)

    if input_vnd_per_kw_month is not None and input_vnd_per_kw_month < 0:
        warnings.append(
            make_warning(
                "negative_demand_charge_input",
                "Giá công suất không được âm; chưa dùng giá này trong tính toán.",
                severity=WarningSeverity.ERROR,
                field="demand_charge_input_vnd_per_kw_month",
                blocking=True,
            )
        )
        input_vnd_per_kw_month = None

    if normalized_applicability == DemandChargeApplicability.NOT_APPLICABLE.value:
        return (
            _demand_charge_result(
                applicability=normalized_applicability,
                mode=normalized_mode,
                detailed_voltage_band=normalized_band,
                input_value=input_vnd_per_kw_month,
                reference_value=reference_value,
                effective_value=0.0,
                status="not_applicable",
                source="not_applicable",
                catalog_version=catalog.version,
                evidence_note=evidence_note,
                reference_bands=reference_bands,
                included=False,
            ),
            tuple(warnings),
        )

    if normalized_applicability == DemandChargeApplicability.UNKNOWN.value:
        warnings.append(
            make_warning(
                "demand_charge_applicability_unknown",
                "Chưa xác nhận giá công suất; lợi ích giảm phí công suất chưa được cộng vào NPV cơ sở.",
                severity=WarningSeverity.INFO,
                field="demand_charge_applicability",
            )
        )
        return (
            _demand_charge_result(
                applicability=normalized_applicability,
                mode=normalized_mode,
                detailed_voltage_band=normalized_band,
                input_value=input_vnd_per_kw_month,
                reference_value=reference_value,
                effective_value=0.0,
                status="unknown",
                source="not_confirmed",
                catalog_version=catalog.version,
                evidence_note=evidence_note,
                reference_bands=reference_bands,
                included=False,
            ),
            tuple(warnings),
        )

    if normalized_mode in {DemandChargeMode.INVOICE.value, DemandChargeMode.MANUAL.value}:
        source = "invoice" if normalized_mode == DemandChargeMode.INVOICE.value else "user_input"
        status = "invoice_confirmed" if normalized_mode == DemandChargeMode.INVOICE.value else "manual_unconfirmed"
        if input_vnd_per_kw_month is None or input_vnd_per_kw_month <= 0:
            warnings.append(
                make_warning(
                    "demand_charge_input_required",
                    "Cần nhập giá công suất lớn hơn 0 khi đã xác nhận áp dụng theo hóa đơn hoặc nhập thủ công.",
                    severity=WarningSeverity.ERROR,
                    field="demand_charge_input_vnd_per_kw_month",
                    blocking=False,
                )
            )
            return (
                _demand_charge_result(
                    applicability=normalized_applicability,
                    mode=normalized_mode,
                    detailed_voltage_band=normalized_band,
                    input_value=input_vnd_per_kw_month,
                    reference_value=reference_value,
                    effective_value=0.0,
                    status="invalid_input",
                    source=source,
                    catalog_version=catalog.version,
                    evidence_note=evidence_note,
                    reference_bands=reference_bands,
                    included=False,
                ),
                tuple(warnings),
            )
        if normalized_mode == DemandChargeMode.MANUAL.value:
            warnings.append(
                make_warning(
                    "manual_demand_charge_needs_invoice_check",
                    "Giá được nhập thủ công; cần đối chiếu hóa đơn hoặc hợp đồng.",
                    severity=WarningSeverity.WARNING,
                    field="demand_charge_input_vnd_per_kw_month",
                )
            )
        return (
            _demand_charge_result(
                applicability=normalized_applicability,
                mode=normalized_mode,
                detailed_voltage_band=normalized_band,
                input_value=input_vnd_per_kw_month,
                reference_value=reference_value,
                effective_value=input_vnd_per_kw_month,
                status=status,
                source=source,
                catalog_version=catalog.version,
                evidence_note=evidence_note,
                reference_bands=reference_bands,
                included=True,
            ),
            tuple(warnings),
        )

    if normalized_band == DetailedVoltageBand.UNKNOWN.value or reference_value is None:
        warnings.append(
            make_warning(
                "demand_charge_voltage_band_required",
                "Cần chọn cấp điện áp chi tiết trước khi dùng giá công suất tham chiếu.",
                severity=WarningSeverity.ERROR,
                field="detailed_voltage_band",
                blocking=False,
            )
        )
        return (
            _demand_charge_result(
                applicability=normalized_applicability,
                mode=DemandChargeMode.REFERENCE.value,
                detailed_voltage_band=normalized_band,
                input_value=input_vnd_per_kw_month,
                reference_value=reference_value,
                effective_value=0.0,
                status=catalog.status,
                source="evn_trial_reference",
                catalog_version=catalog.version,
                evidence_note=evidence_note,
                reference_bands=reference_bands,
                included=False,
            ),
            tuple(warnings),
        )

    warnings.append(
        make_warning(
            "trial_reference_demand_charge",
            "Đang sử dụng giá tham chiếu thử nghiệm, chưa phải xác nhận hóa đơn.",
            severity=WarningSeverity.WARNING,
            field="detailed_voltage_band",
        )
    )
    return (
        _demand_charge_result(
            applicability=normalized_applicability,
            mode=DemandChargeMode.REFERENCE.value,
            detailed_voltage_band=normalized_band,
            input_value=input_vnd_per_kw_month,
            reference_value=reference_value,
            effective_value=reference_value,
            status=catalog.status,
            source="evn_trial_reference",
            catalog_version=catalog.version,
            evidence_note=evidence_note,
            reference_bands=reference_bands,
            included=True,
        ),
        tuple(warnings),
    )


def _normalize_enum_value(value: str, allowed: set[str], fallback: str) -> str:
    return value if value in allowed else fallback


def _reference_band_payload(band: object) -> dict[str, JSONValue]:
    return {
        "code": getattr(band, "code"),
        "label": getattr(band, "label"),
        "min_voltage_kv": getattr(band, "min_voltage_kv"),
        "max_voltage_kv": getattr(band, "max_voltage_kv"),
        "price_vnd_per_kw_month": getattr(band, "price_vnd_per_kw_month"),
        "status": getattr(band, "status"),
        "source_name": getattr(band, "source_name"),
        "source_date": getattr(band, "source_date"),
        "notes": list(getattr(band, "notes")),
    }


def _demand_charge_result(
    *,
    applicability: str,
    mode: str,
    detailed_voltage_band: str,
    input_value: float | None,
    reference_value: float | None,
    effective_value: float,
    status: str,
    source: str,
    catalog_version: str,
    evidence_note: str | None,
    reference_bands: tuple[dict[str, JSONValue], ...],
    included: bool,
) -> dict[str, JSONValue]:
    return {
        "demand_charge_applicability": applicability,
        "demand_charge_mode": mode,
        "detailed_voltage_band": detailed_voltage_band,
        "demand_charge_input_vnd_per_kw_month": input_value,
        "demand_charge_reference_vnd_per_kw_month": reference_value,
        "effective_demand_charge_vnd_per_kw_month": effective_value,
        "demand_charge_status": status,
        "demand_charge_source": source,
        "demand_charge_catalog_version": catalog_version,
        "demand_charge_evidence_note": evidence_note,
        "demand_charge_reference_bands": reference_bands,
        "demand_saving_included_in_base_npv": included,
    }


def get_load_factor(
    *,
    industry: str,
    shift_pattern: str,
    config: QuickSizingConfig,
) -> tuple[float, tuple[CalculationWarning, ...]]:
    lookup = config.lookup_catalog
    warnings: list[CalculationWarning] = []
    base = lookup.industry_load_factors.get(industry)
    if base is None:
        base = lookup.industry_load_factors["Khác"]
        warnings.append(
            make_warning(
                "unknown_industry_load_factor",
                "Ngành chưa có hệ số phụ tải riêng; dùng profile mặc định.",
                field="industry",
            )
        )

    adjustment = lookup.shift_load_factor_adjustments.get(shift_pattern)
    if adjustment is None:
        adjustment = lookup.shift_load_factor_adjustments["Không cố định"]
        warnings.append(
            make_warning(
                "unknown_shift_adjustment",
                "Ca vận hành chưa có hiệu chỉnh load factor; dùng mặc định.",
                field="shift_pattern",
            )
        )

    return (
        clamp(base + adjustment, lookup.load_factor_min, lookup.load_factor_max),
        tuple(warnings),
    )


def get_load_range_bounds(
    estimated_load_range: str,
    config: QuickSizingConfig,
) -> tuple[float | None, float | None]:
    return config.lookup_catalog.load_range_bounds_kw.get(
        estimated_load_range,
        (None, None),
    )


def get_shiftable_energy_ratio(industry: str, config: QuickSizingConfig) -> float:
    lookup = config.lookup_catalog
    return lookup.shiftable_energy_ratio_by_industry.get(
        industry,
        lookup.shiftable_energy_ratio_by_industry["Khác"],
    )


def get_pv_surplus_ratio(
    export_policy: str | None,
    solar_objectives: tuple[str, ...],
    config: QuickSizingConfig,
) -> float:
    lookup = config.lookup_catalog
    base = lookup.pv_surplus_ratio_by_export_policy.get(
        export_policy or "Chưa xác định",
        lookup.pv_surplus_ratio_by_export_policy["Chưa xác định"],
    )
    adjustment = sum(
        lookup.pv_surplus_objective_adjustments.get(objective, 0)
        for objective in solar_objectives
    )
    return clamp(base + adjustment, 0.0, 0.8)


def get_cycle_requirement(objective: str, config: QuickSizingConfig) -> float:
    return config.lookup_catalog.cycles_per_day_by_objective.get(objective, 0.5)
