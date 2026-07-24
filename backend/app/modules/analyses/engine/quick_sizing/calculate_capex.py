from __future__ import annotations

import math

from app.modules.analyses.engine.quick_sizing.config import CostCatalog, QuickSizingConfig
from app.modules.analyses.engine.quick_sizing.models import (
    CalculationTraceItem,
    CalculationWarning,
    CapexBreakdown,
    CombinedSizingResult,
    UnitCostMetadata,
    WarningSeverity,
)
from app.modules.analyses.engine.quick_sizing.utils import clamp, make_warning


def select_epc_base_rate(equipment_cost: float, catalog: CostCatalog) -> float:
    for band in catalog.epc_rate_bands:
        lower_matched = equipment_cost >= band.min_equipment_cost
        upper_matched = band.max_equipment_cost is None or equipment_cost < band.max_equipment_cost
        if lower_matched and upper_matched:
            return band.rate_pct

    return catalog.epc_rate_bands[-1].rate_pct if catalog.epc_rate_bands else catalog.epc_max_rate_pct


def calculate_epc_rate(
    *,
    equipment_cost: float,
    voltage_level: str,
    catalog: CostCatalog,
    epc_mode: str = "auto",
    epc_manual_rate_pct: float | None = None,
) -> tuple[float, float, float]:
    base_rate_pct = select_epc_base_rate(equipment_cost, catalog)
    voltage_adjustment_pct = catalog.voltage_adjustments_pct.get(
        voltage_level,
        catalog.voltage_adjustments_pct.get("Chưa xác định", 0.0),
    )
    auto_rate_pct = clamp(
        base_rate_pct + voltage_adjustment_pct,
        catalog.epc_min_rate_pct,
        catalog.epc_max_rate_pct,
    )
    if epc_mode == "manual" and epc_manual_rate_pct is not None and math.isfinite(epc_manual_rate_pct):
        applied_rate_pct = clamp(
            epc_manual_rate_pct,
            catalog.epc_min_rate_pct,
            catalog.epc_max_rate_pct,
        )
    else:
        applied_rate_pct = auto_rate_pct

    return base_rate_pct, voltage_adjustment_pct, applied_rate_pct


