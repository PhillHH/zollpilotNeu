from dataclasses import dataclass
import os
from typing import Literal


Environment = Literal["development", "staging", "production"]


@dataclass(frozen=True)
class Settings:
    # Environment
    environment: Environment
    debug_mode: bool
    
    # API
    api_host: str
    api_port: int
    log_level: str
    
    # Database
    database_url: str
    
    # Session
    session_secret: str
    session_ttl_minutes: int
    session_cookie_name: str
    session_cookie_secure: bool
    session_cookie_domain: str | None
    session_cookie_samesite: str
    
    # CORS
    web_origin: str
    
    # Rate Limits
    rate_limit_default: int
    rate_limit_pdf: int
    rate_limit_validation: int
    rate_limit_fields: int


class ConfigurationError(Exception):
    """Raised when configuration is invalid."""
    pass


def _get_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes"}


def _get_int(key: str, default: int) -> int:
    value = os.getenv(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        raise ConfigurationError(f"{key} must be an integer, got: {value}")


def validate_settings(settings: Settings) -> list[str]:
    """
    Validate settings and return list of warnings/errors.
    Raises ConfigurationError for critical issues.
    """
    errors: list[str] = []
    warnings: list[str] = []
    
    # Critical validations
    if not settings.session_secret:
        errors.append("SESSION_SECRET is required")
    elif len(settings.session_secret) < 32:
        warnings.append("SESSION_SECRET should be at least 32 characters")
    elif settings.session_secret == "change-me":
        if settings.environment == "production":
            errors.append("SESSION_SECRET must not be 'change-me' in production")
        else:
            warnings.append("SESSION_SECRET is using default value")
    
    if not settings.database_url:
        errors.append("DATABASE_URL is required")
    
    # Production-specific validations
    if settings.environment == "production":
        if not settings.session_cookie_secure:
            warnings.append("SESSION_COOKIE_SECURE should be true in production")
        if settings.debug_mode:
            warnings.append("DEBUG_MODE should be false in production")
        if "localhost" in settings.web_origin:
            warnings.append("WEB_ORIGIN contains 'localhost' in production")
    
    if errors:
        raise ConfigurationError(f"Configuration errors: {', '.join(errors)}")
    
    return warnings


def get_settings() -> Settings:
    """
    Load and validate application settings from environment variables.
    Raises ConfigurationError if critical settings are missing or invalid.
    """
    environment_str = os.getenv("NODE_ENV", "development")
    if environment_str not in ("development", "staging", "production"):
        environment_str = "development"
    environment: Environment = environment_str  # type: ignore
    
    session_secret = os.getenv("SESSION_SECRET", "")
    database_url = os.getenv("DATABASE_URL", "")
    
    session_cookie_domain = os.getenv("SESSION_COOKIE_DOMAIN") or None
    if session_cookie_domain in {"localhost", "127.0.0.1"}:
        session_cookie_domain = None

    settings = Settings(
        environment=environment,
        debug_mode=_get_bool(os.getenv("DEBUG_MODE"), False),
        api_host=os.getenv("API_HOST", "0.0.0.0"),
        api_port=_get_int("API_PORT", 8000),
        log_level=os.getenv("LOG_LEVEL", "info"),
        database_url=database_url,
        session_secret=session_secret,
        session_ttl_minutes=_get_int("SESSION_TTL_MINUTES", 120),
        session_cookie_name=os.getenv("SESSION_COOKIE_NAME", "zollpilot_session"),
        session_cookie_secure=_get_bool(os.getenv("SESSION_COOKIE_SECURE"), False),
        session_cookie_domain=session_cookie_domain,
        session_cookie_samesite=os.getenv("SESSION_COOKIE_SAMESITE", "Lax"),
        web_origin=os.getenv("WEB_ORIGIN", "http://localhost:3000"),
        rate_limit_default=_get_int("RATE_LIMIT_DEFAULT", 60),
        rate_limit_pdf=_get_int("RATE_LIMIT_PDF", 10),
        rate_limit_validation=_get_int("RATE_LIMIT_VALIDATION", 30),
        rate_limit_fields=_get_int("RATE_LIMIT_FIELDS", 120),
    )
    
    # Validate (will raise ConfigurationError if critical issues)
    warnings = validate_settings(settings)
    
    # Log warnings in non-test environments
    if warnings and environment != "development":
        import logging
        logger = logging.getLogger("config")
        for warning in warnings:
            logger.warning(f"Configuration warning: {warning}")
    
    return settings

