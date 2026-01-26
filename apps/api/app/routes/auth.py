from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.rbac import Role, role_at_least
from app.core.security import (
    compute_expiry,
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.db.prisma_client import prisma
from app.dependencies.auth import AuthContext, get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["auth"])


class Credentials(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime


class TenantResponse(BaseModel):
    id: str
    name: str
    created_at: datetime


class PermissionsResponse(BaseModel):
    can_access_admin: bool


class AuthMeData(BaseModel):
    user: UserResponse
    tenant: TenantResponse
    role: Role
    permissions: PermissionsResponse


class AuthMeResponse(BaseModel):
    data: AuthMeData


class StatusData(BaseModel):
    status: str


class StatusResponse(BaseModel):
    data: StatusData


def _build_permissions(role: Role) -> PermissionsResponse:
    return PermissionsResponse(can_access_admin=role_at_least(role, Role.ADMIN))


async def _create_session(user_id: str, settings: Settings) -> tuple[str, datetime]:
    token = generate_session_token()
    token_hash = hash_session_token(token, settings.session_secret)
    expires_at = compute_expiry(settings.session_ttl_minutes)

    await prisma.session.create(
        data={
            "user_id": user_id,
            "token_hash": token_hash,
            "expires_at": expires_at,
        }
    )

    return token, expires_at


def _set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.session_cookie_secure,
        max_age=settings.session_ttl_minutes * 60,
        domain=settings.session_cookie_domain,
    )


def _clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(key=settings.session_cookie_name, domain=settings.session_cookie_domain)


@router.post("/register", response_model=AuthMeResponse, status_code=status.HTTP_201_CREATED)
async def register(credentials: Credentials, response: Response) -> AuthMeResponse:
    settings = get_settings()
    existing = await prisma.user.find_unique(where={"email": credentials.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="email_in_use")

    user = await prisma.user.create(
        data={
            "email": credentials.email,
            "password_hash": hash_password(credentials.password),
        }
    )
    tenant = await prisma.tenant.create(data={"name": "Default"})
    membership = await prisma.membership.create(
        data={"user_id": user["id"], "tenant_id": tenant["id"], "role": Role.OWNER.value}
    )

    token, _ = await _create_session(user["id"], settings)
    _set_session_cookie(response, token, settings)

    role = Role(membership["role"])
    return AuthMeResponse(
        data=AuthMeData(
            user=UserResponse(**user),
            tenant=TenantResponse(**tenant),
            role=role,
            permissions=_build_permissions(role),
        )
    )


@router.post("/login", response_model=AuthMeResponse)
async def login(credentials: Credentials, response: Response) -> AuthMeResponse:
    settings = get_settings()
    user = await prisma.user.find_unique(where={"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")

    membership = await prisma.membership.find_first(where={"user_id": user["id"]})
    if not membership:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no_membership")

    tenant = await prisma.tenant.find_unique(where={"id": membership["tenant_id"]})
    if not tenant:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no_tenant")

    token, _ = await _create_session(user["id"], settings)
    _set_session_cookie(response, token, settings)

    role = Role(membership["role"])
    return AuthMeResponse(
        data=AuthMeData(
            user=UserResponse(**user),
            tenant=TenantResponse(**tenant),
            role=role,
            permissions=_build_permissions(role),
        )
    )


@router.post("/logout", response_model=StatusResponse)
async def logout(response: Response, context: AuthContext = Depends(get_current_user)) -> StatusResponse:
    settings = get_settings()
    if context.session_token_hash:
        await prisma.session.delete(where={"token_hash": context.session_token_hash})
    _clear_session_cookie(response, settings)
    return StatusResponse(data=StatusData(status="ok"))


@router.get("/me", response_model=AuthMeResponse)
async def me(context: AuthContext = Depends(get_current_user)) -> AuthMeResponse:
    role = context.role
    return AuthMeResponse(
        data=AuthMeData(
            user=UserResponse(**context.user),
            tenant=TenantResponse(**context.tenant),
            role=role,
            permissions=_build_permissions(role),
        )
    )


@router.get("/admin", response_model=StatusResponse)
async def admin(context: AuthContext = Depends(require_role(Role.ADMIN))) -> StatusResponse:
    return StatusResponse(data=StatusData(status="ok"))

