from typing import Literal

from pydantic import BaseModel, Field

AdminSearchGroupKey = Literal["users", "projects", "files", "leads"]
AdminSearchItemType = Literal["user", "project", "file", "lead"]
AdminSearchMetadataValue = str | int | float | bool | None


class AdminSearchItem(BaseModel):
    id: str
    type: AdminSearchItemType
    title: str
    subtitle: str
    metadata: dict[str, AdminSearchMetadataValue] = Field(default_factory=dict)
    target_url: str


class AdminSearchGroups(BaseModel):
    users: list[AdminSearchItem] = Field(default_factory=list)
    projects: list[AdminSearchItem] = Field(default_factory=list)
    files: list[AdminSearchItem] = Field(default_factory=list)
    leads: list[AdminSearchItem] = Field(default_factory=list)


class AdminSearchResponse(BaseModel):
    query: str
    groups: AdminSearchGroups
    total_matches: int
