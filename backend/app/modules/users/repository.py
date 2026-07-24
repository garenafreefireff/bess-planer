from motor.motor_asyncio import AsyncIOMotorDatabase


class UserRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["users"]
