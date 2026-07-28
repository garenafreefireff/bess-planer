from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from app.core.config import Settings


@dataclass(frozen=True)
class RateLimitPolicy:
    name: str
    method: str
    path: str
    requests: int
    window_seconds: int = 60


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Small in-process limiter for public and compute-heavy endpoints.

    This protects a single API process. Deployments with multiple workers or replicas
    should replace the in-memory bucket with a shared Redis-backed limiter.
    """

    def __init__(self, app, *, settings: Settings) -> None:  # type: ignore[no-untyped-def]
        super().__init__(app)
        self.settings = settings
        self._events: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        prefix = settings.api_v1_prefix.rstrip("/")
        self._policies = (
            RateLimitPolicy("auth_login", "POST", f"{prefix}/auth/login", settings.rate_limit_login_per_minute),
            RateLimitPolicy("auth_register", "POST", f"{prefix}/auth/register", settings.rate_limit_register_per_minute),
            RateLimitPolicy("quick_sizing", "POST", f"{prefix}/analyses/quick-sizing", settings.rate_limit_quick_sizing_per_minute),
            RateLimitPolicy("lead_capture", "POST", f"{prefix}/leads", settings.rate_limit_lead_capture_per_minute),
            RateLimitPolicy("quick_sizing_lead", "POST", f"{prefix}/leads/quick-sizing", settings.rate_limit_lead_capture_per_minute),
            RateLimitPolicy("sizing_lab_persistent", "POST", f"{prefix}/analyses/sizing-lab", settings.rate_limit_sizing_lab_per_minute),
            RateLimitPolicy("sizing_lab", "POST", f"{prefix}/analyses/sizing-lab/transient", settings.rate_limit_sizing_lab_per_minute),
        )

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not self.settings.rate_limit_enabled:
            return await call_next(request)

        policy = next(
            (
                item
                for item in self._policies
                if item.requests > 0
                and request.method.upper() == item.method
                and request.url.path == item.path
            ),
            None,
        )
        if policy is None:
            return await call_next(request)

        client_key = self._client_key(request)
        now = time.monotonic()
        retry_after = 0
        async with self._lock:
            bucket = self._events[(policy.name, client_key)]
            threshold = now - policy.window_seconds
            while bucket and bucket[0] <= threshold:
                bucket.popleft()
            if len(bucket) >= policy.requests:
                retry_after = max(1, int(policy.window_seconds - (now - bucket[0])))
            else:
                bucket.append(now)

        if retry_after > 0:
            return JSONResponse(
                status_code=429,
                content={
                    "code": "rate_limit_exceeded",
                    "message": "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)

    def _client_key(self, request: Request) -> str:
        if self.settings.rate_limit_trust_proxy_headers:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",", 1)[0].strip()
            real_ip = request.headers.get("x-real-ip")
            if real_ip:
                return real_ip.strip()
        return request.client.host if request.client else "unknown"
