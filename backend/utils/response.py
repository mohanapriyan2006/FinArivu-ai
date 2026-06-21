"""Standard API response wrapper."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""

    success: bool
    message: str
    data: T | None = None
    error_code: str | None = None


def success_response(
    data: Any = None,
    message: str = "Success",
) -> dict[str, Any]:
    """Create a success response."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "error_code": None,
    }


def error_response(
    message: str,
    error_code: str,
) -> dict[str, Any]:
    """Create an error response."""
    return {
        "success": False,
        "message": message,
        "data": None,
        "error_code": error_code,
    }
