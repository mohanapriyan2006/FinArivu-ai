"""Custom HTTP exceptions."""

from fastapi import HTTPException, status


class FinArivuException(HTTPException):
    """Base exception for FinArivu API."""

    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: str,
    ) -> None:
        self.error_code = error_code
        super().__init__(status_code=status_code, detail=message)


class AuthenticationError(FinArivuException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code="AUTH_001",
        )


class AuthorizationError(FinArivuException):
    """Raised when user is not authorized."""

    def __init__(self, message: str = "Not authorized") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code="AUTH_002",
        )


class ResourceNotFoundError(FinArivuException):
    """Raised when a resource is not found."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code="RES_001",
        )


class ValidationError(FinArivuException):
    """Raised when validation fails."""

    def __init__(self, message: str = "Validation error") -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error_code="VAL_001",
        )


class DatabaseError(FinArivuException):
    """Raised when a database operation fails."""

    def __init__(self, message: str = "Database error") -> None:
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=message,
            error_code="DB_001",
        )
