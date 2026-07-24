from typing import ClassVar

from pydantic import Field

from app.models.base import BaseDocument
from app.modules.projects.enums import ProjectStatus, ProjectType


class ProjectDocument(BaseDocument):
    collection_name: ClassVar[str] = "projects"
    user_id: str
    site_id: str
    bess_catalog_id: str
    latest_analysis_run_id: str | None = None
    name: str
    project_type: ProjectType
    status: ProjectStatus = ProjectStatus.DRAFT
    configuration: dict = Field(default_factory=dict)
    scenarios: list[dict] = Field(default_factory=list)
    dataset_ids: list[str] = Field(default_factory=list)
