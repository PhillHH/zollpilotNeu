from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    api_host: str
    api_port: int
    log_level: str
    database_url: str
    session_secret: str
    session_ttl_minutes: int
    session_cookie_name: str
    session_cookie_secure: bool
    session_cookie_domain: str | None
    web_origin: str


def _get_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes"}


def get_settings() -> Settings:
    session_secret = os.getenv("SESSION_SECRET", "")
    if not session_secret:
        raise RuntimeError("SESSION_SECRET is required")

    return Settings(
        api_host=os.getenv("API_HOST", "0.0.0.0"),
        api_port=int(os.getenv("API_PORT", "8000")),
        log_level=os.getenv("LOG_LEVEL", "info"),
        database_url=os.getenv("DATABASE_URL", ""),
        session_secret=session_secret,
        session_ttl_minutes=int(os.getenv("SESSION_TTL_MINUTES", "120")),
        session_cookie_name=os.getenv("SESSION_COOKIE_NAME", "zollpilot_session"),
        session_cookie_secure=_get_bool(os.getenv("SESSION_COOKIE_SECURE"), False),
        session_cookie_domain=os.getenv("SESSION_COOKIE_DOMAIN"),
        web_origin=os.getenv("WEB_ORIGIN", "http://localhost:3000"),
    )

