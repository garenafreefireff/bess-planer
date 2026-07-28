from typing import Annotated

from fastapi import APIRouter, Query

from app.dependencies.authentication import AdminUserDep
from app.modules.admin_search.dependencies import AdminSearchServiceDep
from app.modules.admin_search.schemas import AdminSearchResponse

router = APIRouter()


@router.get("", response_model=AdminSearchResponse)
async def search_admin_data(
    admin_user: AdminUserDep,
    admin_search_service: AdminSearchServiceDep,
    q: Annotated[str, Query(min_length=2, max_length=160)],
    limit_per_group: Annotated[int, Query(ge=1, le=10)] = 5,
) -> AdminSearchResponse:
    del admin_user
    return await admin_search_service.search(query=q, limit_per_group=limit_per_group)
