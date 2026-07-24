from motor.motor_asyncio import AsyncIOMotorDatabase


class AuditLogRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.collection = database["audit_logs"]
