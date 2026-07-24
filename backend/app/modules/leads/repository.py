from motor.motor_asyncio import AsyncIOMotorDatabase


class LeadRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["leads"]
