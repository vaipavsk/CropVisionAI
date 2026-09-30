"""
In-memory sliding-window rate limiter for FastAPI endpoints.

Provides defense-in-depth abuse protection for resource-intensive AI and upload
endpoints in development and single-instance deployments.
"""

from __future__ import annotations

import time
import threading
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request

from app.config import get_settings


class InMemoryRateLimiter:
    """Thread-safe sliding-window rate limiter."""

    def __init__(self, max_requests: int = 30, window_seconds: int = 60, name: str = "default") -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.name = name
        self._records: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def _get_client_identifier(self, request: Request) -> str:
        """Extract client identifier from IP or Authorization token."""
        # Prefer client host IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "unknown_client"

    def __call__(self, request: Request) -> None:
        """FastAPI dependency callable."""
        settings = get_settings()
        if not getattr(settings, "rate_limit_enabled", True):
            return

        client_id = self._get_client_identifier(request)
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            # Prune timestamps outside current window
            timestamps = [t for t in self._records[client_id] if t > window_start]
            if len(timestamps) >= self.max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - earliest)))
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded for {self.name}. Please retry after {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)
            self._records[client_id] = timestamps

    def reset(self) -> None:
        """Clear all stored rate-limit records (used for test isolation)."""
        with self._lock:
            self._records.clear()


# Pre-configured rate limiting dependencies
upload_rate_limiter = InMemoryRateLimiter(max_requests=30, window_seconds=60, name="Upload API")
predict_rate_limiter = InMemoryRateLimiter(max_requests=30, window_seconds=60, name="Prediction API")
feedback_rate_limiter = InMemoryRateLimiter(max_requests=60, window_seconds=60, name="Feedback API")
