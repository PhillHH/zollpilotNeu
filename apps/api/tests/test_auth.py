import os
import uuid
from datetime import datetime

import pytest
from dataclasses import dataclass
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


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()


@dataclass
class AuthTestContext:
    client: TestClient
    prisma: FakePrisma


@pytest.fixture()
def auth_context(monkeypatch: pytest.MonkeyPatch) -> AuthTestContext:
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

    return AuthTestContext(client=client, prisma=fake_prisma)


def test_register_creates_user_tenant_membership(auth_context: AuthTestContext) -> None:
    response = auth_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["user"]["email"] == "a@b.com"
    assert body["data"]["tenant"]["name"] == "Default"
    assert body["data"]["role"] == "OWNER"


def test_login_works(auth_context: AuthTestContext) -> None:
    auth_context.client.post("/auth/register", json={"email": "c@d.com", "password": "Secret123!"})
    response = auth_context.client.post(
        "/auth/login", json={"email": "c@d.com", "password": "Secret123!"}
    )

    assert response.status_code == 200
    assert response.json()["data"]["user"]["email"] == "c@d.com"


def test_invalid_password_returns_401(auth_context: AuthTestContext) -> None:
    auth_context.client.post("/auth/register", json={"email": "e@f.com", "password": "Secret123!"})
    response = auth_context.client.post(
        "/auth/login", json={"email": "e@f.com", "password": "Wrong"}
    )

    assert response.status_code == 401


def test_me_without_session_returns_401(auth_context: AuthTestContext) -> None:
    response = auth_context.client.get("/auth/me")
    assert response.status_code == 401


def test_rbac_blocks_user_from_admin(auth_context: AuthTestContext) -> None:
    response = auth_context.client.post(
        "/auth/register", json={"email": "g@h.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    for membership in auth_context.prisma.membership._memberships:
        membership["role"] = "USER"

    cookies = response.cookies
    response = auth_context.client.get("/auth/admin", cookies=cookies)
    assert response.status_code == 403

