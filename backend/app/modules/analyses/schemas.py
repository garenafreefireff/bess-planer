from datetime import datetime
from typing import Any, Literal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.modules.analyses.engine.quick_sizing.models import QuickSizingInput
from app.modules.analyses.enums import AnalysisRunStatus, AnalysisType
from app.shared.schemas.object_id import ObjectIdStr


class QuickSizingStep1Request(BaseModel):
    project_id: ObjectIdStr | None = None
    bess_catalog_id: ObjectIdStr | None = None
    currency: str = "VND"
    industry: str = Field(min_length=1, max_length=120)
    custom_industry: str | None = Field(
        default=None,
        validation_alias=AliasChoices("customIndustry", "custom_industry"),
    )
    estimated_load_range: str = Field(
        min_length=1,
        max_length=80,
        validation_alias=AliasChoices("estimatedLoadRange", "estimated_load_range"),
    )
    monthly_electricity_bill: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices(
            "monthlyElectricityBillVnd",
            "monthlyElectricityBill",
            "monthly_electricity_bill",
        ),
    )
    voltage_level: str = Field(
        min_length=1,
        max_length=80,
        validation_alias=AliasChoices("voltageLevel", "voltage_level"),
    )
    operating_hours_per_day: float | None = Field(
        default=None,
        ge=0,
        le=24,
        validation_alias=AliasChoices("operatingHoursPerDay", "operating_hours_per_day"),
    )
    operating_days_per_week: float | None = Field(
        default=None,
        ge=0,
        le=7,
        validation_alias=AliasChoices("operatingDaysPerWeek", "operating_days_per_week"),
    )
    shift_pattern: str = Field(
        min_length=1,
        max_length=80,
        validation_alias=AliasChoices("shiftPattern", "shift_pattern"),
    )
    solar_status: Literal["yes", "none", "planned", "unknown"] = Field(
        default="unknown",
        validation_alias=AliasChoices("solarStatus", "solar_status"),
    )
    solar_capacity_value: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices("solarCapacityValue", "solar_capacity_value"),
    )
    solar_capacity_unit: str | None = Field(
        default=None,
        validation_alias=AliasChoices("solarCapacityUnit", "solar_capacity_unit"),
    )
    solar_monthly_generation_value: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices(
            "solarMonthlyGenerationValue",
            "solar_monthly_generation_value",
        ),
    )
    solar_monthly_generation_unit: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "solarMonthlyGenerationUnit",
            "solar_monthly_generation_unit",
        ),
    )
    export_policy: str | None = Field(
        default=None,
        validation_alias=AliasChoices("exportPolicy", "export_policy"),
    )
    solar_objectives: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("solarObjectives", "solar_objectives"),
    )
    bess_objectives: list[str] = Field(
        min_length=1,
        max_length=3,
        validation_alias=AliasChoices("bessObjectives", "bess_objectives"),
    )
    backup_critical_load_pct: float | None = Field(
        default=None,
        ge=0,
        le=100,
        validation_alias=AliasChoices(
            "backupCriticalLoadPercent",
            "backup_critical_load_pct",
        ),
    )
    backup_duration_hours: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices("backupDurationHours", "backup_duration_hours"),
    )
    estimated_peak_demand_kw: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices("estimatedPeakDemandKw", "estimated_peak_demand_kw"),
    )
    target_peak_reduction_type: Literal["percent", "kw"] | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "targetPeakReductionType",
            "target_peak_reduction_type",
        ),
    )
    target_peak_reduction_value: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices(
            "targetPeakReductionValue",
            "target_peak_reduction_value",
        ),
    )
    budget_range: str = Field(
        default="Chưa xác định",
        validation_alias=AliasChoices("budgetRange", "budget_range"),
    )
    custom_budget: float | None = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices("customBudgetVnd", "customBudget", "custom_budget"),
    )
    demand_charge_applicability: Literal["applicable", "not_applicable", "unknown"] = Field(
        default="unknown",
        validation_alias=AliasChoices(
            "demandChargeApplicability",
            "demand_charge_applicability",
        ),
    )
    demand_charge_mode: Literal["invoice", "manual", "reference"] = Field(
        default="reference",
        validation_alias=AliasChoices("demandChargeMode", "demand_charge_mode"),
    )
    detailed_voltage_band: Literal[
        "gte_110kv",
        "22_to_lt_110kv",
        "6_to_lt_22kv",
        "lt_6kv",
        "unknown",
    ] = Field(
        default="unknown",
        validation_alias=AliasChoices("detailedVoltageBand", "detailed_voltage_band"),
    )
    demand_charge_input_vnd_per_kw_month: float | None = Field(
        default=None,
        ge=0,
        le=1_000_000,
        validation_alias=AliasChoices(
            "demandChargeInputVndPerKwMonth",
            "demand_charge_input_vnd_per_kw_month",
        ),
    )
    demand_charge_evidence_note: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "demandChargeEvidenceNote",
            "demand_charge_evidence_note",
        ),
    )

    @field_validator(
        "currency",
        "industry",
        "custom_industry",
        "estimated_load_range",
        "voltage_level",
        "shift_pattern",
        "solar_capacity_unit",
        "solar_monthly_generation_unit",
        "export_policy",
        "budget_range",
        "demand_charge_evidence_note",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value: object) -> object:
        if value is None or not isinstance(value, str):
            return value
        return value.strip()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        currency = value.upper()
        if len(currency) != 3 or not currency.isalpha():
            raise ValueError("Currency must be a 3-letter ISO currency code.")
        return currency

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> "QuickSizingStep1Request":
        if "backup" in self.bess_objectives and self.backup_duration_hours == -1:
            raise ValueError("Custom backup duration must be resolved before calculation.")
        if self.demand_charge_applicability == "not_applicable":
            return self
        if self.demand_charge_applicability == "unknown":
            return self
        if self.demand_charge_mode in {"invoice", "manual"}:
            if (
                self.demand_charge_input_vnd_per_kw_month is None
                or self.demand_charge_input_vnd_per_kw_month <= 0
            ):
                raise ValueError("Demand charge input must be greater than 0.")
        if self.demand_charge_mode == "reference" and self.detailed_voltage_band == "unknown":
            raise ValueError("Detailed voltage band is required for reference demand charge.")
        return self

    def to_engine_input(self) -> QuickSizingInput:
        return QuickSizingInput(
            industry=self.industry,
            custom_industry=self.custom_industry,
            estimated_load_range=self.estimated_load_range,
            monthly_electricity_bill=self.monthly_electricity_bill,
            currency=self.currency,
            voltage_level=self.voltage_level,
            operating_hours_per_day=self.operating_hours_per_day,
            operating_days_per_week=self.operating_days_per_week,
            shift_pattern=self.shift_pattern,
            solar_status=self.solar_status,
            solar_capacity_value=self.solar_capacity_value,
            solar_capacity_unit=self.solar_capacity_unit,
            solar_monthly_generation_value=self.solar_monthly_generation_value,
            solar_monthly_generation_unit=self.solar_monthly_generation_unit,
            export_policy=self.export_policy,
            solar_objectives=tuple(self.solar_objectives),
            bess_objectives=tuple(self.bess_objectives),
            backup_critical_load_pct=self.backup_critical_load_pct,
            backup_duration_hours=self.backup_duration_hours,
            estimated_peak_demand_kw=self.estimated_peak_demand_kw,
            target_peak_reduction_type=self.target_peak_reduction_type,
            target_peak_reduction_value=self.target_peak_reduction_value,
            budget_range=self.budget_range,
            custom_budget=self.custom_budget,
            demand_charge_applicability=self.demand_charge_applicability,
            demand_charge_mode=self.demand_charge_mode,
            detailed_voltage_band=self.detailed_voltage_band,
            demand_charge_input_vnd_per_kw_month=self.demand_charge_input_vnd_per_kw_month,
            demand_charge_evidence_note=self.demand_charge_evidence_note,
        )

    model_config = ConfigDict(populate_by_name=True)


class AnalysisRunResponse(BaseModel):
    id: str | None = None
    user_id: str | None = None
    project_id: str | None = None
    bess_catalog_id: str | None = None
    analysis_type: AnalysisType
    status: AnalysisRunStatus
    progress_pct: float
    input_snapshot: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] = Field(default_factory=dict)
    artifacts: dict[str, Any] = Field(default_factory=dict)
    engine_version: str
    error: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
