from __future__ import annotations

from typing import Any


def success_response(
    data: Any = None,
    message: str = "Success",
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
        "meta": meta if meta is not None else {},
        "errors": None,
    }


def error_response(
    message: str = "An error occurred",
    errors: Any = None,
    error_code: str = "INTERNAL_ERROR",
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "message": message,
        "data": None,
        "meta": meta if meta is not None else {},
        "errors": {
            "code": error_code,
            "details": errors,
        },
    }
