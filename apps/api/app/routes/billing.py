from __future__ import annotations

from fastapi import APIRouter, Depends
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

