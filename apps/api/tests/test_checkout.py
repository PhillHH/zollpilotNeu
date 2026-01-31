"""
Tests for Checkout & Payment Routes (Sprint 7 – U6)
"""
import json
import os
import uuid
from dataclasses import dataclass
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


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
        self._by_token_hash.pop(where["token_hash"], None)


class FakeTenantCreditBalanceModel:
    def __init__(self) -> None:
        self._by_tenant_id: dict[str, dict] = {}

    async def find_unique(self, where: dict) -> dict | None:
        return self._by_tenant_id.get(where["tenant_id"])

    async def upsert(self, where: dict, data: dict) -> dict:
        tenant_id = where["tenant_id"]
        existing = self._by_tenant_id.get(tenant_id)
        if existing:
            increment = data["update"]["balance"].get("increment", 0)
            existing["balance"] += increment
            existing["updated_at"] = datetime.utcnow()
            return existing
        else:
            record = {
                "tenant_id": data["create"]["tenant_id"],
                "balance": data["create"]["balance"],
                "updated_at": datetime.utcnow(),
            }
            self._by_tenant_id[tenant_id] = record
            return record


class FakeCreditLedgerEntryModel:
    def __init__(self) -> None:
        self._entries: list[dict] = []

    async def create(self, data: dict) -> dict:
        entry = {
            "id": str(uuid.uuid4()),
            "tenant_id": data["tenant_id"],
            "delta": data["delta"],
            "reason": data["reason"],
            "metadata_json": data.get("metadata_json"),
            "created_by_user_id": data.get("created_by_user_id"),
            "created_at": datetime.utcnow(),
        }
        self._entries.append(entry)
        return entry

    async def find_many(self, where: dict, order: dict | None = None, take: int | None = None) -> list[dict]:
        entries = [e for e in self._entries if e["tenant_id"] == where["tenant_id"]]
        entries = list(reversed(entries))
        if take:
            entries = entries[:take]
        return entries


class FakeUserEventModel:
    def __init__(self) -> None:
        self._events: list[dict] = []

    async def create(self, data: dict) -> dict:
        event = {
            "id": str(uuid.uuid4()),
            "user_id": data["user_id"],
            "type": data["type"],
            "metadata_json": data.get("metadata_json"),
            "created_at": datetime.utcnow(),
        }
        self._events.append(event)
        return event


