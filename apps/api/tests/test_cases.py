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
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._cases.append(case)
        return case

    async def find_many(self, where: dict, order: dict) -> list[dict]:
        cases = [case for case in self._cases if case["tenant_id"] == where["tenant_id"]]
        return list(reversed(cases))

    async def find_first(self, where: dict) -> dict | None:
        for case in self._cases:
            if case["id"] == where["id"] and case["tenant_id"] == where["tenant_id"]:
                return case
        return None


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.case = FakeCaseModel()


@dataclass
class CaseTestContext:
    prisma: FakePrisma
    client: TestClient


@pytest.fixture()
def case_context(monkeypatch: pytest.MonkeyPatch) -> CaseTestContext:
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

    return CaseTestContext(prisma=fake_prisma, client=client)


def test_get_cases_without_auth_returns_401(case_context: CaseTestContext) -> None:
    response = case_context.client.get("/cases")
    assert response.status_code == 401


def test_post_case_creates_tenant_scoped_case(case_context: CaseTestContext) -> None:
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    response = case_context.client.post("/cases", json={"title": "Test Case"})
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["title"] == "Test Case"


def test_get_cases_list_is_tenant_scoped(case_context: CaseTestContext) -> None:
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    case_context.client.post("/cases", json={"title": "Tenant A"})

    other_client = TestClient(create_app())
    other_client.headers["X-Contract-Version"] = "1"
    response = other_client.post(
        "/auth/register", json={"email": "c@d.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    other_client.post("/cases", json={"title": "Tenant B"})

    response = case_context.client.get("/cases")
    assert response.status_code == 200
    body = response.json()
    titles = [case["title"] for case in body["data"]]
    assert titles == ["Tenant A"]

