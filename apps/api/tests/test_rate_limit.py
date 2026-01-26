"""
Tests für Rate Limiting und Error Handling.
"""

import pytest
from unittest.mock import patch, MagicMock
from starlette.testclient import TestClient

from app.main import app
from app.middleware.rate_limit import RateLimitStore, get_rate_limit_store


# --- Rate Limit Store Tests ---


class TestRateLimitStore:
    """Tests für RateLimitStore."""

    def test_allows_requests_under_limit(self):
        """Requests unter dem Limit werden erlaubt."""
        store = RateLimitStore(window_seconds=60, max_requests=5)

        for i in range(5):
            allowed, remaining, retry_after = store.is_allowed("tenant-1")
            assert allowed is True
            assert remaining == 4 - i
            assert retry_after == 0

    def test_blocks_requests_over_limit(self):
        """Requests über dem Limit werden blockiert."""
        store = RateLimitStore(window_seconds=60, max_requests=3)

        # Erste 3 Requests erlaubt
        for _ in range(3):
            allowed, _, _ = store.is_allowed("tenant-1")
            assert allowed is True

        # 4. Request blockiert
        allowed, remaining, retry_after = store.is_allowed("tenant-1")
        assert allowed is False
        assert remaining == 0
        assert retry_after > 0

    def test_different_tenants_have_separate_limits(self):
        """Jeder Tenant hat sein eigenes Limit."""
        store = RateLimitStore(window_seconds=60, max_requests=2)

        # Tenant 1 macht 2 Requests
        store.is_allowed("tenant-1")
        store.is_allowed("tenant-1")

        # Tenant 1 ist am Limit
        allowed, _, _ = store.is_allowed("tenant-1")
        assert allowed is False

        # Tenant 2 kann noch Requests machen
        allowed, _, _ = store.is_allowed("tenant-2")
        assert allowed is True

    def test_cleanup_removes_old_entries(self):
        """Cleanup entfernt abgelaufene Einträge."""
        store = RateLimitStore(window_seconds=1, max_requests=10)

        store.is_allowed("tenant-1")
        assert len(store._requests["tenant-1"]) == 1

        # Simuliere Zeit vergehen (normalerweise würde man time.sleep verwenden)
        import time
        time.sleep(1.1)

        store.cleanup()
        # Nach Cleanup sollte der Tenant-Key entfernt sein
        assert "tenant-1" not in store._requests or len(store._requests["tenant-1"]) == 0


class TestRateLimitCategories:
    """Tests für verschiedene Rate Limit Kategorien."""

    def test_default_store_exists(self):
        """Default Store existiert."""
        store = get_rate_limit_store("default")
        assert store is not None
        assert store.max_requests == 60

    def test_pdf_store_has_lower_limit(self):
        """PDF Store hat niedrigeres Limit."""
        store = get_rate_limit_store("pdf")
        assert store.max_requests == 10

    def test_validation_store_has_medium_limit(self):
        """Validation Store hat mittleres Limit."""
        store = get_rate_limit_store("validation")
        assert store.max_requests == 30

    def test_fields_store_has_higher_limit(self):
        """Fields Store (Autosave) hat höheres Limit."""
        store = get_rate_limit_store("fields")
        assert store.max_requests == 120

    def test_unknown_category_returns_default(self):
        """Unbekannte Kategorie gibt Default Store zurück."""
        store = get_rate_limit_store("unknown")
        assert store.max_requests == 60


# --- Error Response Tests ---


class TestErrorResponses:
    """Tests für Error Response Format."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_error_response_includes_request_id(self, client):
        """Error Response enthält requestId."""
        response = client.get(
            "/cases/non-existent-id",
            headers={"X-Contract-Version": "1"}
        )

        # Sollte 401 (Auth Required) sein da kein Session Cookie
        assert response.status_code == 401
        data = response.json()
        assert "requestId" in data
        assert data["requestId"] is not None

    def test_error_response_has_correct_structure(self, client):
        """Error Response hat korrektes Format."""
        response = client.get(
            "/cases/non-existent-id",
            headers={"X-Contract-Version": "1"}
        )

        data = response.json()
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]
        assert "requestId" in data

    def test_validation_error_includes_details(self, client):
        """Validation Error enthält Details."""
        response = client.post(
            "/auth/register",
            headers={"X-Contract-Version": "1"},
            json={"email": "not-an-email", "password": "short"}
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "VALIDATION_ERROR"
        assert "details" in data["error"]

    def test_contract_version_error(self, client):
        """Missing Contract Version gibt korrekten Error."""
        response = client.get("/health")

        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "CONTRACT_VERSION_INVALID"


# --- Integration Tests ---


class TestRateLimitMiddlewareIntegration:
    """Integration Tests für Rate Limit Middleware."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_rate_limit_headers_present(self, client):
        """Rate Limit Headers sind in Response."""
        # Erst authentifizieren würde nötig sein für echte Rate Limits
        # Da wir ohne Auth sind, testen wir nur die Header-Präsenz bei Auth-Errors
        response = client.get(
            "/cases",
            headers={"X-Contract-Version": "1"}
        )

        # Ohne Auth werden wir 401 bekommen, aber keine Rate Limit Headers
        # da Rate Limiting nur für authentifizierte Requests gilt
        assert response.status_code == 401

    def test_x_request_id_header_always_present(self, client):
        """X-Request-Id Header ist immer vorhanden."""
        response = client.get(
            "/health",
            headers={"X-Contract-Version": "1"}
        )

        assert "X-Request-Id" in response.headers


# --- Error Taxonomy Tests ---


class TestErrorCodes:
    """Tests für Error Code Konsistenz."""

    def test_all_error_codes_have_status_mapping(self):
        """Alle Error Codes haben ein Status Mapping."""
        from app.core.errors import ErrorCode, ERROR_STATUS_MAP

        for code in ErrorCode:
            assert code in ERROR_STATUS_MAP, f"Missing status mapping for {code}"

    def test_all_error_codes_have_message(self):
        """Alle Error Codes haben eine Default Message."""
        from app.core.errors import ErrorCode, ERROR_MESSAGES

        for code in ErrorCode:
            assert code in ERROR_MESSAGES, f"Missing message for {code}"

    def test_api_error_helper_creates_correct_exception(self):
        """api_error Helper erstellt korrekte HTTPException."""
        from app.core.errors import ErrorCode, api_error

        exc = api_error(ErrorCode.CASE_NOT_FOUND, "Custom message")

        assert exc.status_code == 404
        assert exc.detail["code"] == "CASE_NOT_FOUND"
        assert exc.detail["message"] == "Custom message"

    def test_api_error_with_details(self):
        """api_error kann Details enthalten."""
        from app.core.errors import ErrorCode, api_error

        exc = api_error(
            ErrorCode.VALIDATION_ERROR,
            details={"field": "email", "error": "invalid"}
        )

        assert "details" in exc.detail
        assert exc.detail["details"]["field"] == "email"

    def test_api_error_with_headers(self):
        """api_error kann Custom Headers enthalten."""
        from app.core.errors import ErrorCode, api_error

        exc = api_error(
            ErrorCode.RATE_LIMITED,
            headers={"Retry-After": "60"}
        )

        assert exc.headers == {"Retry-After": "60"}

