"""
Tests for Case Lifecycle (Submit, Snapshots, Field Lock).
"""

import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


# --- Fake Prisma Models ---


class FakeUserModel:
    def __init__(self) -> None:
        self._users: list[dict] = []
        self._by_email: dict[str, dict] = {}

    def model_dump(self) -> dict:
        return {}

    async def create(self, data: dict) -> "FakeUser":
        user_dict = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "password_hash": data["password_hash"],
            "created_at": datetime.now(timezone.utc),
        }
        self._users.append(user_dict)
        self._by_email[data["email"]] = user_dict
        return FakeUser(user_dict)

    async def find_unique(self, where: dict) -> "FakeUser | None":
        if "email" in where:
            user_dict = self._by_email.get(where["email"])
            return FakeUser(user_dict) if user_dict else None
        for u in self._users:
            if u["id"] == where.get("id"):
                return FakeUser(u)
        return None


class FakeUser:
    def __init__(self, data: dict) -> None:
        self._data = data
        for k, v in data.items():
            setattr(self, k, v)

    def model_dump(self) -> dict:
        return self._data


class FakeTenantModel:
    def __init__(self) -> None:
        self._tenants: list[dict] = []

    async def create(self, data: dict) -> "FakeTenant":
        tenant_dict = {
            "id": str(uuid.uuid4()),
            "name": data["name"],
            "created_at": datetime.now(timezone.utc),
            "plan_id": None,
            "plan_activated_at": None,
        }
        self._tenants.append(tenant_dict)
        return FakeTenant(tenant_dict)

    async def find_unique(self, where: dict) -> "FakeTenant | None":
        for t in self._tenants:
            if t["id"] == where.get("id"):
                return FakeTenant(t)
        return None


class FakeTenant:
    def __init__(self, data: dict) -> None:
        self._data = data
        for k, v in data.items():
            setattr(self, k, v)

    def model_dump(self) -> dict:
        return self._data


class FakeMembershipModel:
    def __init__(self) -> None:
        self._memberships: list[dict] = []

    async def create(self, data: dict) -> "FakeMembership":
        membership = {
            "user_id": data["user_id"],
            "tenant_id": data["tenant_id"],
            "role": data["role"],
        }
        self._memberships.append(membership)
        return FakeMembership(membership)

    async def find_first(self, where: dict) -> "FakeMembership | None":
        for m in self._memberships:
            if m["user_id"] == where.get("user_id"):
                return FakeMembership(m)
        return None


class FakeMembership:
    def __init__(self, data: dict) -> None:
        self._data = data
        for k, v in data.items():
            setattr(self, k, v)


class FakeSessionModel:
    def __init__(self) -> None:
        self._sessions: list[dict] = []

    async def create(self, data: dict) -> "FakeSession":
        session = {
            "id": str(uuid.uuid4()),
            "user_id": data["user_id"],
            "token_hash": data["token_hash"],
            "expires_at": data["expires_at"],
            "created_at": datetime.now(timezone.utc),
        }
        self._sessions.append(session)
        return FakeSession(session)

    async def find_unique(self, where: dict) -> "FakeSession | None":
        for s in self._sessions:
            if s.get("token_hash") == where.get("token_hash"):
                return FakeSession(s)
        return None

    async def delete(self, where: dict) -> None:
        self._sessions = [s for s in self._sessions if s.get("token_hash") != where.get("token_hash")]


class FakeSession:
    def __init__(self, data: dict) -> None:
        self._data = data
        for k, v in data.items():
            setattr(self, k, v)


