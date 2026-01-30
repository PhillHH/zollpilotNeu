"""
Tests for Admin Content API (Blog & FAQ management).

These endpoints require EDITOR role or higher.
"""

import os
import uuid
from dataclasses import dataclass
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


class FakeBlogPostModel:
    def __init__(self) -> None:
        self._posts: list[dict] = []

    async def find_many(
        self, where: dict | None = None, order: dict | None = None
    ) -> list[dict]:
        posts = self._posts
        if where:
            if "status" in where:
                posts = [p for p in posts if p.get("status") == where.get("status")]
        if order and order.get("created_at") == "desc":
            posts = sorted(posts, key=lambda x: x.get("created_at", ""), reverse=True)
        return posts

    async def find_unique(self, where: dict) -> dict | None:
        for post in self._posts:
            if "id" in where and post.get("id") == where["id"]:
                return post
            if "slug" in where and post.get("slug") == where["slug"]:
                return post
        return None

    async def create(self, data: dict) -> dict:
        post = {
            "id": str(uuid.uuid4()),
            **data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._posts.append(post)
        return _DictWrapper(post)

    async def update(self, where: dict, data: dict) -> dict:
        for post in self._posts:
            if post.get("id") == where["id"]:
                post.update(data)
                post["updated_at"] = datetime.utcnow()
                return _DictWrapper(post)
        return None

    async def delete(self, where: dict) -> None:
        self._posts = [p for p in self._posts if p.get("id") != where["id"]]


class FakeFaqEntryModel:
    def __init__(self) -> None:
        self._entries: list[dict] = []

    async def find_many(
        self,
        where: dict | None = None,
        order: list[dict] | None = None,
        include: dict | None = None,
    ) -> list[dict]:
        entries = self._entries
        if where:
            if "status" in where:
                entries = [e for e in entries if e.get("status") == where.get("status")]
            if "category" in where:
                entries = [e for e in entries if e.get("category") == where.get("category")]
        return entries

    async def find_unique(self, where: dict) -> dict | None:
        for entry in self._entries:
            if entry.get("id") == where.get("id"):
                return entry
        return None

    async def create(self, data: dict) -> dict:
        entry = {
            "id": str(uuid.uuid4()),
            **data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._entries.append(entry)
        return _DictWrapper(entry)

    async def update(self, where: dict, data: dict) -> dict:
        for entry in self._entries:
            if entry.get("id") == where["id"]:
                entry.update(data)
                entry["updated_at"] = datetime.utcnow()
                return _DictWrapper(entry)
        return None

    async def delete(self, where: dict) -> None:
        self._entries = [e for e in self._entries if e.get("id") != where["id"]]


class _DictWrapper:
    """Wrapper to make dict accessible via attribute access."""
    def __init__(self, data: dict):
        self._data = data

    def __getattr__(self, name: str):
        return self._data.get(name)

    def model_dump(self) -> dict:
        return self._data


class FakeUserModel:
    def __init__(self) -> None:
        self._users: dict[str, dict] = {}

    async def find_unique(self, where: dict) -> dict | None:
        user_id = where.get("id")
        if user_id and user_id in self._users:
            return _DictWrapper(self._users[user_id])
        return None

    def add(self, user_id: str, email: str, role: str = "EDITOR") -> dict:
        user = {
            "id": user_id,
            "email": email,
            "status": "ACTIVE",
            "user_type": "BUSINESS",
        }
        self._users[user_id] = user
        return user


class FakeMembershipModel:
    def __init__(self) -> None:
        self._memberships: list[dict] = []

    async def find_first(self, where: dict) -> dict | None:
        for m in self._memberships:
            if m.get("user_id") == where.get("user_id"):
                return _DictWrapper(m)
        return None

    def add(self, user_id: str, tenant_id: str, role: str) -> dict:
        membership = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "role": role,
        }
        self._memberships.append(membership)
        return membership


class FakeTenantModel:
    def __init__(self) -> None:
        self._tenants: dict[str, dict] = {}

    async def find_unique(self, where: dict) -> dict | None:
        tenant_id = where.get("id")
        if tenant_id and tenant_id in self._tenants:
            return _DictWrapper(self._tenants[tenant_id])
        return None

    def add(self, tenant_id: str, name: str) -> dict:
        tenant = {
            "id": tenant_id,
            "name": name,
            "type": "BUSINESS",
        }
        self._tenants[tenant_id] = tenant
        return tenant


class FakeSessionModel:
    pass


class FakePrisma:
    def __init__(self) -> None:
        self.blogpost = FakeBlogPostModel()
        self.faqentry = FakeFaqEntryModel()
        self.user = FakeUserModel()
        self.membership = FakeMembershipModel()
        self.tenant = FakeTenantModel()
        self.session = FakeSessionModel()


@dataclass
class AdminContentTestContext:
    prisma: FakePrisma
    client: TestClient
    user_id: str
    tenant_id: str


def create_session_state(user_id: str):
    """Create a mock session state."""
    class MockSession:
        def __init__(self, uid: str):
            self.user_id = uid
    return MockSession(user_id)


@pytest.fixture()
def admin_context(monkeypatch: pytest.MonkeyPatch) -> AdminContentTestContext:
    os.environ["SESSION_SECRET"] = "test-secret"
    os.environ["SESSION_TTL_MINUTES"] = "60"
    os.environ["SESSION_COOKIE_NAME"] = "zollpilot_session"

    async def _noop() -> None:
        return None

    fake_prisma = FakePrisma()
    monkeypatch.setattr("app.db.prisma_client.prisma", fake_prisma)
    monkeypatch.setattr("app.db.prisma_client.connect_prisma", _noop)
    monkeypatch.setattr("app.db.prisma_client.disconnect_prisma", _noop)

    # Create test user with EDITOR role
    user_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    fake_prisma.user.add(user_id, "editor@test.com", "EDITOR")
    fake_prisma.tenant.add(tenant_id, "Test Tenant")
    fake_prisma.membership.add(user_id, tenant_id, "EDITOR")

    # Patch session middleware to inject our user
    def mock_session_middleware(self, request, call_next):
        request.state.session = create_session_state(user_id)
        request.state.session_token_hash = "test-hash"
        return call_next(request)

    from app.middleware import session
    monkeypatch.setattr(session.SessionMiddleware, "__call__", mock_session_middleware)

    client = TestClient(create_app())
    client.headers["X-Contract-Version"] = "1"

    return AdminContentTestContext(
        prisma=fake_prisma,
        client=client,
        user_id=user_id,
        tenant_id=tenant_id,
    )


@pytest.fixture()
def user_context(monkeypatch: pytest.MonkeyPatch) -> AdminContentTestContext:
    """Context with USER role (should be denied access)."""
    os.environ["SESSION_SECRET"] = "test-secret"
    os.environ["SESSION_TTL_MINUTES"] = "60"
    os.environ["SESSION_COOKIE_NAME"] = "zollpilot_session"

    async def _noop() -> None:
        return None

    fake_prisma = FakePrisma()
    monkeypatch.setattr("app.db.prisma_client.prisma", fake_prisma)
    monkeypatch.setattr("app.db.prisma_client.connect_prisma", _noop)
    monkeypatch.setattr("app.db.prisma_client.disconnect_prisma", _noop)

    # Create test user with USER role (should not have content access)
    user_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    fake_prisma.user.add(user_id, "user@test.com", "USER")
    fake_prisma.tenant.add(tenant_id, "Test Tenant")
    fake_prisma.membership.add(user_id, tenant_id, "USER")

    def mock_session_middleware(self, request, call_next):
        request.state.session = create_session_state(user_id)
        request.state.session_token_hash = "test-hash"
        return call_next(request)

    from app.middleware import session
    monkeypatch.setattr(session.SessionMiddleware, "__call__", mock_session_middleware)

    client = TestClient(create_app())
    client.headers["X-Contract-Version"] = "1"

    return AdminContentTestContext(
        prisma=fake_prisma,
        client=client,
        user_id=user_id,
        tenant_id=tenant_id,
    )


# --- Role-Based Access Tests ---


def test_editor_can_list_blog_posts(admin_context: AdminContentTestContext) -> None:
    """EDITOR role can list blog posts."""
    response = admin_context.client.get("/admin/content/blog")
    assert response.status_code == 200
    assert "data" in response.json()


def test_editor_can_create_blog_post(admin_context: AdminContentTestContext) -> None:
    """EDITOR role can create blog posts."""
    response = admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "Test Post",
            "slug": "test-post",
            "excerpt": "Test excerpt",
            "content": "Test content",
        },
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["title"] == "Test Post"
    assert data["status"] == "DRAFT"


