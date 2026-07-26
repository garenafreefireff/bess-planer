import re
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.security import utc_now
from app.models.lead import LeadDocument, LeadInteraction
from app.modules.leads.enums import LeadSource, LeadStatus


def _normalize(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    normalized = dict(document)
    normalized["_id"] = str(normalized["_id"])
    if normalized.get("user_id") is not None:
        normalized["user_id"] = str(normalized["user_id"])
    return normalized


class LeadRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["leads"]

    async def upsert_by_email(
        self,
        *,
        email: str,
        source: LeadSource,
        contact_updates: dict[str, Any],
        interaction: LeadInteraction,
        quick_sizing_input: dict[str, Any] | None = None,
        quick_sizing_result: dict[str, Any] | None = None,
        result_code: str | None = None,
    ) -> LeadDocument:
        now = utc_now()
        set_values = {
            **{key: value for key, value in contact_updates.items() if value is not None},
            "updated_at": now,
        }
        if quick_sizing_input is not None:
            set_values["latest_quick_sizing_input"] = quick_sizing_input
        if quick_sizing_result is not None:
            set_values["latest_quick_sizing_result"] = quick_sizing_result
        if result_code is not None:
            set_values["result_code"] = result_code

        document = await self.collection.find_one_and_update(
            {"email": email},
            {
                "$set": set_values,
                "$setOnInsert": {
                    "email": email,
                    "status": LeadStatus.NEW.value,
                    "tags": [],
                    "assigned_to": None,
                    "admin_note": None,
                    "converted_at": None,
                    "created_at": now,
                },
                "$addToSet": {"sources": source.value},
                "$push": {
                    "interactions": {
                        "$each": [interaction.model_dump(mode="python")],
                        "$slice": -100,
                    }
                },
                "$inc": {"touch_count": 1},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return LeadDocument.model_validate(_normalize(document))

    async def count(
        self,
        *,
        status: LeadStatus | None = None,
        source: LeadSource | None = None,
        search: str | None = None,
    ) -> int:
        return await self.collection.count_documents(self._filter(status, source, search))

    async def list(
        self,
        *,
        skip: int,
        limit: int,
        status: LeadStatus | None = None,
        source: LeadSource | None = None,
        search: str | None = None,
    ) -> list[LeadDocument]:
        cursor = (
            self.collection.find(self._filter(status, source, search))
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [LeadDocument.model_validate(_normalize(document)) for document in documents]

    async def update(self, lead_id: str, updates: dict[str, Any]) -> LeadDocument | None:
        payload = {**updates, "updated_at": utc_now()}
        status_value = payload.get("status")
        if status_value == LeadStatus.CONVERTED.value:
            payload["converted_at"] = utc_now()
        elif status_value is not None:
            payload["converted_at"] = None
        document = await self.collection.find_one_and_update(
            {"_id": ObjectId(lead_id)},
            {"$set": payload},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize(document)
        return LeadDocument.model_validate(normalized) if normalized else None

    @staticmethod
    def _filter(
        status: LeadStatus | None,
        source: LeadSource | None,
        search: str | None,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if status is not None:
            query["status"] = status.value
        if source is not None:
            query["sources"] = source.value
        if search:
            escaped = {"$regex": re.escape(search.strip()), "$options": "i"}
            query["$or"] = [
                {"email": escaped},
                {"full_name": escaped},
                {"company_name": escaped},
                {"phone": escaped},
            ]
        return query
