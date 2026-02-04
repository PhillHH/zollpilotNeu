"""
Admin Content API endpoints for managing Blog and FAQ content.

Requires EDITOR role or higher (EDITOR, ADMIN, OWNER, SYSTEM_ADMIN).
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, field_validator

from app.core.rbac import Role
from app.dependencies.auth import AuthContext, require_role
from app.db.prisma_client import prisma

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/admin/content", tags=["admin-content"])

# Constants
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
MAX_CONTENT_LENGTH = 100000  # 100KB max content
MAX_EXCERPT_LENGTH = 500

# Content editor role guard - requires EDITOR or higher
get_content_editor_context = require_role(Role.EDITOR)


# --- Blog Models ---


class BlogPostCreateRequest(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    status: str = "DRAFT"
    meta_title: str | None = None
    meta_description: str | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not SLUG_PATTERN.match(v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens only (e.g., 'my-post')")
        if len(v) > 100:
            raise ValueError("Slug must be 100 characters or less")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if len(v.strip()) == 0:
            raise ValueError("Title is required")
        if len(v) > 200:
            raise ValueError("Title must be 200 characters or less")
        return v.strip()

    @field_validator("excerpt")
    @classmethod
    def validate_excerpt(cls, v: str) -> str:
        if len(v) > MAX_EXCERPT_LENGTH:
            raise ValueError(f"Excerpt must be {MAX_EXCERPT_LENGTH} characters or less")
        return v.strip()

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if len(v) > MAX_CONTENT_LENGTH:
            raise ValueError(f"Content must be {MAX_CONTENT_LENGTH} characters or less")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("DRAFT", "PUBLISHED"):
            raise ValueError("Status must be DRAFT or PUBLISHED")
        return v


class BlogPostUpdateRequest(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    status: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not SLUG_PATTERN.match(v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens only")
        if len(v) > 100:
            raise ValueError("Slug must be 100 characters or less")
        return v

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v.strip()) == 0:
            raise ValueError("Title cannot be empty")
        if len(v) > 200:
            raise ValueError("Title must be 200 characters or less")
        return v.strip()

    @field_validator("excerpt")
    @classmethod
    def validate_excerpt(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v) > MAX_EXCERPT_LENGTH:
            raise ValueError(f"Excerpt must be {MAX_EXCERPT_LENGTH} characters or less")
        return v.strip()

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v) > MAX_CONTENT_LENGTH:
            raise ValueError(f"Content must be {MAX_CONTENT_LENGTH} characters or less")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in ("DRAFT", "PUBLISHED"):
            raise ValueError("Status must be DRAFT or PUBLISHED")
        return v


class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    meta_title: str | None
    meta_description: str | None
    created_by_user_id: str | None
    updated_by_user_id: str | None


class BlogPostListItem(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class BlogPostListResponse(BaseModel):
    data: list[BlogPostListItem]
    total: int


class BlogPostSingleResponse(BaseModel):
    data: BlogPostResponse


# --- FAQ Models ---


class FaqCreateRequest(BaseModel):
    question: str
    answer: str
    category: str = "Allgemein"
    order_index: int = 0
    status: str = "DRAFT"
    related_blog_post_id: str | None = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        if len(v.strip()) == 0:
            raise ValueError("Question is required")
        if len(v) > 500:
            raise ValueError("Question must be 500 characters or less")
        return v.strip()

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: str) -> str:
        if len(v) > MAX_CONTENT_LENGTH:
            raise ValueError(f"Answer must be {MAX_CONTENT_LENGTH} characters or less")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if len(v.strip()) == 0:
            raise ValueError("Category is required")
        if len(v) > 100:
            raise ValueError("Category must be 100 characters or less")
        return v.strip()

    @field_validator("order_index")
    @classmethod
    def validate_order_index(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Order index must be >= 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("DRAFT", "PUBLISHED"):
            raise ValueError("Status must be DRAFT or PUBLISHED")
        return v


class FaqUpdateRequest(BaseModel):
    question: str | None = None
    answer: str | None = None
    category: str | None = None
    order_index: int | None = None
    status: str | None = None
    related_blog_post_id: str | None = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v.strip()) == 0:
            raise ValueError("Question cannot be empty")
        if len(v) > 500:
            raise ValueError("Question must be 500 characters or less")
        return v.strip()

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v) > MAX_CONTENT_LENGTH:
            raise ValueError(f"Answer must be {MAX_CONTENT_LENGTH} characters or less")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v.strip()) == 0:
            raise ValueError("Category cannot be empty")
        if len(v) > 100:
            raise ValueError("Category must be 100 characters or less")
        return v.strip()

    @field_validator("order_index")
    @classmethod
    def validate_order_index(cls, v: int | None) -> int | None:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Order index must be >= 0")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in ("DRAFT", "PUBLISHED"):
            raise ValueError("Status must be DRAFT or PUBLISHED")
        return v


class FaqResponse(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    order_index: int
    status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    related_blog_post_id: str | None
    created_by_user_id: str | None
    updated_by_user_id: str | None


class FaqListItem(BaseModel):
    id: str
    question: str
    category: str
    order_index: int
    status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class FaqListResponse(BaseModel):
    data: list[FaqListItem]
    total: int


class FaqSingleResponse(BaseModel):
    data: FaqResponse


# --- Blog Endpoints ---


@router.get("/blog", response_model=BlogPostListResponse)
async def list_blog_posts(
    status_filter: str | None = Query(default=None, alias="status", description="Filter by status (DRAFT, PUBLISHED)"),
    _context: AuthContext = Depends(get_content_editor_context),
) -> BlogPostListResponse:
    """List all blog posts (admin view - includes drafts)."""
    where: dict[str, Any] = {}
    if status_filter:
        where["status"] = status_filter

    try:
        posts = await prisma.blogpost.find_many(
            where=where if where else None,
            order={"created_at": "desc"},
        )
    except Exception as e:
        logger.exception(f"Error fetching blog posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "BLOG_FETCH_ERROR", "message": f"Failed to fetch blog posts: {str(e)}"},
        )

    return BlogPostListResponse(
        data=[
            BlogPostListItem(
                id=p.id,
                title=p.title,
                slug=p.slug,
                excerpt=p.excerpt,
                status=p.status,
                published_at=p.published_at,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in posts
        ],
        total=len(posts),
    )


@router.get("/blog/{post_id}", response_model=BlogPostSingleResponse)
async def get_blog_post(
    post_id: str,
    _context: AuthContext = Depends(get_content_editor_context),
) -> BlogPostSingleResponse:
    """Get a single blog post by ID (admin view)."""
    post = await prisma.blogpost.find_unique(where={"id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Blog post not found."},
        )

    return BlogPostSingleResponse(
        data=BlogPostResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content=post.content,
            status=post.status,
            published_at=post.published_at,
            created_at=post.created_at,
            updated_at=post.updated_at,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
            created_by_user_id=post.created_by_user_id,
            updated_by_user_id=post.updated_by_user_id,
        )
    )


@router.post("/blog", response_model=BlogPostSingleResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    payload: BlogPostCreateRequest,
    context: AuthContext = Depends(get_content_editor_context),
) -> BlogPostSingleResponse:
    """Create a new blog post."""
    # Defensive: ensure user context exists
    user_id = context.user.get("id") if context.user else None
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_USER", "message": "No user context available."},
        )

    try:
        # Check slug uniqueness
        existing = await prisma.blogpost.find_unique(where={"slug": payload.slug})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "SLUG_EXISTS", "message": "A blog post with this slug already exists."},
            )

        # Set published_at if status is PUBLISHED
        published_at = datetime.utcnow() if payload.status == "PUBLISHED" else None

        post = await prisma.blogpost.create(
            data={
                "title": payload.title,
                "slug": payload.slug,
                "excerpt": payload.excerpt,
                "content": payload.content,
                "status": payload.status,
                "published_at": published_at,
                "meta_title": payload.meta_title,
                "meta_description": payload.meta_description,
                "created_by_user_id": user_id,
                "updated_by_user_id": user_id,
            }
        )

        return BlogPostSingleResponse(
            data=BlogPostResponse(
                id=post.id,
                title=post.title,
                slug=post.slug,
                excerpt=post.excerpt,
                content=post.content,
                status=post.status,
                published_at=post.published_at,
                created_at=post.created_at,
                updated_at=post.updated_at,
                meta_title=post.meta_title,
                meta_description=post.meta_description,
                created_by_user_id=post.created_by_user_id,
                updated_by_user_id=post.updated_by_user_id,
            )
        )
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        logger.exception(f"Error creating blog post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "BLOG_CREATE_ERROR", "message": f"Failed to create blog post: {str(e)}"},
        )


@router.put("/blog/{post_id}", response_model=BlogPostSingleResponse)
async def update_blog_post(
    post_id: str,
    payload: BlogPostUpdateRequest,
    context: AuthContext = Depends(get_content_editor_context),
) -> BlogPostSingleResponse:
    """Update an existing blog post."""
    existing = await prisma.blogpost.find_unique(where={"id": post_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Blog post not found."},
        )

    # Check slug uniqueness if changing
    if payload.slug and payload.slug != existing.slug:
        slug_conflict = await prisma.blogpost.find_unique(where={"slug": payload.slug})
        if slug_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "SLUG_EXISTS", "message": "A blog post with this slug already exists."},
            )

    update_data: dict[str, Any] = {"updated_by_user_id": context.user["id"]}

    if payload.title is not None:
        update_data["title"] = payload.title
    if payload.slug is not None:
        update_data["slug"] = payload.slug
    if payload.excerpt is not None:
        update_data["excerpt"] = payload.excerpt
    if payload.content is not None:
        update_data["content"] = payload.content
    if payload.meta_title is not None:
        update_data["meta_title"] = payload.meta_title
    if payload.meta_description is not None:
        update_data["meta_description"] = payload.meta_description

    # Handle status changes
    if payload.status is not None:
        update_data["status"] = payload.status
        # Set published_at when publishing for the first time
        if payload.status == "PUBLISHED" and existing.published_at is None:
            update_data["published_at"] = datetime.utcnow()

    post = await prisma.blogpost.update(where={"id": post_id}, data=update_data)

    return BlogPostSingleResponse(
        data=BlogPostResponse(
            id=post.id,
            title=post.title,
            slug=post.slug,
            excerpt=post.excerpt,
            content=post.content,
            status=post.status,
            published_at=post.published_at,
            created_at=post.created_at,
            updated_at=post.updated_at,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
            created_by_user_id=post.created_by_user_id,
            updated_by_user_id=post.updated_by_user_id,
        )
    )


@router.delete("/blog/{post_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_blog_post(
    post_id: str,
    _context: AuthContext = Depends(get_content_editor_context),
) -> Response:
    """Delete a blog post."""
    existing = await prisma.blogpost.find_unique(where={"id": post_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Blog post not found."},
        )

    await prisma.blogpost.delete(where={"id": post_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- FAQ Endpoints ---


@router.get("/faq", response_model=FaqListResponse)
async def list_faq_entries(
    status_filter: str | None = Query(default=None, alias="status", description="Filter by status (DRAFT, PUBLISHED)"),
    category: str | None = Query(default=None, description="Filter by category"),
    _context: AuthContext = Depends(get_content_editor_context),
) -> FaqListResponse:
    """List all FAQ entries (admin view - includes drafts)."""
    where: dict[str, Any] = {}
    if status_filter:
        where["status"] = status_filter
    if category:
        where["category"] = category

    entries = await prisma.faqentry.find_many(
        where=where if where else None,
        order=[{"category": "asc"}, {"order_index": "asc"}],
    )

    return FaqListResponse(
        data=[
            FaqListItem(
                id=e.id,
                question=e.question,
                category=e.category,
                order_index=e.order_index,
                status=e.status,
                published_at=e.published_at,
                created_at=e.created_at,
                updated_at=e.updated_at,
            )
            for e in entries
        ],
        total=len(entries),
    )


@router.get("/faq/{entry_id}", response_model=FaqSingleResponse)
async def get_faq_entry(
    entry_id: str,
    _context: AuthContext = Depends(get_content_editor_context),
) -> FaqSingleResponse:
    """Get a single FAQ entry by ID (admin view)."""
    entry = await prisma.faqentry.find_unique(where={"id": entry_id})
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "FAQ entry not found."},
        )

    return FaqSingleResponse(
        data=FaqResponse(
            id=entry.id,
            question=entry.question,
            answer=entry.answer,
            category=entry.category,
            order_index=entry.order_index,
            status=entry.status,
            published_at=entry.published_at,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            related_blog_post_id=entry.related_blog_post_id,
            created_by_user_id=entry.created_by_user_id,
            updated_by_user_id=entry.updated_by_user_id,
        )
    )


@router.post("/faq", response_model=FaqSingleResponse, status_code=status.HTTP_201_CREATED)
async def create_faq_entry(
    payload: FaqCreateRequest,
    context: AuthContext = Depends(get_content_editor_context),
) -> FaqSingleResponse:
    """Create a new FAQ entry."""
    # Validate related blog post if provided
    if payload.related_blog_post_id:
        blog_post = await prisma.blogpost.find_unique(where={"id": payload.related_blog_post_id})
        if not blog_post:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": "Related blog post not found."},
            )

    # Set published_at if status is PUBLISHED
    published_at = datetime.utcnow() if payload.status == "PUBLISHED" else None

    entry = await prisma.faqentry.create(
        data={
            "question": payload.question,
            "answer": payload.answer,
            "category": payload.category,
            "order_index": payload.order_index,
            "status": payload.status,
            "published_at": published_at,
            "related_blog_post_id": payload.related_blog_post_id,
            "created_by_user_id": context.user["id"],
            "updated_by_user_id": context.user["id"],
        }
    )

    return FaqSingleResponse(
        data=FaqResponse(
            id=entry.id,
            question=entry.question,
            answer=entry.answer,
            category=entry.category,
            order_index=entry.order_index,
            status=entry.status,
            published_at=entry.published_at,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            related_blog_post_id=entry.related_blog_post_id,
            created_by_user_id=entry.created_by_user_id,
            updated_by_user_id=entry.updated_by_user_id,
        )
    )


@router.put("/faq/{entry_id}", response_model=FaqSingleResponse)
async def update_faq_entry(
    entry_id: str,
    payload: FaqUpdateRequest,
    context: AuthContext = Depends(get_content_editor_context),
) -> FaqSingleResponse:
    """Update an existing FAQ entry."""
    existing = await prisma.faqentry.find_unique(where={"id": entry_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "FAQ entry not found."},
        )

    # Validate related blog post if changing
    if payload.related_blog_post_id is not None and payload.related_blog_post_id != "":
        blog_post = await prisma.blogpost.find_unique(where={"id": payload.related_blog_post_id})
        if not blog_post:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": "Related blog post not found."},
            )

    update_data: dict[str, Any] = {"updated_by_user_id": context.user["id"]}

    if payload.question is not None:
        update_data["question"] = payload.question
    if payload.answer is not None:
        update_data["answer"] = payload.answer
    if payload.category is not None:
        update_data["category"] = payload.category
    if payload.order_index is not None:
        update_data["order_index"] = payload.order_index
    if payload.related_blog_post_id is not None:
        # Allow clearing the relation with empty string
        update_data["related_blog_post_id"] = payload.related_blog_post_id if payload.related_blog_post_id else None

    # Handle status changes
    if payload.status is not None:
        update_data["status"] = payload.status
        # Set published_at when publishing for the first time
        if payload.status == "PUBLISHED" and existing.published_at is None:
            update_data["published_at"] = datetime.utcnow()

    entry = await prisma.faqentry.update(where={"id": entry_id}, data=update_data)

    return FaqSingleResponse(
        data=FaqResponse(
            id=entry.id,
            question=entry.question,
            answer=entry.answer,
            category=entry.category,
            order_index=entry.order_index,
            status=entry.status,
            published_at=entry.published_at,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
            related_blog_post_id=entry.related_blog_post_id,
            created_by_user_id=entry.created_by_user_id,
            updated_by_user_id=entry.updated_by_user_id,
        )
    )


@router.delete("/faq/{entry_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_faq_entry(
    entry_id: str,
    _context: AuthContext = Depends(get_content_editor_context),
) -> Response:
    """Delete a FAQ entry."""
    existing = await prisma.faqentry.find_unique(where={"id": entry_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "FAQ entry not found."},
        )

    await prisma.faqentry.delete(where={"id": entry_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Utility Endpoints ---


@router.get("/categories", response_model=dict)
async def list_faq_categories(
    _context: AuthContext = Depends(get_content_editor_context),
) -> dict:
    """List all unique FAQ categories."""
    entries = await prisma.faqentry.find_many()
    categories = sorted(set(e.category for e in entries))
    return {"data": categories}
