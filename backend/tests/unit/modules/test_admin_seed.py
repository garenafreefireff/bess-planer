from types import SimpleNamespace
from typing import Any, cast

import pytest

from app.core.config import Settings
from app.core.security import hash_password, verify_password
from app.modules.auth.admin_seed import seed_admin_user


class FakeInsertResult:
    inserted_id = "64b000000000000000000010"


class FakeUsersCollection:
    def __init__(self, document: dict[str, Any] | None = None) -> None:
        self.document = document
        self.inserted: dict[str, Any] | None = None
        self.updated: dict[str, Any] | None = None

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        if self.document and self.document.get("email") == query.get("email"):
            return self.document
        return None

    async def insert_one(self, payload: dict[str, Any]) -> FakeInsertResult:
        self.inserted = payload
        self.document = {"_id": FakeInsertResult.inserted_id, **payload}
        return FakeInsertResult()

    async def update_one(self, query: dict[str, Any], update: dict[str, Any]) -> None:
        self.updated = update
        self.document = {**(self.document or query), **update["$set"]}


class FakeDatabase:
    def __init__(self, users: FakeUsersCollection) -> None:
        self.users = users

    def __getitem__(self, name: str) -> FakeUsersCollection:
        assert name == "users"
        return self.users


def fake_settings() -> Settings:
    return cast(Settings, SimpleNamespace(password_hash_iterations=1_000))


@pytest.mark.asyncio
async def test_seed_admin_creates_admin_user() -> None:
    users = FakeUsersCollection()

    result = await seed_admin_user(
        FakeDatabase(users),  # type: ignore[arg-type]
        fake_settings(),
        email=" Admin@Example.com ",
        password="StrongPassword123!",
        representative_name=" EnergyInsight Admin ",
        phone="0916848638",
    )

    assert result.created is True
    assert result.email == "admin@example.com"
    assert users.inserted is not None
    assert users.inserted["email"] == "admin@example.com"
    assert users.inserted["role"] == "admin"
    assert users.inserted["status"] == "active"
    assert users.inserted["phone"] == "0916848638"
    assert verify_password("StrongPassword123!", users.inserted["password_hash"])


@pytest.mark.asyncio
async def test_seed_admin_promotes_existing_customer_without_resetting_password() -> None:
    original_hash = hash_password("OldPassword123!", iterations=1_000)
    users = FakeUsersCollection(
        {
            "_id": "64b000000000000000000011",
            "email": "customer@example.com",
            "password_hash": original_hash,
            "representative_name": "Customer",
            "role": "customer",
            "status": "active",
        }
    )

    result = await seed_admin_user(
        FakeDatabase(users),  # type: ignore[arg-type]
        fake_settings(),
        email="customer@example.com",
        password="NewPassword123!",
        representative_name="Promoted Admin",
    )

    assert result.created is False
    assert result.promoted is True
    assert result.password_updated is False
    assert users.updated is not None
    assert users.updated["$set"]["role"] == "admin"
    assert users.updated["$set"]["status"] == "active"
    assert "password_hash" not in users.updated["$set"]


@pytest.mark.asyncio
async def test_seed_admin_resets_existing_password_only_when_requested() -> None:
    original_hash = hash_password("OldPassword123!", iterations=1_000)
    users = FakeUsersCollection(
        {
            "_id": "64b000000000000000000012",
            "email": "admin@example.com",
            "password_hash": original_hash,
            "representative_name": "Admin",
            "role": "admin",
            "status": "active",
        }
    )

    result = await seed_admin_user(
        FakeDatabase(users),  # type: ignore[arg-type]
        fake_settings(),
        email="admin@example.com",
        password="NewPassword123!",
        representative_name="Admin",
        reset_password=True,
    )

    assert result.password_updated is True
    assert users.updated is not None
    assert verify_password("NewPassword123!", users.updated["$set"]["password_hash"])
