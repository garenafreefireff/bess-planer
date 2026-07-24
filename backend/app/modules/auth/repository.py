from datetime import datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError
from app.core.security import utc_now
from app.models.auth_session import AuthSessionDocument
from app.models.user import UserDocument
from app.modules.users.enums import UserRole, UserStatus


def _normalize_document_id(document: dict[str, Any] | None) -> dict[str, Any] | None:
    if document is None:
        return None

    normalized = dict(document)
    if "_id" in normalized:
        normalized["_id"] = str(normalized["_id"])
    return normalized


def _normalize_user_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    normalized = _normalize_document_id(document)
    if normalized is None:
        return None

    if "representative_name" not in normalized and "full_name" in normalized:
        normalized["representative_name"] = normalized["full_name"]
    if "role" not in normalized:
        roles = normalized.get("roles")
        normalized["role"] = roles[0] if isinstance(roles, list) and roles else UserRole.CUSTOMER
    if "status" not in normalized:
        normalized["status"] = (
            UserStatus.ACTIVE if normalized.get("is_active", True) else UserStatus.SUSPENDED
        )
    if "preferences" not in normalized:
        normalized["preferences"] = {}

    return normalized


def _object_id(value: str) -> ObjectId | None:
    if not ObjectId.is_valid(value):
        return None
    return ObjectId(value)


class AuthRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.users_collection = database["users"]
        self.sessions_collection = database["auth_sessions"]

    async def create_user(self, user: UserDocument) -> UserDocument:
        payload = user.model_dump(by_alias=True, exclude={"id"})

        try:
            result = await self.users_collection.insert_one(payload)
        except DuplicateKeyError as exc:
            raise ConflictError("Email is already registered.") from exc

        created = await self.users_collection.find_one({"_id": result.inserted_id})
        return UserDocument.model_validate(_normalize_user_document(created))

    async def get_user_by_email(self, email: str) -> UserDocument | None:
        document = await self.users_collection.find_one({"email": email})
        normalized = _normalize_user_document(document)
        return UserDocument.model_validate(normalized) if normalized else None

    async def get_user_by_id(self, user_id: str) -> UserDocument | None:
        object_id = _object_id(user_id)
        if object_id is None:
            return None

        document = await self.users_collection.find_one({"_id": object_id})
        normalized = _normalize_user_document(document)
        return UserDocument.model_validate(normalized) if normalized else None

    async def create_session(self, session: AuthSessionDocument) -> AuthSessionDocument:
        payload = session.model_dump(by_alias=True, exclude={"id"})
        result = await self.sessions_collection.insert_one(payload)
        created = await self.sessions_collection.find_one({"_id": result.inserted_id})
        return AuthSessionDocument.model_validate(_normalize_document_id(created))

    async def get_session_by_refresh_token_hash(
        self,
        refresh_token_hash: str,
    ) -> AuthSessionDocument | None:
        document = await self.sessions_collection.find_one(
            {
                "refresh_token_hash": refresh_token_hash,
                "revoked_at": None,
                "expires_at": {"$gt": utc_now()},
            }
        )
        normalized = _normalize_document_id(document)
        return AuthSessionDocument.model_validate(normalized) if normalized else None

    async def revoke_session(self, session_id: str, revoked_at: datetime) -> None:
        object_id = _object_id(session_id)
        if object_id is None:
            return

        await self.sessions_collection.update_one(
            {"_id": object_id, "revoked_at": None},
            {"$set": {"revoked_at": revoked_at, "updated_at": utc_now()}},
        )