class FakePurchaseModel:
    def __init__(self) -> None:
        self._purchases: list[dict] = []

    async def create(self, data: dict) -> dict:
        purchase = {
            "id": str(uuid.uuid4()),
            "tenant_id": data["tenant_id"],
            "user_id": data["user_id"],
            "provider": data.get("provider", "STRIPE"),
            "provider_ref": data["provider_ref"],
            "type": data["type"],
            "amount_cents": data["amount_cents"],
            "currency": data.get("currency", "EUR"),
            "credits_amount": data.get("credits_amount"),
            "status": data.get("status", "PENDING"),
            "metadata_json": data.get("metadata_json"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "paid_at": None,
        }
        self._purchases.append(purchase)
        return purchase

    async def find_first(self, where: dict) -> dict | None:
        for purchase in self._purchases:
            if "provider_ref" in where and purchase["provider_ref"] == where["provider_ref"]:
                if "tenant_id" in where and purchase["tenant_id"] != where["tenant_id"]:
                    continue
                return purchase
            if "id" in where and purchase["id"] == where["id"]:
                if "tenant_id" in where and purchase["tenant_id"] != where["tenant_id"]:
                    continue
                return purchase
        return None

    async def find_many(self, where: dict, order: dict | None = None, take: int | None = None) -> list[dict]:
        purchases = [p for p in self._purchases if p["tenant_id"] == where.get("tenant_id")]
        purchases = list(reversed(purchases))
        if take:
            purchases = purchases[:take]
        return purchases

    async def update(self, where: dict, data: dict) -> dict:
        for purchase in self._purchases:
            if purchase["id"] == where["id"]:
                purchase.update(data)
                purchase["updated_at"] = datetime.utcnow()
                return purchase
        raise ValueError("Purchase not found")

    async def update_many(self, where: dict, data: dict) -> dict:
        count = 0
        for purchase in self._purchases:
            if purchase["provider_ref"] == where.get("provider_ref") and purchase["status"] == where.get("status"):
                purchase.update(data)
                purchase["updated_at"] = datetime.utcnow()
                count += 1
        return {"count": count}


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.tenantcreditbalance = FakeTenantCreditBalanceModel()
        self.creditledgerentry = FakeCreditLedgerEntryModel()
        self.userevent = FakeUserEventModel()
        self.purchase = FakePurchaseModel()


@dataclass
class CheckoutTestContext:
    prisma: FakePrisma
    client: TestClient


@pytest.fixture()
def checkout_context(monkeypatch: pytest.MonkeyPatch) -> CheckoutTestContext:
    os.environ["SESSION_SECRET"] = "test-secret"
    os.environ["SESSION_TTL_MINUTES"] = "60"
    os.environ["SESSION_COOKIE_NAME"] = "zollpilot_session"

    async def _noop() -> None:
        return None

    fake_prisma = FakePrisma()
    monkeypatch.setattr("app.db.prisma_client.prisma", fake_prisma)
    monkeypatch.setattr("app.db.prisma_client.connect_prisma", _noop)
    monkeypatch.setattr("app.db.prisma_client.disconnect_prisma", _noop)

    client = TestClient(create_app())
    client.headers["X-Contract-Version"] = "1"

    return CheckoutTestContext(prisma=fake_prisma, client=client)


# --- Products Tests ---


def test_list_products_returns_available_products(checkout_context: CheckoutTestContext) -> None:
    """GET /billing/products returns available products."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "test@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Get products
    response = checkout_context.client.get("/billing/products")
    assert response.status_code == 200
    body = response.json()

    # Check structure
    assert "data" in body
    products = body["data"]
    assert len(products) >= 1

    # Check product structure
    product = products[0]
    assert "id" in product
    assert "name" in product
    assert "description" in product
    assert "price_cents" in product
    assert "credits" in product
    assert "type" in product


# --- Checkout Session Tests ---


def test_create_checkout_session_creates_purchase(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/checkout/session creates a pending purchase."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "buyer@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create checkout session
    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "credits_5"}
    )
    assert response.status_code == 200
    body = response.json()

    # Check response
    assert "data" in body
    assert "checkout_url" in body["data"]
    assert "session_id" in body["data"]
    assert body["data"]["product_id"] == "credits_5"
    assert body["data"]["amount_cents"] == 699  # 5 credits = 6.99 EUR

    # Check purchase was created
    session_id = body["data"]["session_id"]
    assert len(checkout_context.prisma.purchase._purchases) == 1
    purchase = checkout_context.prisma.purchase._purchases[0]
    assert purchase["provider_ref"] == session_id
    assert purchase["status"] == "PENDING"
    assert purchase["type"] == "CREDITS"
    assert purchase["credits_amount"] == 5


def test_create_checkout_session_rejects_invalid_product(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/checkout/session rejects invalid product_id."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "buyer@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Try invalid product
    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "invalid_product"}
    )
    assert response.status_code == 422  # Validation error


# --- Complete Checkout Tests ---


def test_complete_checkout_credits_account(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/checkout/complete credits the account."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "payer@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Get tenant ID
    response = checkout_context.client.get("/billing/me")
    tenant_id = response.json()["data"]["tenant"]["id"]

    # Create checkout session
    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "credits_10"}
    )
    session_id = response.json()["data"]["session_id"]

    # Complete checkout
    response = checkout_context.client.post(
        f"/billing/checkout/complete?session_id={session_id}"
    )
    assert response.status_code == 200
    body = response.json()

    assert body["data"]["status"] == "completed"
    assert body["data"]["credits_added"] == 10

    # Verify balance
    balance = checkout_context.prisma.tenantcreditbalance._by_tenant_id.get(tenant_id)
    assert balance is not None
    assert balance["balance"] == 10

    # Verify ledger entry
    assert len(checkout_context.prisma.creditledgerentry._entries) == 1
    entry = checkout_context.prisma.creditledgerentry._entries[0]
    assert entry["delta"] == 10
    assert entry["reason"] == "PURCHASE"


def test_complete_checkout_idempotent(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/checkout/complete is idempotent."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "idem@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create checkout session
    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "credits_5"}
    )
    session_id = response.json()["data"]["session_id"]

    # Complete checkout first time
    response = checkout_context.client.post(
        f"/billing/checkout/complete?session_id={session_id}"
    )
    assert response.status_code == 200
    assert response.json()["data"]["credits_added"] == 5

    # Complete checkout second time
    response = checkout_context.client.post(
        f"/billing/checkout/complete?session_id={session_id}"
    )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "already_paid"

    # Verify balance wasn't doubled
    assert len(checkout_context.prisma.creditledgerentry._entries) == 1


def test_complete_checkout_fails_for_nonexistent_session(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/checkout/complete fails for non-existent session."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "nocase@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Try to complete non-existent session
    response = checkout_context.client.post(
        "/billing/checkout/complete?session_id=cs_nonexistent_123"
    )
    assert response.status_code == 404


# --- Purchases List Tests ---


def test_list_purchases_returns_user_purchases(checkout_context: CheckoutTestContext) -> None:
    """GET /billing/purchases returns purchases for the tenant."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "lister@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create a checkout session (creates pending purchase)
    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "credits_5"}
    )
    assert response.status_code == 200

    # List purchases
    response = checkout_context.client.get("/billing/purchases")
    assert response.status_code == 200
    body = response.json()

    assert "data" in body
    assert len(body["data"]) == 1
    assert body["data"][0]["status"] == "PENDING"
    assert body["data"][0]["type"] == "CREDITS"


