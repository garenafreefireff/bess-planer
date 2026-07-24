from typing import Annotated

from fastapi import Depends, Query, Request
from pydantic import BaseModel

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE


class RequestContext(BaseModel):
    request_id: str | None = None


class PaginationParams(BaseModel):
    page: int
    page_size: int

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size


def get_request_context(request: Request) -> RequestContext:
    return RequestContext(request_id=getattr(request.state, "request_id", None))


def get_pagination_params(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


RequestContextDep = Annotated[RequestContext, Depends(get_request_context)]
PaginationDep = Annotated[PaginationParams, Depends(get_pagination_params)]
