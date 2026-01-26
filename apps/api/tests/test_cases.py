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
            "archived_at": None,
        }
        self._cases.append(case)
        return case

    async def find_many(self, where: dict, order: dict, include: dict | None = None) -> list[dict]:
        cases = [case for case in self._cases if case["tenant_id"] == where["tenant_id"]]
        # Filter by status
        if "status" in where:
            status_filter = where["status"]
            if isinstance(status_filter, dict) and "in" in status_filter:
                cases = [c for c in cases if c["status"] in status_filter["in"]]
            else:
                cases = [c for c in cases if c["status"] == status_filter]
        return list(reversed(cases))

    async def find_first(self, where: dict, include: dict | None = None) -> dict | None:
        for case in self._cases:
            if case["id"] == where["id"] and case["tenant_id"] == where["tenant_id"]:
                if include and include.get("fields"):
                    case["fields"] = []
                return case
        return None

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
        return [f for f in self._fields if f["case_id"] == where["case_id"]]

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


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.case = FakeCaseModel()
        self.casefield = FakeCaseFieldModel()


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


def test_user_b_cannot_read_user_a_case(case_context: CaseTestContext) -> None:
    """User B from different tenant cannot read User A's case (404)."""
    # User A creates a case
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201
    create_resp = case_context.client.post("/cases", json={"title": "User A Case"})
    case_id = create_resp.json()["data"]["id"]

    # User B registers (different tenant)
    other_client = TestClient(create_app())
    other_client.headers["X-Contract-Version"] = "1"
    response = other_client.post(
        "/auth/register", json={"email": "c@d.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # User B tries to access User A's case
    response = other_client.get(f"/cases/{case_id}")
    assert response.status_code == 404


def test_archive_case_idempotent(case_context: CaseTestContext) -> None:
    """Archive endpoint is idempotent - multiple calls return 200."""
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    create_resp = case_context.client.post("/cases", json={"title": "To Archive"})
    case_id = create_resp.json()["data"]["id"]

    # First archive
    response = case_context.client.post(f"/cases/{case_id}/archive")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ARCHIVED"

    # Second archive (idempotent)
    response = case_context.client.post(f"/cases/{case_id}/archive")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ARCHIVED"


def test_field_upsert_sets_value_json(case_context: CaseTestContext) -> None:
    """PUT /cases/{id}/fields/{key} sets value_json correctly."""
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    create_resp = case_context.client.post("/cases", json={"title": "Test"})
    case_id = create_resp.json()["data"]["id"]

    response = case_context.client.put(
        f"/cases/{case_id}/fields/notes",
        json={"value": "My notes content"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["key"] == "notes"
    assert body["data"]["value"] == "My notes content"


def test_field_upsert_overwrites(case_context: CaseTestContext) -> None:
    """PUT /cases/{id}/fields/{key} overwrites existing value."""
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    create_resp = case_context.client.post("/cases", json={"title": "Test"})
    case_id = create_resp.json()["data"]["id"]

    # First upsert
    case_context.client.put(
        f"/cases/{case_id}/fields/notes",
        json={"value": "Initial"}
    )

    # Second upsert (overwrite)
    response = case_context.client.put(
        f"/cases/{case_id}/fields/notes",
        json={"value": "Updated"}
    )
    assert response.status_code == 200
    assert response.json()["data"]["value"] == "Updated"


def test_field_invalid_key_returns_400(case_context: CaseTestContext) -> None:
    """Invalid field key returns 400 VALIDATION_ERROR."""
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    create_resp = case_context.client.post("/cases", json={"title": "Test"})
    case_id = create_resp.json()["data"]["id"]

    # Invalid key with uppercase
    response = case_context.client.put(
        f"/cases/{case_id}/fields/InvalidKey",
        json={"value": "test"}
    )
    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_field_oversized_value_returns_413(case_context: CaseTestContext) -> None:
    """Oversized field value returns 413 PAYLOAD_TOO_LARGE."""
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    create_resp = case_context.client.post("/cases", json={"title": "Test"})
    case_id = create_resp.json()["data"]["id"]

    # Value larger than 16KB
    large_value = "x" * (17 * 1024)
    response = case_context.client.put(
        f"/cases/{case_id}/fields/notes",
        json={"value": large_value}
    )
    assert response.status_code == 413
    body = response.json()
    assert body["error"]["code"] == "PAYLOAD_TOO_LARGE"


def test_patch_case_updates_title(case_context: CaseTestContext) -> None:
    """PATCH /cases/{id} updates title."""
    response = case_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    create_resp = case_context.client.post("/cases", json={"title": "Original"})
    case_id = create_resp.json()["data"]["id"]

    response = case_context.client.patch(
        f"/cases/{case_id}",
        json={"title": "Updated Title"}
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Updated Title"

