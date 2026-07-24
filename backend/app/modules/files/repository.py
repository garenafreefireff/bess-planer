from motor.motor_asyncio import AsyncIOMotorDatabase


class FileRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["files"]