def test_user_cannot_access_admin_content(user_context: AdminContentTestContext) -> None:
    """USER role cannot access admin content endpoints."""
    response = user_context.client.get("/admin/content/blog")
    assert response.status_code == 403
    body = response.json()
    assert body["error"]["code"] == "FORBIDDEN"


def test_user_cannot_create_blog_post(user_context: AdminContentTestContext) -> None:
    """USER role cannot create blog posts."""
    response = user_context.client.post(
        "/admin/content/blog",
        json={
            "title": "Test Post",
            "slug": "test-post",
            "excerpt": "Test excerpt",
            "content": "Test content",
        },
    )
    assert response.status_code == 403


# --- Blog CRUD Tests ---


def test_create_blog_post_with_published_status(
    admin_context: AdminContentTestContext,
) -> None:
    """Creating a blog post with PUBLISHED status sets published_at."""
    response = admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "Published Post",
            "slug": "published-post",
            "excerpt": "Excerpt",
            "content": "Content",
            "status": "PUBLISHED",
        },
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["status"] == "PUBLISHED"
    assert data["published_at"] is not None


def test_create_blog_post_slug_unique(admin_context: AdminContentTestContext) -> None:
    """Cannot create two blog posts with same slug."""
    admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "First Post",
            "slug": "duplicate-slug",
            "excerpt": "Excerpt",
            "content": "Content",
        },
    )

    response = admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "Second Post",
            "slug": "duplicate-slug",
            "excerpt": "Excerpt",
            "content": "Content",
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "SLUG_EXISTS"


