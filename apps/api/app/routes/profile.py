"""
Profile API Routes

Endpoints for managing user profile data.
Profile data is used for pre-filling forms in the wizard.
"""

import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma

logger = logging.getLogger(__name__)


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
    user_id = context.user.get("id") if context.user else None
    email = context.user.get("email", "") if context.user else ""

    if not user_id:
        # Should not happen with proper auth, but return empty profile
        return ProfileResponse(
            data=ProfileResponse.ProfileResponseData(
                user_id="",
                email="",
            )
        )

    # Try to get existing profile
    try:
        profile = await prisma.userprofile.find_unique(where={"user_id": user_id})
    except Exception as e:
        logger.exception(f"Error fetching profile for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PROFILE_FETCH_ERROR",
                "message": f"Failed to load profile: {str(e)}",
            },
        )

    if profile:
        # Safely convert JSON fields to lists
        preferred_countries = None
        preferred_currencies = None

        if profile.preferred_countries is not None:
            if isinstance(profile.preferred_countries, list):
                preferred_countries = profile.preferred_countries
            elif isinstance(profile.preferred_countries, str):
                # Handle case where it might be stored as JSON string
                import json
                try:
                    preferred_countries = json.loads(profile.preferred_countries)
                except (json.JSONDecodeError, TypeError):
                    preferred_countries = None

        if profile.preferred_currencies is not None:
            if isinstance(profile.preferred_currencies, list):
                preferred_currencies = profile.preferred_currencies
            elif isinstance(profile.preferred_currencies, str):
                import json
                try:
                    preferred_currencies = json.loads(profile.preferred_currencies)
                except (json.JSONDecodeError, TypeError):
                    preferred_currencies = None

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
                preferred_countries=preferred_countries,
                preferred_currencies=preferred_currencies,
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
    user_id = context.user.get("id") if context.user else None
    email = context.user.get("email", "") if context.user else ""

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_USER", "message": "No user found in session."},
        )

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
    try:
        profile = await prisma.userprofile.upsert(
            where={"user_id": user_id},
            data={
                "create": {"user_id": user_id, **update_data},
                "update": update_data,
            },
        )
    except Exception as e:
        logger.exception(f"Error updating profile for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PROFILE_UPDATE_ERROR",
                "message": f"Failed to update profile: {str(e)}",
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
