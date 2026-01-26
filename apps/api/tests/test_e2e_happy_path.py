"""
End-to-End Happy Path Tests.

Tests the complete user journey:
Register → Create Case → Bind IZA → Fill Fields → Validate → Submit → PDF

Also tests negative paths:
- Submit without filling required fields
- PDF export without submission
- Tenant isolation
- Credit consumption
"""

import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


# --- Fake Prisma Models (Comprehensive) ---


class FakeModel:
    """Base class for fake models."""
    def __init__(self, data: dict) -> None:
        self._data = data
        for k, v in data.items():
            setattr(self, k, v)

    def model_dump(self) -> dict:
        return self._data


class FakeUserModel:
    def __init__(self) -> None:
        self._users: list[dict] = []

    async def create(self, data: dict) -> FakeModel:
        user = {
            "id": str(uuid.uuid4()),
            "email": data["email"],
            "password_hash": data["password_hash"],
            "created_at": datetime.now(timezone.utc),
        }
        self._users.append(user)
        return FakeModel(user)

    async def find_unique(self, where: dict) -> FakeModel | None:
        for u in self._users:
            if "email" in where and u["email"] == where["email"]:
                return FakeModel(u)
            if "id" in where and u["id"] == where["id"]:
                return FakeModel(u)
        return None


class FakeTenantModel:
    def __init__(self) -> None:
        self._tenants: list[dict] = []

    async def create(self, data: dict) -> FakeModel:
        tenant = {
            "id": str(uuid.uuid4()),
            "name": data["name"],
            "plan_id": None,
            "plan_activated_at": None,
            "created_at": datetime.now(timezone.utc),
        }
        self._tenants.append(tenant)
        return FakeModel(tenant)

    async def find_unique(self, where: dict) -> FakeModel | None:
        for t in self._tenants:
            if t["id"] == where.get("id"):
                return FakeModel(t)
        return None

    async def find_many(self) -> list[FakeModel]:
        return [FakeModel(t) for t in self._tenants]


class FakeMembershipModel:
    def __init__(self) -> None:
        self._memberships: list[dict] = []

    async def create(self, data: dict) -> FakeModel:
        m = {
            "user_id": data["user_id"],
            "tenant_id": data["tenant_id"],
            "role": data["role"],
        }
        self._memberships.append(m)
        return FakeModel(m)

    async def find_first(self, where: dict) -> FakeModel | None:
        for m in self._memberships:
            if m["user_id"] == where.get("user_id"):
                return FakeModel(m)
        return None


class FakeSessionModel:
    def __init__(self) -> None:
        self._sessions: list[dict] = []

    async def create(self, data: dict) -> FakeModel:
        session = {
            "id": str(uuid.uuid4()),
            "user_id": data["user_id"],
            "tenant_id": data.get("tenant_id"),
            "token_hash": data["token_hash"],
            "expires_at": data["expires_at"],
            "created_at": datetime.now(timezone.utc),
        }
        self._sessions.append(session)
        return FakeModel(session)

    async def find_unique(self, where: dict) -> FakeModel | None:
        for s in self._sessions:
            if s.get("token_hash") == where.get("token_hash"):
                return FakeModel(s)
        return None

    async def delete(self, where: dict) -> None:
        self._sessions = [s for s in self._sessions if s.get("token_hash") != where.get("token_hash")]


class FakeProcedureModel:
    def __init__(self) -> None:
        self._procedures: list[dict] = []
        self._steps: list[dict] = []
        self._fields: list[dict] = []

    async def find_first(self, where: dict, include: dict | None = None) -> FakeModel | None:
        for p in self._procedures:
            match = True
            if "code" in where and p["code"] != where["code"]:
                match = False
            if "is_active" in where and p["is_active"] != where["is_active"]:
                match = False
            if "id" in where and p["id"] != where["id"]:
                match = False
            if match:
                proc = FakeModel(p)
                if include and include.get("steps"):
                    proc.steps = self._get_steps(p["id"])
                return proc
        return None

    async def find_many(self, where: dict = {}, order: dict | None = None) -> list[FakeModel]:
        return [FakeModel(p) for p in self._procedures if p.get("is_active", True) == where.get("is_active", True)]

    def _get_steps(self, proc_id: str) -> list[FakeModel]:
        steps = []
        for s in sorted([x for x in self._steps if x["procedure_id"] == proc_id], key=lambda x: x["order"]):
            step = FakeModel(s)
            step.fields = [FakeModel(f) for f in sorted([x for x in self._fields if x["procedure_step_id"] == s["id"]], key=lambda x: x["order"])]
            steps.append(step)
        return steps


