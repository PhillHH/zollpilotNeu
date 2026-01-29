from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator

from app.core.rbac import Role
from app.core.json import normalize_to_json_optional
from app.dependencies.auth import AuthContext, require_role
from app.db.prisma_client import prisma


router = APIRouter(prefix="/admin", tags=["admin"])

# Constants
PLAN_CODE_PATTERN = re.compile(r"^[A-Z0-9_]{2,32}$")


# --- Plan Models ---


VALID_PROCEDURE_CODES = ["IZA", "IAA", "IPK"]


class PlanCreateRequest(BaseModel):
    code: str
    name: str
    interval: str = "NONE"
    price_cents: int | None = None
    currency: str = "EUR"
    credits_included: int = 0
    allowed_procedures: list[str] = []

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not PLAN_CODE_PATTERN.match(v):
            raise ValueError("Code must be 2-32 uppercase letters, numbers, or underscores")
        return v

    @field_validator("price_cents")
    @classmethod
    def validate_price(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("price_cents must be >= 0")
        return v

    @field_validator("interval")
    @classmethod
    def validate_interval(cls, v: str) -> str:
        valid = ["ONE_TIME", "YEARLY", "MONTHLY", "NONE"]
        if v not in valid:
            raise ValueError(f"interval must be one of {valid}")
        return v

    @field_validator("credits_included")
    @classmethod
    def validate_credits(cls, v: int) -> int:
        if v < 0:
            raise ValueError("credits_included must be >= 0")
        return v

    @field_validator("allowed_procedures")
    @classmethod
    def validate_procedures(cls, v: list[str]) -> list[str]:
        for proc in v:
            if proc not in VALID_PROCEDURE_CODES:
                raise ValueError(f"Invalid procedure code: {proc}. Valid: {VALID_PROCEDURE_CODES}")
        return v


class PlanPatchRequest(BaseModel):
    name: str | None = None
    price_cents: int | None = None
    currency: str | None = None
    interval: str | None = None
    credits_included: int | None = None
    allowed_procedures: list[str] | None = None

    @field_validator("price_cents")
    @classmethod
    def validate_price(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("price_cents must be >= 0")
        return v

    @field_validator("credits_included")
    @classmethod
    def validate_credits(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("credits_included must be >= 0")
        return v

    @field_validator("allowed_procedures")
    @classmethod
    def validate_procedures(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            for proc in v:
                if proc not in VALID_PROCEDURE_CODES:
                    raise ValueError(f"Invalid procedure code: {proc}. Valid: {VALID_PROCEDURE_CODES}")
        return v


class PlanResponse(BaseModel):
    id: str
    code: str
    name: str
    is_active: bool
    interval: str
    price_cents: int | None
    currency: str
    credits_included: int
    allowed_procedures: list[str]
    created_at: datetime
    updated_at: datetime


class PlanListResponse(BaseModel):
    data: list[PlanResponse]


class PlanSingleResponse(BaseModel):
    data: PlanResponse


# --- Tenant Models ---


class TenantSummary(BaseModel):
    id: str
    name: str
    plan_code: str | None
    credits_balance: int
    user_count: int
    created_at: datetime


class TenantListResponse(BaseModel):
    data: list[TenantSummary]


# --- User Models ---


class UserSummary(BaseModel):
    id: str
    email: str
    user_type: str
    status: str
    tenant_id: str | None
    tenant_name: str | None
    created_at: datetime
    last_login_at: datetime | None


class UserListResponse(BaseModel):
    data: list[UserSummary]


class UserEventResponse(BaseModel):
    id: str
    type: str
    created_at: datetime
    metadata_json: Any | None


class UserDetailResponse(BaseModel):
    id: str
    email: str
    user_type: str
    status: str
    tenant_id: str | None
    tenant_name: str | None
    created_at: datetime
    last_login_at: datetime | None
    events: list[UserEventResponse]


class TenantDetailResponse(BaseModel):
    id: str
    name: str
    type: str
    plan_code: str | None
    credits_balance: int
    user_count: int
    created_at: datetime
    users: list[UserSummary]


# --- Events Models ---


class EventListItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    tenant_id: str | None
    tenant_name: str | None
    type: str
    created_at: datetime
    metadata_json: Any | None


class EventListResponse(BaseModel):
    data: list[EventListItem]
    total: int
    page: int
    page_size: int


class SetPlanRequest(BaseModel):
    plan_code: str


class GrantCreditsRequest(BaseModel):
    amount: int
    note: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("amount must be > 0")
        return v


class LedgerEntryResponse(BaseModel):
    id: str
    delta: int
    reason: str
    metadata_json: Any | None
    created_by_user_id: str | None
    created_at: datetime


class LedgerListResponse(BaseModel):
    data: list[LedgerEntryResponse]


class CreditsBalanceResponse(BaseModel):
    data: dict


# --- Admin dependency ---
# Admin endpoints require SYSTEM_ADMIN role (ZollPilot internal)
# Tenant admins (ADMIN role) do NOT have access to system-wide admin functions

get_admin_context = require_role(Role.SYSTEM_ADMIN)


# --- Plan Endpoints ---


@router.get("/plans", response_model=PlanListResponse)
async def list_plans(
    _context: AuthContext = Depends(get_admin_context),
) -> PlanListResponse:
    plans = await prisma.plan.find_many(order={"created_at": "desc"})
    return PlanListResponse(data=[PlanResponse(**p.model_dump()) for p in plans])


@router.post("/plans", response_model=PlanSingleResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    payload: PlanCreateRequest,
    _context: AuthContext = Depends(get_admin_context),
) -> PlanSingleResponse:
    # Check code uniqueness
    existing = await prisma.plan.find_unique(where={"code": payload.code})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Plan code already exists."},
        )

    plan = await prisma.plan.create(
        data={
            "code": payload.code,
            "name": payload.name,
            "interval": payload.interval,
            "price_cents": payload.price_cents,
            "currency": payload.currency,
            "credits_included": payload.credits_included,
            "allowed_procedures": payload.allowed_procedures,
        }
    )
    return PlanSingleResponse(data=PlanResponse(**plan.model_dump()))


@router.patch("/plans/{plan_id}", response_model=PlanSingleResponse)
async def patch_plan(
    plan_id: str,
    payload: PlanPatchRequest,
    _context: AuthContext = Depends(get_admin_context),
) -> PlanSingleResponse:
    existing = await prisma.plan.find_unique(where={"id": plan_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Plan not found."},
        )

    update_data: dict[str, Any] = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.price_cents is not None:
        update_data["price_cents"] = payload.price_cents
    if payload.currency is not None:
        update_data["currency"] = payload.currency
    if payload.interval is not None:
        update_data["interval"] = payload.interval
    if payload.credits_included is not None:
        update_data["credits_included"] = payload.credits_included
    if payload.allowed_procedures is not None:
        update_data["allowed_procedures"] = payload.allowed_procedures

    if not update_data:
        return PlanSingleResponse(data=PlanResponse(**existing.model_dump()))

    plan = await prisma.plan.update(where={"id": plan_id}, data=update_data)
    return PlanSingleResponse(data=PlanResponse(**plan.model_dump()))


@router.post("/plans/{plan_id}/activate", response_model=PlanSingleResponse)
async def activate_plan(
    plan_id: str,
    _context: AuthContext = Depends(get_admin_context),
) -> PlanSingleResponse:
    existing = await prisma.plan.find_unique(where={"id": plan_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Plan not found."},
        )

    plan = await prisma.plan.update(where={"id": plan_id}, data={"is_active": True})
    return PlanSingleResponse(data=PlanResponse(**plan.model_dump()))


@router.post("/plans/{plan_id}/deactivate", response_model=PlanSingleResponse)
async def deactivate_plan(
    plan_id: str,
    _context: AuthContext = Depends(get_admin_context),
) -> PlanSingleResponse:
    existing = await prisma.plan.find_unique(where={"id": plan_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Plan not found."},
        )

    plan = await prisma.plan.update(where={"id": plan_id}, data={"is_active": False})
    return PlanSingleResponse(data=PlanResponse(**plan.model_dump()))


# --- User Endpoints ---


@router.get("/users", response_model=UserListResponse)
async def list_users(
    _context: AuthContext = Depends(get_admin_context),
) -> UserListResponse:
    users = await prisma.user.find_many(
        include={"memberships": {"include": {"tenant": True}}},
        order={"created_at": "desc"},
    )

    result = []
    for u in users:
        # Get first membership's tenant if exists
        tenant_id = None
        tenant_name = None
        if u.memberships and len(u.memberships) > 0:
            membership = u.memberships[0]
            if membership.tenant:
                tenant_id = membership.tenant.id
                tenant_name = membership.tenant.name

        result.append(
            UserSummary(
                id=u.id,
                email=u.email,
                user_type=u.user_type,
                status=u.status,
                tenant_id=tenant_id,
                tenant_name=tenant_name,
                created_at=u.created_at,
                last_login_at=u.last_login_at,
            )
        )

    return UserListResponse(data=result)


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    _context: AuthContext = Depends(get_admin_context),
) -> UserDetailResponse:
    user = await prisma.user.find_unique(
        where={"id": user_id},
        include={
            "memberships": {"include": {"tenant": True}},
            "events": {"order_by": {"created_at": "desc"}, "take": 50},
        },
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "User not found."},
        )

    # Get tenant info
    tenant_id = None
    tenant_name = None
    if user.memberships and len(user.memberships) > 0:
        membership = user.memberships[0]
        if membership.tenant:
            tenant_id = membership.tenant.id
            tenant_name = membership.tenant.name

    # Map events
    events = [
        UserEventResponse(
            id=e.id,
            type=e.type,
            created_at=e.created_at,
            metadata_json=e.metadata_json,
        )
        for e in (user.events or [])
    ]

    return UserDetailResponse(
        id=user.id,
        email=user.email,
        user_type=user.user_type,
        status=user.status,
        tenant_id=tenant_id,
        tenant_name=tenant_name,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        events=events,
    )


# --- Events Endpoints ---


@router.get("/events", response_model=EventListResponse)
async def list_events(
    user_id: str | None = Query(default=None, description="Filter by user ID"),
    tenant_id: str | None = Query(default=None, description="Filter by tenant ID"),
    event_type: str | None = Query(default=None, description="Filter by event type"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=100, description="Items per page"),
    _context: AuthContext = Depends(get_admin_context),
) -> EventListResponse:
    """List all events with optional filtering and pagination."""
    # Build where clause
    where: dict[str, Any] = {}

    if user_id:
        where["user_id"] = user_id

    if event_type:
        where["type"] = event_type

    # For tenant filtering, we need to get user IDs first
    user_ids_for_tenant: list[str] | None = None
    if tenant_id:
        memberships = await prisma.membership.find_many(
            where={"tenant_id": tenant_id},
            include={"user": True},
        )
        user_ids_for_tenant = [m.user_id for m in memberships]
        if user_ids_for_tenant:
            where["user_id"] = {"in": user_ids_for_tenant}
        else:
            # No users in tenant, return empty
            return EventListResponse(data=[], total=0, page=page, page_size=page_size)

    # Count total
    total = await prisma.userevent.count(where=where)

    # Fetch events with pagination
    skip = (page - 1) * page_size
    events = await prisma.userevent.find_many(
        where=where,
        include={"user": {"include": {"memberships": {"include": {"tenant": True}}}}},
        order={"created_at": "desc"},
        skip=skip,
        take=page_size,
    )

    # Map to response
    result = []
    for e in events:
        # Get tenant info from user's first membership
        e_tenant_id = None
        e_tenant_name = None
        if e.user and e.user.memberships and len(e.user.memberships) > 0:
            membership = e.user.memberships[0]
            if membership.tenant:
                e_tenant_id = membership.tenant.id
                e_tenant_name = membership.tenant.name

        result.append(
            EventListItem(
                id=e.id,
                user_id=e.user_id,
                user_email=e.user.email if e.user else "unknown",
                tenant_id=e_tenant_id,
                tenant_name=e_tenant_name,
                type=e.type,
                created_at=e.created_at,
                metadata_json=e.metadata_json,
            )
        )

    return EventListResponse(data=result, total=total, page=page, page_size=page_size)


# --- Tenant Endpoints ---


@router.get("/tenants", response_model=TenantListResponse)
async def list_tenants(
    _context: AuthContext = Depends(get_admin_context),
) -> TenantListResponse:
    tenants = await prisma.tenant.find_many(
        include={"plan": True, "credit_balance": True, "memberships": True},
        order={"created_at": "desc"},
    )

    result = []
    for t in tenants:
        plan_code = t.plan.code if t.plan else None
        balance = t.credit_balance.balance if t.credit_balance else 0
        user_count = len(t.memberships) if t.memberships else 0
        result.append(
            TenantSummary(
                id=t.id,
                name=t.name,
                plan_code=plan_code,
                credits_balance=balance,
                user_count=user_count,
                created_at=t.created_at,
            )
        )

    return TenantListResponse(data=result)


@router.get("/tenants/{tenant_id}", response_model=TenantDetailResponse)
async def get_tenant_detail(
    tenant_id: str,
    _context: AuthContext = Depends(get_admin_context),
) -> TenantDetailResponse:
    tenant = await prisma.tenant.find_unique(
        where={"id": tenant_id},
        include={
            "plan": True,
            "credit_balance": True,
            "memberships": {"include": {"user": True}},
        },
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Tenant not found."},
        )

    plan_code = tenant.plan.code if tenant.plan else None
    balance = tenant.credit_balance.balance if tenant.credit_balance else 0

    # Map users from memberships
    users = []
    for membership in (tenant.memberships or []):
        if membership.user:
            u = membership.user
            users.append(
                UserSummary(
                    id=u.id,
                    email=u.email,
                    user_type=u.user_type,
                    status=u.status,
                    tenant_id=tenant_id,
                    tenant_name=tenant.name,
                    created_at=u.created_at,
                    last_login_at=u.last_login_at,
                )
            )

    return TenantDetailResponse(
        id=tenant.id,
        name=tenant.name,
        type=tenant.type,
        plan_code=plan_code,
        credits_balance=balance,
        user_count=len(users),
        created_at=tenant.created_at,
        users=users,
    )


@router.post("/tenants/{tenant_id}/plan", response_model=TenantSummary)
async def set_tenant_plan(
    tenant_id: str,
    payload: SetPlanRequest,
    _context: AuthContext = Depends(get_admin_context),
) -> TenantSummary:
    tenant = await prisma.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Tenant not found."},
        )

    plan = await prisma.plan.find_unique(where={"code": payload.plan_code})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Plan not found."},
        )

    updated = await prisma.tenant.update(
        where={"id": tenant_id},
        data={"plan_id": plan.id, "plan_activated_at": datetime.utcnow()},
        include={"credit_balance": True, "memberships": True},
    )

    balance = updated.credit_balance.balance if updated.credit_balance else 0
    user_count = len(updated.memberships) if updated.memberships else 0

    return TenantSummary(
        id=updated.id,
        name=updated.name,
        plan_code=plan.code,
        credits_balance=balance,
        user_count=user_count,
        created_at=updated.created_at,
    )


@router.post("/tenants/{tenant_id}/credits/grant", response_model=CreditsBalanceResponse)
async def grant_credits(
    tenant_id: str,
    payload: GrantCreditsRequest,
    context: AuthContext = Depends(get_admin_context),
) -> CreditsBalanceResponse:
    tenant = await prisma.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Tenant not found."},
        )

    # Atomic operation: update balance + create ledger entry
    # Upsert balance
    balance_record = await prisma.tenantcreditbalance.upsert(
        where={"tenant_id": tenant_id},
        data={
            "create": {"tenant_id": tenant_id, "balance": payload.amount},
            "update": {"balance": {"increment": payload.amount}},
        },
    )

    # Create ledger entry with normalized JSON metadata
    metadata = {"note": payload.note} if payload.note else None
    await prisma.creditledgerentry.create(
        data={
            "tenant_id": tenant_id,
            "delta": payload.amount,
            "reason": "ADMIN_GRANT",
            "metadata_json": normalize_to_json_optional(metadata),
            "created_by_user_id": context.user["id"],
        }
    )

    return CreditsBalanceResponse(data={"balance": balance_record.balance})


@router.get("/tenants/{tenant_id}/credits/ledger", response_model=LedgerListResponse)
async def get_credits_ledger(
    tenant_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    _context: AuthContext = Depends(get_admin_context),
) -> LedgerListResponse:
    tenant = await prisma.tenant.find_unique(where={"id": tenant_id})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Tenant not found."},
        )

    entries = await prisma.creditledgerentry.find_many(
        where={"tenant_id": tenant_id},
        order={"created_at": "desc"},
        take=limit,
    )

    return LedgerListResponse(data=[LedgerEntryResponse(**e.model_dump()) for e in entries])

