from typing import Annotated

from fastapi import Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase


def get_database(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongodb


DatabaseDep = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
