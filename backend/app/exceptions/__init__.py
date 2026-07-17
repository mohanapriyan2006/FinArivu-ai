from __future__ import annotations

from typing import Any


class FinArivuException(Exception):
    """Base exception for all application errors."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        error_code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class ValidationError(FinArivuException):
    status_code = 422
    error_code = "VALIDATION_ERROR"


class AuthenticationError(FinArivuException):
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"


class AuthorizationError(FinArivuException):
    status_code = 403
    error_code = "AUTHORIZATION_ERROR"


class NotFoundError(FinArivuException):
    status_code = 404
    error_code = "NOT_FOUND"


class ConflictError(FinArivuException):
    status_code = 409
    error_code = "CONFLICT"


class BusinessRuleError(FinArivuException):
    status_code = 400
    error_code = "BUSINESS_RULE_ERROR"


class ExternalServiceError(FinArivuException):
    status_code = 502
    error_code = "EXTERNAL_SERVICE_ERROR"
