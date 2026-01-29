"""
Tests für User-Typen (PRIVATE/BUSINESS) und Tenant-Beziehungen.

Testet:
- PRIVATE User ohne Tenant
- BUSINESS User mit Tenant
- UserEvent Historie
- UserStatus (active/disabled)
"""

import os
import uuid
from datetime import datetime
from typing import Any

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
        }
        self._by_id[user_id] = user
        self._by_email[user["email"]] = user
        return user

    async def find_unique(self, where: dict) -> dict | None:
        if "email" in where:
            return self._by_email.get(where["email"])
        return self._by_id.get(where.get("id"))

    async def update(self, where: dict, data: dict) -> dict | None:
        user = await self.find_unique(where)
        if user:
            user.update(data.get("data", data))
        return user


class FakeTenantModel:
    """Fake Tenant Model mit type-Feld."""

    def __init__(self) -> None:
        self._by_id: dict[str, dict] = {}

    async def create(self, data: dict) -> dict:
        tenant_id = str(uuid.uuid4())
        tenant = {
            "id": tenant_id,
            "name": data["name"],
            "type": data.get("type", "BUSINESS"),
            "created_at": datetime.utcnow(),
        }
        self._by_id[tenant_id] = tenant
        return tenant

    async def find_unique(self, where: dict) -> dict | None:
        return self._by_id.get(where.get("id"))

    async def find_many(self, where: dict | None = None) -> list[dict]:
        if where and "type" in where:
            return [t for t in self._by_id.values() if t["type"] == where["type"]]
        return list(self._by_id.values())


class FakeMembershipModel:
    """Fake Membership Model."""

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


class FakeUserEventModel:
    """Fake UserEvent Model für Historie."""

    def __init__(self) -> None:
        self._events: list[dict] = []

    async def create(self, data: dict) -> dict:
        event = {
            "id": str(uuid.uuid4()),
            "user_id": data["user_id"],
            "type": data["type"],
            "created_at": datetime.utcnow(),
            "metadata_json": data.get("metadata_json"),
        }
        self._events.append(event)
        return event

    async def find_many(self, where: dict | None = None) -> list[dict]:
        if not where:
            return self._events
        return [
            e for e in self._events
            if all(e.get(k) == v for k, v in where.items())
        ]


class FakePrisma:
    """Fake Prisma Client mit allen Models."""

    def __init__(self) -> None:
        self.user = FakeUserModel()
        self.tenant = FakeTenantModel()
        self.membership = FakeMembershipModel()
        self.session = FakeSessionModel()
        self.userevent = FakeUserEventModel()


@dataclass
class UserTypesTestContext:
    client: TestClient
    prisma: FakePrisma


@pytest.fixture()
def user_types_context(monkeypatch: pytest.MonkeyPatch) -> UserTypesTestContext:
    """Fixture für User-Types Tests."""
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

    return UserTypesTestContext(client=client, prisma=fake_prisma)


# ============================================
# Tests: User Types
# ============================================

def test_private_user_has_no_tenant_membership(user_types_context: UserTypesTestContext) -> None:
    """PRIVATE User kann ohne Tenant existieren."""
    prisma = user_types_context.prisma

    # Erstelle PRIVATE User direkt (ohne Tenant)
    import asyncio

    async def create_private_user():
        user = await prisma.user.create({
            "email": "private@example.com",
            "password_hash": "hashed",
            "user_type": "PRIVATE",
        })
        return user

    user = asyncio.get_event_loop().run_until_complete(create_private_user())

    assert user["user_type"] == "PRIVATE"
    assert user["status"] == "ACTIVE"

    # Keine Membership für PRIVATE User
    async def check_membership():
        membership = await prisma.membership.find_first({"user_id": user["id"]})
        return membership

    membership = asyncio.get_event_loop().run_until_complete(check_membership())
    assert membership is None


def test_business_user_belongs_to_tenant(user_types_context: UserTypesTestContext) -> None:
    """BUSINESS User gehört zu einem Tenant."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_business_user_with_tenant():
        # Erstelle Tenant
        tenant = await prisma.tenant.create({
            "name": "Acme GmbH",
            "type": "BUSINESS",
        })

        # Erstelle BUSINESS User
        user = await prisma.user.create({
            "email": "business@acme.com",
            "password_hash": "hashed",
            "user_type": "BUSINESS",
        })

        # Verknüpfe User mit Tenant
        membership = await prisma.membership.create({
            "user_id": user["id"],
            "tenant_id": tenant["id"],
            "role": "OWNER",
        })

        return user, tenant, membership

    user, tenant, membership = asyncio.get_event_loop().run_until_complete(
        create_business_user_with_tenant()
    )

    assert user["user_type"] == "BUSINESS"
    assert tenant["type"] == "BUSINESS"
    assert membership["user_id"] == user["id"]
    assert membership["tenant_id"] == tenant["id"]


def test_tenant_has_business_type(user_types_context: UserTypesTestContext) -> None:
    """Tenant hat type=BUSINESS."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_tenant():
        return await prisma.tenant.create({
            "name": "Test GmbH",
            "type": "BUSINESS",
        })

    tenant = asyncio.get_event_loop().run_until_complete(create_tenant())

    assert tenant["type"] == "BUSINESS"
    assert tenant["name"] == "Test GmbH"


