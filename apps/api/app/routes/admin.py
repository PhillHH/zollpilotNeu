from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator

from app.core.rbac import Role
from app.dependencies.auth import AuthContext, require_role
from app.db.prisma_client import prisma


router = APIRouter(prefix="/admin", tags=["admin"])

# Constants
PLAN_CODE_PATTERN = re.compile(r"^[A-Z0-9_]{2,32}$")


# --- Plan Models ---


class PlanCreateRequest(BaseModel):
    code: str
    name: str
    interval: str = "NONE"
    price_cents: int | None = None
    currency: str = "EUR"

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


class PlanPatchRequest(BaseModel):
    name: str | None = None
    price_cents: int | None = None
    currency: str | None = None
    interval: str | None = None

    @field_validator("price_cents")
    @classmethod
    def validate_price(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("price_cents must be >= 0")
        return v


class PlanResponse(BaseModel):
    id: str
    code: str
    name: str
    is_active: bool
    interval: str
    price_cents: int | None
    currency: str
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
    created_at: datetime


class TenantListResponse(BaseModel):
    data: list[TenantSummary]


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


# --- Tenant Endpoints ---


@router.get("/tenants", response_model=TenantListResponse)
async def list_tenants(
    _context: AuthContext = Depends(get_admin_context),
) -> TenantListResponse:
    tenants = await prisma.tenant.find_many(
        include={"plan": True, "credit_balance": True},
        order={"created_at": "desc"},
    )

    result = []
    for t in tenants:
        plan_code = t.plan.code if t.plan else None
        balance = t.credit_balance.balance if t.credit_balance else 0
        result.append(
            TenantSummary(
                id=t.id,
                name=t.name,
                plan_code=plan_code,
                credits_balance=balance,
                created_at=t.created_at,
            )
        )

    return TenantListResponse(data=result)


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
        include={"credit_balance": True},
    )

    balance = updated.credit_balance.balance if updated.credit_balance else 0

    return TenantSummary(
        id=updated.id,
        name=updated.name,
        plan_code=plan.code,
        credits_balance=balance,
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

    # Create ledger entry
    metadata = {"note": payload.note} if payload.note else None
    await prisma.creditledgerentry.create(
        data={
            "tenant_id": tenant_id,
            "delta": payload.amount,
            "reason": "ADMIN_GRANT",
            "metadata_json": metadata,
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

