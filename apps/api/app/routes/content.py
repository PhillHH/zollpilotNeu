"""
Content API routes.

Public read-only endpoints for blog posts and FAQ entries.
Only returns published content (status = PUBLISHED).
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.errors import ErrorCode
from app.core.responses import success_response
from app.db.prisma_client import prisma


router = APIRouter(prefix="/content", tags=["content"])


# --- DTOs ---


class BlogPostListItem(BaseModel):
    """Blog post list item (no content)."""

    id: str
    title: str
    slug: str
    excerpt: str
    published_at: Optional[datetime]
    meta_title: Optional[str]
    meta_description: Optional[str]


class BlogPostDetail(BaseModel):
    """Blog post detail (with content)."""

    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    published_at: Optional[datetime]
    meta_title: Optional[str]
    meta_description: Optional[str]


class FaqEntryItem(BaseModel):
    """FAQ entry item."""

    id: str
    question: str
    answer: str
    category: str
    order_index: int
    related_blog_slug: Optional[str] = None


class FaqCategory(BaseModel):
    """FAQ entries grouped by category."""

    category: str
    entries: list[FaqEntryItem]


# --- Blog Endpoints ---


@router.get("/blog")
async def list_blog_posts():
    """
    List all published blog posts.

    Returns posts sorted by published_at descending (newest first).
    Only returns PUBLISHED posts.
    """

    posts = await prisma.blogpost.find_many(
        where={"status": "PUBLISHED"},
        order={"published_at": "desc"},
    )

    items = [
        BlogPostListItem(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            published_at=post.published_at,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
        )
        for post in posts
    ]

    return success_response([item.model_dump() for item in items])


@router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    """
    Get a single blog post by slug.

    Only returns PUBLISHED posts.
    """

    post = await prisma.blogpost.find_first(
        where={
            "slug": slug,
            "status": "PUBLISHED",
        }
    )

    if not post:
        raise HTTPException(
            status_code=404,
            detail={
                "code": ErrorCode.NOT_FOUND.value,
                "message": "Blog post not found.",
            },
        )

    detail = BlogPostDetail(
        id=post.id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        content=post.content,
        published_at=post.published_at,
        meta_title=post.meta_title,
        meta_description=post.meta_description,
    )

    return success_response(detail.model_dump())


# --- FAQ Endpoints ---


@router.get("/faq")
async def list_faq_entries():
    """
    List all published FAQ entries grouped by category.

    Returns entries sorted by category, then by order_index.
    Only returns PUBLISHED entries.
    """

    entries = await prisma.faqentry.find_many(
        where={"status": "PUBLISHED"},
        order=[
            {"category": "asc"},
            {"order_index": "asc"},
        ],
        include={"related_blog_post": True},
    )

    # Group by category
    categories_map: dict[str, list[FaqEntryItem]] = {}

    for entry in entries:
        related_slug = None
        if entry.related_blog_post and entry.related_blog_post.status == "PUBLISHED":
            related_slug = entry.related_blog_post.slug

        item = FaqEntryItem(
            id=entry.id,
            question=entry.question,
            answer=entry.answer,
            category=entry.category,
            order_index=entry.order_index,
            related_blog_slug=related_slug,
        )

        if entry.category not in categories_map:
            categories_map[entry.category] = []
        categories_map[entry.category].append(item)

    # Convert to list of FaqCategory
    result = [
        FaqCategory(category=cat, entries=items)
        for cat, items in categories_map.items()
    ]

    return success_response([cat.model_dump() for cat in result])
