"""
Tests for Prefill Upload & Extraction Routes (Sprint 8 – U7)
"""
import io
import json
import os
import uuid
from dataclasses import dataclass
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.routes.prefill import (
    extract_amounts,
    extract_items,
    extract_merchant_name,
    extract_shipping_cost,
    extract_total_amount,
    process_document,
)


# --- Fake Models ---


class FakeUserModel:
    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}
        self._by_email: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": data["email"],
            "password_hash": data["password_hash"],
            "created_at": datetime.utcnow(),
        }
        self._by_id[user_id] = user
        self._by_email[user["email"]] = user
        return user

    async def find_unique(self, where: dict) -> dict | None:
        if "email" in where:
            return self._by_email.get(where["email"])
        return self._by_id.get(where["id"])


class FakeTenantModel:
    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        tenant_id = str(uuid.uuid4())
        tenant = {
            "id": tenant_id,
            "name": data["name"],
            "created_at": datetime.utcnow(),
            "plan_id": None,
            "plan_activated_at": None,
        }
        self._by_id[tenant_id] = tenant
        return tenant

    async def find_unique(self, where: dict) -> dict | None:
        return self._by_id.get(where["id"])


class FakeMembershipModel:
    def __init__(self) -> None:
        self._memberships: list[dict] = []

    async def create(self, data: dict) -> dict:
        membership = {
            "user_id": data["user_id"],
            "tenant_id": data["tenant_id"],
            "role": data["role"],
        }
        self._memberships.append(membership)
        return membership

    async def find_first(self, where: dict) -> dict | None:
        for membership in self._memberships:
            if membership["user_id"] == where["user_id"]:
                return membership
        return None


class FakeSessionModel:
    def __init__(self) -> None:
        self._by_token_hash: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        session = {
            "id": str(uuid.uuid4()),
            "user_id": data["user_id"],
            "token_hash": data["token_hash"],
            "expires_at": data["expires_at"],
            "created_at": datetime.utcnow(),
        }
        self._by_token_hash[session["token_hash"]] = session
        return session

    async def find_unique(self, where: dict) -> dict | None:
        return self._by_token_hash.get(where["token_hash"])

    async def delete(self, where: dict) -> None:
        token_hash = where.get("token_hash")
        if token_hash in self._by_token_hash:
            del self._by_token_hash[token_hash]


@dataclass
class FakePrisma:
    user: FakeUserModel
    tenant: FakeTenantModel
    membership: FakeMembershipModel
    session: FakeSessionModel


@pytest.fixture
def fake_prisma(monkeypatch) -> FakePrisma:
    fake = FakePrisma(
        user=FakeUserModel(),
        tenant=FakeTenantModel(),
        membership=FakeMembershipModel(),
        session=FakeSessionModel(),
    )
    monkeypatch.setattr("app.routes.auth.prisma", fake)
    monkeypatch.setattr("app.routes.prefill.prisma", fake, raising=False)
    monkeypatch.setattr("app.middleware.session.prisma", fake)
    return fake


@pytest.fixture
def client(fake_prisma: FakePrisma) -> TestClient:
    os.environ.setdefault("SESSION_SECRET", "test-secret-key-for-testing-only")
    app = create_app()
    return TestClient(app)


@pytest.fixture
def auth_client(client: TestClient) -> TestClient:
    """Client with authenticated session."""
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "TestPass123!"},
        headers={"X-Contract-Version": "1"},
    )
    return client


# --- Unit Tests for Extraction Functions ---


class TestExtractAmounts:
    def test_extract_euro_symbol_before(self):
        text = "Total: €150.00"
        amounts = extract_amounts(text)
        assert len(amounts) >= 1
        assert any(a[0] == 150.0 and a[1] == "EUR" for a in amounts)

    def test_extract_euro_symbol_after(self):
        text = "Summe: 99,99 €"
        amounts = extract_amounts(text)
        assert len(amounts) >= 1
        assert any(a[0] == 99.99 and a[1] == "EUR" for a in amounts)

    def test_extract_usd(self):
        text = "Total: $49.99 USD"
        amounts = extract_amounts(text)
        assert len(amounts) >= 1
        assert any(a[0] == 49.99 and a[1] == "USD" for a in amounts)

    def test_extract_multiple_amounts(self):
        text = "Item 1: €25.00, Item 2: €30.00, Total: €55.00"
        amounts = extract_amounts(text)
        assert len(amounts) >= 3

    def test_extract_comma_decimal(self):
        text = "Betrag: 1.234,56 EUR"
        amounts = extract_amounts(text)
        # Should handle German format (comma as decimal)
        assert len(amounts) >= 1


class TestExtractShippingCost:
    def test_find_shipping_with_keyword(self):
        text = "Artikel: €50.00\nVersandkosten: €5.99\nGesamt: €55.99"
        amounts = extract_amounts(text)
        shipping = extract_shipping_cost(text, amounts)
        assert shipping is not None
        assert shipping[0] == 5.99
        assert shipping[1] == "EUR"

    def test_find_shipping_english(self):
        text = "Subtotal: $100.00\nShipping: $9.99\nTotal: $109.99"
        amounts = extract_amounts(text)
        shipping = extract_shipping_cost(text, amounts)
        assert shipping is not None
        assert shipping[0] == 9.99

    def test_no_shipping_keyword(self):
        text = "Item: €50.00\nTotal: €50.00"
        amounts = extract_amounts(text)
        shipping = extract_shipping_cost(text, amounts)
        assert shipping is None


