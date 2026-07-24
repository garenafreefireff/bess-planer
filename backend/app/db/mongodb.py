from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


def create_mongodb_client(
    uri: str,
    *,
    server_selection_timeout_ms: int = 3000,
) -> AsyncIOMotorClient:
    return AsyncIOMotorClient(
        uri,
        uuidRepresentation="standard",
        serverSelectionTimeoutMS=server_selection_timeout_ms,
    )


def get_database(client: AsyncIOMotorClient, database_name: str) -> AsyncIOMotorDatabase:
    return client[database_name]


async def ping_database(database: AsyncIOMotorDatabase) -> bool:
    await database.command("ping")
    return True
