import re
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


SUPPORTED_FILE_EXTENSIONS = ["csv", "xlsx"]


def _regex(query: str) -> dict[str, str]:
    return {"$regex": re.escape(query.strip()), "$options": "i"}


def _normalize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_normalize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _normalize_value(item) for key, item in value.items()}
    return value


class AdminSearchRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.users = database["users"]
        self.projects = database["projects"]
        self.files = database["files"]
        self.leads = database["leads"]

    async def search_users(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        escaped = _regex(query)
        rows = await self.users.find(
            {
                "$or": [
                    {"representative_name": escaped},
                    {"email": escaped},
                    {"company_name": escaped},
                ]
            },
            {
                "email": 1,
                "representative_name": 1,
                "company_name": 1,
                "role": 1,
                "status": 1,
            },
        ).sort("updated_at", -1).limit(limit).to_list(length=limit)
        return [_normalize_value(row) for row in rows]

    async def search_projects(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        escaped = _regex(query)
        rows = await self.projects.find(
            {
                "$or": [
                    {"name": escaped},
                    {"configuration.location": escaped},
                    {"configuration.industry": escaped},
                ]
            },
            {
                "name": 1,
                "project_type": 1,
                "status": 1,
                "configuration.location": 1,
                "configuration.industry": 1,
            },
        ).sort("updated_at", -1).limit(limit).to_list(length=limit)
        return [_normalize_value(row) for row in rows]

    async def search_files(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        escaped = _regex(query)
        rows = await self.files.find(
            {
                "extension": {"$in": SUPPORTED_FILE_EXTENSIONS},
                "$or": [
                    {"original_name": escaped},
                    {"sha256": escaped},
                ],
            },
            {
                "original_name": 1,
                "sha256": 1,
                "extension": 1,
                "kind": 1,
                "version": 1,
                "size_bytes": 1,
                "status": 1,
            },
        ).sort("updated_at", -1).limit(limit).to_list(length=limit)
        return [_normalize_value(row) for row in rows]

    async def search_leads(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        escaped = _regex(query)
        rows = await self.leads.find(
            {
                "$or": [
                    {"full_name": escaped},
                    {"email": escaped},
                    {"company_name": escaped},
                    {"phone": escaped},
                ]
            },
            {
                "full_name": 1,
                "email": 1,
                "company_name": 1,
                "phone": 1,
                "sources": 1,
                "status": 1,
            },
        ).sort("updated_at", -1).limit(limit).to_list(length=limit)
        return [_normalize_value(row) for row in rows]