class FakeProcedureModel:
    def __init__(self) -> None:
        self._procedures: list[dict] = []
        self._steps: list[dict] = []
        self._fields: list[dict] = []

    async def create(self, data: dict) -> "FakeProcedure":
        proc = {
            "id": str(uuid.uuid4()),
            "code": data["code"],
            "name": data["name"],
            "version": data.get("version", "v1"),
            "is_active": data.get("is_active", True),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        self._procedures.append(proc)
        return FakeProcedure(proc, self)

    async def find_first(self, where: dict, include: dict | None = None) -> "FakeProcedure | None":
        for p in self._procedures:
            match = True
            if "code" in where and p["code"] != where["code"]:
                match = False
            if "is_active" in where and p["is_active"] != where["is_active"]:
                match = False
            if "id" in where and p["id"] != where["id"]:
                match = False
            if match:
                return FakeProcedure(p, self, include)
        return None

    async def find_many(self, where: dict, order: dict | None = None) -> list["FakeProcedure"]:
        result = []
        for p in self._procedures:
            if p.get("is_active", True) == where.get("is_active", True):
                result.append(FakeProcedure(p, self))
        return result

    async def find_unique(self, where: dict) -> "FakeProcedure | None":
        for p in self._procedures:
            if p["id"] == where.get("id"):
                return FakeProcedure(p, self)
        return None

    def add_step(self, proc_id: str, step: dict) -> dict:
        step["id"] = str(uuid.uuid4())
        step["procedure_id"] = proc_id
        self._steps.append(step)
        return step

    def add_field(self, step_id: str, field: dict) -> dict:
        field["id"] = str(uuid.uuid4())
        field["procedure_step_id"] = step_id
        self._fields.append(field)
        return field


class FakeProcedure:
    def __init__(self, data: dict, model: FakeProcedureModel, include: dict | None = None) -> None:
        self._data = data
        self._model = model
        for k, v in data.items():
            setattr(self, k, v)

        self.steps = []
        if include and include.get("steps"):
            steps = [s for s in model._steps if s["procedure_id"] == data["id"]]
            steps.sort(key=lambda x: x.get("order", 0))
            for s in steps:
                fields = [f for f in model._fields if f["procedure_step_id"] == s["id"]]
                fields.sort(key=lambda x: x.get("order", 0))
                step_obj = FakeProcedureStep(s)
                step_obj.fields = [FakeProcedureField(f) for f in fields]
                self.steps.append(step_obj)


class FakeProcedureStep:
    def __init__(self, data: dict) -> None:
        for k, v in data.items():
            setattr(self, k, v)
        self.fields = []


class FakeProcedureField:
    def __init__(self, data: dict) -> None:
        for k, v in data.items():
            setattr(self, k, v)


class FakeCaseModel:
    def __init__(self, procedure_model: FakeProcedureModel) -> None:
        self._cases: list[dict] = []
        self._procedure_model = procedure_model

    async def create(self, data: dict) -> "FakeCase":
        case = {
            "id": str(uuid.uuid4()),
            "tenant_id": data["tenant_id"],
            "created_by_user_id": data["created_by_user_id"],
            "title": data["title"],
            "status": data["status"],
            "version": data.get("version", 1),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "submitted_at": None,
            "archived_at": None,
            "procedure_id": data.get("procedure_id"),
            "procedure_version": data.get("procedure_version"),
        }
        self._cases.append(case)
        return FakeCase(case, None, self._procedure_model)

    async def find_first(self, where: dict, include: dict | None = None) -> "FakeCase | None":
        for c in self._cases:
            if c["id"] == where.get("id") and c["tenant_id"] == where.get("tenant_id"):
                return FakeCase(c, include, self._procedure_model)
        return None

    async def find_many(self, where: dict, order: dict | None = None) -> list["FakeCase"]:
        result = [c for c in self._cases if c["tenant_id"] == where.get("tenant_id")]
        return [FakeCase(c, None, self._procedure_model) for c in reversed(result)]

    async def update(self, where: dict, data: dict) -> "FakeCase":
        for i, c in enumerate(self._cases):
            if c["id"] == where.get("id"):
                self._cases[i].update(data)
                self._cases[i]["updated_at"] = datetime.now(timezone.utc)
                return FakeCase(self._cases[i], None, self._procedure_model)
        raise ValueError("Case not found")


class FakeCase:
    def __init__(self, data: dict, include: dict | None, procedure_model: FakeProcedureModel) -> None:
        self._data = data
        for k, v in data.items():
            setattr(self, k, v)

        self.fields = []
        self.procedure = None

        if include and include.get("fields"):
            # Fields will be populated by FakeCaseFieldModel
            pass

        if include and include.get("procedure") and data.get("procedure_id"):
            # Lookup procedure
            for p in procedure_model._procedures:
                if p["id"] == data["procedure_id"]:
                    self.procedure = FakeProcedure(p, procedure_model, include={"steps": {"include": {"fields": True}}})
                    break

    def model_dump(self) -> dict:
        return self._data


class FakeCaseFieldModel:
    def __init__(self) -> None:
        self._fields: list[dict] = []

    async def find_many(self, where: dict) -> list["FakeCaseField"]:
        return [FakeCaseField(f) for f in self._fields if f["case_id"] == where.get("case_id")]

    async def upsert(self, where: dict, data: dict) -> "FakeCaseField":
        case_id = where["case_id_key"]["case_id"]
        key = where["case_id_key"]["key"]

        for i, f in enumerate(self._fields):
            if f["case_id"] == case_id and f["key"] == key:
                self._fields[i].update(data["update"])
                self._fields[i]["updated_at"] = datetime.now(timezone.utc)
                return FakeCaseField(self._fields[i])

        new_field = {
            "id": str(uuid.uuid4()),
            "case_id": case_id,
            "key": key,
            "value_json": data["create"]["value_json"],
            "value_text": None,
            "updated_at": datetime.now(timezone.utc),
        }
        self._fields.append(new_field)
        return FakeCaseField(new_field)


class FakeCaseField:
    def __init__(self, data: dict) -> None:
        for k, v in data.items():
            setattr(self, k, v)


class FakeCaseSnapshotModel:
    def __init__(self) -> None:
        self._snapshots: list[dict] = []

    async def create(self, data: dict) -> "FakeCaseSnapshot":
        snapshot = {
            "id": str(uuid.uuid4()),
            "case_id": data["case_id"],
            "version": data["version"],
            "procedure_code": data["procedure_code"],
            "procedure_version": data["procedure_version"],
            "fields_json": data["fields_json"],
            "validation_json": data["validation_json"],
            "created_at": datetime.now(timezone.utc),
        }
        self._snapshots.append(snapshot)
        return FakeCaseSnapshot(snapshot)

    async def find_many(self, where: dict, order: dict | None = None) -> list["FakeCaseSnapshot"]:
        result = [s for s in self._snapshots if s["case_id"] == where.get("case_id")]
        if order and order.get("version") == "desc":
            result.sort(key=lambda x: x["version"], reverse=True)
        return [FakeCaseSnapshot(s) for s in result]

    async def find_first(self, where: dict, order: dict | None = None) -> "FakeCaseSnapshot | None":
        for s in self._snapshots:
            if s["case_id"] == where.get("case_id") and s["version"] == where.get("version"):
                return FakeCaseSnapshot(s)
        return None


class FakeCaseSnapshot:
    def __init__(self, data: dict) -> None:
        for k, v in data.items():
            setattr(self, k, v)


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.procedure = FakeProcedureModel()
        self.case = FakeCaseModel(self.procedure)
        self.casefield = FakeCaseFieldModel()
        self.casesnapshot = FakeCaseSnapshotModel()


# --- Test Context ---


@dataclass
class LifecycleTestContext:
    prisma: FakePrisma
    client: TestClient
    user_token: str
    tenant_id: str
    user_id: str


def _seed_procedure(fake_prisma: FakePrisma) -> str:
    """Seed IZA procedure and return its ID."""
    import asyncio

    async def _seed():
        proc = await fake_prisma.procedure.create({
            "code": "IZA",
            "name": "Zollanmeldung Import",
            "version": "v1",
            "is_active": True,
        })

        step1 = fake_prisma.procedure.add_step(proc.id, {
            "step_key": "package",
            "title": "Sendungsdaten",
            "order": 1,
            "is_active": True,
        })

        fake_prisma.procedure.add_field(step1["id"], {
            "field_key": "tracking_number",
            "field_type": "TEXT",
            "required": True,
            "config_json": {},
            "order": 1,
        })

        fake_prisma.procedure.add_field(step1["id"], {
            "field_key": "weight_kg",
            "field_type": "NUMBER",
            "required": True,
            "config_json": {},
            "order": 2,
        })

        return proc.id

    return asyncio.get_event_loop().run_until_complete(_seed())


@pytest.fixture()
def lifecycle_ctx(monkeypatch: pytest.MonkeyPatch) -> LifecycleTestContext:
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

    # Register user
    response = client.post("/auth/register", json={"email": "test@example.com", "password": "Secret123!"})
    assert response.status_code == 201
    user_token = response.cookies["zollpilot_session"]

    # Get IDs
    user_data = fake_prisma.user._by_email["test@example.com"]
    membership = next(m for m in fake_prisma.membership._memberships if m["user_id"] == user_data["id"])

    # Seed procedure
    _seed_procedure(fake_prisma)

    return LifecycleTestContext(
        prisma=fake_prisma,
        client=client,
        user_token=user_token,
        tenant_id=membership["tenant_id"],
        user_id=user_data["id"],
    )


# --- Tests ---


def test_submit_invalid_case_returns_409(lifecycle_ctx: LifecycleTestContext) -> None:
    """Submit with missing required fields returns 409 CASE_INVALID."""
    client = lifecycle_ctx.client
    cookies = {"zollpilot_session": lifecycle_ctx.user_token}

    # Create case
    resp = client.post("/cases", json={"title": "Test Case"}, cookies=cookies)
    assert resp.status_code == 201
    case_id = resp.json()["data"]["id"]

    # Bind procedure
    resp = client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)
    assert resp.status_code == 200

    # Submit without filling required fields
    resp = client.post(f"/cases/{case_id}/submit", cookies=cookies)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CASE_INVALID"


