from __future__ import annotations

import logging
import sys
from typing import Any

from pythonjsonlogger.jsonlogger import JsonFormatter

from app.core.config import settings


def _configure_root_logger() -> logging.Logger:
    logger = logging.getLogger("finarivu")
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))
    logger.handlers.clear()
    logger.propagate = False

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG)

    formatter = JsonFormatter(
        "%(asctime)s %(name)s %(levelname)s %(message)s",
        rename_fields={"asctime": "timestamp", "levelname": "level"},
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


logger: logging.Logger = _configure_root_logger()


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(f"finarivu.{name}")


def sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Remove sensitive financial fields before logging."""
    sensitive = {
        "password",
        "token",
        "secret",
        "salary",
        "income",
        "expense",
        "amount",
        "tax",
        "asset",
        "loan",
        "pan",
        "aadhaar",
    }
    safe: dict[str, Any] = {}
    for key, value in payload.items():
        if any(s in key.lower() for s in sensitive):
            safe[key] = "***"
        else:
            safe[key] = value
    return safe
