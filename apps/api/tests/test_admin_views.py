"""
Tests für Admin-Listenansichten (Nutzer und Mandanten).

Testet:
- Admin sieht Nutzerliste mit allen Feldern
- Admin sieht Mandantenliste mit user_count
- Regulärer User erhält 403
"""

import os
import uuid
from datetime import datetime

import pytest
from dataclasses import dataclass
from fastapi.testclient import TestClient

from app.main import create_app


class FakeUserModel:
    """Fake User Model mit user_type, status und last_login_at."""

    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}
        self._by_email: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": data["email"],
            "password_hash": data["password_hash"],
            "user_type": data.get("user_type", "PRIVATE"),
            "status": data.get("status", "ACTIVE"),
            "created_at": datetime.utcnow(),
            "last_login_at": data.get("last_login_at"),
            "memberships": [],
            "events": [],
        }
        self._by_id[user_id] = user
        self._by_email[user["email"]] = user
        return self._wrap(user)

    def _wrap(self, user: dict):
        """Wrap dict to mimic Prisma model with attributes."""
        class UserWrapper:
            def __init__(self, data: dict):
                self.__dict__.update(data)
                self.memberships = data.get("memberships", [])
                self.events = data.get("events", [])

            def model_dump(self):
                return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

        return UserWrapper(user)

    async def find_unique(self, where: dict, include: dict | None = None) -> object | None:
        user = None
        if "email" in where:
            user = self._by_email.get(where["email"])
        else:
            user = self._by_id.get(where.get("id"))

        if user and include:
            return self._wrap(user)
        return self._wrap(user) if user else None

    async def find_many(self, include: dict | None = None, order: dict | None = None) -> list:
        users = list(self._by_id.values())
        return [self._wrap(u) for u in users]


class FakeTenantModel:
    """Fake Tenant Model mit memberships für user_count."""

    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        tenant_id = str(uuid.uuid4())
        tenant = {
            "id": tenant_id,
            "name": data["name"],
            "type": data.get("type", "BUSINESS"),
            "created_at": datetime.utcnow(),
            "plan_id": None,
            "plan_activated_at": None,
            "memberships": [],
        }
        self._by_id[tenant_id] = tenant
        return self._wrap(tenant)

    def _wrap(self, tenant: dict):
        """Wrap dict to mimic Prisma model."""
        class TenantWrapper:
            def __init__(self, data: dict):
                self.__dict__.update(data)
                self.plan = None
                self.credit_balance = None
                self.memberships = data.get("memberships", [])

            def model_dump(self):
                return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

        return TenantWrapper(tenant)

    async def find_unique(self, where: dict, include: dict | None = None) -> object | None:
        tenant = self._by_id.get(where.get("id"))
        return self._wrap(tenant) if tenant else None

    async def find_many(self, include: dict | None = None, order: dict | None = None) -> list:
        tenants = list(self._by_id.values())
        return [self._wrap(t) for t in tenants]

    async def update(self, where: dict, data: dict, include: dict | None = None) -> object:
        tenant = self._by_id.get(where["id"])
        if tenant:
            tenant.update(data)
        return self._wrap(tenant) if tenant else None


class FakeMembershipModel:
    """Fake Membership Model mit Tenant-Include."""

    def __init__(self, tenant_model: FakeTenantModel) -> None:
        self._memberships: list[dict] = []
        self._tenant_model = tenant_model

    async def create(self, data: dict) -> dict:
        membership = {
            "user_id": data["user_id"],
            "tenant_id": data["tenant_id"],
            "role": data["role"],
            "tenant": None,
        }
        self._memberships.append(membership)

        # Update user's memberships reference
        # Update tenant's memberships reference
        tenant = self._tenant_model._by_id.get(data["tenant_id"])
        if tenant:
            if "memberships" not in tenant:
                tenant["memberships"] = []
            tenant["memberships"].append(self._wrap(membership, tenant))

        return membership

    def _wrap(self, membership: dict, tenant: dict | None = None):
        """Wrap membership with tenant."""
        class MembershipWrapper:
            def __init__(self, data: dict, t: dict | None):
                self.__dict__.update(data)
                if t:
                    class TenantWrapper:
                        def __init__(self, td: dict):
                            self.__dict__.update(td)
                    self.tenant = TenantWrapper(t)
                else:
                    self.tenant = None

        return MembershipWrapper(membership, tenant)

    async def find_first(self, where: dict) -> dict | None:
        for membership in self._memberships:
            if membership["user_id"] == where["user_id"]:
                return membership
        return None

    async def find_many(self, where: dict | None = None) -> list[dict]:
        if not where:
            return self._memberships
        return [
            m for m in self._memberships
            if all(m.get(k) == v for k, v in where.items())
        ]


