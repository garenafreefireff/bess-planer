from typing import ClassVar

from app.models.base import BaseDocument


class SystemSettingDocument(BaseDocument):
    collection_name: ClassVar[str] = "system_settings"
