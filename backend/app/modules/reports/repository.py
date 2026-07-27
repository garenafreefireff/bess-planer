from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.notification_outbox import NotificationOutboxDocument
from app.modules.reports.schemas import NotificationOutboxCreate


def _normalize(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    normalized = dict(document)
    normalized["_id"] = str(normalized["_id"])
    return normalized


class ReportRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["reports"]
        self.notification_outbox = database["notification_outbox"]

    async def enqueue_notification(
        self,
        payload: NotificationOutboxCreate,
    ) -> NotificationOutboxDocument:
        document = NotificationOutboxDocument(**payload.model_dump())
        result = await self.notification_outbox.insert_one(
            document.model_dump(by_alias=True, exclude={"id"})
        )
        created = await self.notification_outbox.find_one({"_id": result.inserted_id})
        return NotificationOutboxDocument.model_validate(_normalize(created))

    async def count_notifications(self, status: str | None = None) -> int:
        query = {"status": status} if status else {}
        return await self.notification_outbox.count_documents(query)

    async def list_notifications(
        self,
        *,
        skip: int,
        limit: int,
        status: str | None = None,
    ) -> list[NotificationOutboxDocument]:
        query = {"status": status} if status else {}
        cursor = self.notification_outbox.find(query).sort("created_at", -1).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        return [NotificationOutboxDocument.model_validate(_normalize(document)) for document in documents]
