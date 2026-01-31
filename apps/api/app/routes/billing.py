from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator

from app.dependencies.auth import AuthContext, get_current_user
from app.core.json import normalize_to_json_optional
from app.db.prisma_client import prisma


router = APIRouter(prefix="/billing", tags=["billing"])


# --- Credit Pricing Constants ---
# 1 Credit = 1 Ausfüllhilfe = 1.49 EUR
# Premium = 2 Credits = 2.99 EUR (IZA full service)
CREDIT_PRICE_CENTS = 149  # 1.49 EUR per credit
CREDIT_CURRENCY = "EUR"


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


# --- Credit Purchase ---


class CreditPurchaseRequest(BaseModel):
    amount: int

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("amount must be > 0")
        if v > 100:
            raise ValueError("amount must be <= 100")
        return v


class CreditPurchaseResponse(BaseModel):
    balance: int
    purchased: int
    price_cents: int
    currency: str


class CreditPurchaseWrapper(BaseModel):
    data: CreditPurchaseResponse


@router.post("/credits/purchase", response_model=CreditPurchaseWrapper)
async def purchase_credits(
    payload: CreditPurchaseRequest,
    context: AuthContext = Depends(get_current_user),
) -> CreditPurchaseWrapper:
    """
    Purchase credits for the tenant.

    This is a simulated purchase endpoint. In production, this would integrate
    with a payment provider (e.g., Stripe). Currently, it adds credits directly.

    Returns the new balance and purchase details.
    """
    tenant_id = context.tenant["id"]
    user_id = context.user["id"]
    amount = payload.amount
    price_cents = amount * CREDIT_PRICE_CENTS

    # Upsert balance (atomic increment)
    balance_record = await prisma.tenantcreditbalance.upsert(
        where={"tenant_id": tenant_id},
        data={
            "create": {"tenant_id": tenant_id, "balance": amount},
            "update": {"balance": {"increment": amount}},
        },
    )

    # Create ledger entry
    metadata = {
        "amount": amount,
        "price_cents": price_cents,
        "currency": CREDIT_CURRENCY,
    }
    await prisma.creditledgerentry.create(
        data={
            "tenant_id": tenant_id,
            "delta": amount,
            "reason": "PURCHASE",
            "metadata_json": normalize_to_json_optional(metadata),
            "created_by_user_id": user_id,
        }
    )

    # Log user event
    await prisma.userevent.create(
        data={
            "user_id": user_id,
            "type": "PURCHASE",
            "metadata_json": normalize_to_json_optional({
                "credits": amount,
                "price_cents": price_cents,
            }),
        }
    )

    return CreditPurchaseWrapper(
        data=CreditPurchaseResponse(
            balance=balance_record.balance,
            purchased=amount,
            price_cents=price_cents,
            currency=CREDIT_CURRENCY,
        )
    )


# --- Credit Spend (for Ausfüllhilfe / "Bereit" click) ---


class CreditSpendRequest(BaseModel):
    case_id: str
    idempotency_key: str | None = None  # Optional for retry safety

    @field_validator("case_id")
    @classmethod
    def validate_case_id(cls, v: str) -> str:
        if not v or len(v) < 10:
            raise ValueError("case_id must be a valid UUID")
        return v


class CreditSpendResponse(BaseModel):
    balance: int
    spent: int
    case_id: str


class CreditSpendWrapper(BaseModel):
    data: CreditSpendResponse


