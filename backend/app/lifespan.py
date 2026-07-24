import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pymongo.errors import PyMongoError

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.indexes import ensure_indexes
from app.db.mongodb import create_mongodb_client, ping_database

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = getattr(app.state, "settings", get_settings())
    configure_logging(settings.log_level)

    mongodb_client = create_mongodb_client(settings.mongodb_uri)
    app.state.mongodb_client = mongodb_client
    app.state.mongodb = mongodb_client[settings.mongodb_database]
    app.state.mongodb_available = False

    try:
        await ping_database(app.state.mongodb)
        await ensure_indexes(app.state.mongodb)
        app.state.mongodb_available = True
        logger.info("MongoDB connection ready.")
    except PyMongoError as exc:
        logger.warning(
            "MongoDB is unavailable; DB-backed endpoints will fail until it is started. "
            "Quick Sizing without login can still run. uri=%s error=%s",
            settings.mongodb_uri,
            exc,
        )

    try:
        yield
    finally:
        mongodb_client.close()
