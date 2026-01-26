import os
import uuid
from dataclasses import dataclass
from datetime import datetime

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
            "procedure_id": None,
            "procedure_version": None,
        }
        self._cases.append(case)
        return case

    async def find_first(self, where: dict, include: dict | None = None) -> dict | None:
        for case in self._cases:
            if case["id"] == where.get("id") and case["tenant_id"] == where.get("tenant_id"):
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
    def __init__(self, case_model: FakeCaseModel) -> None:
        self._fields: list[dict] = []
        self._case_model = case_model

    def _attach_fields_to_case(self, case_id: str) -> list[dict]:
        return [f for f in self._fields if f["case_id"] == case_id]

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
        self._steps: list[dict] = []
        self._fields: list[dict] = []
        self._seed_iza()

    def _seed_iza(self) -> None:
        proc_id = str(uuid.uuid4())
        step_package_id = str(uuid.uuid4())
        step_person_id = str(uuid.uuid4())

        self._procedures.append({
            "id": proc_id,
            "code": "IZA",
            "name": "Zollanmeldung Import",
            "version": "v1",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })

        self._steps.append({
            "id": step_package_id,
            "procedure_id": proc_id,
            "step_key": "package",
            "title": "Sendungsdaten",
            "order": 1,
            "is_active": True,
        })
        self._steps.append({
            "id": step_person_id,
            "procedure_id": proc_id,
            "step_key": "person",
            "title": "Empfängerdaten",
            "order": 2,
            "is_active": True,
        })

        # Package fields
        self._fields.extend([
            {"id": str(uuid.uuid4()), "procedure_step_id": step_package_id, "field_key": "tracking_number", "field_type": "TEXT", "required": True, "config_json": {"maxLength": 50}, "order": 1},
            {"id": str(uuid.uuid4()), "procedure_step_id": step_package_id, "field_key": "weight_kg", "field_type": "NUMBER", "required": True, "config_json": {"min": 0.01, "max": 1000}, "order": 2},
            {"id": str(uuid.uuid4()), "procedure_step_id": step_package_id, "field_key": "origin_country", "field_type": "COUNTRY", "required": True, "config_json": {}, "order": 3},
        ])

        # Person fields
        self._fields.extend([
            {"id": str(uuid.uuid4()), "procedure_step_id": step_person_id, "field_key": "recipient_name", "field_type": "TEXT", "required": True, "config_json": {"maxLength": 100}, "order": 1},
            {"id": str(uuid.uuid4()), "procedure_step_id": step_person_id, "field_key": "recipient_address", "field_type": "TEXT", "required": True, "config_json": {"maxLength": 200}, "order": 2},
            {"id": str(uuid.uuid4()), "procedure_step_id": step_person_id, "field_key": "is_business", "field_type": "BOOLEAN", "required": False, "config_json": {}, "order": 3},
        ])

    async def find_many(self, where: dict | None = None, order: dict | None = None, include: dict | None = None) -> list[dict]:
        results = []
        for proc in self._procedures:
            if where:
                if "is_active" in where and proc["is_active"] != where["is_active"]:
                    continue
            proc_copy = proc.copy()
            if include and include.get("steps"):
                proc_copy["steps"] = self._get_steps_for_procedure(proc["id"], include["steps"])
            results.append(proc_copy)
        return results

    async def find_first(self, where: dict, include: dict | None = None) -> dict | None:
        for proc in self._procedures:
            match = True
            if "code" in where and proc["code"] != where["code"]:
                match = False
            if "is_active" in where and proc["is_active"] != where["is_active"]:
                match = False
            if "version" in where and proc["version"] != where["version"]:
                match = False
            if match:
                proc_copy = proc.copy()
                if include and include.get("steps"):
                    proc_copy["steps"] = self._get_steps_for_procedure(proc["id"], include["steps"])
                return proc_copy
        return None

    async def find_unique(self, where: dict) -> dict | None:
        for proc in self._procedures:
            if proc["id"] == where.get("id"):
                return proc
        return None

    def _get_steps_for_procedure(self, proc_id: str, include: dict | None) -> list[dict]:
        steps = []
        for step in sorted(self._steps, key=lambda s: s["order"]):
            if step["procedure_id"] == proc_id:
                step_copy = step.copy()
                if include and include.get("include", {}).get("fields"):
                    step_copy["fields"] = [
                        f for f in self._fields
                        if f["procedure_step_id"] == step["id"]
                    ]
                steps.append(step_copy)
        return steps


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.case = FakeCaseModel()
        self.casefield = FakeCaseFieldModel(self.case)
        self.procedure = FakeProcedureModel()