@router.post("/credits/spend", response_model=CreditSpendWrapper)
async def spend_credits(
    payload: CreditSpendRequest,
    context: AuthContext = Depends(get_current_user),
) -> CreditSpendWrapper:
    """
    Spend credits for a case (triggered on "Bereit" click).

    Rules:
    - 1 credit per case
    - Must be DRAFT status
    - Tenant must have sufficient balance
    - Idempotency: same case_id won't deduct twice

    Returns the new balance.
    """
    tenant_id = context.tenant["id"]
    user_id = context.user["id"]
    case_id = payload.case_id
    credits_required = 1

    # Verify case exists and belongs to tenant
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id}
    )

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Fall nicht gefunden."},
        )

    # Check if already spent for this case (idempotency)
    existing_spend = await prisma.creditledgerentry.find_first(
        where={
            "tenant_id": tenant_id,
            "reason": "AUSFUELLHILFE",
        }
    )

    # Check for this specific case in metadata
    if existing_spend and existing_spend.metadata_json:
        meta = existing_spend.metadata_json
        if isinstance(meta, dict) and meta.get("case_id") == case_id:
            # Already spent - return current balance (idempotent)
            balance = await prisma.tenantcreditbalance.find_unique(
                where={"tenant_id": tenant_id}
            )
            return CreditSpendWrapper(
                data=CreditSpendResponse(
                    balance=balance.balance if balance else 0,
                    spent=0,  # Not spent again
                    case_id=case_id,
                )
            )

    # More thorough idempotency check - find all AUSFUELLHILFE entries
    all_spends = await prisma.creditledgerentry.find_many(
        where={"tenant_id": tenant_id, "reason": "AUSFUELLHILFE"}
    )

    for spend in all_spends:
        if spend.metadata_json and isinstance(spend.metadata_json, dict):
            if spend.metadata_json.get("case_id") == case_id:
                # Already spent for this case
                balance = await prisma.tenantcreditbalance.find_unique(
                    where={"tenant_id": tenant_id}
                )
                return CreditSpendWrapper(
                    data=CreditSpendResponse(
                        balance=balance.balance if balance else 0,
                        spent=0,
                        case_id=case_id,
                    )
                )

    # Get current balance
    balance_record = await prisma.tenantcreditbalance.find_unique(
        where={"tenant_id": tenant_id}
    )

    current_balance = balance_record.balance if balance_record else 0

    if current_balance < credits_required:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "INSUFFICIENT_CREDITS",
                "message": f"Nicht genügend Credits. Benötigt: {credits_required}, Vorhanden: {current_balance}.",
                "required": credits_required,
                "available": current_balance,
            },
        )

    # Deduct credits (atomic decrement)
    new_balance = await prisma.tenantcreditbalance.update(
        where={"tenant_id": tenant_id},
        data={"balance": {"decrement": credits_required}},
    )

    # Prevent negative balance (safety check)
    if new_balance.balance < 0:
        # Rollback by incrementing back
        await prisma.tenantcreditbalance.update(
            where={"tenant_id": tenant_id},
            data={"balance": {"increment": credits_required}},
        )
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "INSUFFICIENT_CREDITS",
                "message": "Nicht genügend Credits.",
            },
        )

    # Create ledger entry
    await prisma.creditledgerentry.create(
        data={
            "tenant_id": tenant_id,
            "delta": -credits_required,
            "reason": "AUSFUELLHILFE",
            "metadata_json": normalize_to_json_optional({
                "case_id": case_id,
                "case_title": case.title,
            }),
            "created_by_user_id": user_id,
        }
    )

    # Log user event
    await prisma.userevent.create(
        data={
            "user_id": user_id,
            "type": "CREDIT_USED",
            "metadata_json": normalize_to_json_optional({
                "case_id": case_id,
                "credits_spent": credits_required,
            }),
        }
    )

    return CreditSpendWrapper(
        data=CreditSpendResponse(
            balance=new_balance.balance,
            spent=credits_required,
            case_id=case_id,
        )
    )


# --- Pricing Info (public-ish, for display) ---


class PricingTier(BaseModel):
    name: str
    credits: int
    price_cents: int
    currency: str
    description: str


class PricingInfoResponse(BaseModel):
    tiers: list[PricingTier]
    credit_unit_price_cents: int
    currency: str


class PricingInfoWrapper(BaseModel):
    data: PricingInfoResponse


@router.get("/pricing", response_model=PricingInfoWrapper)
async def get_pricing_info(
    context: AuthContext = Depends(get_current_user),
) -> PricingInfoWrapper:
    """
    Get pricing information for credits.

    Returns available pricing tiers and unit price.
    """
    tiers = [
        PricingTier(
            name="Einzelner Credit",
            credits=1,
            price_cents=149,
            currency="EUR",
            description="1 Ausfüllhilfe",
        ),
        PricingTier(
            name="5er Pack",
            credits=5,
            price_cents=699,
            currency="EUR",
            description="5 Ausfüllhilfen (Spare 6%)",
        ),
        PricingTier(
            name="10er Pack",
            credits=10,
            price_cents=1299,
            currency="EUR",
            description="10 Ausfüllhilfen (Spare 13%)",
        ),
    ]

    return PricingInfoWrapper(
        data=PricingInfoResponse(
            tiers=tiers,
            credit_unit_price_cents=CREDIT_PRICE_CENTS,
            currency=CREDIT_CURRENCY,
        )
    )

