from motor.motor_asyncio import AsyncIOMotorDatabase


class DatasetRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["datasets"]
