"""
Checkout & Payment Routes (Sprint 7 – U6)

Handles Stripe Checkout integration for credit purchases and IZA Pass.
"""
from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, field_validator

from app.dependencies.auth import AuthContext, get_current_user
from app.core.json import normalize_to_json_optional
from app.db.prisma_client import prisma


router = APIRouter(prefix="/billing", tags=["billing", "checkout"])


# --- Environment Configuration ---
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_ENABLED = bool(STRIPE_SECRET_KEY)

# Frontend URLs for redirects
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
CHECKOUT_SUCCESS_URL = f"{FRONTEND_URL}/app/billing?checkout=success"
CHECKOUT_CANCEL_URL = f"{FRONTEND_URL}/app/billing?checkout=cancel"


# --- Product Definitions ---
# These would typically come from Stripe Dashboard, but we define them here for v1

PRODUCTS = {
    "credits_5": {
        "name": "5 Credits",
        "description": "5 Ausfüllhilfen für ZollPilot",
        "price_cents": 699,
        "credits": 5,
        "type": "CREDITS",
    },
    "credits_10": {
        "name": "10 Credits",
        "description": "10 Ausfüllhilfen für ZollPilot",
        "price_cents": 1299,
        "credits": 10,
        "type": "CREDITS",
    },
    "credits_1": {
        "name": "1 Credit",
        "description": "1 Ausfüllhilfe für ZollPilot",
        "price_cents": 149,
        "credits": 1,
        "type": "CREDITS",
    },
    "iza_pass": {
        "name": "IZA Pass",
        "description": "Einmaliger Zugang zur IZA-Ausfüllhilfe",
        "price_cents": 299,
        "credits": 2,
        "type": "IZA_PASS",
    },
}


# --- Request/Response Models ---


class CheckoutSessionRequest(BaseModel):
    product_id: str

    @field_validator("product_id")
    @classmethod
    def validate_product_id(cls, v: str) -> str:
        if v not in PRODUCTS:
            raise ValueError(f"Invalid product_id. Must be one of: {list(PRODUCTS.keys())}")
        return v


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str
    product_id: str
    amount_cents: int
    currency: str


class CheckoutSessionWrapper(BaseModel):
    data: CheckoutSessionResponse


class ProductInfo(BaseModel):
    id: str
    name: str
    description: str
    price_cents: int
    credits: int
    type: str


class ProductsListWrapper(BaseModel):
    data: list[ProductInfo]


class PurchaseInfo(BaseModel):
    id: str
    type: str
    status: str
    amount_cents: int
    currency: str
    credits_amount: int | None
    product_name: str | None
    created_at: datetime
    paid_at: datetime | None


class PurchaseWrapper(BaseModel):
    data: PurchaseInfo


class PurchasesListWrapper(BaseModel):
    data: list[PurchaseInfo]


# --- Stripe Mock for v1 (no real Stripe SDK) ---


