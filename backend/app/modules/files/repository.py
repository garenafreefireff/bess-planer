from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.security import utc_now
from app.models.file import FileDocument

REFERENCE_FIELDS = {"user_id", "project_id"}


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
    return normalized


def _to_mongo(file_document: FileDocument) -> dict[str, Any]:
    payload = file_document.model_dump(by_alias=True, exclude={"id"})
    for field in REFERENCE_FIELDS:
        payload[field] = _object_id(payload[field])
    return payload


class FileRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["files"]

    async def create_file(self, file_document: FileDocument) -> FileDocument:
        result = await self.collection.insert_one(_to_mongo(file_document))
        created = await self.collection.find_one({"_id": result.inserted_id})
        return FileDocument.model_validate(_normalize_document_id(created))

    async def count_by_user(self, user_id: str) -> int:
        return await self.collection.count_documents({"user_id": _object_id(user_id)})

    async def list_by_user(self, user_id: str, *, skip: int, limit: int) -> list[FileDocument]:
        cursor = (
            self.collection.find({"user_id": _object_id(user_id)})
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [FileDocument.model_validate(_normalize_document_id(item)) for item in documents]

    async def list_by_project_for_user(
        self,
        project_id: str,
        user_id: str,
    ) -> list[FileDocument]:
        documents = await self.collection.find(
            {"project_id": _object_id(project_id), "user_id": _object_id(user_id)}
        ).to_list(length=None)
        return [FileDocument.model_validate(_normalize_document_id(item)) for item in documents]

    async def delete_by_project_for_user(self, project_id: str, user_id: str) -> None:
        await self.collection.delete_many(
            {"project_id": _object_id(project_id), "user_id": _object_id(user_id)}
        )

    async def get_by_id_for_user(self, file_id: str, user_id: str) -> FileDocument | None:
        document = await self.collection.find_one(
            {"_id": _object_id(file_id), "user_id": _object_id(user_id)}
        )
        normalized = _normalize_document_id(document)
        return FileDocument.model_validate(normalized) if normalized else None

    async def update_by_id_for_user(
        self,
        file_id: str,
        user_id: str,
        updates: dict[str, Any],
    ) -> FileDocument | None:
        payload = dict(updates)
        payload["updated_at"] = utc_now()
        document = await self.collection.find_one_and_update(
            {"_id": _object_id(file_id), "user_id": _object_id(user_id)},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize_document_id(document)
        return FileDocument.model_validate(normalized) if normalized else None

    async def delete_by_id_for_user(self, file_id: str, user_id: str) -> FileDocument | None:
        document = await self.collection.find_one_and_delete(
            {"_id": _object_id(file_id), "user_id": _object_id(user_id)}
        )
        normalized = _normalize_document_id(document)
        return FileDocument.model_validate(normalized) if normalized else None