def test_submit_valid_case_creates_snapshot(lifecycle_ctx: LifecycleTestContext) -> None:
    """Submit with all required fields filled creates snapshot and sets status."""
    client = lifecycle_ctx.client
    cookies = {"zollpilot_session": lifecycle_ctx.user_token}

    # Create case
    resp = client.post("/cases", json={"title": "Valid Case"}, cookies=cookies)
    assert resp.status_code == 201
    case_id = resp.json()["data"]["id"]

    # Bind procedure
    client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

    # Fill required fields
    client.put(f"/cases/{case_id}/fields/tracking_number", json={"value": "12345"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/weight_kg", json={"value": 10.5}, cookies=cookies)

    # Sync fields to case
    lifecycle_ctx.prisma.case._cases[0]["fields"] = lifecycle_ctx.prisma.casefield._fields

    # Submit
    resp = client.post(f"/cases/{case_id}/submit", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["status"] == "SUBMITTED"
    assert "snapshot_id" in data

    # Verify snapshot exists
    assert len(lifecycle_ctx.prisma.casesnapshot._snapshots) == 1
    snapshot = lifecycle_ctx.prisma.casesnapshot._snapshots[0]
    assert snapshot["case_id"] == case_id
    assert snapshot["procedure_code"] == "IZA"


def test_submit_idempotent(lifecycle_ctx: LifecycleTestContext) -> None:
    """Second submit call returns same result."""
    client = lifecycle_ctx.client
    cookies = {"zollpilot_session": lifecycle_ctx.user_token}

    # Create and fill case
    resp = client.post("/cases", json={"title": "Idempotent Case"}, cookies=cookies)
    case_id = resp.json()["data"]["id"]
    client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/tracking_number", json={"value": "12345"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/weight_kg", json={"value": 10.5}, cookies=cookies)

    # Sync fields
    lifecycle_ctx.prisma.case._cases[0]["fields"] = lifecycle_ctx.prisma.casefield._fields

    # First submit
    resp1 = client.post(f"/cases/{case_id}/submit", cookies=cookies)
    assert resp1.status_code == 200

    # Second submit (idempotent)
    resp2 = client.post(f"/cases/{case_id}/submit", cookies=cookies)
    assert resp2.status_code == 200
    assert resp2.json()["data"]["snapshot_id"] == resp1.json()["data"]["snapshot_id"]

    # Only one snapshot created
    assert len(lifecycle_ctx.prisma.casesnapshot._snapshots) == 1


def test_field_update_blocked_after_submit(lifecycle_ctx: LifecycleTestContext) -> None:
    """Field updates return 409 CASE_NOT_EDITABLE after submit."""
    client = lifecycle_ctx.client
    cookies = {"zollpilot_session": lifecycle_ctx.user_token}

    # Create and submit case
    resp = client.post("/cases", json={"title": "Locked Case"}, cookies=cookies)
    case_id = resp.json()["data"]["id"]
    client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/tracking_number", json={"value": "12345"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/weight_kg", json={"value": 10.5}, cookies=cookies)

    # Sync fields and submit
    lifecycle_ctx.prisma.case._cases[0]["fields"] = lifecycle_ctx.prisma.casefield._fields
    client.post(f"/cases/{case_id}/submit", cookies=cookies)

    # Try to update field
    resp = client.put(f"/cases/{case_id}/fields/tracking_number", json={"value": "new-value"}, cookies=cookies)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CASE_NOT_EDITABLE"


def test_list_snapshots_returns_versions(lifecycle_ctx: LifecycleTestContext) -> None:
    """GET /cases/{id}/snapshots returns list of snapshots."""
    client = lifecycle_ctx.client
    cookies = {"zollpilot_session": lifecycle_ctx.user_token}

    # Create and submit case
    resp = client.post("/cases", json={"title": "Snapshot List"}, cookies=cookies)
    case_id = resp.json()["data"]["id"]
    client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/tracking_number", json={"value": "12345"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/weight_kg", json={"value": 10.5}, cookies=cookies)
    lifecycle_ctx.prisma.case._cases[0]["fields"] = lifecycle_ctx.prisma.casefield._fields
    client.post(f"/cases/{case_id}/submit", cookies=cookies)

    # List snapshots
    resp = client.get(f"/cases/{case_id}/snapshots", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) == 1
    assert data[0]["version"] == 1


def test_get_snapshot_returns_detail(lifecycle_ctx: LifecycleTestContext) -> None:
    """GET /cases/{id}/snapshots/{version} returns snapshot detail."""
    client = lifecycle_ctx.client
    cookies = {"zollpilot_session": lifecycle_ctx.user_token}

    # Create and submit case
    resp = client.post("/cases", json={"title": "Snapshot Detail"}, cookies=cookies)
    case_id = resp.json()["data"]["id"]
    client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/tracking_number", json={"value": "12345"}, cookies=cookies)
    client.put(f"/cases/{case_id}/fields/weight_kg", json={"value": 10.5}, cookies=cookies)
    lifecycle_ctx.prisma.case._cases[0]["fields"] = lifecycle_ctx.prisma.casefield._fields
    client.post(f"/cases/{case_id}/submit", cookies=cookies)

    # Get snapshot
    resp = client.get(f"/cases/{case_id}/snapshots/1", cookies=cookies)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["version"] == 1
    assert data["procedure_code"] == "IZA"
    assert "fields_json" in data
    assert "validation_json" in data

