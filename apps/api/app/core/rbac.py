from __future__ import annotations

from enum import Enum


class Role(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    USER = "USER"


_ROLE_ORDER = {
    Role.OWNER: 3,
    Role.ADMIN: 2,
    Role.USER: 1,
}


def role_at_least(user_role: Role, required_role: Role) -> bool:
    return _ROLE_ORDER[user_role] >= _ROLE_ORDER[required_role]

