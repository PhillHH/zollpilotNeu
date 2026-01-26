from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    password_bytes = password.encode("utf-8")
    hash_bytes = password_hash.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hash_bytes)


def generate_session_token() -> str:
    token = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(token).decode("utf-8")


def hash_session_token(token: str, secret: str) -> str:
    secret_bytes = secret.encode("utf-8")
    token_bytes = token.encode("utf-8")
    digest = hmac.new(secret_bytes, token_bytes, hashlib.sha256).hexdigest()
    return digest


def compute_expiry(minutes: int) -> datetime:
    """Compute session expiry time as timezone-aware UTC datetime."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)

