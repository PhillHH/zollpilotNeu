"""
Security & Tenant Isolation Tests

These tests verify that tenant isolation and role-based access control
are strictly enforced. They test NEGATIVE cases - i.e., that unauthorized
access is properly blocked.

Non-negotiables:
1. User A CANNOT access User B's data → 404
2. Regular user CANNOT access admin endpoints → 403
3. Admin without proper role CANNOT access system admin endpoints → 403
"""

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
            "status": "ACTIVE",
            "user_type": "PRIVATE",
            "created_at": datetime.utcnow(),
            "last_login_at": None,
        }
        self._by_id[user_id] = user
        self._by_email[user["email"]] = user
        return user

    async def find_unique(self, where: dict) -> dict | None:
        if "email" in where:
            return self._by_email.get(where["email"])
        return self._by_id.get(where.get("id"))

    async def find_many(self, **kwargs) -> list[dict]:
        return list(self._by_id.values())


class FakeTenantModel:
    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        tenant_id = str(uuid.uuid4())
        tenant = {
            "id": tenant_id,
            "name": data["name"],
            "type": "BUSINESS",
            "created_at": datetime.utcnow(),
            "plan_id": None,
            "plan_activated_at": None,
        }
        self._by_id[tenant_id] = tenant
        return tenant

    async def find_unique(self, where: dict) -> dict | None:
        return self._by_id.get(where.get("id"))

    async def find_many(self, **kwargs) -> list[dict]:
        return list(self._by_id.values())


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
            if membership["user_id"] == where.get("user_id"):
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
        return self._by_token_hash.get(where.get("token_hash"))

    async def delete(self, where: dict) -> None:
        self._by_token_hash.pop(where.get("token_hash"), None)


class FakeCaseModel:
    def __init__(self) -> None:
        self._cases: list[dict] = []

    async def create(self, data: dict) -> dict:
        case = {
            "id": str(uuid.uuid4()),
            "tenant_id": data["tenant_id"],
            "created_by_user_id": data["created_by_user_id"],
            "title": data["title"],
            "status": data["status"],
            "version": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "submitted_at": None,
            "archived_at": None,
            "procedure_id": None,
            "procedure_version": None,
        }
        self._cases.append(case)
        return case

    async def find_first(self, where: dict, include: dict | None = None) -> dict | None:
        for case in self._cases:
            match = True
            if "id" in where and case["id"] != where["id"]:
                match = False
            if "tenant_id" in where and case["tenant_id"] != where["tenant_id"]:
                match = False
            if match:
                if include and include.get("fields"):
                    case["fields"] = []
                if include and include.get("procedure"):
                    case["procedure"] = None
                return case
        return None

    async def find_many(self, where: dict | None = None, order: dict | None = None) -> list[dict]:
        results = []
        for case in self._cases:
            if where:
                if "tenant_id" in where and case["tenant_id"] != where["tenant_id"]:
                    continue
                if "status" in where:
                    status_filter = where["status"]
                    if isinstance(status_filter, dict) and "in" in status_filter:
                        if case["status"] not in status_filter["in"]:
                            continue
                    elif case["status"] != status_filter:
                        continue
            results.append(case)
        return results

    async def update(self, where: dict, data: dict) -> dict:
        for case in self._cases:
            if case["id"] == where["id"]:
                case.update(data)
                case["updated_at"] = datetime.utcnow()
                return case
        return None


class FakeCaseFieldModel:
    def __init__(self) -> None:
        self._fields: list[dict] = []

    async def find_many(self, where: dict) -> list[dict]:
        return [f for f in self._fields if f["case_id"] == where.get("case_id")]

    async def upsert(self, where: dict, data: dict) -> dict:
        composite_key = where.get("case_id_key", {})
        case_id = composite_key.get("case_id")
        key = composite_key.get("key")

        for field in self._fields:
            if field["case_id"] == case_id and field["key"] == key:
                field["value_json"] = data["update"]["value_json"]
                field["updated_at"] = datetime.utcnow()
                return field

        new_field = {
            "id": str(uuid.uuid4()),
            "case_id": data["create"]["case_id"],
            "key": data["create"]["key"],
            "value_json": data["create"]["value_json"],
            "value_text": None,
            "updated_at": datetime.utcnow(),
        }
        self._fields.append(new_field)
        return new_field


