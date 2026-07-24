from motor.motor_asyncio import AsyncIOMotorDatabase


class SystemSettingRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["system_settings"]
