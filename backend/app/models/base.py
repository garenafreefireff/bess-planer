from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.security import utc_now


class BaseDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = ConfigDict(populate_by_name=True)
