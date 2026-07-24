from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.security import utc_now
from app.models.project import ProjectDocument

REFERENCE_FIELDS = {
    "user_id",
    "site_id",
    "bess_catalog_id",
    "latest_analysis_run_id",
}


def _object_id(value: str) -> ObjectId:
    return ObjectId(value)


def _normalize_document_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None

    normalized = dict(document)
    if "_id" in normalized:
        normalized["_id"] = str(normalized["_id"])

    for field in REFERENCE_FIELDS:
        if field in normalized and normalized[field] is not None:
            normalized[field] = str(normalized[field])

    normalized["dataset_ids"] = [str(value) for value in normalized.get("dataset_ids", [])]
    return normalized


def _project_to_mongo(project: ProjectDocument) -> dict[str, Any]:
    payload = project.model_dump(by_alias=True, exclude={"id"})
    return _references_to_object_ids(payload)


def _references_to_object_ids(payload: dict[str, Any]) -> dict[str, Any]:
    converted = dict(payload)

    for field in REFERENCE_FIELDS:
        if field in converted and converted[field] is not None:
            converted[field] = _object_id(converted[field])

    if "dataset_ids" in converted and converted["dataset_ids"] is not None:
        converted["dataset_ids"] = [_object_id(value) for value in converted["dataset_ids"]]

    return converted


class ProjectRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["projects"]

    async def create_project(self, project: ProjectDocument) -> ProjectDocument:
        payload = _project_to_mongo(project)
        result = await self.collection.insert_one(payload)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return ProjectDocument.model_validate(_normalize_document_id(created))

    async def count_by_user(self, user_id: str) -> int:
        return await self.collection.count_documents({"user_id": _object_id(user_id)})

    async def list_by_user(
        self,
        user_id: str,
        *,
        skip: int,
        limit: int,
    ) -> list[ProjectDocument]:
        cursor = (
            self.collection.find({"user_id": _object_id(user_id)})
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [
            ProjectDocument.model_validate(_normalize_document_id(document))
            for document in documents
        ]

    async def get_by_id_for_user(
        self,
        project_id: str,
        user_id: str,
    ) -> ProjectDocument | None:
        document = await self.collection.find_one(
            {
                "_id": _object_id(project_id),
                "user_id": _object_id(user_id),
            }
        )
        normalized = _normalize_document_id(document)
        return ProjectDocument.model_validate(normalized) if normalized else None

    async def update_by_id_for_user(
        self,
        project_id: str,
        user_id: str,
        updates: dict[str, Any],
    ) -> ProjectDocument | None:
        payload = _references_to_object_ids(updates)
        payload["updated_at"] = utc_now()

        document = await self.collection.find_one_and_update(
            {
                "_id": _object_id(project_id),
                "user_id": _object_id(user_id),
            },
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize_document_id(document)
        return ProjectDocument.model_validate(normalized) if normalized else None

    async def delete_by_id_for_user(self, project_id: str, user_id: str) -> bool:
        result = await self.collection.delete_one(
            {
                "_id": _object_id(project_id),
                "user_id": _object_id(user_id),
            }
        )
        return result.deleted_count == 1
