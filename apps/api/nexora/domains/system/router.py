"""
System Configuration API.
Provides read/write access to local .env provider keys for the settings UI.
Only available in local (non-production) deployments.
"""

import os
import re
from pathlib import Path

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from nexora.config import get_settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/system", tags=["System Configuration"])

# Path to the API .env file (resolved relative to this file at runtime)
_ENV_FILE = Path(__file__).parent.parent.parent.parent / ".env"

_ALLOWED_KEYS = {
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GEMINI_API_KEY",
    "OLLAMA_HOST",
}


class ProviderKeyUpdate(BaseModel):
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    ollama_host: str | None = None


class ProviderKeyStatus(BaseModel):
    openai_configured: bool
    anthropic_configured: bool
    gemini_configured: bool
    ollama_host: str
    openai_fingerprint: str | None = None
    anthropic_fingerprint: str | None = None
    gemini_fingerprint: str | None = None


def _mask_key(key: str) -> str:
    """Returns a safe fingerprint — first 6 chars + *** + last 4."""
    if not key or len(key) < 12:
        return "***"
    return f"{key[:6]}...{key[-4:]}"


def _read_env() -> dict[str, str]:
    """Read current .env into a key-value dict."""
    result: dict[str, str] = {}
    if not _ENV_FILE.exists():
        return result
    for line in _ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        result[k.strip()] = v.strip()
    return result


def _write_env_key(key: str, value: str) -> None:
    """Update or append a single key in the .env file."""
    if not _ENV_FILE.exists():
        _ENV_FILE.write_text(f"{key}={value}\n")
        return

    content = _ENV_FILE.read_text()
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    if pattern.search(content):
        content = pattern.sub(f"{key}={value}", content)
    else:
        content = content.rstrip("\n") + f"\n{key}={value}\n"
    _ENV_FILE.write_text(content)


def _require_local():
    """Guard: only allow in non-production environments."""
    settings = get_settings()
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System config API is only available in local/development mode.",
        )


@router.get("/provider-keys", response_model=ProviderKeyStatus)
async def get_provider_keys():
    """Return current provider key status (masked — no plaintext exposure)."""
    _require_local()
    env = _read_env()

    openai = env.get("OPENAI_API_KEY", "")
    anthropic = env.get("ANTHROPIC_API_KEY", "")
    gemini = env.get("GEMINI_API_KEY", "")
    ollama = env.get("OLLAMA_HOST", "http://localhost:11434")

    return ProviderKeyStatus(
        openai_configured=bool(openai),
        anthropic_configured=bool(anthropic),
        gemini_configured=bool(gemini),
        ollama_host=ollama,
        openai_fingerprint=_mask_key(openai) if openai else None,
        anthropic_fingerprint=_mask_key(anthropic) if anthropic else None,
        gemini_fingerprint=_mask_key(gemini) if gemini else None,
    )


@router.patch("/provider-keys", response_model=ProviderKeyStatus)
async def update_provider_keys(body: ProviderKeyUpdate):
    """Save provider API keys to the local .env file and invalidate the settings cache."""
    _require_local()

    updates: dict[str, str] = {}
    if body.openai_api_key is not None:
        updates["OPENAI_API_KEY"] = body.openai_api_key
    if body.anthropic_api_key is not None:
        updates["ANTHROPIC_API_KEY"] = body.anthropic_api_key
    if body.gemini_api_key is not None:
        updates["GEMINI_API_KEY"] = body.gemini_api_key
    if body.ollama_host is not None:
        updates["OLLAMA_HOST"] = body.ollama_host

    for key, value in updates.items():
        _write_env_key(key, value)
        logger.info("provider_key_updated", key=key, configured=bool(value))

    # Clear the settings cache so the new keys are picked up on next request
    get_settings.cache_clear()

    return await get_provider_keys()


@router.get("/health-extended")
async def health_extended():
    """Deep health check including provider connectivity status."""
    _require_local()
    env = _read_env()
    settings = get_settings()

    providers: dict[str, dict] = {}

    # OpenAI
    openai_key = env.get("OPENAI_API_KEY", "")
    providers["openai"] = {"configured": bool(openai_key), "status": "ready" if openai_key else "not_configured"}

    # Anthropic
    anthropic_key = env.get("ANTHROPIC_API_KEY", "")
    providers["anthropic"] = {"configured": bool(anthropic_key), "status": "ready" if anthropic_key else "not_configured"}

    # Gemini
    gemini_key = env.get("GEMINI_API_KEY", "")
    providers["gemini"] = {"configured": bool(gemini_key), "status": "ready" if gemini_key else "not_configured"}

    # Ollama local
    ollama_host = env.get("OLLAMA_HOST", settings.OLLAMA_HOST)
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{ollama_host.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                models = [m.get("name") for m in resp.json().get("models", [])]
                providers["ollama"] = {"configured": True, "status": "reachable", "available_models": models}
            else:
                providers["ollama"] = {"configured": False, "status": "unreachable"}
    except Exception:
        providers["ollama"] = {"configured": False, "status": "offline"}

    return {
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "auth_disabled": settings.DISABLE_AUTH,
        "providers": providers,
    }
