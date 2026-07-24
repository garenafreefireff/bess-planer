from datetime import datetime
from typing import ClassVar

from app.models.base import BaseDocument


class AuthSessionDocument(BaseDocument):
    collection_name: ClassVar[str] = "auth_sessions"
    user_id: str
    refresh_token_hash: str
    expires_at: datetime
    revoked_at: datetime | None = None
    user_agent: str | None = None
    ip_address: str | None = None
