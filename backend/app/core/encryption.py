from __future__ import annotations

import base64
import os
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings
from app.exceptions import FinArivuException


# Derive a deterministic 256-bit AES key from the configured secret + salt.
_SALT = settings.aes_key_salt_str.encode("utf-8")[:16].ljust(16, b"\0")
_KDF = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=_SALT,
    iterations=100_000,
)
_KEY = _KDF.derive(settings.aes_key_str.encode("utf-8"))


def encrypt(value: str) -> str:
    """Encrypt a string using AES-256-GCM and return URL-safe base64 ciphertext."""
    aesgcm = AESGCM(_KEY)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, value.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt(ciphertext: str) -> str:
    """Decrypt an AES-256-GCM ciphertext and return the original string."""
    try:
        data = base64.b64decode(ciphertext)
        nonce, encrypted = data[:12], data[12:]
        aesgcm = AESGCM(_KEY)
        return aesgcm.decrypt(nonce, encrypted, None).decode("utf-8")
    except Exception as exc:
        raise FinArivuException(
            "Failed to decrypt sensitive value",
            status_code=500,
            error_code="DECRYPTION_ERROR",
        ) from exc


def maybe_encrypt(value: Any | None) -> Any | None:
    """Encrypt only string values; pass through others unchanged."""
    if value is None or not isinstance(value, str):
        return value
    return encrypt(value)


def maybe_decrypt(value: Any | None) -> Any | None:
    """Decrypt only string values; pass through others unchanged."""
    if value is None or not isinstance(value, str):
        return value
    return decrypt(value)
