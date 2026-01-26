"""
Tests for health and readiness endpoints.
"""

import os
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """Create test client with mocked Prisma."""
    monkeypatch.setenv("SESSION_SECRET", "test-secret-at-least-32-chars-long")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
    
    async def noop():
        pass
    
    monkeypatch.setattr("app.db.prisma_client.connect_prisma", noop)
    monkeypatch.setattr("app.db.prisma_client.disconnect_prisma", noop)
    
    app = create_app()
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for /health (liveness probe)."""

    def test_health_returns_ok(self, client: TestClient) -> None:
        """Health endpoint always returns ok (no DB check)."""
        response = client.get("/health", headers={"X-Contract-Version": "1"})
        
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "ok"

    def test_health_no_db_dependency(self, client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
        """Health should succeed even if DB is unavailable."""
        # Mock prisma to raise error
        mock_prisma = MagicMock()
        mock_prisma.execute_raw = AsyncMock(side_effect=Exception("DB unavailable"))
        monkeypatch.setattr("app.routes.health.prisma", mock_prisma)
        
        response = client.get("/health", headers={"X-Contract-Version": "1"})
        
        # Should still succeed (health doesn't check DB)
        assert response.status_code == 200


class TestReadinessEndpoint:
    """Tests for /ready (readiness probe)."""

    def test_ready_returns_ok_when_db_available(self, client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
        """Readiness returns ok when DB is reachable."""
        mock_prisma = MagicMock()
        mock_prisma.execute_raw = AsyncMock(return_value=None)
        monkeypatch.setattr("app.routes.health.prisma", mock_prisma)
        
        response = client.get("/ready", headers={"X-Contract-Version": "1"})
        
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["status"] == "ok"
        assert data["database"] == "ok"
        assert "version" in data

    def test_ready_fails_when_db_unavailable(self, client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
        """Readiness returns 503 when DB is unreachable."""
        mock_prisma = MagicMock()
        mock_prisma.execute_raw = AsyncMock(side_effect=Exception("Connection refused"))
        monkeypatch.setattr("app.routes.health.prisma", mock_prisma)
        
        response = client.get("/ready", headers={"X-Contract-Version": "1"})
        
        assert response.status_code == 503
        data = response.json()["data"]
        assert data["status"] == "degraded"
        assert "error" in data["database"]

    def test_ready_includes_version(self, client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
        """Readiness response includes application version."""
        mock_prisma = MagicMock()
        mock_prisma.execute_raw = AsyncMock(return_value=None)
        monkeypatch.setattr("app.routes.health.prisma", mock_prisma)
        
        response = client.get("/ready", headers={"X-Contract-Version": "1"})
        
        assert response.status_code == 200
        assert response.json()["data"]["version"] == "1.0.0"

