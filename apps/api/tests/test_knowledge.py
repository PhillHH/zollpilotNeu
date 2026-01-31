"""
Tests for Knowledge Base API.

These are public, read-only endpoints that don't require authentication.
Only returns PUBLISHED entries.
"""

import os
import uuid
from dataclasses import dataclass
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


class FakeKnowledgeTopicModel:
    def __init__(self) -> None:
        self._topics: list[dict] = []

    async def find_many(
        self,
        order: dict | None = None,
        include: dict | None = None,
    ) -> list[dict]:
        topics = self._topics
        if order and order.get("order_index") == "asc":
            topics = sorted(topics, key=lambda x: x.get("order_index", 0))

        # Handle include for entries
        if include and "entries" in include:
            entries_filter = include["entries"].get("where", {})
            for topic in topics:
                if "entries" not in topic:
                    topic["entries"] = []
                # Filter entries by status if specified
                if entries_filter.get("status"):
                    topic["entries"] = [
                        e for e in topic.get("_all_entries", [])
                        if e.get("status") == entries_filter["status"]
                    ]

        return topics

    async def find_unique(self, where: dict) -> dict | None:
        for topic in self._topics:
            if topic.get("code") == where.get("code"):
                return topic
        return None

    def add(
        self,
        code: str,
        name: str,
        description: str | None = None,
        order_index: int = 0,
    ) -> dict:
        topic = {
            "id": str(uuid.uuid4()),
            "code": code,
            "name": name,
            "description": description,
            "order_index": order_index,
            "entries": [],
            "_all_entries": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._topics.append(topic)
        return topic


class FakeKnowledgeEntryModel:
    def __init__(self, topics: FakeKnowledgeTopicModel) -> None:
        self._entries: list[dict] = []
        self._topics = topics

    async def find_many(
        self,
        where: dict | None = None,
        order: dict | None = None,
        include: dict | None = None,
    ) -> list[dict]:
        entries = self._entries

        if where:
            # Filter by status
            if "status" in where:
                entries = [e for e in entries if e.get("status") == where["status"]]

            # Filter by applies_to
            if "applies_to" in where:
                applies_filter = where["applies_to"]
                if isinstance(applies_filter, dict) and "in" in applies_filter:
                    entries = [e for e in entries if e.get("applies_to") in applies_filter["in"]]
                elif isinstance(applies_filter, str):
                    entries = [e for e in entries if e.get("applies_to") == applies_filter]

            # Filter by topic code
            if "topic" in where:
                topic_code = where["topic"].get("code")
                entries = [
                    e for e in entries
                    if e.get("topic") and e["topic"].get("code") == topic_code
                ]

            # Filter by related_fields (has)
            if "related_fields" in where:
                field = where["related_fields"].get("has")
                entries = [e for e in entries if field in e.get("related_fields", [])]

        if order and order.get("title") == "asc":
            entries = sorted(entries, key=lambda x: x.get("title", ""))

        return entries

    async def find_first(self, where: dict, include: dict | None = None) -> dict | None:
        for entry in self._entries:
            matches = True
            if where.get("id") and entry.get("id") != where["id"]:
                matches = False
            if where.get("status") and entry.get("status") != where["status"]:
                matches = False
            if matches:
                return entry
        return None

    def add(
        self,
        title: str,
        summary: str,
        explanation: str,
        applies_to: str = "ALL",
        related_fields: list[str] | None = None,
        status: str = "PUBLISHED",
        topic: dict | None = None,
    ) -> dict:
        entry = {
            "id": str(uuid.uuid4()),
            "title": title,
            "summary": summary,
            "explanation": explanation,
            "applies_to": applies_to,
            "related_fields": related_fields or [],
            "version": 1,
            "status": status,
            "topic": topic,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        self._entries.append(entry)

        # Add to topic's entries
        if topic:
            for t in self._topics._topics:
                if t["id"] == topic["id"]:
                    t["_all_entries"].append(entry)
                    if status == "PUBLISHED":
                        t["entries"].append(entry)
                    break

        return entry


class FakePrisma:
    def __init__(self) -> None:
        self.knowledgetopic = FakeKnowledgeTopicModel()
        self.knowledgeentry = FakeKnowledgeEntryModel(self.knowledgetopic)


@dataclass
class KnowledgeTestContext:
    prisma: FakePrisma
    client: TestClient


@pytest.fixture()
def knowledge_context(monkeypatch: pytest.MonkeyPatch) -> KnowledgeTestContext:
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

    return KnowledgeTestContext(prisma=fake_prisma, client=client)


# --- Topic Tests ---


def test_knowledge_topics_returns_empty_array_when_no_topics(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/topics returns empty array when no topics exist."""
    response = knowledge_context.client.get("/knowledge/topics")
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []


def test_knowledge_topics_returns_topics_sorted_by_order(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/topics returns topics sorted by order_index."""
    knowledge_context.prisma.knowledgetopic.add(
        code="second",
        name="Second Topic",
        order_index=2,
    )
    knowledge_context.prisma.knowledgetopic.add(
        code="first",
        name="First Topic",
        order_index=1,
    )

    response = knowledge_context.client.get("/knowledge/topics")
    assert response.status_code == 200
    body = response.json()

    assert len(body["data"]) == 2
    assert body["data"][0]["code"] == "first"
    assert body["data"][1]["code"] == "second"


def test_knowledge_topics_includes_entry_count(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/topics includes count of PUBLISHED entries."""
    topic = knowledge_context.prisma.knowledgetopic.add(
        code="zollwert",
        name="Zollwert",
        order_index=1,
    )

    # Add published entry
    knowledge_context.prisma.knowledgeentry.add(
        title="Published Entry",
        summary="Summary",
        explanation="Explanation",
        status="PUBLISHED",
        topic=topic,
    )

    # Add draft entry (should not be counted)
    knowledge_context.prisma.knowledgeentry.add(
        title="Draft Entry",
        summary="Summary",
        explanation="Explanation",
        status="DRAFT",
        topic=topic,
    )

    response = knowledge_context.client.get("/knowledge/topics")
    assert response.status_code == 200
    body = response.json()

    assert len(body["data"]) == 1
    assert body["data"][0]["entry_count"] == 1


# --- Entry List Tests ---


def test_knowledge_entries_returns_empty_array_when_no_entries(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries returns empty array when no entries exist."""
    response = knowledge_context.client.get("/knowledge/entries")
    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []


def test_knowledge_entries_returns_published_only(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries returns only PUBLISHED entries."""
    knowledge_context.prisma.knowledgeentry.add(
        title="Published Entry",
        summary="Published summary",
        explanation="Published explanation",
        status="PUBLISHED",
    )
    knowledge_context.prisma.knowledgeentry.add(
        title="Draft Entry",
        summary="Draft summary",
        explanation="Draft explanation",
        status="DRAFT",
    )

    response = knowledge_context.client.get("/knowledge/entries")
    assert response.status_code == 200
    body = response.json()

    assert len(body["data"]) == 1
    assert body["data"][0]["title"] == "Published Entry"


def test_knowledge_entries_filters_by_procedure(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries?procedure=IZA filters by procedure type."""
    knowledge_context.prisma.knowledgeentry.add(
        title="IZA Entry",
        summary="IZA summary",
        explanation="IZA explanation",
        applies_to="IZA",
        status="PUBLISHED",
    )
    knowledge_context.prisma.knowledgeentry.add(
        title="ALL Entry",
        summary="ALL summary",
        explanation="ALL explanation",
        applies_to="ALL",
        status="PUBLISHED",
    )
    knowledge_context.prisma.knowledgeentry.add(
        title="IPK Entry",
        summary="IPK summary",
        explanation="IPK explanation",
        applies_to="IPK",
        status="PUBLISHED",
    )

    response = knowledge_context.client.get("/knowledge/entries?procedure=IZA")
    assert response.status_code == 200
    body = response.json()

    # Should return IZA and ALL entries
    assert len(body["data"]) == 2
    titles = [e["title"] for e in body["data"]]
    assert "IZA Entry" in titles
    assert "ALL Entry" in titles
    assert "IPK Entry" not in titles


def test_knowledge_entries_filters_by_topic(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries?topic=zollwert filters by topic code."""
    topic = knowledge_context.prisma.knowledgetopic.add(
        code="zollwert",
        name="Zollwert",
    )

    knowledge_context.prisma.knowledgeentry.add(
        title="Zollwert Entry",
        summary="Summary",
        explanation="Explanation",
        status="PUBLISHED",
        topic=topic,
    )
    knowledge_context.prisma.knowledgeentry.add(
        title="Other Entry",
        summary="Summary",
        explanation="Explanation",
        status="PUBLISHED",
        topic=None,
    )

    response = knowledge_context.client.get("/knowledge/entries?topic=zollwert")
    assert response.status_code == 200
    body = response.json()

    assert len(body["data"]) == 1
    assert body["data"][0]["title"] == "Zollwert Entry"


def test_knowledge_entries_filters_by_field(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries?field=versandkosten filters by related field."""
    knowledge_context.prisma.knowledgeentry.add(
        title="Versandkosten Entry",
        summary="Summary",
        explanation="Explanation",
        related_fields=["versandkosten", "zollwert"],
        status="PUBLISHED",
    )
    knowledge_context.prisma.knowledgeentry.add(
        title="Other Entry",
        summary="Summary",
        explanation="Explanation",
        related_fields=["warennummer"],
        status="PUBLISHED",
    )

    response = knowledge_context.client.get("/knowledge/entries?field=versandkosten")
    assert response.status_code == 200
    body = response.json()

    assert len(body["data"]) == 1
    assert body["data"][0]["title"] == "Versandkosten Entry"


def test_knowledge_entries_includes_topic_info(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries includes topic_code and topic_name."""
    topic = knowledge_context.prisma.knowledgetopic.add(
        code="zollwert",
        name="Zollwert",
    )

    knowledge_context.prisma.knowledgeentry.add(
        title="Entry with Topic",
        summary="Summary",
        explanation="Explanation",
        status="PUBLISHED",
        topic=topic,
    )

    response = knowledge_context.client.get("/knowledge/entries")
    assert response.status_code == 200
    body = response.json()

    assert len(body["data"]) == 1
    assert body["data"][0]["topic_code"] == "zollwert"
    assert body["data"][0]["topic_name"] == "Zollwert"


# --- Entry Detail Tests ---


def test_knowledge_entry_detail_returns_full_explanation(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries/{id} returns full explanation."""
    entry = knowledge_context.prisma.knowledgeentry.add(
        title="Detailed Entry",
        summary="Short summary",
        explanation="# Full Explanation\n\nWith markdown content.",
        status="PUBLISHED",
    )

    response = knowledge_context.client.get(f"/knowledge/entries/{entry['id']}")
    assert response.status_code == 200
    body = response.json()

    assert body["data"]["title"] == "Detailed Entry"
    assert body["data"]["summary"] == "Short summary"
    assert body["data"]["explanation"] == "# Full Explanation\n\nWith markdown content."


def test_knowledge_entry_detail_returns_404_for_nonexistent(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries/{id} returns 404 for non-existent entry."""
    response = knowledge_context.client.get(f"/knowledge/entries/{uuid.uuid4()}")
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"


def test_knowledge_entry_detail_returns_404_for_draft(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """GET /knowledge/entries/{id} returns 404 for DRAFT entries."""
    entry = knowledge_context.prisma.knowledgeentry.add(
        title="Draft Entry",
        summary="Summary",
        explanation="Explanation",
        status="DRAFT",
    )

    response = knowledge_context.client.get(f"/knowledge/entries/{entry['id']}")
    assert response.status_code == 404


# --- No Auth Required Tests ---


def test_knowledge_endpoints_do_not_require_auth(
    knowledge_context: KnowledgeTestContext,
) -> None:
    """Knowledge endpoints are public and don't require authentication."""
    # Topics list
    response = knowledge_context.client.get("/knowledge/topics")
    assert response.status_code == 200

    # Entries list
    response = knowledge_context.client.get("/knowledge/entries")
    assert response.status_code == 200