class FakeCaseModel:
    def __init__(self, proc_model: FakeProcedureModel, field_model: "FakeCaseFieldModel") -> None:
        self._cases: list[dict] = []
        self._proc_model = proc_model
        self._field_model = field_model

    async def create(self, data: dict) -> FakeModel:
        case = {
            "id": str(uuid.uuid4()),
            "tenant_id": data["tenant_id"],
            "created_by_user_id": data["created_by_user_id"],
            "title": data["title"],
            "status": data["status"],
            "version": data.get("version", 1),
            "procedure_id": data.get("procedure_id"),
            "procedure_version": data.get("procedure_version"),
            "submitted_at": None,
            "archived_at": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        self._cases.append(case)
        return FakeModel(case)

    async def find_first(self, where: dict, include: dict | None = None) -> FakeModel | None:
        for c in self._cases:
            if c["id"] == where.get("id") and c["tenant_id"] == where.get("tenant_id"):
                model = FakeModel(c)
                if include and include.get("fields"):
                    model.fields = await self._field_model.find_many({"case_id": c["id"]})
                if include and include.get("procedure") and c.get("procedure_id"):
                    model.procedure = await self._proc_model.find_first({"id": c["procedure_id"]}, include={"steps": {"include": {"fields": True}}})
                return model
        return None

    async def find_many(self, where: dict, order: dict | None = None) -> list[FakeModel]:
        return [FakeModel(c) for c in reversed(self._cases) if c["tenant_id"] == where.get("tenant_id")]

    async def update(self, where: dict, data: dict) -> FakeModel:
        for i, c in enumerate(self._cases):
            if c["id"] == where.get("id"):
                self._cases[i].update(data)
                self._cases[i]["updated_at"] = datetime.now(timezone.utc)
                return FakeModel(self._cases[i])
        raise ValueError("Case not found")


class FakeCaseFieldModel:
    def __init__(self) -> None:
        self._fields: list[dict] = []

    async def find_many(self, where: dict) -> list[FakeModel]:
        return [FakeModel(f) for f in self._fields if f["case_id"] == where.get("case_id")]

    async def upsert(self, where: dict, data: dict) -> FakeModel:
        case_id = where["case_id_key"]["case_id"]
        key = where["case_id_key"]["key"]
        for i, f in enumerate(self._fields):
            if f["case_id"] == case_id and f["key"] == key:
                self._fields[i].update(data["update"])
                self._fields[i]["updated_at"] = datetime.now(timezone.utc)
                return FakeModel(self._fields[i])
        new_field = {
            "id": str(uuid.uuid4()),
            "case_id": case_id,
            "key": key,
            "value_json": data["create"]["value_json"],
            "value_text": None,
            "updated_at": datetime.now(timezone.utc),
        }
        self._fields.append(new_field)
        return FakeModel(new_field)


class FakeCaseSnapshotModel:
    def __init__(self) -> None:
        self._snapshots: list[dict] = []

    async def create(self, data: dict) -> FakeModel:
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
        return FakeModel(snapshot)

    async def find_first(self, where: dict, order: dict | None = None) -> FakeModel | None:
        for s in self._snapshots:
            if s["case_id"] == where.get("case_id") and s["version"] == where.get("version"):
                return FakeModel(s)
        return None

    async def find_many(self, where: dict, order: dict | None = None) -> list[FakeModel]:
        result = [FakeModel(s) for s in self._snapshots if s["case_id"] == where.get("case_id")]
        if order and order.get("version") == "desc":
            result.sort(key=lambda x: x.version, reverse=True)
        return result


class FakeCreditBalanceModel:
    def __init__(self) -> None:
        self._balances: dict[str, dict] = {}

    async def find_unique(self, where: dict) -> FakeModel | None:
        tenant_id = where.get("tenant_id")
        if tenant_id in self._balances:
            return FakeModel(self._balances[tenant_id])
        return None

    async def upsert(self, where: dict, data: dict) -> FakeModel:
        tenant_id = where.get("tenant_id")
        if tenant_id in self._balances:
            self._balances[tenant_id]["balance"] = data["update"]["balance"]
        else:
            self._balances[tenant_id] = {"tenant_id": tenant_id, "balance": data["create"]["balance"]}
        return FakeModel(self._balances[tenant_id])

    async def update(self, where: dict, data: dict) -> FakeModel:
        tenant_id = where.get("tenant_id")
        if tenant_id in self._balances:
            self._balances[tenant_id]["balance"] = data["balance"]
            return FakeModel(self._balances[tenant_id])
        raise ValueError("Balance not found")


class FakeLedgerModel:
    def __init__(self) -> None:
        self._entries: list[dict] = []

    async def create(self, data: dict) -> FakeModel:
        entry = {
            "id": str(uuid.uuid4()),
            "tenant_id": data["tenant_id"],
            "delta": data["delta"],
            "reason": data["reason"],
            "metadata_json": data.get("metadata_json"),
            "created_by_user_id": data.get("created_by_user_id"),
            "created_at": datetime.now(timezone.utc),
        }
        self._entries.append(entry)
        return FakeModel(entry)

    async def find_many(self, where: dict, order: dict | None = None, take: int | None = None) -> list[FakeModel]:
        entries = [e for e in self._entries if e["tenant_id"] == where.get("tenant_id")]
        entries.sort(key=lambda x: x["created_at"], reverse=True)
        if take:
            entries = entries[:take]
        return [FakeModel(e) for e in entries]


class FakePrisma:
    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.casefield = FakeCaseFieldModel()
        self.procedure = FakeProcedureModel()
        self.case = FakeCaseModel(self.procedure, self.casefield)
        self.casesnapshot = FakeCaseSnapshotModel()
        self.tenantcreditbalance = FakeCreditBalanceModel()
        self.creditledgerentry = FakeLedgerModel()


# --- Test Fixtures ---


def seed_iza_procedure(prisma: FakePrisma) -> str:
    """Seed the IZA v1 procedure with all fields."""
    proc = {
        "id": str(uuid.uuid4()),
        "code": "IZA",
        "name": "Internetbestellung – Import Zollanmeldung",
        "version": "v1",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    prisma.procedure._procedures.append(proc)

    # Step 1: Package
    step1 = {"id": str(uuid.uuid4()), "procedure_id": proc["id"], "step_key": "package", "title": "Über dein Paket", "order": 1, "is_active": True}
    prisma.procedure._steps.append(step1)
    prisma.procedure._fields.extend([
        {"id": str(uuid.uuid4()), "procedure_step_id": step1["id"], "field_key": "contents_description", "field_type": "TEXT", "required": True, "config_json": {}, "order": 1},
        {"id": str(uuid.uuid4()), "procedure_step_id": step1["id"], "field_key": "value_amount", "field_type": "NUMBER", "required": True, "config_json": {}, "order": 2},
        {"id": str(uuid.uuid4()), "procedure_step_id": step1["id"], "field_key": "value_currency", "field_type": "CURRENCY", "required": True, "config_json": {}, "order": 3},
        {"id": str(uuid.uuid4()), "procedure_step_id": step1["id"], "field_key": "origin_country", "field_type": "COUNTRY", "required": True, "config_json": {}, "order": 4},
    ])

    # Step 2: Sender
    step2 = {"id": str(uuid.uuid4()), "procedure_id": proc["id"], "step_key": "sender", "title": "Absender", "order": 2, "is_active": True}
    prisma.procedure._steps.append(step2)
    prisma.procedure._fields.extend([
        {"id": str(uuid.uuid4()), "procedure_step_id": step2["id"], "field_key": "sender_name", "field_type": "TEXT", "required": True, "config_json": {}, "order": 1},
        {"id": str(uuid.uuid4()), "procedure_step_id": step2["id"], "field_key": "sender_country", "field_type": "COUNTRY", "required": True, "config_json": {}, "order": 2},
    ])

    # Step 3: Recipient
    step3 = {"id": str(uuid.uuid4()), "procedure_id": proc["id"], "step_key": "recipient", "title": "Empfänger", "order": 3, "is_active": True}
    prisma.procedure._steps.append(step3)
    prisma.procedure._fields.extend([
        {"id": str(uuid.uuid4()), "procedure_step_id": step3["id"], "field_key": "recipient_full_name", "field_type": "TEXT", "required": True, "config_json": {}, "order": 1},
        {"id": str(uuid.uuid4()), "procedure_step_id": step3["id"], "field_key": "recipient_address", "field_type": "TEXT", "required": True, "config_json": {}, "order": 2},
        {"id": str(uuid.uuid4()), "procedure_step_id": step3["id"], "field_key": "recipient_city", "field_type": "TEXT", "required": True, "config_json": {}, "order": 3},
        {"id": str(uuid.uuid4()), "procedure_step_id": step3["id"], "field_key": "recipient_postcode", "field_type": "TEXT", "required": True, "config_json": {}, "order": 4},
        {"id": str(uuid.uuid4()), "procedure_step_id": step3["id"], "field_key": "recipient_country", "field_type": "COUNTRY", "required": True, "config_json": {"default": "DE"}, "order": 5},
    ])

    # Step 4: Additional
    step4 = {"id": str(uuid.uuid4()), "procedure_id": proc["id"], "step_key": "additional", "title": "Weitere Angaben", "order": 4, "is_active": True}
    prisma.procedure._steps.append(step4)
    prisma.procedure._fields.extend([
        {"id": str(uuid.uuid4()), "procedure_step_id": step4["id"], "field_key": "commercial_goods", "field_type": "BOOLEAN", "required": True, "config_json": {}, "order": 1},
        {"id": str(uuid.uuid4()), "procedure_step_id": step4["id"], "field_key": "remarks", "field_type": "TEXT", "required": False, "config_json": {}, "order": 2},
    ])

    return proc["id"]


@dataclass
class E2EContext:
    prisma: FakePrisma
    client: TestClient
    session_cookie: str
    tenant_id: str
    user_id: str


@pytest.fixture()
def e2e_ctx(monkeypatch: pytest.MonkeyPatch) -> E2EContext:
    """Setup complete E2E test context."""
    os.environ["SESSION_SECRET"] = "test-secret"
    os.environ["SESSION_TTL_MINUTES"] = "60"
    os.environ["SESSION_COOKIE_NAME"] = "zollpilot_session"

    async def noop():
        pass

    prisma = FakePrisma()
    monkeypatch.setattr("app.db.prisma_client.prisma", prisma)
    monkeypatch.setattr("app.db.prisma_client.connect_prisma", noop)
    monkeypatch.setattr("app.db.prisma_client.disconnect_prisma", noop)

    # Seed IZA procedure
    seed_iza_procedure(prisma)

    client = TestClient(create_app())
    client.headers["X-Contract-Version"] = "1"

    # Register user
    resp = client.post("/auth/register", json={"email": "test@e2e.com", "password": "Password123!"})
    assert resp.status_code == 201
    session_cookie = resp.cookies["zollpilot_session"]

    # Get user and tenant IDs
    user = next(u for u in prisma.user._users if u["email"] == "test@e2e.com")
    membership = next(m for m in prisma.membership._memberships if m["user_id"] == user["id"])

    # Seed credits for the tenant
    prisma.tenantcreditbalance._balances[membership["tenant_id"]] = {
        "tenant_id": membership["tenant_id"],
        "balance": 10,
        "updated_at": datetime.now(timezone.utc),
    }

    return E2EContext(
        prisma=prisma,
        client=client,
        session_cookie=session_cookie,
        tenant_id=membership["tenant_id"],
        user_id=user["id"],
    )


# --- Full Happy Path Test ---


class TestFullHappyPath:
    """Test the complete user journey: Register → Case → IZA → Submit → PDF"""

    def test_complete_iza_flow(self, e2e_ctx: E2EContext) -> None:
        """Complete flow from case creation to PDF export."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        # 1. Create Case
        resp = client.post("/cases", json={"title": "Meine erste Sendung"}, cookies=cookies)
        assert resp.status_code == 201
        case_id = resp.json()["data"]["id"]

        # 2. Bind IZA Procedure
        resp = client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)
        assert resp.status_code == 200
        assert resp.json()["data"]["procedure_code"] == "IZA"

        # 3. Fill all required fields
        fields_data = {
            "contents_description": "Smartphone",
            "value_amount": 299.99,
            "value_currency": "EUR",
            "origin_country": "CN",
            "sender_name": "China Shop Ltd",
            "sender_country": "CN",
            "recipient_full_name": "Max Mustermann",
            "recipient_address": "Musterstraße 123",
            "recipient_city": "Berlin",
            "recipient_postcode": "10115",
            "recipient_country": "DE",
            "commercial_goods": False,
        }

        for key, value in fields_data.items():
            resp = client.put(f"/cases/{case_id}/fields/{key}", json={"value": value}, cookies=cookies)
            assert resp.status_code == 200

        # 4. Validate
        resp = client.post(f"/cases/{case_id}/validate", cookies=cookies)
        assert resp.status_code == 200
        assert resp.json()["data"]["valid"] is True

        # 5. Submit
        resp = client.post(f"/cases/{case_id}/submit", cookies=cookies)
        assert resp.status_code == 200
        submit_data = resp.json()["data"]
        assert submit_data["status"] == "SUBMITTED"
        assert "snapshot_id" in submit_data

        # 6. Get Summary
        resp = client.get(f"/cases/{case_id}/summary", cookies=cookies)
        assert resp.status_code == 200
        summary = resp.json()["data"]
        assert summary["procedure"]["code"] == "IZA"
        assert len(summary["sections"]) == 4

        # 7. Export PDF
        resp = client.post(f"/cases/{case_id}/pdf", cookies=cookies)
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert "Content-Disposition" in resp.headers

        # 8. Verify credit was consumed
        balance = e2e_ctx.prisma.tenantcreditbalance._balances[e2e_ctx.tenant_id]
        assert balance["balance"] == 9  # Started with 10, consumed 1


# --- Negative Path Tests ---


class TestNegativePaths:
    """Test error cases and edge conditions."""

    def test_submit_without_required_fields(self, e2e_ctx: E2EContext) -> None:
        """Submit case with missing fields returns CASE_INVALID."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        # Create case and bind procedure
        resp = client.post("/cases", json={"title": "Incomplete"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]
        client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

        # Try to submit without filling fields
        resp = client.post(f"/cases/{case_id}/submit", cookies=cookies)
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "CASE_INVALID"

    def test_pdf_export_without_submit(self, e2e_ctx: E2EContext) -> None:
        """PDF export on non-submitted case returns CASE_NOT_SUBMITTED."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        # Create case (don't submit)
        resp = client.post("/cases", json={"title": "Not Submitted"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]

        # Try to export PDF
        resp = client.post(f"/cases/{case_id}/pdf", cookies=cookies)
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "CASE_NOT_SUBMITTED"

    def test_pdf_export_consumes_credits(self, e2e_ctx: E2EContext) -> None:
        """Each PDF export consumes exactly 1 credit."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        # Create and submit a valid case
        resp = client.post("/cases", json={"title": "Credit Test"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]
        client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

        # Fill required fields
        for key, value in {
            "contents_description": "Test", "value_amount": 50, "value_currency": "EUR",
            "origin_country": "US", "sender_name": "Sender", "sender_country": "US",
            "recipient_full_name": "Recipient", "recipient_address": "Addr",
            "recipient_city": "City", "recipient_postcode": "12345",
            "recipient_country": "DE", "commercial_goods": False,
        }.items():
            client.put(f"/cases/{case_id}/fields/{key}", json={"value": value}, cookies=cookies)

        client.post(f"/cases/{case_id}/submit", cookies=cookies)

        initial_balance = e2e_ctx.prisma.tenantcreditbalance._balances[e2e_ctx.tenant_id]["balance"]

        # Export PDF twice
        client.post(f"/cases/{case_id}/pdf", cookies=cookies)
        client.post(f"/cases/{case_id}/pdf", cookies=cookies)

        final_balance = e2e_ctx.prisma.tenantcreditbalance._balances[e2e_ctx.tenant_id]["balance"]
        assert final_balance == initial_balance - 2

    def test_insufficient_credits_blocks_pdf(self, e2e_ctx: E2EContext) -> None:
        """PDF export with 0 credits returns INSUFFICIENT_CREDITS."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        # Set balance to 0
        e2e_ctx.prisma.tenantcreditbalance._balances[e2e_ctx.tenant_id]["balance"] = 0

        # Create and submit case
        resp = client.post("/cases", json={"title": "No Credits"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]
        client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

        for key, value in {
            "contents_description": "Test", "value_amount": 50, "value_currency": "EUR",
            "origin_country": "US", "sender_name": "Sender", "sender_country": "US",
            "recipient_full_name": "Recipient", "recipient_address": "Addr",
            "recipient_city": "City", "recipient_postcode": "12345",
            "recipient_country": "DE", "commercial_goods": False,
        }.items():
            client.put(f"/cases/{case_id}/fields/{key}", json={"value": value}, cookies=cookies)

        client.post(f"/cases/{case_id}/submit", cookies=cookies)

        # Try to export PDF
        resp = client.post(f"/cases/{case_id}/pdf", cookies=cookies)
        assert resp.status_code == 402
        assert resp.json()["error"]["code"] == "INSUFFICIENT_CREDITS"

    def test_field_update_blocked_after_submit(self, e2e_ctx: E2EContext) -> None:
        """Field updates after submit return CASE_NOT_EDITABLE."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        # Create, fill, and submit case
        resp = client.post("/cases", json={"title": "Locked"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]
        client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

        for key, value in {
            "contents_description": "Test", "value_amount": 50, "value_currency": "EUR",
            "origin_country": "US", "sender_name": "Sender", "sender_country": "US",
            "recipient_full_name": "Recipient", "recipient_address": "Addr",
            "recipient_city": "City", "recipient_postcode": "12345",
            "recipient_country": "DE", "commercial_goods": False,
        }.items():
            client.put(f"/cases/{case_id}/fields/{key}", json={"value": value}, cookies=cookies)

        client.post(f"/cases/{case_id}/submit", cookies=cookies)

        # Try to update a field
        resp = client.put(f"/cases/{case_id}/fields/contents_description", json={"value": "Changed"}, cookies=cookies)
        assert resp.status_code == 409
        assert resp.json()["error"]["code"] == "CASE_NOT_EDITABLE"


class TestTenantIsolation:
    """Test that tenants cannot access each other's data."""

    def test_user_cannot_access_other_tenant_case(self, e2e_ctx: E2EContext, monkeypatch: pytest.MonkeyPatch) -> None:
        """User from Tenant A cannot access cases from Tenant B."""
        client = e2e_ctx.client

        # User A creates a case
        cookies_a = {"zollpilot_session": e2e_ctx.session_cookie}
        resp = client.post("/cases", json={"title": "Tenant A Case"}, cookies=cookies_a)
        case_id = resp.json()["data"]["id"]

        # Register User B (different tenant)
        resp = client.post("/auth/register", json={"email": "userb@tenant.com", "password": "Password123!"})
        assert resp.status_code == 201
        cookies_b = {"zollpilot_session": resp.cookies["zollpilot_session"]}

        # User B tries to access User A's case
        resp = client.get(f"/cases/{case_id}", cookies=cookies_b)
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "CASE_NOT_FOUND"

        # User B tries to modify User A's case
        resp = client.put(f"/cases/{case_id}/fields/test", json={"value": "hack"}, cookies=cookies_b)
        assert resp.status_code == 404


class TestValidationRules:
    """Test IZA-specific validation rules."""

    def test_origin_country_must_not_be_de(self, e2e_ctx: E2EContext) -> None:
        """Origin country DE is rejected."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        resp = client.post("/cases", json={"title": "DE Origin"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]
        client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

        # Fill fields with origin_country = DE
        for key, value in {
            "contents_description": "Test", "value_amount": 50, "value_currency": "EUR",
            "origin_country": "DE",  # Invalid!
            "sender_name": "Sender", "sender_country": "US",
            "recipient_full_name": "Recipient", "recipient_address": "Addr",
            "recipient_city": "City", "recipient_postcode": "12345",
            "recipient_country": "DE", "commercial_goods": False,
        }.items():
            client.put(f"/cases/{case_id}/fields/{key}", json={"value": value}, cookies=cookies)

        resp = client.post(f"/cases/{case_id}/validate", cookies=cookies)
        assert resp.status_code == 200
        assert resp.json()["data"]["valid"] is False
        errors = resp.json()["data"]["errors"]
        assert any(e["field_key"] == "origin_country" for e in errors)

    def test_commercial_goods_requires_remarks(self, e2e_ctx: E2EContext) -> None:
        """When commercial_goods is true, remarks is required."""
        client = e2e_ctx.client
        cookies = {"zollpilot_session": e2e_ctx.session_cookie}

        resp = client.post("/cases", json={"title": "Commercial"}, cookies=cookies)
        case_id = resp.json()["data"]["id"]
        client.post(f"/cases/{case_id}/procedure", json={"procedure_code": "IZA"}, cookies=cookies)

        # Fill fields with commercial_goods=true but no remarks
        for key, value in {
            "contents_description": "Test", "value_amount": 50, "value_currency": "EUR",
            "origin_country": "US", "sender_name": "Sender", "sender_country": "US",
            "recipient_full_name": "Recipient", "recipient_address": "Addr",
            "recipient_city": "City", "recipient_postcode": "12345",
            "recipient_country": "DE",
            "commercial_goods": True,  # True but no remarks!
        }.items():
            client.put(f"/cases/{case_id}/fields/{key}", json={"value": value}, cookies=cookies)

        resp = client.post(f"/cases/{case_id}/validate", cookies=cookies)
        assert resp.status_code == 200
        assert resp.json()["data"]["valid"] is False
        errors = resp.json()["data"]["errors"]
        assert any(e["field_key"] == "remarks" for e in errors)

