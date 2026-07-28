from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.projects.enums import ProjectStatus, ProjectType
from app.shared.schemas.object_id import ObjectIdStr


class ProjectCreateRequest(BaseModel):
    site_id: ObjectIdStr
    bess_catalog_id: ObjectIdStr
    name: str = Field(min_length=1, max_length=160)
    project_type: ProjectType = ProjectType.BESS_PLANNING
    status: ProjectStatus = ProjectStatus.DRAFT
    active_load_dataset_id: ObjectIdStr | None = None
    active_pv_dataset_id: ObjectIdStr | None = None
    configuration: dict[str, Any] = Field(default_factory=dict)
    scenarios: list[dict[str, Any]] = Field(default_factory=list)
    dataset_ids: list[ObjectIdStr] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Project name is required.")
        return stripped


class ProjectUpdateRequest(BaseModel):
    site_id: ObjectIdStr | None = None
    bess_catalog_id: ObjectIdStr | None = None
    latest_analysis_run_id: ObjectIdStr | None = None
    active_load_dataset_id: ObjectIdStr | None = None
    active_pv_dataset_id: ObjectIdStr | None = None
    name: str | None = Field(default=None, min_length=1, max_length=160)
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None
    configuration: dict[str, Any] | None = None
    scenarios: list[dict[str, Any]] | None = None
    dataset_ids: list[ObjectIdStr] | None = None

    @field_validator("name")
    @classmethod
    def strip_optional_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Project name is required.")
        return stripped

    @model_validator(mode="after")
    def require_at_least_one_change(self) -> "ProjectUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        return self


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    site_id: str
    bess_catalog_id: str
    latest_analysis_run_id: str | None = None
    active_load_dataset_id: str | None = None
    active_pv_dataset_id: str | None = None
    name: str
    project_type: ProjectType
    status: ProjectStatus
    configuration: dict[str, Any] = Field(default_factory=dict)
    scenarios: list[dict[str, Any]] = Field(default_factory=list)
    dataset_ids: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
