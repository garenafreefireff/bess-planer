from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        settings = get_settings()
        request_id = request.headers.get(settings.request_id_header, str(uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers[settings.request_id_header] = request_id
        return response
