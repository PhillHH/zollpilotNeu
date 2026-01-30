from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    """
    User roles with hierarchical permissions.

    Hierarchy (highest to lowest):
    - SYSTEM_ADMIN: ZollPilot internal, full system access (plans, all tenants)
    - OWNER: Tenant owner, full access within their tenant
    - ADMIN: Tenant administrator, administrative access within tenant
    - EDITOR: Content editor, can manage blog and FAQ content
    - USER: Standard user, limited access within tenant
    """
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    USER = "USER"


_ROLE_ORDER = {
    Role.SYSTEM_ADMIN: 5,
    Role.OWNER: 4,
    Role.ADMIN: 3,
    Role.EDITOR: 2,
    Role.USER: 1,
}


def role_at_least(user_role: Role, required_role: Role) -> bool:
    """Check if user_role is at least as high as required_role."""
    return _ROLE_ORDER[user_role] >= _ROLE_ORDER[required_role]


def is_system_admin(role: Role) -> bool:
    """Check if role is SYSTEM_ADMIN."""
    return role == Role.SYSTEM_ADMIN


def can_manage_content(role: Role) -> bool:
    """Check if role can manage content (blog, FAQ)."""
    return role in (Role.SYSTEM_ADMIN, Role.OWNER, Role.ADMIN, Role.EDITOR)