# --- Webhook Tests ---


def test_webhook_processes_checkout_completed(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/webhook processes checkout.session.completed event."""
    # Register user and create checkout
    response = checkout_context.client.post(
        "/auth/register", json={"email": "webhook@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "credits_5"}
    )
    session_id = response.json()["data"]["session_id"]

    # Simulate webhook
    webhook_payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
            }
        }
    }

    response = checkout_context.client.post(
        "/billing/webhook",
        content=json.dumps(webhook_payload),
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200
    body = response.json()

    assert body["received"] is True
    assert body["processed"] is True

    # Verify purchase was marked as paid
    purchase = checkout_context.prisma.purchase._purchases[0]
    assert purchase["status"] == "PAID"
    assert purchase["paid_at"] is not None


def test_webhook_idempotent(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/webhook is idempotent for duplicate events."""
    # Register user and create checkout
    response = checkout_context.client.post(
        "/auth/register", json={"email": "webhook2@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    response = checkout_context.client.post(
        "/billing/checkout/session", json={"product_id": "credits_5"}
    )
    session_id = response.json()["data"]["session_id"]

    # Simulate webhook twice
    webhook_payload = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
            }
        }
    }

    # First webhook
    response = checkout_context.client.post(
        "/billing/webhook",
        content=json.dumps(webhook_payload),
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200
    assert response.json()["processed"] is True

    # Second webhook (duplicate)
    response = checkout_context.client.post(
        "/billing/webhook",
        content=json.dumps(webhook_payload),
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200
    assert response.json()["processed"] is False
    assert "Already processed" in response.json().get("reason", "")

    # Verify only one ledger entry
    assert len(checkout_context.prisma.creditledgerentry._entries) == 1


def test_webhook_handles_unknown_event(checkout_context: CheckoutTestContext) -> None:
    """POST /billing/webhook acknowledges unknown events."""
    # Register user
    response = checkout_context.client.post(
        "/auth/register", json={"email": "unknown@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    webhook_payload = {
        "type": "unknown.event.type",
        "data": {"object": {}}
    }

    response = checkout_context.client.post(
        "/billing/webhook",
        content=json.dumps(webhook_payload),
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200
    body = response.json()

    assert body["received"] is True
    assert body["processed"] is False