class TestExtractTotalAmount:
    def test_find_total_with_keyword(self):
        text = "Artikel: €25.00\nVersand: €5.00\nGesamt: €30.00"
        amounts = extract_amounts(text)
        total = extract_total_amount(text, amounts)
        assert total is not None
        assert total[0] == 30.0

    def test_find_total_english(self):
        text = "Items: $50.00\nTotal: $55.00"
        amounts = extract_amounts(text)
        total = extract_total_amount(text, amounts)
        assert total is not None
        assert total[0] == 55.0

    def test_fallback_to_largest_amount(self):
        text = "€10.00 €20.00 €100.00"
        amounts = extract_amounts(text)
        total = extract_total_amount(text, amounts)
        assert total is not None
        assert total[0] == 100.0
        # Lower confidence without keyword
        assert total[2] < 0.7


class TestExtractMerchantName:
    def test_extract_from_pattern(self):
        text = "Rechnung von: Amazon Deutschland GmbH\nArtikel: ..."
        result = extract_merchant_name(text)
        assert result is not None
        assert "Amazon" in result[0]

    def test_extract_seller_keyword(self):
        text = "Verkäufer: Tech Shop Berlin"
        result = extract_merchant_name(text)
        assert result is not None
        assert "Tech Shop" in result[0]


class TestExtractItems:
    def test_extract_line_items(self):
        text = """
        iPhone 15 Pro                €1199.00
        USB-C Kabel                    €19.99
        Schutzhülle                    €29.99
        """
        items = extract_items(text)
        assert len(items) >= 2

    def test_extract_with_quantity(self):
        text = """
        2x Smartphone Case             $29.99
        1x Screen Protector            $9.99
        """
        items = extract_items(text)
        assert len(items) >= 2


class TestProcessDocument:
    def test_process_empty_pdf(self):
        # Empty content simulates unreadable PDF
        result = process_document(b"", "pdf")
        assert len(result.suggestions) == 0
        assert len(result.warnings) > 0

    def test_process_image_unsupported(self):
        result = process_document(b"fake image data", "jpg")
        assert result.extraction_method == "image_unsupported"
        assert len(result.warnings) > 0
        assert "eingeschränkt" in result.warnings[0].lower()

    def test_process_png_unsupported(self):
        result = process_document(b"fake png data", "png")
        assert result.extraction_method == "image_unsupported"


# --- Integration Tests ---


class TestPrefillEndpoints:
    def test_upload_requires_auth(self, client: TestClient):
        response = client.post(
            "/prefill/upload",
            files={"file": ("test.pdf", b"test content", "application/pdf")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 401

    def test_upload_invalid_file_type(self, auth_client: TestClient):
        response = auth_client.post(
            "/prefill/upload",
            files={"file": ("test.txt", b"test content", "text/plain")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "INVALID_FILE_TYPE"

    def test_upload_empty_file(self, auth_client: TestClient):
        response = auth_client.post(
            "/prefill/upload",
            files={"file": ("test.pdf", b"", "application/pdf")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "EMPTY_FILE"

    def test_upload_pdf_returns_suggestions(self, auth_client: TestClient):
        # Create a simple PDF-like content (not a real PDF, but tests the flow)
        # In real tests, you'd use a real PDF fixture
        response = auth_client.post(
            "/prefill/upload",
            files={"file": ("invoice.pdf", b"%PDF-1.4 test", "application/pdf")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "suggestions" in data["data"]
        assert "items" in data["data"]
        assert "extraction_method" in data["data"]
        assert "warnings" in data["data"]

    def test_upload_image_returns_unsupported_warning(self, auth_client: TestClient):
        response = auth_client.post(
            "/prefill/upload",
            files={"file": ("photo.jpg", b"\xFF\xD8\xFF", "image/jpeg")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["extraction_method"] == "image_unsupported"
        assert len(data["data"]["warnings"]) > 0

    def test_get_prefill_info(self, auth_client: TestClient):
        response = auth_client.get(
            "/prefill/info",
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "supported_formats" in data["data"]
        assert "max_file_size_mb" in data["data"]
        assert "features" in data["data"]
        assert "limitations" in data["data"]
        assert "privacy" in data["data"]

    def test_prefill_info_requires_auth(self, client: TestClient):
        response = client.get(
            "/prefill/info",
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 401


class TestFileSize:
    def test_file_too_large(self, auth_client: TestClient):
        # Create content larger than 10 MB
        large_content = b"x" * (11 * 1024 * 1024)
        response = auth_client.post(
            "/prefill/upload",
            files={"file": ("large.pdf", large_content, "application/pdf")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "FILE_TOO_LARGE"


class TestPrivacy:
    def test_no_content_in_response_debug(self, auth_client: TestClient):
        """Ensure raw text preview is limited."""
        response = auth_client.post(
            "/prefill/upload",
            files={"file": ("invoice.pdf", b"%PDF-1.4 test", "application/pdf")},
            headers={"X-Contract-Version": "1"},
        )
        assert response.status_code == 200
        data = response.json()
        # Raw text preview should be None or limited
        if data["data"]["raw_text_preview"] is not None:
            assert len(data["data"]["raw_text_preview"]) <= 500
