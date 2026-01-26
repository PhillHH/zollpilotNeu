import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


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

    async def find_many(self, include: dict | None = None, order: dict | None = None) -> list[dict]:
        tenants = list(self._by_id.values())
        # Simulate include
        for t in tenants:
            if include and include.get("plan"):
                t["plan"] = None
            if include and include.get("credit_balance"):
                t["credit_balance"] = None
        return tenants

    async def update(self, where: dict, data: dict, include: dict | None = None) -> dict:
        tenant = self._by_id.get(where["id"])
        if tenant:
            tenant.update(data)
            if include and include.get("credit_balance"):
                tenant["credit_balance"] = None
        return tenant


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


class FakePlanModel:
    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}
        self._by_code: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        plan_id = str(uuid.uuid4())
        plan = {
            "id": plan_id,
            "code": data["code"],
            "name": data["name"],
            "is_active": data.get("is_active", True),
            "price_cents": data.get("price_cents"),
            "currency": data.get("currency", "EUR"),
            "interval": data.get("interval", "NONE"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._by_id[plan_id] = plan
        self._by_code[plan["code"]] = plan
        return plan

    async def find_unique(self, where: dict) -> dict | None:
        if "id" in where:
            return self._by_id.get(where["id"])
        if "code" in where:
            return self._by_code.get(where["code"])
        return None

    async def find_many(self, order: dict | None = None) -> list[dict]:
        return list(self._by_id.values())

    async def update(self, where: dict, data: dict) -> dict:
        plan = self._by_id.get(where["id"])
        if plan:
            plan.update(data)
            plan["updated_at"] = datetime.utcnow()
            self._by_code[plan["code"]] = plan
        return plan


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


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.plan = FakePlanModel()
        self.tenantcreditbalance = FakeTenantCreditBalanceModel()
        self.creditledgerentry = FakeCreditLedgerEntryModel()


@dataclass
class BillingTestContext:
    prisma: FakePrisma
    client: TestClient


@pytest.fixture()
def billing_context(monkeypatch: pytest.MonkeyPatch) -> BillingTestContext:
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

    return BillingTestContext(prisma=fake_prisma, client=client)


def test_billing_me_returns_plan_and_credits(billing_context: BillingTestContext) -> None:
    """GET /billing/me returns plan + credits for authed user."""
    # Register user
    response = billing_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Get billing info
    response = billing_context.client.get("/billing/me")
    assert response.status_code == 200
    body = response.json()
    assert "tenant" in body["data"]
    assert "credits" in body["data"]
    assert body["data"]["credits"]["balance"] == 0


def test_billing_me_reflects_plan_change(billing_context: BillingTestContext) -> None:
    """GET /billing/me reflects plan changes."""
    # Register as owner
    response = billing_context.client.post(
        "/auth/register", json={"email": "admin@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create a plan
    response = billing_context.client.post(
        "/admin/plans", json={"code": "PREMIUM", "name": "Premium Plan"}
    )
    assert response.status_code == 201

    # Get tenant ID
    response = billing_context.client.get("/billing/me")
    tenant_id = response.json()["data"]["tenant"]["id"]

    # Set plan
    response = billing_context.client.post(
        f"/admin/tenants/{tenant_id}/plan", json={"plan_code": "PREMIUM"}
    )
    assert response.status_code == 200

    # Check billing/me
    response = billing_context.client.get("/billing/me")
    assert response.status_code == 200
    assert response.json()["data"]["plan"]["code"] == "PREMIUM"


def test_non_admin_cannot_access_admin_endpoints(billing_context: BillingTestContext) -> None:
    """Non-admin calling /admin/* returns 403."""
    # Register as regular user
    response = billing_context.client.post(
        "/auth/register", json={"email": "user@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Change role to USER
    membership = billing_context.prisma.membership._memberships[0]
    membership["role"] = "USER"

    # Try to access admin endpoints
    response = billing_context.client.get("/admin/plans")
    assert response.status_code == 403


def test_admin_grant_credits_increases_balance(billing_context: BillingTestContext) -> None:
    """Admin grant credits increases balance and creates ledger entry."""
    # Register as owner
    response = billing_context.client.post(
        "/auth/register", json={"email": "admin@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Get tenant ID
    response = billing_context.client.get("/billing/me")
    tenant_id = response.json()["data"]["tenant"]["id"]

    # Grant credits
    response = billing_context.client.post(
        f"/admin/tenants/{tenant_id}/credits/grant",
        json={"amount": 100, "note": "Test grant"}
    )
    assert response.status_code == 200
    assert response.json()["data"]["balance"] == 100

    # Check ledger
    response = billing_context.client.get(f"/admin/tenants/{tenant_id}/credits/ledger")
    assert response.status_code == 200
    ledger = response.json()["data"]
    assert len(ledger) == 1
    assert ledger[0]["delta"] == 100
    assert ledger[0]["reason"] == "ADMIN_GRANT"


def test_admin_set_plan_updates_tenant(billing_context: BillingTestContext) -> None:
    """Admin set plan updates tenant.plan_id."""
    # Register as owner
    response = billing_context.client.post(
        "/auth/register", json={"email": "admin@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan
    response = billing_context.client.post(
        "/admin/plans", json={"code": "BASIC", "name": "Basic"}
    )
    assert response.status_code == 201
    plan_id = response.json()["data"]["id"]

    # Get tenant ID
    response = billing_context.client.get("/billing/me")
    tenant_id = response.json()["data"]["tenant"]["id"]

    # Set plan
    response = billing_context.client.post(
        f"/admin/tenants/{tenant_id}/plan", json={"plan_code": "BASIC"}
    )
    assert response.status_code == 200
    assert response.json()["plan_code"] == "BASIC"

    # Verify tenant has plan_id
    tenant = billing_context.prisma.tenant._by_id[tenant_id]
    assert tenant["plan_id"] == plan_id

