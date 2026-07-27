import re
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.core.security import utc_now
from app.models.organization import OrganizationDocument
from app.models.user import UserDocument
from app.modules.users.enums import UserRole, UserStatus


def _normalize_organization(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    normalized = dict(document)
    normalized["_id"] = str(normalized["_id"])
    normalized["owner_user_id"] = str(normalized.get("owner_user_id", ""))
    normalized["member_user_ids"] = [str(value) for value in normalized.get("member_user_ids", [])]
    return normalized


def _normalize(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None
    normalized = dict(document)
    normalized["_id"] = str(normalized["_id"])
    if "representative_name" not in normalized and "full_name" in normalized:
        normalized["representative_name"] = normalized["full_name"]
    if "role" not in normalized:
        roles = normalized.get("roles")
        normalized["role"] = roles[0] if isinstance(roles, list) and roles else UserRole.CUSTOMER.value
    if "status" not in normalized:
        normalized["status"] = UserStatus.ACTIVE.value if normalized.get("is_active", True) else UserStatus.SUSPENDED.value
    normalized.setdefault("preferences", {})
    return normalized


class UserRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["users"]
        self.organizations_collection = database["organizations"]

    async def create_organization(
        self,
        organization: OrganizationDocument,
    ) -> OrganizationDocument:
        payload = organization.model_dump(by_alias=True, exclude={"id"})
        result = await self.organizations_collection.insert_one(payload)
        created = await self.organizations_collection.find_one({"_id": result.inserted_id})
        return OrganizationDocument.model_validate(_normalize_organization(created))

    async def get_organization_by_id(
        self,
        organization_id: str,
    ) -> OrganizationDocument | None:
        if not ObjectId.is_valid(organization_id):
            return None
        document = await self.organizations_collection.find_one({"_id": ObjectId(organization_id)})
        normalized = _normalize_organization(document)
        return OrganizationDocument.model_validate(normalized) if normalized else None

    async def get_organization_for_user(
        self,
        user_id: str,
        organization_id: str | None,
    ) -> OrganizationDocument | None:
        query: dict[str, Any]
        if organization_id and ObjectId.is_valid(organization_id):
            query = {
                "_id": ObjectId(organization_id),
                "$or": [
                    {"owner_user_id": user_id},
                    {"member_user_ids": user_id},
                ],
            }
        else:
            query = {
                "$or": [
                    {"owner_user_id": user_id},
                    {"member_user_ids": user_id},
                ]
            }
        document = await self.organizations_collection.find_one(query)
        normalized = _normalize_organization(document)
        return OrganizationDocument.model_validate(normalized) if normalized else None

    async def update_organization_for_owner(
        self,
        organization_id: str,
        owner_user_id: str,
        updates: dict[str, Any],
    ) -> OrganizationDocument | None:
        if not ObjectId.is_valid(organization_id):
            return None
        document = await self.organizations_collection.find_one_and_update(
            {"_id": ObjectId(organization_id), "owner_user_id": owner_user_id},
            {"$set": {**updates, "updated_at": utc_now()}},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize_organization(document)
        return OrganizationDocument.model_validate(normalized) if normalized else None

    async def link_user_to_organization(
        self,
        user_id: str,
        organization_id: str,
    ) -> UserDocument | None:
        if not ObjectId.is_valid(user_id):
            return None
        document = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": {"organization_id": organization_id, "updated_at": utc_now()}},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize(document)
        return UserDocument.model_validate(normalized) if normalized else None

    async def count_organizations_admin(self, search: str | None = None) -> int:
        return await self.organizations_collection.count_documents(self._organization_filter(search))

    async def list_organizations_admin(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None = None,
    ) -> list[OrganizationDocument]:
        cursor = (
            self.organizations_collection.find(self._organization_filter(search))
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [
            OrganizationDocument.model_validate(_normalize_organization(document))
            for document in documents
        ]

    @staticmethod
    def _organization_filter(search: str | None) -> dict[str, Any]:
        if not search:
            return {}
        escaped = {"$regex": re.escape(search.strip()), "$options": "i"}
        return {
            "$or": [
                {"name": escaped},
                {"industry": escaped},
                {"phone": escaped},
                {"address": escaped},
            ]
        }

    async def count_admin(
        self,
        *,
        status: UserStatus | None = None,
        role: UserRole | None = None,
        search: str | None = None,
    ) -> int:
        return await self.collection.count_documents(self._admin_filter(status, role, search))

    async def list_admin(
        self,
        *,
        skip: int,
        limit: int,
        status: UserStatus | None = None,
        role: UserRole | None = None,
        search: str | None = None,
    ) -> list[UserDocument]:
        cursor = (
            self.collection.find(self._admin_filter(status, role, search))
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [UserDocument.model_validate(_normalize(document)) for document in documents]

    async def get_by_id(self, user_id: str) -> UserDocument | None:
        if not ObjectId.is_valid(user_id):
            return None
        document = await self.collection.find_one({"_id": ObjectId(user_id)})
        normalized = _normalize(document)
        return UserDocument.model_validate(normalized) if normalized else None

    async def update_admin(self, user_id: str, updates: dict[str, Any]) -> UserDocument | None:
        if not ObjectId.is_valid(user_id):
            return None
        document = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": {**updates, "updated_at": utc_now()}},
            return_document=ReturnDocument.AFTER,
        )
        normalized = _normalize(document)
        return UserDocument.model_validate(normalized) if normalized else None

    @staticmethod
    def _admin_filter(
        status: UserStatus | None,
        role: UserRole | None,
        search: str | None,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if status is not None:
            query["status"] = status.value
        if role is not None:
            query["role"] = role.value
        if search:
            escaped = {"$regex": re.escape(search.strip()), "$options": "i"}
            query["$or"] = [
                {"email": escaped},
                {"representative_name": escaped},
                {"company_name": escaped},
                {"phone": escaped},
            ]
        return query
