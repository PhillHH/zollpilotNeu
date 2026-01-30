"""
Profile API Routes

Endpoints for managing user profile data.
Profile data is used for pre-filling forms in the wizard.
"""

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma


router = APIRouter(prefix="/profile", tags=["profile"])


# --- Request/Response Models ---


class ProfileData(BaseModel):
    """User profile data for form pre-filling."""

    # Persönliche Daten
    name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)

    # Standard-Absender
    default_sender_name: Optional[str] = Field(None, max_length=200)
    default_sender_country: Optional[str] = Field(None, max_length=2)

    # Standard-Empfänger
    default_recipient_name: Optional[str] = Field(None, max_length=200)
    default_recipient_country: Optional[str] = Field(None, max_length=2)

    # Häufige Länder & Währungen
    preferred_countries: Optional[List[str]] = Field(None, max_length=20)
    preferred_currencies: Optional[List[str]] = Field(None, max_length=10)


class ProfileResponse(BaseModel):
    """Profile GET response."""

    class ProfileResponseData(BaseModel):
        user_id: str
        email: str
        name: Optional[str] = None
        address: Optional[str] = None
        default_sender_name: Optional[str] = None
        default_sender_country: Optional[str] = None
        default_recipient_name: Optional[str] = None
        default_recipient_country: Optional[str] = None
        preferred_countries: Optional[List[str]] = None
        preferred_currencies: Optional[List[str]] = None
        updated_at: Optional[datetime] = None

    data: ProfileResponseData


class ProfileUpdateRequest(BaseModel):
    """Profile PUT request body."""

    name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)
    default_sender_name: Optional[str] = Field(None, max_length=200)
    default_sender_country: Optional[str] = Field(None, max_length=2)
    default_recipient_name: Optional[str] = Field(None, max_length=200)
    default_recipient_country: Optional[str] = Field(None, max_length=2)
    preferred_countries: Optional[List[str]] = Field(None, max_length=20)
    preferred_currencies: Optional[List[str]] = Field(None, max_length=10)


# --- Endpoints ---


@router.get("", response_model=ProfileResponse)
async def get_profile(
    context: AuthContext = Depends(get_current_user),
) -> ProfileResponse:
    """
    Get the current user's profile.

    Returns profile data including personal info, default sender/recipient,
    and preferred countries/currencies for form pre-filling.
    """
    user_id = context.user["id"]
    email = context.user["email"]

    # Try to get existing profile
    profile = await prisma.userprofile.find_unique(where={"user_id": user_id})

    if profile:
        return ProfileResponse(
            data=ProfileResponse.ProfileResponseData(
                user_id=user_id,
                email=email,
                name=profile.name,
                address=profile.address,
                default_sender_name=profile.default_sender_name,
                default_sender_country=profile.default_sender_country,
                default_recipient_name=profile.default_recipient_name,
                default_recipient_country=profile.default_recipient_country,
                preferred_countries=profile.preferred_countries,
                preferred_currencies=profile.preferred_currencies,
                updated_at=profile.updated_at,
            )
        )

    # Return empty profile if none exists
    return ProfileResponse(
        data=ProfileResponse.ProfileResponseData(
            user_id=user_id,
            email=email,
        )
    )


@router.put("", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    context: AuthContext = Depends(get_current_user),
) -> ProfileResponse:
    """
    Update the current user's profile.

    Creates the profile if it doesn't exist (upsert).
    All fields are optional - only provided fields are updated.
    """
    user_id = context.user["id"]
    email = context.user["email"]

    # Build update data (only non-None fields)
    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name or None
    if payload.address is not None:
        update_data["address"] = payload.address or None
    if payload.default_sender_name is not None:
        update_data["default_sender_name"] = payload.default_sender_name or None
    if payload.default_sender_country is not None:
        update_data["default_sender_country"] = payload.default_sender_country or None
    if payload.default_recipient_name is not None:
        update_data["default_recipient_name"] = payload.default_recipient_name or None
    if payload.default_recipient_country is not None:
        update_data["default_recipient_country"] = (
            payload.default_recipient_country or None
        )
    if payload.preferred_countries is not None:
        update_data["preferred_countries"] = payload.preferred_countries or None
    if payload.preferred_currencies is not None:
        update_data["preferred_currencies"] = payload.preferred_currencies or None

    # Upsert profile
    profile = await prisma.userprofile.upsert(
        where={"user_id": user_id},
        data={
            "create": {"user_id": user_id, **update_data},
            "update": update_data,
        },
    )

    return ProfileResponse(
        data=ProfileResponse.ProfileResponseData(
            user_id=user_id,
            email=email,
            name=profile.name,
            address=profile.address,
            default_sender_name=profile.default_sender_name,
            default_sender_country=profile.default_sender_country,
            default_recipient_name=profile.default_recipient_name,
            default_recipient_country=profile.default_recipient_country,
            preferred_countries=profile.preferred_countries,
            preferred_currencies=profile.preferred_currencies,
            updated_at=profile.updated_at,
        )
    )