def create_mock_checkout_session(
    product: dict,
    tenant_id: str,
    user_id: str,
    product_id: str,
) -> tuple[str, str]:
    """
    Create a mock checkout session for development/testing.

    In production, this would use the Stripe SDK:

    ```python
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {"name": product["name"]},
                "unit_amount": product["price_cents"],
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=CHECKOUT_SUCCESS_URL + "&session_id={CHECKOUT_SESSION_ID}",
        cancel_url=CHECKOUT_CANCEL_URL,
        metadata={
            "tenant_id": tenant_id,
            "user_id": user_id,
            "product_id": product_id,
        },
    )
    return session.id, session.url
    ```
    """
    # Generate a mock session ID
    import uuid
    session_id = f"cs_mock_{uuid.uuid4().hex[:16]}"

    # In dev mode, redirect to a mock success page with the session ID
    checkout_url = f"{CHECKOUT_SUCCESS_URL}&session_id={session_id}"

    return session_id, checkout_url


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Stripe webhook signature.

    In production:
    ```python
    import stripe
    try:
        stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
        return True
    except stripe.error.SignatureVerificationError:
        return False
    ```
    """
    if not STRIPE_WEBHOOK_SECRET:
        # In dev mode, accept all webhooks
        return True

    # Simple HMAC verification for testing
    expected = hmac.new(
        STRIPE_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, f"sha256={expected}")


# --- Endpoints ---


@router.get("/products", response_model=ProductsListWrapper)
async def list_products(
    context: AuthContext = Depends(get_current_user),
) -> ProductsListWrapper:
    """
    List available products for purchase.

    Returns all credit packs and passes available for purchase.
    """
    products = [
        ProductInfo(
            id=pid,
            name=p["name"],
            description=p["description"],
            price_cents=p["price_cents"],
            credits=p["credits"],
            type=p["type"],
        )
        for pid, p in PRODUCTS.items()
    ]

    return ProductsListWrapper(data=products)


@router.post("/checkout/session", response_model=CheckoutSessionWrapper)
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    context: AuthContext = Depends(get_current_user),
) -> CheckoutSessionWrapper:
    """
    Create a Stripe Checkout session for purchasing credits or passes.

    Returns a checkout URL that the frontend should redirect to.
    """
    tenant_id = context.tenant["id"]
    user_id = context.user["id"]
    product_id = payload.product_id
    product = PRODUCTS[product_id]

    # Create checkout session (mock or real Stripe)
    if STRIPE_ENABLED:
        # TODO: Implement real Stripe integration
        session_id, checkout_url = create_mock_checkout_session(
            product, tenant_id, user_id, product_id
        )
    else:
        session_id, checkout_url = create_mock_checkout_session(
            product, tenant_id, user_id, product_id
        )

    # Create pending purchase record
    purchase_type = "CREDITS" if product["type"] == "CREDITS" else "IZA_PASS"

    await prisma.purchase.create(
        data={
            "tenant_id": tenant_id,
            "user_id": user_id,
            "provider": "STRIPE",
            "provider_ref": session_id,
            "type": purchase_type,
            "amount_cents": product["price_cents"],
            "currency": "EUR",
            "credits_amount": product["credits"],
            "status": "PENDING",
            "metadata_json": normalize_to_json_optional({
                "product_id": product_id,
                "product_name": product["name"],
            }),
        }
    )

    return CheckoutSessionWrapper(
        data=CheckoutSessionResponse(
            checkout_url=checkout_url,
            session_id=session_id,
            product_id=product_id,
            amount_cents=product["price_cents"],
            currency="EUR",
        )
    )


@router.post("/webhook")
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
) -> dict:
    """
    Handle Stripe webhook events.

    Processes checkout.session.completed events to:
    1. Mark purchase as PAID
    2. Credit the tenant's account
    3. Create ledger entry
    """
    payload = await request.body()

    # Verify signature (in production)
    if STRIPE_WEBHOOK_SECRET and stripe_signature:
        if not verify_webhook_signature(payload, stripe_signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_SIGNATURE", "message": "Invalid webhook signature"},
            )

    # Parse webhook payload
    import json
    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PAYLOAD", "message": "Invalid JSON payload"},
        )

    event_type = event.get("type", "")

    # Handle checkout.session.completed
    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        session_id = session.get("id", "")

        if not session_id:
            return {"received": True, "processed": False, "reason": "No session ID"}

        # Find the purchase
        purchase = await prisma.purchase.find_first(
            where={"provider_ref": session_id}
        )

        if not purchase:
            return {"received": True, "processed": False, "reason": "Purchase not found"}

        # Idempotency check - already processed
        if purchase.status == "PAID":
            return {"received": True, "processed": False, "reason": "Already processed"}

        # Update purchase status
        await prisma.purchase.update(
            where={"id": purchase.id},
            data={
                "status": "PAID",
                "paid_at": datetime.utcnow(),
            },
        )

        # Credit the account
        credits_to_add = purchase.credits_amount or 0

        if credits_to_add > 0:
            # Upsert balance
            await prisma.tenantcreditbalance.upsert(
                where={"tenant_id": purchase.tenant_id},
                data={
                    "create": {"tenant_id": purchase.tenant_id, "balance": credits_to_add},
                    "update": {"balance": {"increment": credits_to_add}},
                },
            )

            # Create ledger entry
            metadata = purchase.metadata_json if isinstance(purchase.metadata_json, dict) else {}
            await prisma.creditledgerentry.create(
                data={
                    "tenant_id": purchase.tenant_id,
                    "delta": credits_to_add,
                    "reason": "PURCHASE",
                    "metadata_json": normalize_to_json_optional({
                        "purchase_id": purchase.id,
                        "product_name": metadata.get("product_name", "Credits"),
                        "amount_cents": purchase.amount_cents,
                    }),
                    "created_by_user_id": purchase.user_id,
                },
            )

            # Log user event
            await prisma.userevent.create(
                data={
                    "user_id": purchase.user_id,
                    "type": "PURCHASE",
                    "metadata_json": normalize_to_json_optional({
                        "purchase_id": purchase.id,
                        "credits": credits_to_add,
                        "amount_cents": purchase.amount_cents,
                    }),
                },
            )

        return {"received": True, "processed": True}

    # Handle checkout.session.expired (optional)
    if event_type == "checkout.session.expired":
        session = event.get("data", {}).get("object", {})
        session_id = session.get("id", "")

        if session_id:
            await prisma.purchase.update_many(
                where={"provider_ref": session_id, "status": "PENDING"},
                data={"status": "FAILED"},
            )

        return {"received": True, "processed": True}

    # Unknown event type - acknowledge but don't process
    return {"received": True, "processed": False, "reason": f"Unhandled event: {event_type}"}


@router.get("/purchases", response_model=PurchasesListWrapper)
async def list_purchases(
    context: AuthContext = Depends(get_current_user),
    limit: int = 20,
) -> PurchasesListWrapper:
    """
    List purchases for the current tenant.
    """
    tenant_id = context.tenant["id"]

    purchases = await prisma.purchase.find_many(
        where={"tenant_id": tenant_id},
        order={"created_at": "desc"},
        take=min(limit, 100),
    )

    result = []
    for p in purchases:
        metadata = p.metadata_json if isinstance(p.metadata_json, dict) else {}
        result.append(
            PurchaseInfo(
                id=p.id,
                type=p.type,
                status=p.status,
                amount_cents=p.amount_cents,
                currency=p.currency,
                credits_amount=p.credits_amount,
                product_name=metadata.get("product_name"),
                created_at=p.created_at,
                paid_at=p.paid_at,
            )
        )

    return PurchasesListWrapper(data=result)


@router.get("/purchases/{purchase_id}", response_model=PurchaseWrapper)
async def get_purchase(
    purchase_id: str,
    context: AuthContext = Depends(get_current_user),
) -> PurchaseWrapper:
    """
    Get a single purchase (receipt).
    """
    tenant_id = context.tenant["id"]

    purchase = await prisma.purchase.find_first(
        where={"id": purchase_id, "tenant_id": tenant_id}
    )

    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Kauf nicht gefunden."},
        )

    metadata = purchase.metadata_json if isinstance(purchase.metadata_json, dict) else {}

    return PurchaseWrapper(
        data=PurchaseInfo(
            id=purchase.id,
            type=purchase.type,
            status=purchase.status,
            amount_cents=purchase.amount_cents,
            currency=purchase.currency,
            credits_amount=purchase.credits_amount,
            product_name=metadata.get("product_name"),
            created_at=purchase.created_at,
            paid_at=purchase.paid_at,
        )
    )


@router.post("/checkout/complete")
async def complete_mock_checkout(
    session_id: str,
    context: AuthContext = Depends(get_current_user),
) -> dict:
    """
    Complete a mock checkout session (for development only).

    This simulates a successful Stripe webhook without needing actual Stripe.
    In production, this endpoint should be disabled.
    """
    if STRIPE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Not available in production"},
        )

    tenant_id = context.tenant["id"]
    user_id = context.user["id"]

    # Find the purchase
    purchase = await prisma.purchase.find_first(
        where={"provider_ref": session_id, "tenant_id": tenant_id}
    )

    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Checkout-Session nicht gefunden."},
        )

    # Already paid
    if purchase.status == "PAID":
        return {"data": {"status": "already_paid", "purchase_id": purchase.id}}

    # Mark as paid
    await prisma.purchase.update(
        where={"id": purchase.id},
        data={
            "status": "PAID",
            "paid_at": datetime.utcnow(),
        },
    )

    # Credit the account
    credits_to_add = purchase.credits_amount or 0

    if credits_to_add > 0:
        # Upsert balance
        await prisma.tenantcreditbalance.upsert(
            where={"tenant_id": tenant_id},
            data={
                "create": {"tenant_id": tenant_id, "balance": credits_to_add},
                "update": {"balance": {"increment": credits_to_add}},
            },
        )

        # Create ledger entry
        metadata = purchase.metadata_json if isinstance(purchase.metadata_json, dict) else {}
        await prisma.creditledgerentry.create(
            data={
                "tenant_id": tenant_id,
                "delta": credits_to_add,
                "reason": "PURCHASE",
                "metadata_json": normalize_to_json_optional({
                    "purchase_id": purchase.id,
                    "product_name": metadata.get("product_name", "Credits"),
                    "amount_cents": purchase.amount_cents,
                }),
                "created_by_user_id": user_id,
            },
        )

        # Log user event
        await prisma.userevent.create(
            data={
                "user_id": user_id,
                "type": "PURCHASE",
                "metadata_json": normalize_to_json_optional({
                    "purchase_id": purchase.id,
                    "credits": credits_to_add,
                    "amount_cents": purchase.amount_cents,
                }),
            },
        )

    return {
        "data": {
            "status": "completed",
            "purchase_id": purchase.id,
            "credits_added": credits_to_add,
        }
    }
