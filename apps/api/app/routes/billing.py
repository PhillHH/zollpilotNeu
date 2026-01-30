from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma


router = APIRouter(prefix="/billing", tags=["billing"])


class PlanInfo(BaseModel):
    code: str
    name: str
    interval: str
    price_cents: int | None
    currency: str | None


class TenantInfo(BaseModel):
    id: str
    name: str


class CreditsInfo(BaseModel):
    balance: int


class BillingMeResponse(BaseModel):
    tenant: TenantInfo
    plan: PlanInfo | None
    credits: CreditsInfo


class BillingMeWrapper(BaseModel):
    data: BillingMeResponse


@router.get("/me", response_model=BillingMeWrapper)
async def get_billing_me(
    context: AuthContext = Depends(get_current_user),
) -> BillingMeWrapper:
    tenant = context.tenant

    # Get plan if assigned
    plan_info = None
    if tenant.get("plan_id"):
        plan = await prisma.plan.find_unique(where={"id": tenant["plan_id"]})
        if plan:
            plan_info = PlanInfo(
                code=plan.code,
                name=plan.name,
                interval=plan.interval,
                price_cents=plan.price_cents,
                currency=plan.currency,
            )

    # Get credit balance
    credit_balance = await prisma.tenantcreditbalance.find_unique(
        where={"tenant_id": tenant["id"]}
    )
    balance = credit_balance.balance if credit_balance else 0

    return BillingMeWrapper(
        data=BillingMeResponse(
            tenant=TenantInfo(id=tenant["id"], name=tenant["name"]),
            plan=plan_info,
            credits=CreditsInfo(balance=balance),
        )
    )


# --- Credit History ---


class CreditHistoryEntry(BaseModel):
    id: str
    delta: int
    reason: str
    case_title: str | None
    created_at: datetime


class CreditHistoryResponse(BaseModel):
    data: list[CreditHistoryEntry]


@router.get("/history", response_model=CreditHistoryResponse)
async def get_credit_history(
    context: AuthContext = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
) -> CreditHistoryResponse:
    """
    Get credit history for the current user's tenant.
    Returns ledger entries with case title where applicable.
    """
    tenant_id = context.tenant["id"]

    entries = await prisma.creditledgerentry.find_many(
        where={"tenant_id": tenant_id},
        order={"created_at": "desc"},
        take=limit,
    )

    result: list[CreditHistoryEntry] = []
    for entry in entries:
        case_title: str | None = None

        # Try to get case title from metadata
        if entry.metadata_json and isinstance(entry.metadata_json, dict):
            case_id = entry.metadata_json.get("case_id")
            if case_id:
                case = await prisma.case.find_unique(where={"id": case_id})
                if case:
                    case_title = case.title

        result.append(
            CreditHistoryEntry(
                id=entry.id,
                delta=entry.delta,
                reason=entry.reason,
                case_title=case_title,
                created_at=entry.created_at,
            )
        )

    return CreditHistoryResponse(data=result)