def calculate_capex(
    sizing: CombinedSizingResult,
    *,
    currency: str,
    config: QuickSizingConfig,
    voltage_level: str,
    epc_mode: str = "auto",
    epc_manual_rate_pct: float | None = None,
    include_vat_in_capex: bool | None = None,
) -> tuple[CapexBreakdown, tuple[CalculationWarning, ...], tuple[CalculationTraceItem, ...]]:
    cost = config.cost_catalog
    should_include_vat = (
        cost.include_vat_in_capex_default
        if include_vat_in_capex is None
        else include_vat_in_capex
    )
    battery_cost = sizing.energy_kwh * cost.battery_cost_per_kwh
    pcs_cost = sizing.power_kw * cost.pcs_cost_per_kw
    equipment_cost = battery_cost + pcs_cost
    base_rate_pct, voltage_adjustment_pct, applied_rate_pct = calculate_epc_rate(
        equipment_cost=equipment_cost,
        voltage_level=voltage_level,
        catalog=cost,
        epc_mode=epc_mode,
        epc_manual_rate_pct=epc_manual_rate_pct,
    )
    epc_all_in_cost = equipment_cost * applied_rate_pct / 100
    capex_excluding_vat = equipment_cost + epc_all_in_cost
    vat_amount = capex_excluding_vat * cost.vat_pct / 100 if should_include_vat else 0.0
    total_capex = capex_excluding_vat + vat_amount
    first_year_om = capex_excluding_vat * cost.om_pct / 100
    battery_unit_cost = _unit_cost_metadata(
        value=cost.battery_cost_per_kwh,
        unit=cost.battery_dc_package.unit,
        catalog=cost,
        scope_included=cost.battery_dc_package.scope_included,
        scope_excluded=cost.battery_dc_package.scope_excluded,
        notes=cost.battery_dc_package.notes,
        scenario_values={
            "optimistic": cost.battery_dc_package.optimistic,
            "base": cost.battery_dc_package.base,
            "conservative": cost.battery_dc_package.conservative,
        },
    )
    pcs_unit_cost = _unit_cost_metadata(
        value=cost.pcs_cost_per_kw,
        unit=cost.pcs_equipment.unit,
        catalog=cost,
        scope_included=cost.pcs_equipment.scope_included,
        scope_excluded=cost.pcs_equipment.scope_excluded,
        notes=cost.pcs_equipment.notes,
        scenario_values={
            "optimistic": cost.pcs_equipment.optimistic,
            "base": cost.pcs_equipment.base,
            "conservative": cost.pcs_equipment.conservative,
        },
    )

    breakdown = CapexBreakdown(
        battery_cost=battery_cost,
        battery_unit_cost=battery_unit_cost,
        pcs_cost=pcs_cost,
        pcs_unit_cost=pcs_unit_cost,
        equipment_cost=equipment_cost,
        epc_base_rate_pct=base_rate_pct,
        epc_voltage_adjustment_pct=voltage_adjustment_pct,
        epc_applied_rate_pct=applied_rate_pct,
        epc_all_in_cost=epc_all_in_cost,
        epc_scope_items=cost.epc_scope_items,
        epc_rate_bands=tuple(
            {
                "min_equipment_cost": band.min_equipment_cost,
                "max_equipment_cost": band.max_equipment_cost,
                "rate_pct": band.rate_pct,
            }
            for band in cost.epc_rate_bands
        ),
        epc_voltage_adjustments_pct=dict(cost.voltage_adjustments_pct),
        epc_min_rate_pct=cost.epc_min_rate_pct,
        epc_max_rate_pct=cost.epc_max_rate_pct,
        epc_mode=epc_mode,
        epc_manual_rate_pct=epc_manual_rate_pct if epc_mode == "manual" else None,
        include_vat_in_capex=should_include_vat,
        vat_amount=vat_amount,
        capex_excluding_vat=capex_excluding_vat,
        total_capex=total_capex,
        first_year_om=first_year_om,
        currency=currency,
        cost_model_status=cost.status,
        cost_catalog_version=cost.version,
        cost_model_source_name=cost.source_name,
    )
    warnings = _validate_capex_sum(breakdown)
    trace = (
        CalculationTraceItem(
            formula_id="CAPEX-EPC-ALL-IN-V1",
            description="Tính CAPEX bằng EquipmentCost và EPC all-in theo rate catalog.",
            inputs={
                "power_kw": sizing.power_kw,
                "energy_kwh": sizing.energy_kwh,
                "voltage_level": voltage_level,
                "battery_cost_per_kwh": cost.battery_cost_per_kwh,
                "pcs_cost_per_kw": cost.pcs_cost_per_kw,
                "battery_unit_cost_source": battery_unit_cost.source,
                "pcs_unit_cost_source": pcs_unit_cost.source,
                "battery_unit_cost_scope_included": list(battery_unit_cost.scope_included),
                "pcs_unit_cost_scope_included": list(pcs_unit_cost.scope_included),
                "epc_mode": epc_mode,
                "epc_manual_rate_pct": epc_manual_rate_pct,
                "include_vat_in_capex": should_include_vat,
                "vat_pct": cost.vat_pct,
                "om_pct": cost.om_pct,
                "cost_catalog_version": cost.version,
                "cost_model_status": cost.status,
                "scenario": "base",
                "user_override": False,
            },
            output={
                "battery_cost_formula": (
                    f"{sizing.energy_kwh} kWh x {cost.battery_cost_per_kwh} VND/kWh"
                ),
                "battery_cost": battery_cost,
                "pcs_cost_formula": (
                    f"{sizing.power_kw} kW x {cost.pcs_cost_per_kw} VND/kW"
                ),
                "pcs_cost": pcs_cost,
                "equipment_cost": equipment_cost,
                "epc_base_rate_pct": base_rate_pct,
                "epc_voltage_adjustment_pct": voltage_adjustment_pct,
                "epc_applied_rate_pct": applied_rate_pct,
                "epc_all_in_cost": epc_all_in_cost,
                "capex_excluding_vat": capex_excluding_vat,
                "vat_amount": vat_amount,
                "total_capex": total_capex,
                "first_year_om": first_year_om,
            },
        ),
    )
    return breakdown, tuple(warnings), trace


def _unit_cost_metadata(
    *,
    value: float,
    unit: str,
    catalog: CostCatalog,
    scope_included: tuple[str, ...],
    scope_excluded: tuple[str, ...],
    notes: tuple[str, ...],
    scenario_values: dict[str, float],
) -> UnitCostMetadata:
    return UnitCostMetadata(
        value=value,
        unit=unit,
        status=catalog.status,
        source=catalog.source_name,
        scope_included=scope_included,
        scope_excluded=scope_excluded,
        notes=notes,
        catalog_version=catalog.version,
        scenario_values=scenario_values,
    )


def _validate_capex_sum(breakdown: CapexBreakdown) -> tuple[CalculationWarning, ...]:
    expected = (
        breakdown.battery_cost
        + breakdown.pcs_cost
        + breakdown.epc_all_in_cost
        + breakdown.vat_amount
    )
    if abs(expected - breakdown.total_capex) <= 1:
        return ()
    return (
        make_warning(
            "capex_component_sum_mismatch",
            "Tổng CAPEX không khớp tổng các thành phần chi phí.",
            severity=WarningSeverity.ERROR,
            field="cost_assumptions.total_capex",
            blocking=True,
        ),
    )