class FakeSessionModel:
    """Fake Session Model."""

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
        return self._by_token_hash.get(where.get("token_hash"))

    async def delete(self, where: dict) -> None:
        self._by_token_hash.pop(where["token_hash"], None)


class FakePlanModel:
    """Fake Plan Model."""

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
            "credits_included": data.get("credits_included", 0),
            "allowed_procedures": data.get("allowed_procedures", []),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._by_id[plan_id] = plan
        self._by_code[plan["code"]] = plan
        return self._wrap(plan)

    def _wrap(self, plan: dict):
        class PlanWrapper:
            def __init__(self, data: dict):
                self.__dict__.update(data)

            def model_dump(self):
                return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

        return PlanWrapper(plan)

    async def find_unique(self, where: dict) -> object | None:
        plan = None
        if "id" in where:
            plan = self._by_id.get(where["id"])
        if "code" in where:
            plan = self._by_code.get(where["code"])
        return self._wrap(plan) if plan else None

    async def find_many(self, order: dict | None = None) -> list:
        return [self._wrap(p) for p in self._by_id.values()]

    async def update(self, where: dict, data: dict) -> object | None:
        plan = self._by_id.get(where.get("id"))
        if plan:
            plan.update(data)
            plan["updated_at"] = datetime.utcnow()
        return self._wrap(plan) if plan else None


class FakeTenantCreditBalanceModel:
    """Fake TenantCreditBalance Model."""

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
            return existing
        else:
            record = {
                "tenant_id": data["create"]["tenant_id"],
                "balance": data["create"]["balance"],
            }
            self._by_tenant_id[tenant_id] = record
            return record


class FakeCreditLedgerEntryModel:
    """Fake CreditLedgerEntry Model."""

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
    """Fake Prisma Client."""

    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel(self.tenant)
        self.session = FakeSessionModel()
        self.plan = FakePlanModel()
        self.tenantcreditbalance = FakeTenantCreditBalanceModel()
        self.creditledgerentry = FakeCreditLedgerEntryModel()


@dataclass
class AdminViewsTestContext:
    client: TestClient
    prisma: FakePrisma


@pytest.fixture()
def admin_views_context(monkeypatch: pytest.MonkeyPatch) -> AdminViewsTestContext:
    """Fixture für Admin-Views Tests."""
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

    return AdminViewsTestContext(client=client, prisma=fake_prisma)


# ============================================
# Tests: Admin Users List
# ============================================

def test_admin_can_list_users(admin_views_context: AdminViewsTestContext) -> None:
    """SYSTEM_ADMIN kann Nutzerliste abrufen."""
    # Register as OWNER (which includes SYSTEM_ADMIN permissions)
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "admin@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Access users list
    response = admin_views_context.client.get("/admin/users")
    assert response.status_code == 200

    body = response.json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1

    # Check user has expected fields
    user = body["data"][0]
    assert "id" in user
    assert "email" in user
    assert "user_type" in user
    assert "status" in user
    assert "tenant_id" in user
    assert "tenant_name" in user
    assert "created_at" in user
    assert "last_login_at" in user


def test_users_list_shows_correct_user_type(admin_views_context: AdminViewsTestContext) -> None:
    """Nutzerliste zeigt korrekten user_type."""
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "private@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    response = admin_views_context.client.get("/admin/users")
    assert response.status_code == 200

    users = response.json()["data"]
    assert len(users) >= 1
    # Default user_type is PRIVATE
    assert users[0]["user_type"] == "PRIVATE"


def test_users_list_shows_active_status(admin_views_context: AdminViewsTestContext) -> None:
    """Nutzerliste zeigt korrekten Status."""
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "active@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    response = admin_views_context.client.get("/admin/users")
    assert response.status_code == 200

    users = response.json()["data"]
    assert len(users) >= 1
    # Default status is ACTIVE
    assert users[0]["status"] == "ACTIVE"


# ============================================
# Tests: Admin Tenants List with user_count
# ============================================