def test_update_blog_post(admin_context: AdminContentTestContext) -> None:
    """Can update an existing blog post."""
    # Create first
    create_response = admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "Original Title",
            "slug": "original-slug",
            "excerpt": "Excerpt",
            "content": "Content",
        },
    )
    post_id = create_response.json()["data"]["id"]

    # Update
    response = admin_context.client.put(
        f"/admin/content/blog/{post_id}",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Updated Title"


def test_delete_blog_post(admin_context: AdminContentTestContext) -> None:
    """Can delete a blog post."""
    # Create first
    create_response = admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "To Delete",
            "slug": "to-delete",
            "excerpt": "Excerpt",
            "content": "Content",
        },
    )
    post_id = create_response.json()["data"]["id"]

    # Delete
    response = admin_context.client.delete(f"/admin/content/blog/{post_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = admin_context.client.get(f"/admin/content/blog/{post_id}")
    assert get_response.status_code == 404


# --- FAQ CRUD Tests ---


def test_editor_can_list_faq_entries(admin_context: AdminContentTestContext) -> None:
    """EDITOR role can list FAQ entries."""
    response = admin_context.client.get("/admin/content/faq")
    assert response.status_code == 200
    assert "data" in response.json()


def test_create_faq_entry(admin_context: AdminContentTestContext) -> None:
    """Can create a FAQ entry."""
    response = admin_context.client.post(
        "/admin/content/faq",
        json={
            "question": "What is ZollPilot?",
            "answer": "ZollPilot helps with customs.",
            "category": "Allgemein",
        },
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["question"] == "What is ZollPilot?"
    assert data["status"] == "DRAFT"


def test_update_faq_entry(admin_context: AdminContentTestContext) -> None:
    """Can update a FAQ entry."""
    # Create first
    create_response = admin_context.client.post(
        "/admin/content/faq",
        json={
            "question": "Original question?",
            "answer": "Original answer.",
        },
    )
    entry_id = create_response.json()["data"]["id"]

    # Update
    response = admin_context.client.put(
        f"/admin/content/faq/{entry_id}",
        json={"question": "Updated question?"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["question"] == "Updated question?"


def test_delete_faq_entry(admin_context: AdminContentTestContext) -> None:
    """Can delete a FAQ entry."""
    # Create first
    create_response = admin_context.client.post(
        "/admin/content/faq",
        json={
            "question": "To delete?",
            "answer": "Answer.",
        },
    )
    entry_id = create_response.json()["data"]["id"]

    # Delete
    response = admin_context.client.delete(f"/admin/content/faq/{entry_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = admin_context.client.get(f"/admin/content/faq/{entry_id}")
    assert get_response.status_code == 404


def test_publish_faq_entry(admin_context: AdminContentTestContext) -> None:
    """Publishing a FAQ entry sets published_at."""
    # Create as draft
    create_response = admin_context.client.post(
        "/admin/content/faq",
        json={
            "question": "Draft question?",
            "answer": "Draft answer.",
        },
    )
    entry_id = create_response.json()["data"]["id"]

    # Publish
    response = admin_context.client.put(
        f"/admin/content/faq/{entry_id}",
        json={"status": "PUBLISHED"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "PUBLISHED"
    assert data["published_at"] is not None


# --- Categories Test ---


def test_list_faq_categories(admin_context: AdminContentTestContext) -> None:
    """Can list unique FAQ categories."""
    # Create entries with different categories
    admin_context.client.post(
        "/admin/content/faq",
        json={"question": "Q1?", "answer": "A1", "category": "Category A"},
    )
    admin_context.client.post(
        "/admin/content/faq",
        json={"question": "Q2?", "answer": "A2", "category": "Category B"},
    )

    response = admin_context.client.get("/admin/content/categories")
    assert response.status_code == 200
    categories = response.json()["data"]
    assert "Category A" in categories
    assert "Category B" in categories


# --- Validation Tests ---


def test_blog_slug_validation(admin_context: AdminContentTestContext) -> None:
    """Blog slug must be lowercase alphanumeric with hyphens."""
    response = admin_context.client.post(
        "/admin/content/blog",
        json={
            "title": "Test",
            "slug": "Invalid Slug!",
            "excerpt": "Excerpt",
            "content": "Content",
        },
    )
    assert response.status_code == 400  # Validation error


def test_faq_question_required(admin_context: AdminContentTestContext) -> None:
    """FAQ question is required."""
    response = admin_context.client.post(
        "/admin/content/faq",
        json={
            "question": "",  # Empty
            "answer": "Answer",
        },
    )
    assert response.status_code == 400  # Validation error