class FakeProcedureModel:
    def __init__(self) -> None:
        self._procedures: list[dict] = []
        self._seed_iza()

    def _seed_iza(self) -> None:
        proc_id = str(uuid.uuid4())
        self._procedures.append({
            "id": proc_id,
            "code": "IZA",
            "name": "Zollanmeldung Import",
            "version": "v1",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "steps": [],
        })

    async def find_many(self, where: dict | None = None, **kwargs) -> list[dict]:
        results = []
        for proc in self._procedures:
            if where and "is_active" in where:
                if proc["is_active"] != where["is_active"]:
                    continue
            results.append(proc)
        return results

    async def find_first(self, where: dict, include: dict | None = None) -> dict | None:
        for proc in self._procedures:
            if where.get("code") == proc["code"] and where.get("is_active") == proc["is_active"]:
                return proc
        return None


class FakePlanModel:
    def __init__(self) -> None:
        self._plans: list[dict] = []

    async def find_many(self, **kwargs) -> list[dict]:
        return self._plans


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.case = FakeCaseModel()
        self.casefield = FakeCaseFieldModel()
        self.procedure = FakeProcedureModel()
        self.plan = FakePlanModel()


@dataclass
class SecurityTestContext:
    prisma: FakePrisma
    client: TestClient
    user_a_id: str
    user_a_tenant_id: str
    user_b_id: str
    user_b_tenant_id: str
    admin_id: str
    admin_tenant_id: str