def test_tenants_list_includes_user_count(admin_views_context: AdminViewsTestContext) -> None:
    """Mandantenliste enthält user_count."""
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "tenant@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    response = admin_views_context.client.get("/admin/tenants")
    assert response.status_code == 200

    body = response.json()
    assert "data" in body
    tenants = body["data"]
    assert len(tenants) >= 1

    # Check tenant has user_count field
    tenant = tenants[0]
    assert "user_count" in tenant
    assert isinstance(tenant["user_count"], int)


# ============================================
# Tests: Non-Admin Access Denied
# ============================================

def test_regular_user_cannot_access_admin_users(admin_views_context: AdminViewsTestContext) -> None:
    """Regulärer USER erhält 403 bei /admin/users."""
    # Register
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "user@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Change role to USER
    membership = admin_views_context.prisma.membership._memberships[0]
    membership["role"] = "USER"

    # Try to access admin users
    response = admin_views_context.client.get("/admin/users")
    assert response.status_code == 403


def test_regular_user_cannot_access_admin_tenants(admin_views_context: AdminViewsTestContext) -> None:
    """Regulärer USER erhält 403 bei /admin/tenants."""
    # Register
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "user2@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Change role to USER
    membership = admin_views_context.prisma.membership._memberships[0]
    membership["role"] = "USER"

    # Try to access admin tenants
    response = admin_views_context.client.get("/admin/tenants")
    assert response.status_code == 403


def test_unauthenticated_user_cannot_access_admin(admin_views_context: AdminViewsTestContext) -> None:
    """Nicht-authentifizierter User erhält 401."""
    response = admin_views_context.client.get("/admin/users")
    assert response.status_code == 401

    response = admin_views_context.client.get("/admin/tenants")
    assert response.status_code == 401


# ============================================
# Tests: User Detail
# ============================================

def test_admin_can_get_user_detail(admin_views_context: AdminViewsTestContext) -> None:
    """Admin kann Nutzerdetails abrufen."""
    # Register
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "detail@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    user_id = response.json()["data"]["user"]["id"]

    # Get user detail
    response = admin_views_context.client.get(f"/admin/users/{user_id}")
    assert response.status_code == 200

    body = response.json()
    assert "id" in body
    assert "email" in body
    assert body["email"] == "detail@example.com"
    assert "events" in body
    assert isinstance(body["events"], list)


def test_user_detail_returns_404_for_unknown(admin_views_context: AdminViewsTestContext) -> None:
    """Unbekannter User liefert 404."""
    # Register admin first
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "admin404@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Try to get unknown user
    response = admin_views_context.client.get("/admin/users/unknown-id")
    assert response.status_code == 404


# ============================================
# Tests: Tenant Detail
# ============================================

def test_admin_can_get_tenant_detail(admin_views_context: AdminViewsTestContext) -> None:
    """Admin kann Mandantendetails abrufen."""
    # Register
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "tenant-detail@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    tenant_id = response.json()["data"]["tenant"]["id"]

    # Get tenant detail
    response = admin_views_context.client.get(f"/admin/tenants/{tenant_id}")
    assert response.status_code == 200

    body = response.json()
    assert "id" in body
    assert "name" in body
    assert "users" in body
    assert isinstance(body["users"], list)
    assert "user_count" in body


def test_tenant_detail_returns_404_for_unknown(admin_views_context: AdminViewsTestContext) -> None:
    """Unbekannter Mandant liefert 404."""
    # Register admin first
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "admin-tenant404@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Try to get unknown tenant
    response = admin_views_context.client.get("/admin/tenants/unknown-id")
    assert response.status_code == 404


# ============================================
# Tests: Plan with Credits and Procedures (B1)
# ============================================

def test_create_plan_with_credits_and_procedures(admin_views_context: AdminViewsTestContext) -> None:
    """Tarif kann mit credits_included und allowed_procedures erstellt werden."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "plan-admin@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan with new fields
    response = admin_views_context.client.post(
        "/admin/plans",
        json={
            "code": "PREMIUM",
            "name": "Premium Plan",
            "interval": "MONTHLY",
            "price_cents": 4999,
            "credits_included": 100,
            "allowed_procedures": ["IZA", "IAA"],
        },
    )
    assert response.status_code == 201

    body = response.json()
    assert body["data"]["code"] == "PREMIUM"
    assert body["data"]["credits_included"] == 100
    assert body["data"]["allowed_procedures"] == ["IZA", "IAA"]


def test_create_plan_with_all_procedures(admin_views_context: AdminViewsTestContext) -> None:
    """Tarif kann mit allen Verfahrensarten erstellt werden."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "plan-all@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan with all procedures
    response = admin_views_context.client.post(
        "/admin/plans",
        json={
            "code": "ENTERPRISE",
            "name": "Enterprise Plan",
            "credits_included": 500,
            "allowed_procedures": ["IZA", "IAA", "IPK"],
        },
    )
    assert response.status_code == 201

    body = response.json()
    assert body["data"]["credits_included"] == 500
    assert set(body["data"]["allowed_procedures"]) == {"IZA", "IAA", "IPK"}