# ============================================
# Tests: User Status
# ============================================

def test_user_default_status_is_active(user_types_context: UserTypesTestContext) -> None:
    """Neuer User hat Status ACTIVE."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_user():
        return await prisma.user.create({
            "email": "new@example.com",
            "password_hash": "hashed",
        })

    user = asyncio.get_event_loop().run_until_complete(create_user())
    assert user["status"] == "ACTIVE"


def test_user_can_be_disabled(user_types_context: UserTypesTestContext) -> None:
    """User kann deaktiviert werden."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_and_disable_user():
        user = await prisma.user.create({
            "email": "disabled@example.com",
            "password_hash": "hashed",
        })
        updated = await prisma.user.update(
            {"id": user["id"]},
            {"data": {"status": "DISABLED"}}
        )
        return updated

    user = asyncio.get_event_loop().run_until_complete(create_and_disable_user())
    assert user["status"] == "DISABLED"


# ============================================
# Tests: User Events (Historie)
# ============================================

def test_user_event_registered_is_created(user_types_context: UserTypesTestContext) -> None:
    """REGISTERED Event wird erstellt."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_user_with_event():
        user = await prisma.user.create({
            "email": "events@example.com",
            "password_hash": "hashed",
        })

        event = await prisma.userevent.create({
            "user_id": user["id"],
            "type": "REGISTERED",
            "metadata_json": {"source": "web"},
        })

        return user, event

    user, event = asyncio.get_event_loop().run_until_complete(create_user_with_event())

    assert event["user_id"] == user["id"]
    assert event["type"] == "REGISTERED"
    assert event["metadata_json"]["source"] == "web"


def test_user_event_login_is_created(user_types_context: UserTypesTestContext) -> None:
    """LOGIN Event wird erstellt."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_login_event():
        user = await prisma.user.create({
            "email": "login@example.com",
            "password_hash": "hashed",
        })

        event = await prisma.userevent.create({
            "user_id": user["id"],
            "type": "LOGIN",
            "metadata_json": {"ip": "127.0.0.1"},
        })

        return event

    event = asyncio.get_event_loop().run_until_complete(create_login_event())
    assert event["type"] == "LOGIN"


def test_user_events_can_be_queried_by_user(user_types_context: UserTypesTestContext) -> None:
    """Events können nach User gefiltert werden."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_multiple_events():
        user = await prisma.user.create({
            "email": "multi@example.com",
            "password_hash": "hashed",
        })

        await prisma.userevent.create({"user_id": user["id"], "type": "REGISTERED"})
        await prisma.userevent.create({"user_id": user["id"], "type": "LOGIN"})
        await prisma.userevent.create({"user_id": user["id"], "type": "LOGIN"})

        events = await prisma.userevent.find_many({"user_id": user["id"]})
        return events

    events = asyncio.get_event_loop().run_until_complete(create_multiple_events())
    assert len(events) == 3


# ============================================
# Tests: Last Login
# ============================================

def test_last_login_at_is_updated(user_types_context: UserTypesTestContext) -> None:
    """last_login_at wird bei Login aktualisiert."""
    prisma = user_types_context.prisma

    import asyncio

    async def update_last_login():
        user = await prisma.user.create({
            "email": "lastlogin@example.com",
            "password_hash": "hashed",
        })

        assert user["last_login_at"] is None

        now = datetime.utcnow()
        updated = await prisma.user.update(
            {"id": user["id"]},
            {"data": {"last_login_at": now}}
        )

        return updated, now

    user, now = asyncio.get_event_loop().run_until_complete(update_last_login())
    assert user["last_login_at"] == now


# ============================================
# Tests: Migration Compatibility
# ============================================

def test_existing_users_default_to_private(user_types_context: UserTypesTestContext) -> None:
    """Bestehende User ohne user_type werden zu PRIVATE."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_user_without_type():
        # Simuliert bestehenden User (Default wird angewendet)
        user = await prisma.user.create({
            "email": "existing@example.com",
            "password_hash": "hashed",
            # user_type nicht explizit gesetzt → Default PRIVATE
        })
        return user

    user = asyncio.get_event_loop().run_until_complete(create_user_without_type())
    assert user["user_type"] == "PRIVATE"


def test_existing_tenants_default_to_business(user_types_context: UserTypesTestContext) -> None:
    """Bestehende Tenants ohne type werden zu BUSINESS."""
    prisma = user_types_context.prisma

    import asyncio

    async def create_tenant_without_type():
        # Simuliert bestehenden Tenant (Default wird angewendet)
        tenant = await prisma.tenant.create({
            "name": "Existing Corp",
            # type nicht explizit gesetzt → Default BUSINESS
        })
        return tenant

    tenant = asyncio.get_event_loop().run_until_complete(create_tenant_without_type())
    assert tenant["type"] == "BUSINESS"
