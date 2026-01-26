from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Callable

from fastapi import Depends, HTTPException, Request, status

from app.core.rbac import Role, role_at_least
from app.db.prisma_client import prisma


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AuthContext:
    user: dict
    tenant: dict
    role: Role
    session_token_hash: str | None


async def get_current_user(request: Request) -> AuthContext:
    """
    Extract and validate current user from session.

    Returns AuthContext with user, tenant, and role information.

    Raises:
        401 UNAUTHORIZED: If not authenticated or session invalid
    """
    session = request.state.session
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_REQUIRED",
                "message": "Authentifizierung erforderlich.",
            },
        )

    user = await prisma.user.find_unique(where={"id": session.user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_REQUIRED",
                "message": "Authentifizierung erforderlich.",
            },
        )

    membership = await prisma.membership.find_first(where={"user_id": user.id})
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "NO_MEMBERSHIP",
                "message": "Keine Mandantenzugehörigkeit gefunden.",
            },
        )

    tenant = await prisma.tenant.find_unique(where={"id": membership.tenant_id})
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "NO_TENANT",
                "message": "Mandant nicht gefunden.",
            },
        )

    return AuthContext(
        user=user.model_dump(),
        tenant=tenant.model_dump(),
        role=Role(membership.role),
        session_token_hash=request.state.session_token_hash,
    )


def require_role(min_role: Role) -> Callable:
    """
    Dependency factory for role-based access control.

    Args:
        min_role: Minimum required role for access

    Returns:
        Dependency that validates role and returns AuthContext

    Raises:
        403 FORBIDDEN: If user's role is below min_role
    """
    async def checker(
        request: Request,
        context: AuthContext = Depends(get_current_user),
    ) -> AuthContext:
        if not role_at_least(context.role, min_role):
            # Log the access attempt for debugging
            request_id = getattr(request.state, "request_id", None)
            logger.warning(
                "Access denied: insufficient role",
                extra={
                    "request_id": request_id,
                    "user_id": context.user.get("id"),
                    "user_role": context.role.value,
                    "required_role": min_role.value,
                    "endpoint": str(request.url.path),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN",
                    "message": "Du bist eingeloggt, hast aber keine Berechtigung für diese Aktion.",
                    "required_role": min_role.value,
                    "your_role": context.role.value,
                },
            )
        return context

    return checker

