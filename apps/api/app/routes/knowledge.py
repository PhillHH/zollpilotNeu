"""
Knowledge Base API routes.

Public read-only endpoints for knowledge topics and entries.
Only returns published content (status = PUBLISHED).

The knowledge base provides explanatory content for:
- Wizard form fields
- Mapping view hints
- Future AI assistance

No business logic, no calculations, no automatic decisions.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.responses import success_response
from app.db.prisma_client import prisma


router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# --- DTOs ---


class KnowledgeTopicItem(BaseModel):
    """Knowledge topic for grouping."""

    id: str
    code: str
    name: str
    description: Optional[str]
    order_index: int
    entry_count: int


class KnowledgeEntryItem(BaseModel):
    """Knowledge entry without full explanation."""

    id: str
    title: str
    summary: str
    applies_to: str
    related_fields: list[str]
    version: int
    topic_code: Optional[str]
    topic_name: Optional[str]


class KnowledgeEntryDetail(BaseModel):
    """Knowledge entry with full explanation."""

    id: str
    title: str
    summary: str
    explanation: str
    applies_to: str
    related_fields: list[str]
    version: int
    topic_code: Optional[str]
    topic_name: Optional[str]
    created_at: datetime
    updated_at: datetime


# --- Topic Endpoints ---


@router.get("/topics")
async def list_knowledge_topics():
    """
    List all knowledge topics with entry counts.

    Returns topics sorted by order_index.
    Only counts PUBLISHED entries.
    """

    topics = await prisma.knowledgetopic.find_many(
        order={"order_index": "asc"},
        include={"entries": {"where": {"status": "PUBLISHED"}}},
    )

    items = [
        KnowledgeTopicItem(
            id=topic.id,
            code=topic.code,
            name=topic.name,
            description=topic.description,
            order_index=topic.order_index,
            entry_count=len(topic.entries) if topic.entries else 0,
        )
        for topic in topics
    ]

    return success_response([item.model_dump() for item in items])


# --- Entry Endpoints ---


@router.get("/entries")
async def list_knowledge_entries(
    procedure: Optional[str] = Query(
        None,
        description="Filter by procedure type (IZA, IPK, IAA, ALL)",
        regex="^(IZA|IPK|IAA|ALL)$",
    ),
    topic: Optional[str] = Query(
        None,
        description="Filter by topic code",
    ),
    field: Optional[str] = Query(
        None,
        description="Filter by related field key",
    ),
):
    """
    List all published knowledge entries.

    Supports filtering by:
    - procedure: IZA, IPK, IAA, ALL
    - topic: Topic code (e.g., "zollwert")
    - field: Related field key (e.g., "versandkosten")

    Returns only PUBLISHED entries.
    """

    # Build where clause
    where: dict = {"status": "PUBLISHED"}

    if procedure:
        # Include entries that apply to the specific procedure OR ALL
        if procedure != "ALL":
            where["applies_to"] = {"in": [procedure, "ALL"]}
        else:
            where["applies_to"] = "ALL"

    if topic:
        # Filter by topic code
        where["topic"] = {"code": topic}

    if field:
        # Filter by related field (array contains)
        where["related_fields"] = {"has": field}

    entries = await prisma.knowledgeentry.find_many(
        where=where,
        order={"title": "asc"},
        include={"topic": True},
    )

    items = [
        KnowledgeEntryItem(
            id=entry.id,
            title=entry.title,
            summary=entry.summary,
            applies_to=entry.applies_to,
            related_fields=entry.related_fields,
            version=entry.version,
            topic_code=entry.topic.code if entry.topic else None,
            topic_name=entry.topic.name if entry.topic else None,
        )
        for entry in entries
    ]

    return success_response([item.model_dump() for item in items])


@router.get("/entries/{entry_id}")
async def get_knowledge_entry(entry_id: str):
    """
    Get a single knowledge entry by ID.

    Returns full explanation content.
    Only returns PUBLISHED entries.
    """

    entry = await prisma.knowledgeentry.find_first(
        where={
            "id": entry_id,
            "status": "PUBLISHED",
        },
        include={"topic": True},
    )

    if not entry:
        from fastapi import HTTPException
        from app.core.errors import ErrorCode

        raise HTTPException(
            status_code=404,
            detail={
                "code": ErrorCode.NOT_FOUND.value,
                "message": "Knowledge entry not found.",
            },
        )

    detail = KnowledgeEntryDetail(
        id=entry.id,
        title=entry.title,
        summary=entry.summary,
        explanation=entry.explanation,
        applies_to=entry.applies_to,
        related_fields=entry.related_fields,
        version=entry.version,
        topic_code=entry.topic.code if entry.topic else None,
        topic_name=entry.topic.name if entry.topic else None,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )

    return success_response(detail.model_dump())
