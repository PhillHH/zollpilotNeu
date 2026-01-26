from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from fastapi import Depends, HTTPException, Request, status

from app.core.rbac import Role, role_at_least
from app.db.prisma_client import prisma


@dataclass(frozen=True)
class AuthContext:
    user: dict
    tenant: dict
    role: Role
    session_token_hash: str | None


async def get_current_user(request: Request) -> AuthContext:
    session = request.state.session
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not_authenticated")

    user = await prisma.user.find_unique(where={"id": session.user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not_authenticated")

    membership = await prisma.membership.find_first(where={"user_id": user.id})
    if not membership:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no_membership")

    tenant = await prisma.tenant.find_unique(where={"id": membership.tenant_id})
    if not tenant:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="no_tenant")

    return AuthContext(
        user=user.model_dump(),
        tenant=tenant.model_dump(),
        role=Role(membership.role),
        session_token_hash=request.state.session_token_hash,
    )


def require_role(min_role: Role) -> Callable:
    async def checker(context: AuthContext = Depends(get_current_user)) -> AuthContext:
        if not role_at_least(context.role, min_role):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
        return context

    return checker

