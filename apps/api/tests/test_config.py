"""
Tests for configuration validation.
"""

import os
from unittest.mock import patch

import pytest

from app.core.config import (
    Settings,
    ConfigurationError,
    get_settings,
    validate_settings,
    _get_bool,
    _get_int,
)


class TestGetBool:
    """Tests for _get_bool helper."""

    def test_returns_default_when_none(self) -> None:
        assert _get_bool(None, True) is True
        assert _get_bool(None, False) is False

    def test_parses_true_values(self) -> None:
        assert _get_bool("1", False) is True
        assert _get_bool("true", False) is True
        assert _get_bool("TRUE", False) is True
        assert _get_bool("yes", False) is True
        assert _get_bool("YES", False) is True

    def test_parses_false_values(self) -> None:
        assert _get_bool("0", True) is False
        assert _get_bool("false", True) is False
        assert _get_bool("no", True) is False
        assert _get_bool("anything", True) is False


class TestGetInt:
    """Tests for _get_int helper."""

    def test_returns_default_when_not_set(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("TEST_INT", raising=False)
        assert _get_int("TEST_INT", 42) == 42

    def test_parses_valid_int(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("TEST_INT", "123")
        assert _get_int("TEST_INT", 0) == 123

    def test_raises_on_invalid_int(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("TEST_INT", "not-a-number")
        with pytest.raises(ConfigurationError) as exc_info:
            _get_int("TEST_INT", 0)
        assert "must be an integer" in str(exc_info.value)


class TestValidateSettings:
    """Tests for validate_settings."""

    def _make_settings(self, **overrides) -> Settings:
        """Create settings with defaults for testing."""
        defaults = {
            "environment": "development",
            "debug_mode": False,
            "api_host": "0.0.0.0",
            "api_port": 8000,
            "log_level": "info",
            "database_url": "postgresql://test:test@localhost/test",
            "session_secret": "a" * 32,
            "session_ttl_minutes": 120,
            "session_cookie_name": "test_session",
            "session_cookie_secure": False,
            "session_cookie_domain": None,
            "session_cookie_samesite": "Lax",
            "web_origin": "http://localhost:3000",
            "rate_limit_default": 60,
            "rate_limit_pdf": 10,
            "rate_limit_validation": 30,
            "rate_limit_fields": 120,
        }
        defaults.update(overrides)
        return Settings(**defaults)

    def test_valid_settings_returns_empty_warnings(self) -> None:
        settings = self._make_settings()
        warnings = validate_settings(settings)
        assert warnings == []

    def test_missing_session_secret_raises_error(self) -> None:
        settings = self._make_settings(session_secret="")
        with pytest.raises(ConfigurationError) as exc_info:
            validate_settings(settings)
        assert "SESSION_SECRET is required" in str(exc_info.value)

    def test_missing_database_url_raises_error(self) -> None:
        settings = self._make_settings(database_url="")
        with pytest.raises(ConfigurationError) as exc_info:
            validate_settings(settings)
        assert "DATABASE_URL is required" in str(exc_info.value)

    def test_short_session_secret_returns_warning(self) -> None:
        settings = self._make_settings(session_secret="short")
        # Should not raise, but return warning
        # Actually this will raise because session_secret is required
        # Let's test with a secret that's not empty but short
        settings = self._make_settings(session_secret="a" * 16)  # 16 chars < 32
        warnings = validate_settings(settings)
        assert any("at least 32 characters" in w for w in warnings)

    def test_default_session_secret_in_production_raises_error(self) -> None:
        settings = self._make_settings(
            environment="production",
            session_secret="change-me",
        )
        with pytest.raises(ConfigurationError) as exc_info:
            validate_settings(settings)
        assert "change-me" in str(exc_info.value)

    def test_insecure_cookie_in_production_returns_warning(self) -> None:
        settings = self._make_settings(
            environment="production",
            session_cookie_secure=False,
        )
        warnings = validate_settings(settings)
        assert any("SESSION_COOKIE_SECURE" in w for w in warnings)

    def test_debug_mode_in_production_returns_warning(self) -> None:
        settings = self._make_settings(
            environment="production",
            debug_mode=True,
        )
        warnings = validate_settings(settings)
        assert any("DEBUG_MODE" in w for w in warnings)

    def test_localhost_origin_in_production_returns_warning(self) -> None:
        settings = self._make_settings(
            environment="production",
            web_origin="http://localhost:3000",
        )
        warnings = validate_settings(settings)
        assert any("localhost" in w for w in warnings)


class TestGetSettings:
    """Tests for get_settings."""

    def test_loads_settings_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("SESSION_SECRET", "a" * 32)
        monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
        monkeypatch.setenv("API_PORT", "9000")
        monkeypatch.setenv("NODE_ENV", "staging")
        
        settings = get_settings()
        
        assert settings.api_port == 9000
        assert settings.environment == "staging"
        assert settings.database_url == "postgresql://test:test@localhost/test"

    def test_raises_on_missing_required_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("SESSION_SECRET", raising=False)
        monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
        
        with pytest.raises(ConfigurationError):
            get_settings()

    def test_uses_defaults_for_optional_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("SESSION_SECRET", "a" * 32)
        monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
        monkeypatch.delenv("API_PORT", raising=False)
        monkeypatch.delenv("LOG_LEVEL", raising=False)
        
        settings = get_settings()
        
        assert settings.api_port == 8000
        assert settings.log_level == "info"

    def test_invalid_environment_defaults_to_development(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("SESSION_SECRET", "a" * 32)
        monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
        monkeypatch.setenv("NODE_ENV", "invalid-env")
        
        settings = get_settings()
        
        assert settings.environment == "development"