@dataclass
class ProcedureTestContext:
    prisma: FakePrisma
    client: TestClient


@pytest.fixture()
def proc_context(monkeypatch: pytest.MonkeyPatch) -> ProcedureTestContext:
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

    return ProcedureTestContext(prisma=fake_prisma, client=client)


def test_list_procedures_returns_seeded_iza(proc_context: ProcedureTestContext) -> None:
    """GET /procedures returns seeded IZA procedure."""
    # Register user
    response = proc_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # List procedures
    response = proc_context.client.get("/procedures")
    assert response.status_code == 200
    body = response.json()
    codes = [p["code"] for p in body["data"]]
    assert "IZA" in codes


def test_get_procedure_iza_returns_steps_and_fields(proc_context: ProcedureTestContext) -> None:
    """GET /procedures/IZA returns steps and fields."""
    # Register user
    response = proc_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Get IZA procedure
    response = proc_context.client.get("/procedures/IZA")
    assert response.status_code == 200
    body = response.json()

    proc = body["data"]
    assert proc["code"] == "IZA"
    assert proc["name"] == "Zollanmeldung Import"
    assert len(proc["steps"]) == 2

    # Check steps
    step_keys = [s["step_key"] for s in proc["steps"]]
    assert "package" in step_keys
    assert "person" in step_keys

    # Check fields exist
    package_step = next(s for s in proc["steps"] if s["step_key"] == "package")
    field_keys = [f["field_key"] for f in package_step["fields"]]
    assert "tracking_number" in field_keys
    assert "weight_kg" in field_keys


def test_bind_procedure_to_case(proc_context: ProcedureTestContext) -> None:
    """POST /cases/{id}/procedure binds procedure to case."""
    # Register user
    response = proc_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create case
    response = proc_context.client.post("/cases", json={"title": "Test Case"})
    assert response.status_code == 201
    case_id = response.json()["data"]["id"]

    # Bind procedure
    response = proc_context.client.post(
        f"/cases/{case_id}/procedure",
        json={"procedure_code": "IZA"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["procedure_code"] == "IZA"
    assert body["data"]["procedure_version"] == "v1"


def test_validation_missing_required_field_returns_error(proc_context: ProcedureTestContext) -> None:
    """POST /cases/{id}/validate with missing required field returns valid=false."""
    # Register user
    response = proc_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create case
    response = proc_context.client.post("/cases", json={"title": "Test Case"})
    case_id = response.json()["data"]["id"]

    # Bind procedure
    proc_context.client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"})

    # Attach fields to case for validation (simulate)
    proc_context.prisma.case._cases[0]["fields"] = []

    # Validate (no fields filled)
    response = proc_context.client.post(f"/cases/{case_id}/validate")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["valid"] is False
    assert len(body["data"]["errors"]) > 0

    # Check that tracking_number is in errors
    error_fields = [e["field_key"] for e in body["data"]["errors"]]
    assert "tracking_number" in error_fields


def test_validation_filled_fields_returns_valid(proc_context: ProcedureTestContext) -> None:
    """POST /cases/{id}/validate with all required fields returns valid=true."""
    # Register user
    response = proc_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create case
    response = proc_context.client.post("/cases", json={"title": "Test Case"})
    case_id = response.json()["data"]["id"]

    # Bind procedure
    proc_context.client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"})

    # Fill all required fields
    proc_context.prisma.case._cases[0]["fields"] = [
        {"key": "tracking_number", "value_json": "1Z999AA10123456784"},
        {"key": "weight_kg", "value_json": 5.5},
        {"key": "origin_country", "value_json": "US"},
        {"key": "recipient_name", "value_json": "Max Mustermann"},
        {"key": "recipient_address", "value_json": "Musterstr. 1, 12345 Berlin"},
    ]

    # Validate
    response = proc_context.client.post(f"/cases/{case_id}/validate")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["valid"] is True
    assert body["data"].get("errors") is None or len(body["data"]["errors"]) == 0


def test_validation_without_bound_procedure_returns_error(proc_context: ProcedureTestContext) -> None:
    """POST /cases/{id}/validate without bound procedure returns 400."""
    # Register user
    response = proc_context.client.post(
        "/auth/register", json={"email": "a@b.com", "password": "Secret123!"}
    )
    assert response.status_code == 201

    # Create case (no procedure bound)
    response = proc_context.client.post("/cases", json={"title": "Test Case"})
    case_id = response.json()["data"]["id"]

    # Attach empty fields
    proc_context.prisma.case._cases[0]["fields"] = []

    # Validate
    response = proc_context.client.post(f"/cases/{case_id}/validate")
    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "NO_PROCEDURE_BOUND"

