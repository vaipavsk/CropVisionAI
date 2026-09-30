"""
Unit tests for Task 27 security remediations:
- HTTP security headers
- Configurable CORS origin allowlisting
- In-memory rate limiting mechanism
"""

import unittest
from unittest.mock import MagicMock
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient

from app.config import get_settings
from app.dependencies.rate_limiter import InMemoryRateLimiter
from app.main import app


class TestSecurityRemediation(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_security_headers_present(self):
        """Verify standard defense-in-depth security headers are attached to responses."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(response.headers.get("x-frame-options"), "DENY")
        self.assertEqual(response.headers.get("x-xss-protection"), "1; mode=block")
        self.assertEqual(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin")

    def test_cors_allowed_origin(self):
        """Verify allowed origins receive CORS headers."""
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
        response = self.client.options("/health", headers=headers)
        self.assertIn("access-control-allow-origin", response.headers)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5173")

    def test_cors_disallowed_origin(self):
        """Verify unauthorized origins are not reflected in CORS headers."""
        headers = {
            "Origin": "http://malicious-website.com",
            "Access-Control-Request-Method": "GET",
        }
        response = self.client.options("/health", headers=headers)
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_in_memory_rate_limiter_permits_under_limit(self):
        """Verify rate limiter permits requests within max_requests quota."""
        limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60, name="TestLimiter")
        mock_req = MagicMock(spec=Request)
        mock_req.headers = {}
        mock_req.client = MagicMock()
        mock_req.client.host = "192.168.1.100"

        # 3 calls should pass without exception
        for _ in range(3):
            limiter(mock_req)

    def test_in_memory_rate_limiter_exceeded_raises_429(self):
        """Verify rate limiter throws 429 when quota is exceeded."""
        limiter = InMemoryRateLimiter(max_requests=2, window_seconds=60, name="TestLimiter")
        mock_req = MagicMock(spec=Request)
        mock_req.headers = {}
        mock_req.client = MagicMock()
        mock_req.client.host = "192.168.1.101"

        # 2 allowed
        limiter(mock_req)
        limiter(mock_req)

        # 3rd request exceeds limit
        with self.assertRaises(HTTPException) as ctx:
            limiter(mock_req)
        self.assertEqual(ctx.exception.status_code, 429)
        self.assertIn("Rate limit exceeded", ctx.exception.detail)
        self.assertIn("Retry-After", ctx.exception.headers)

    def test_in_memory_rate_limiter_reset(self):
        """Verify rate limiter can be reset."""
        limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60, name="TestLimiter")
        mock_req = MagicMock(spec=Request)
        mock_req.headers = {}
        mock_req.client = MagicMock()
        mock_req.client.host = "192.168.1.102"

        limiter(mock_req)
        with self.assertRaises(HTTPException):
            limiter(mock_req)

        limiter.reset()
        # Should now succeed after reset
        limiter(mock_req)


if __name__ == "__main__":
    unittest.main()