@pytest.fixture()
def security_context(monkeypatch: pytest.MonkeyPatch) -> SecurityTestContext:
    """Set up two separate tenants with their own users, plus an admin."""
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

    # Register User A (normal user)
    response = client.post(
        "/auth/register", json={"email": "user_a@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    user_a_data = response.json()["data"]
    user_a_id = user_a_data["id"]
    # Get tenant_id from membership
    user_a_membership = None
    for m in fake_prisma.membership._memberships:
        if m["user_id"] == user_a_id:
            user_a_membership = m
            break
    user_a_tenant_id = user_a_membership["tenant_id"]

    # Clear cookies to register User B
    client.cookies.clear()

    # Register User B (different tenant)
    response = client.post(
        "/auth/register", json={"email": "user_b@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    user_b_data = response.json()["data"]
    user_b_id = user_b_data["id"]
    user_b_membership = None
    for m in fake_prisma.membership._memberships:
        if m["user_id"] == user_b_id:
            user_b_membership = m
            break
    user_b_tenant_id = user_b_membership["tenant_id"]

    # Clear cookies to register Admin
    client.cookies.clear()

    # Register Admin user
    response = client.post(
        "/auth/register", json={"email": "admin@test.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    admin_data = response.json()["data"]
    admin_id = admin_data["id"]
    # Update admin's role to SYSTEM_ADMIN
    for m in fake_prisma.membership._memberships:
        if m["user_id"] == admin_id:
            m["role"] = "SYSTEM_ADMIN"
            break
    admin_tenant_id = None
    for m in fake_prisma.membership._memberships:
        if m["user_id"] == admin_id:
            admin_tenant_id = m["tenant_id"]
            break

    return SecurityTestContext(
        prisma=fake_prisma,
        client=client,
        user_a_id=user_a_id,
        user_a_tenant_id=user_a_tenant_id,
        user_b_id=user_b_id,
        user_b_tenant_id=user_b_tenant_id,
        admin_id=admin_id,
        admin_tenant_id=admin_tenant_id,
    )


def _login_as(client: TestClient, email: str, password: str) -> None:
    """Helper to login as a specific user."""
    client.cookies.clear()
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


# ============================================================================
# TENANT ISOLATION TESTS
# ============================================================================


def test_user_a_cannot_access_user_b_case(security_context: SecurityTestContext) -> None:
    """User A CANNOT see User B's case → 404 (not 403 to avoid leaking existence)."""
    ctx = security_context

    # Login as User B and create a case
    _login_as(ctx.client, "user_b@test.com", "Secret123!")
    response = ctx.client.post("/cases", json={"title": "User B's Private Case"})
    assert response.status_code == 201
    user_b_case_id = response.json()["data"]["id"]

    # Login as User A and try to access User B's case
    _login_as(ctx.client, "user_a@test.com", "Secret123!")
    response = ctx.client.get(f"/cases/{user_b_case_id}")

    # CRITICAL: Must return 404, NOT 403
    # 403 would leak that the case exists
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CASE_NOT_FOUND"


def test_user_a_cannot_list_user_b_cases(security_context: SecurityTestContext) -> None:
    """User A's case list does NOT include User B's cases."""
    ctx = security_context

    # Login as User B and create a case
    _login_as(ctx.client, "user_b@test.com", "Secret123!")
    response = ctx.client.post("/cases", json={"title": "User B's Case"})
    assert response.status_code == 201
    user_b_case_id = response.json()["data"]["id"]

    # Login as User A and list cases
    _login_as(ctx.client, "user_a@test.com", "Secret123!")

    # Create a case for User A
    ctx.client.post("/cases", json={"title": "User A's Case"})

    response = ctx.client.get("/cases")
    assert response.status_code == 200

    case_ids = [c["id"] for c in response.json()["data"]]
    # User B's case should NOT be in User A's list
    assert user_b_case_id not in case_ids


def test_user_a_cannot_modify_user_b_case(security_context: SecurityTestContext) -> None:
    """User A CANNOT modify User B's case → 404."""
    ctx = security_context

    # Login as User B and create a case
    _login_as(ctx.client, "user_b@test.com", "Secret123!")
    response = ctx.client.post("/cases", json={"title": "User B's Case"})
    assert response.status_code == 201
    user_b_case_id = response.json()["data"]["id"]

    # Login as User A and try to modify User B's case
    _login_as(ctx.client, "user_a@test.com", "Secret123!")
    response = ctx.client.patch(
        f"/cases/{user_b_case_id}", json={"title": "Hacked Title"}
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CASE_NOT_FOUND"


def test_user_a_cannot_archive_user_b_case(security_context: SecurityTestContext) -> None:
    """User A CANNOT archive User B's case → 404."""
    ctx = security_context

    # Login as User B and create a case
    _login_as(ctx.client, "user_b@test.com", "Secret123!")
    response = ctx.client.post("/cases", json={"title": "User B's Case"})
    assert response.status_code == 201
    user_b_case_id = response.json()["data"]["id"]

    # Login as User A and try to archive User B's case
    _login_as(ctx.client, "user_a@test.com", "Secret123!")
    response = ctx.client.post(f"/cases/{user_b_case_id}/archive")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CASE_NOT_FOUND"


def test_user_a_cannot_update_user_b_case_fields(security_context: SecurityTestContext) -> None:
    """User A CANNOT update fields on User B's case → 404."""
    ctx = security_context

    # Login as User B and create a case
    _login_as(ctx.client, "user_b@test.com", "Secret123!")
    response = ctx.client.post("/cases", json={"title": "User B's Case"})
    assert response.status_code == 201
    user_b_case_id = response.json()["data"]["id"]

    # Login as User A and try to update fields on User B's case
    _login_as(ctx.client, "user_a@test.com", "Secret123!")
    response = ctx.client.put(
        f"/cases/{user_b_case_id}/fields/value_amount", json={"value": 1000}
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CASE_NOT_FOUND"


# ============================================================================
# ROLE-BASED ACCESS CONTROL TESTS
# ============================================================================


def test_regular_user_cannot_access_admin_plans(security_context: SecurityTestContext) -> None:
    """Regular user CANNOT access /admin/plans → 403."""
    ctx = security_context

    # Login as regular user (User A)
    _login_as(ctx.client, "user_a@test.com", "Secret123!")

    response = ctx.client.get("/admin/plans")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_regular_user_cannot_access_admin_tenants(security_context: SecurityTestContext) -> None:
    """Regular user CANNOT access /admin/tenants → 403."""
    ctx = security_context

    # Login as regular user (User A)
    _login_as(ctx.client, "user_a@test.com", "Secret123!")

    response = ctx.client.get("/admin/tenants")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_regular_user_cannot_access_admin_users(security_context: SecurityTestContext) -> None:
    """Regular user CANNOT access /admin/users → 403."""
    ctx = security_context

    # Login as regular user (User A)
    _login_as(ctx.client, "user_a@test.com", "Secret123!")

    response = ctx.client.get("/admin/users")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_admin_can_access_admin_endpoints(security_context: SecurityTestContext) -> None:
    """SYSTEM_ADMIN CAN access admin endpoints → 200."""
    ctx = security_context

    # Login as admin
    _login_as(ctx.client, "admin@test.com", "Secret123!")

    response = ctx.client.get("/admin/plans")
    assert response.status_code == 200

    response = ctx.client.get("/admin/tenants")
    assert response.status_code == 200

    response = ctx.client.get("/admin/users")
    assert response.status_code == 200


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================


def test_unauthenticated_user_cannot_access_cases(security_context: SecurityTestContext) -> None:
    """Unauthenticated user CANNOT access /cases → 401."""
    ctx = security_context
    ctx.client.cookies.clear()

    response = ctx.client.get("/cases")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def test_unauthenticated_user_cannot_create_case(security_context: SecurityTestContext) -> None:
    """Unauthenticated user CANNOT create a case → 401."""
    ctx = security_context
    ctx.client.cookies.clear()

    response = ctx.client.post("/cases", json={"title": "Test Case"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def test_unauthenticated_user_cannot_access_admin(security_context: SecurityTestContext) -> None:
    """Unauthenticated user CANNOT access /admin endpoints → 401."""
    ctx = security_context
    ctx.client.cookies.clear()

    response = ctx.client.get("/admin/plans")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


# ============================================================================
# CROSS-TENANT ATTACK TESTS
# ============================================================================


def test_direct_case_id_access_blocked(security_context: SecurityTestContext) -> None:
    """Guessing a case ID from another tenant is blocked."""
    ctx = security_context

    # Login as User B and create a case
    _login_as(ctx.client, "user_b@test.com", "Secret123!")
    response = ctx.client.post("/cases", json={"title": "Secret Case"})
    user_b_case_id = response.json()["data"]["id"]

    # Login as User A and try direct ID access
    _login_as(ctx.client, "user_a@test.com", "Secret123!")

    # Try various methods of accessing User B's case
    assert ctx.client.get(f"/cases/{user_b_case_id}").status_code == 404
    assert ctx.client.patch(f"/cases/{user_b_case_id}", json={"title": "X"}).status_code == 404
    assert ctx.client.post(f"/cases/{user_b_case_id}/archive").status_code == 404
    assert ctx.client.get(f"/cases/{user_b_case_id}/fields").status_code == 404
    assert ctx.client.put(f"/cases/{user_b_case_id}/fields/test", json={"value": "x"}).status_code == 404


def test_nonexistent_case_returns_404(security_context: SecurityTestContext) -> None:
    """Accessing a non-existent case returns 404."""
    ctx = security_context

    _login_as(ctx.client, "user_a@test.com", "Secret123!")

    fake_id = str(uuid.uuid4())
    response = ctx.client.get(f"/cases/{fake_id}")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CASE_NOT_FOUND"
