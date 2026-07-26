from dataclasses import dataclass
from typing import Any


def _number(value: object, default: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return default
    return float(value)


def _positive(value: object, default: float) -> float:
    number = _number(value, default)
    return number if number > 0 else default


@dataclass(frozen=True)
class SizingAssumptions:
    analysis_years: int
    reference_energy_kwh: float
    reference_power_kw: float
    soc_min_pct: float
    soc_max_pct: float
    charge_efficiency: float
    discharge_efficiency: float
    battery_cost_vnd_per_kwh: float
    pcs_cost_vnd_per_kw: float
    epc_pct: float
    other_cost_pct: float
    annual_opex_pct: float
    discount_rate: float
    electricity_escalation: float
    realization_rate: float
    demand_charge_vnd_per_kw_month: float
    peak_price_vnd_per_kwh: float
    normal_price_vnd_per_kwh: float
    offpeak_price_vnd_per_kwh: float
    optimize_peak: bool
    optimize_tou: bool

    @classmethod
    def from_configuration(cls, configuration: dict[str, Any]) -> "SizingAssumptions":
        soc_min = min(95.0, max(0.0, _number(configuration.get("socMinPct"), 10.0)))
        soc_max = min(100.0, max(soc_min + 1.0, _number(configuration.get("socMaxPct"), 90.0)))
        return cls(
            analysis_years=max(1, int(_positive(configuration.get("analysisYears"), 10))),
            reference_energy_kwh=_positive(configuration.get("energyKwh"), 1000.0),
            reference_power_kw=_positive(configuration.get("powerKw"), 500.0),
            soc_min_pct=soc_min,
            soc_max_pct=soc_max,
            charge_efficiency=min(1.0, max(0.5, _number(configuration.get("chargeEfficiencyPct"), 95.0) / 100)),
            discharge_efficiency=min(1.0, max(0.5, _number(configuration.get("dischargeEfficiencyPct"), 95.0) / 100)),
            battery_cost_vnd_per_kwh=_positive(configuration.get("batteryCostVndPerKwh"), 4_500_000.0),
            pcs_cost_vnd_per_kw=_positive(configuration.get("pcsCostVndPerKw"), 1_800_000.0),
            epc_pct=max(0.0, _number(configuration.get("epcPct"), 12.0)),
            other_cost_pct=max(0.0, _number(configuration.get("otherCostPct"), 5.0)),
            annual_opex_pct=max(0.0, _number(configuration.get("annualOpexPct"), 1.5)),
            discount_rate=max(0.0, _number(configuration.get("discountRatePct"), 8.0) / 100),
            electricity_escalation=max(0.0, _number(configuration.get("electricityEscalationPct"), 3.0) / 100),
            realization_rate=min(1.0, max(0.1, _number(configuration.get("realizationRatePct"), 90.0) / 100)),
            demand_charge_vnd_per_kw_month=max(0.0, _number(configuration.get("demandChargeVndPerKwMonth"), 180_000.0)),
            peak_price_vnd_per_kwh=max(0.0, _number(configuration.get("peakPriceVndPerKwh"), 3_314.0)),
            normal_price_vnd_per_kwh=max(0.0, _number(configuration.get("normalPriceVndPerKwh"), 1_843.0)),
            offpeak_price_vnd_per_kwh=max(0.0, _number(configuration.get("offpeakPriceVndPerKwh"), 1_152.0)),
            optimize_peak=bool(configuration.get("optimizePeak", True)),
            optimize_tou=bool(configuration.get("optimizeTou", True)),
        )


@dataclass(frozen=True)
class ProfileSummary:
    peak_kw: float
    average_kw: float
    annual_energy_kwh: float
    interval_minutes: float
    coverage_pct: float
    start_at: str | None
    end_at: str | None
    valid_rows: int
    row_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "peak_kw": round(self.peak_kw, 3),
            "average_kw": round(self.average_kw, 3),
            "annual_energy_kwh": round(self.annual_energy_kwh, 3),
            "interval_minutes": round(self.interval_minutes, 3),
            "coverage_pct": round(self.coverage_pct, 3),
            "start_at": self.start_at,
            "end_at": self.end_at,
            "valid_rows": self.valid_rows,
            "row_count": self.row_count,
        }


@dataclass(frozen=True)
class Candidate:
    energy_kwh: float
    power_kw: float

    @property
    def id(self) -> str:
        return f"e{int(round(self.energy_kwh))}-p{int(round(self.power_kw))}"

    @property
    def duration_hours(self) -> float:
        return self.energy_kwh / self.power_kw

    @property
    def c_rate(self) -> float:
        return self.power_kw / self.energy_kwh