def test_create_plan_defaults_credits_to_zero(admin_views_context: AdminViewsTestContext) -> None:
    """Ohne credits_included wird Standardwert 0 verwendet."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "plan-default@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan without credits
    response = admin_views_context.client.post(
        "/admin/plans",
        json={"code": "BASIC", "name": "Basic Plan"},
    )
    assert response.status_code == 201

    body = response.json()
    assert body["data"]["credits_included"] == 0
    assert body["data"]["allowed_procedures"] == []


def test_create_plan_rejects_invalid_procedure_code(admin_views_context: AdminViewsTestContext) -> None:
    """Ungültige Verfahrenscodes werden abgelehnt."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "plan-invalid@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Try to create plan with invalid procedure
    response = admin_views_context.client.post(
        "/admin/plans",
        json={
            "code": "INVALID_PLAN",
            "name": "Invalid Plan",
            "allowed_procedures": ["IZA", "INVALID"],
        },
    )
    assert response.status_code == 422


def test_create_plan_rejects_negative_credits(admin_views_context: AdminViewsTestContext) -> None:
    """Negative Credits werden abgelehnt."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "plan-neg@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Try to create plan with negative credits
    response = admin_views_context.client.post(
        "/admin/plans",
        json={
            "code": "NEGATIVE_PLAN",
            "name": "Negative Plan",
            "credits_included": -10,
        },
    )
    assert response.status_code == 422


def test_patch_plan_can_update_credits(admin_views_context: AdminViewsTestContext) -> None:
    """Credits können per PATCH aktualisiert werden."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "patch-credits@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan first
    response = admin_views_context.client.post(
        "/admin/plans",
        json={"code": "PATCH_TEST", "name": "Patch Test", "credits_included": 50},
    )
    assert response.status_code == 201
    plan_id = response.json()["data"]["id"]

    # Patch credits
    response = admin_views_context.client.patch(
        f"/admin/plans/{plan_id}",
        json={"credits_included": 200},
    )
    assert response.status_code == 200
    assert response.json()["data"]["credits_included"] == 200


def test_patch_plan_can_update_procedures(admin_views_context: AdminViewsTestContext) -> None:
    """Allowed procedures können per PATCH aktualisiert werden."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "patch-procs@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan first
    response = admin_views_context.client.post(
        "/admin/plans",
        json={"code": "PROC_TEST", "name": "Proc Test", "allowed_procedures": ["IZA"]},
    )
    assert response.status_code == 201
    plan_id = response.json()["data"]["id"]

    # Patch procedures
    response = admin_views_context.client.patch(
        f"/admin/plans/{plan_id}",
        json={"allowed_procedures": ["IZA", "IAA", "IPK"]},
    )
    assert response.status_code == 200
    assert set(response.json()["data"]["allowed_procedures"]) == {"IZA", "IAA", "IPK"}


def test_plan_list_includes_new_fields(admin_views_context: AdminViewsTestContext) -> None:
    """Tarifliste enthält credits_included und allowed_procedures."""
    # Register admin
    response = admin_views_context.client.post(
        "/auth/register", json={"email": "list-fields@example.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create plan with new fields
    response = admin_views_context.client.post(
        "/admin/plans",
        json={
            "code": "LIST_TEST",
            "name": "List Test",
            "credits_included": 75,
            "allowed_procedures": ["IZA"],
        },
    )
    assert response.status_code == 201

    # List plans
    response = admin_views_context.client.get("/admin/plans")
    assert response.status_code == 200

    plans = response.json()["data"]
    assert len(plans) >= 1

    # Find our plan
    plan = next((p for p in plans if p["code"] == "LIST_TEST"), None)
    assert plan is not None
    assert "credits_included" in plan
    assert "allowed_procedures" in plan
    assert plan["credits_included"] == 75
    assert plan["allowed_procedures"] == ["IZA"]
