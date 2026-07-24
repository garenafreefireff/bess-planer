from motor.motor_asyncio import AsyncIOMotorDatabase


class ReportRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["reports"]
