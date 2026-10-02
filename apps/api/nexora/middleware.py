"""Request middleware: request ID injection, logging, security headers, rate limiting."""

import time
import uuid
from collections import defaultdict
from collections.abc import Awaitable, Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from nexora.config import get_settings

logger = structlog.get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Injects a unique X-Request-ID header into every request and response."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        response.headers["X-Request-ID"] = request_id

        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            request_id=request_id,
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects security-related HTTP response headers on every response."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        settings = get_settings()
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"

        response.headers["Content-Security-Policy"] = "default-src 'self'"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding-window rate limiter for sensitive endpoints."""

    def __init__(self, app, path_prefixes: list[str] | None = None):
        super().__init__(app)
        self._path_prefixes = path_prefixes or ["/api/v1/auth/"]
        self._request_counts: dict[str, list[float]] = defaultdict(list)

    def _is_rate_limited(self, client_ip: str, settings_requests: int, settings_window: int) -> bool:
        now = time.monotonic()
        cutoff = now - settings_window
        timestamps = self._request_counts[client_ip]
        self._request_counts[client_ip] = [t for t in timestamps if t > cutoff]
        if len(self._request_counts[client_ip]) >= settings_requests:
            return True
        self._request_counts[client_ip].append(now)
        return False

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]):
        settings = get_settings()
        if settings.DEBUG or settings.ENVIRONMENT == "test":
            return await call_next(request)

        if not any(request.url.path.startswith(prefix) for prefix in self._path_prefixes):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        if self._is_rate_limited(client_ip, settings.RATE_LIMIT_REQUESTS, settings.RATE_LIMIT_WINDOW):
            response: Response = Response(
                status_code=429,
                headers={"Retry-After": str(settings.RATE_LIMIT_WINDOW)},
                media_type="application/json",
                content='{"detail": "Rate limit exceeded. Please try again later."}',
            )
            return response

        return await call_next(request)

