"""
Tests for Content API (Blog & FAQ).

These are public, read-only endpoints that don't require authentication.
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
            posts = [p for p in posts if p.get("status") == where.get("status")]
        if order and order.get("published_at") == "desc":
            posts = sorted(posts, key=lambda x: x.get("published_at") or "", reverse=True)
        return posts

    async def find_first(self, where: dict) -> dict | None:
        for post in self._posts:
            matches = True
            for key, value in where.items():
                if post.get(key) != value:
                    matches = False
                    break
            if matches:
                return post
        return None

    def add(
        self,
        title: str,
        slug: str,
        excerpt: str,
        content: str,
        status: str = "PUBLISHED",
        published_at: datetime | None = None,
        meta_title: str | None = None,
        meta_description: str | None = None,
    ) -> dict:
        post = {
            "id": str(uuid.uuid4()),
            "title": title,
            "slug": slug,
            "excerpt": excerpt,
            "content": content,
            "status": status,
            "published_at": published_at or datetime.utcnow(),
            "meta_title": meta_title,
            "meta_description": meta_description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._posts.append(post)
        return post


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
            entries = [e for e in entries if e.get("status") == where.get("status")]
        if order:
            # Sort by multiple keys
            for sort_spec in reversed(order):
                key = list(sort_spec.keys())[0]
                reverse = sort_spec[key] == "desc"
                entries = sorted(entries, key=lambda x: x.get(key, 0), reverse=reverse)
        return entries

    def add(
        self,
        question: str,
        answer: str,
        category: str = "Allgemein",
        order_index: int = 0,
        status: str = "PUBLISHED",
        related_blog_post: dict | None = None,
    ) -> dict:
        entry = {
            "id": str(uuid.uuid4()),
            "question": question,
            "answer": answer,
            "category": category,
            "order_index": order_index,
            "status": status,
            "published_at": datetime.utcnow(),
            "related_blog_post": related_blog_post,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._entries.append(entry)
        return entry


class FakePrisma:
    def __init__(self) -> None:
        self.blogpost = FakeBlogPostModel()
        self.faqentry = FakeFaqEntryModel()


@dataclass
class ContentTestContext:
    prisma: FakePrisma
    client: TestClient


@pytest.fixture()
def content_context(monkeypatch: pytest.MonkeyPatch) -> ContentTestContext:
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

    return ContentTestContext(prisma=fake_prisma, client=client)


# --- Blog List Tests ---


def test_blog_list_returns_empty_array_when_no_posts(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog returns empty array when no posts exist."""
    response = content_context.client.get("/content/blog")
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []


