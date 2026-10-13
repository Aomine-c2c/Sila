"""
Cryptographic utilities for NEIMAN OS.
Provides key encryption and decryption for provider API keys using Fernet and machine secret salt.
"""

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet

from nexora.config import get_settings


@lru_cache
def _get_fernet() -> Fernet:
    """Derive a stable 32-byte Fernet key from SECRET_KEY + AUDIT_SECRET_SALT."""
    settings = get_settings()
    key_material = f"{settings.SECRET_KEY}:{settings.AUDIT_SECRET_SALT}".encode("utf-8")
    derived = hashlib.sha256(key_material).digest()
    url_safe_key = base64.urlsafe_b64encode(derived)
    return Fernet(url_safe_key)


def encrypt_secret(plain_text: str | None) -> str | None:
    """Encrypt a secret string into a Fernet ciphertext."""
    if not plain_text or not plain_text.strip():
        return None
    cipher = _get_fernet()
    return cipher.encrypt(plain_text.strip().encode("utf-8")).decode("utf-8")


def decrypt_secret(cipher_text: str | None) -> str | None:
    """Decrypt a Fernet ciphertext back to plaintext secret."""
    if not cipher_text or not cipher_text.strip():
        return None
    try:
        cipher = _get_fernet()
        return cipher.decrypt(cipher_text.strip().encode("utf-8")).decode("utf-8")
    except Exception:
        # Fallback if unencrypted legacy value or key mismatch
        return cipher_text


def mask_secret(secret: str | None) -> str | None:
    """Return masked presentation (e.g., sk-...4938 or empty)."""
    if not secret:
        return None
    clean = secret.strip()
    if len(clean) <= 6:
        return "••••••••"
    return f"{clean[:3]}••••••••{clean[-4:]}"
