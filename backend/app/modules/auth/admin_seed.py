from dataclasses import dataclass

from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

from app.core.config import Settings
from app.core.security import hash_password, utc_now
from app.models.user import UserDocument
from app.modules.users.enums import UserRole, UserStatus


@dataclass(frozen=True)
class AdminSeedResult:
    email: str
    created: bool
    promoted: bool
    password_updated: bool


async def seed_admin_user(
    database: AsyncIOMotorDatabase,
    settings: Settings,
    *,
    email: str,
    password: str | None,
    representative_name: str,
    company_name: str | None = None,
    phone: str | None = None,
    industry: str | None = None,
    reset_password: bool = False,
) -> AdminSeedResult:
    normalized_email = email.strip().lower()
    normalized_name = representative_name.strip()
    if not normalized_email:
        raise ValueError("Admin email is required.")
    if not normalized_name:
        raise ValueError("Admin representative name is required.")

    users = database["users"]
    existing = await users.find_one({"email": normalized_email})
    now = utc_now()

    if existing is None:
        if not password:
            raise ValueError("Admin password is required when creating a new admin user.")

        try:
            user = UserDocument(
                email=normalized_email,
                password_hash=hash_password(
                    password,
                    iterations=settings.password_hash_iterations,
                ),
                company_name=_clean_optional(company_name),
                representative_name=normalized_name,
                phone=_clean_optional(phone),
                industry=_clean_optional(industry),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )
        except ValidationError as exc:
            raise ValueError(str(exc)) from exc

        await users.insert_one(user.model_dump(by_alias=True, exclude={"id"}))
        return AdminSeedResult(
            email=normalized_email,
            created=True,
            promoted=False,
            password_updated=True,
        )

    existing_role = existing.get("role")
    updates = {
        "role": UserRole.ADMIN.value,
        "status": UserStatus.ACTIVE.value,
        "representative_name": normalized_name,
        "updated_at": now,
    }
    _set_optional_update(updates, "company_name", company_name)
    _set_optional_update(updates, "phone", phone)
    _set_optional_update(updates, "industry", industry)

    password_updated = False
    if reset_password:
        if not password:
            raise ValueError("Admin password is required when ADMIN_SEED_RESET_PASSWORD is enabled.")
        updates["password_hash"] = hash_password(
            password,
            iterations=settings.password_hash_iterations,
        )
        password_updated = True

    await users.update_one({"_id": existing["_id"]}, {"$set": updates})
    return AdminSeedResult(
        email=normalized_email,
        created=False,
        promoted=existing_role != UserRole.ADMIN.value,
        password_updated=password_updated,
    )


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _set_optional_update(updates: dict[str, object], key: str, value: str | None) -> None:
    cleaned = _clean_optional(value)
    if cleaned is not None:
        updates[key] = cleaned