def test_blog_list_returns_published_posts_only(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog returns only PUBLISHED posts."""
    # Add a published and a draft post
    content_context.prisma.blogpost.add(
        title="Published Post",
        slug="published-post",
        excerpt="This is published",
        content="Full content here",
        status="PUBLISHED",
    )
    content_context.prisma.blogpost.add(
        title="Draft Post",
        slug="draft-post",
        excerpt="This is a draft",
        content="Draft content",
        status="DRAFT",
    )

    response = content_context.client.get("/content/blog")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["title"] == "Published Post"
    assert body["data"][0]["slug"] == "published-post"


def test_blog_list_returns_posts_sorted_by_published_at_desc(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog returns posts sorted by published_at descending."""
    older = datetime(2024, 1, 1, 12, 0, 0)
    newer = datetime(2024, 6, 15, 12, 0, 0)

    content_context.prisma.blogpost.add(
        title="Older Post",
        slug="older-post",
        excerpt="Older",
        content="Older content",
        published_at=older,
    )
    content_context.prisma.blogpost.add(
        title="Newer Post",
        slug="newer-post",
        excerpt="Newer",
        content="Newer content",
        published_at=newer,
    )

    response = content_context.client.get("/content/blog")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 2
    assert body["data"][0]["title"] == "Newer Post"
    assert body["data"][1]["title"] == "Older Post"


def test_blog_list_includes_meta_fields(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog includes SEO meta fields."""
    content_context.prisma.blogpost.add(
        title="SEO Post",
        slug="seo-post",
        excerpt="SEO excerpt",
        content="SEO content",
        meta_title="Custom SEO Title",
        meta_description="Custom SEO description for search engines",
    )

    response = content_context.client.get("/content/blog")
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["meta_title"] == "Custom SEO Title"
    assert body["data"][0]["meta_description"] == "Custom SEO description for search engines"


# --- Blog Detail Tests ---


def test_blog_detail_returns_post_by_slug(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog/{slug} returns post by slug."""
    content_context.prisma.blogpost.add(
        title="My Article",
        slug="my-article",
        excerpt="Article excerpt",
        content="Full article content with MDX",
    )

    response = content_context.client.get("/content/blog/my-article")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["title"] == "My Article"
    assert body["data"]["slug"] == "my-article"
    assert body["data"]["content"] == "Full article content with MDX"


def test_blog_detail_returns_404_for_nonexistent_slug(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog/{slug} returns 404 for non-existent slug."""
    response = content_context.client.get("/content/blog/nonexistent")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"


def test_blog_detail_returns_404_for_draft_post(
    content_context: ContentTestContext,
) -> None:
    """GET /content/blog/{slug} returns 404 for DRAFT posts."""
    content_context.prisma.blogpost.add(
        title="Draft Article",
        slug="draft-article",
        excerpt="Draft excerpt",
        content="Draft content",
        status="DRAFT",
    )

    response = content_context.client.get("/content/blog/draft-article")
    assert response.status_code == 404


# --- FAQ List Tests ---


def test_faq_list_returns_empty_array_when_no_entries(
    content_context: ContentTestContext,
) -> None:
    """GET /content/faq returns empty array when no entries exist."""
    response = content_context.client.get("/content/faq")
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []


def test_faq_list_returns_entries_grouped_by_category(
    content_context: ContentTestContext,
) -> None:
    """GET /content/faq returns entries grouped by category."""
    content_context.prisma.faqentry.add(
        question="What is ZollPilot?",
        answer="ZollPilot helps you with customs.",
        category="Allgemein",
        order_index=0,
    )
    content_context.prisma.faqentry.add(
        question="How do I start?",
        answer="Click the Start button.",
        category="Allgemein",
        order_index=1,
    )
    content_context.prisma.faqentry.add(
        question="What about costs?",
        answer="Check the billing page.",
        category="Kosten",
        order_index=0,
    )

    response = content_context.client.get("/content/faq")
    assert response.status_code == 200
    body = response.json()

    # Should have categories
    assert len(body["data"]) == 2

    # Find Allgemein category
    allgemein = next((c for c in body["data"] if c["category"] == "Allgemein"), None)
    assert allgemein is not None
    assert len(allgemein["entries"]) == 2
    assert allgemein["entries"][0]["question"] == "What is ZollPilot?"
    assert allgemein["entries"][1]["question"] == "How do I start?"

    # Find Kosten category
    kosten = next((c for c in body["data"] if c["category"] == "Kosten"), None)
    assert kosten is not None
    assert len(kosten["entries"]) == 1


def test_faq_list_returns_published_entries_only(
    content_context: ContentTestContext,
) -> None:
    """GET /content/faq returns only PUBLISHED entries."""
    content_context.prisma.faqentry.add(
        question="Published question?",
        answer="Published answer.",
        status="PUBLISHED",
    )
    content_context.prisma.faqentry.add(
        question="Draft question?",
        answer="Draft answer.",
        status="DRAFT",
    )

    response = content_context.client.get("/content/faq")
    assert response.status_code == 200
    body = response.json()

    # Should have one category with one entry
    assert len(body["data"]) == 1
    assert body["data"][0]["entries"][0]["question"] == "Published question?"


def test_faq_list_includes_related_blog_slug(
    content_context: ContentTestContext,
) -> None:
    """GET /content/faq includes related_blog_slug for linked posts."""
    blog_post = content_context.prisma.blogpost.add(
        title="Related Article",
        slug="related-article",
        excerpt="Related",
        content="Related content",
        status="PUBLISHED",
    )

    content_context.prisma.faqentry.add(
        question="Question with link?",
        answer="Answer with link.",
        related_blog_post=blog_post,
    )

    response = content_context.client.get("/content/faq")
    assert response.status_code == 200
    body = response.json()
    assert body["data"][0]["entries"][0]["related_blog_slug"] == "related-article"


def test_faq_list_excludes_draft_related_blog(
    content_context: ContentTestContext,
) -> None:
    """GET /content/faq excludes related_blog_slug if blog post is DRAFT."""
    blog_post = content_context.prisma.blogpost.add(
        title="Draft Related Article",
        slug="draft-related-article",
        excerpt="Draft related",
        content="Draft related content",
        status="DRAFT",
    )

    content_context.prisma.faqentry.add(
        question="Question with draft link?",
        answer="Answer.",
        related_blog_post=blog_post,
    )

    response = content_context.client.get("/content/faq")
    assert response.status_code == 200
    body = response.json()
    assert body["data"][0]["entries"][0]["related_blog_slug"] is None


# --- No Auth Required Tests ---


def test_content_endpoints_do_not_require_auth(
    content_context: ContentTestContext,
) -> None:
    """Content endpoints are public and don't require authentication."""
    # Blog list
    response = content_context.client.get("/content/blog")
    assert response.status_code == 200

    # FAQ list
    response = content_context.client.get("/content/faq")
    assert response.status_code == 200
