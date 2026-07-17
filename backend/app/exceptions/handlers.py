from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logger import logger
from app.exceptions import FinArivuException
from app.utils.response import error_response


def add_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI application."""

    @app.exception_handler(FinArivuException)
    async def finarivu_exception_handler(request: Request, exc: FinArivuException) -> JSONResponse:
        logger.error(
            "Application exception",
            extra={
                "error_code": exc.error_code,
                "path": request.url.path,
                "detail": exc.message,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=exc.message,
                error_code=exc.error_code,
                errors=exc.details,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        errors = exc.errors()
        message = errors[0]["msg"] if errors else "Validation error"
        logger.warning(
            "Validation error",
            extra={"path": request.url.path, "errors": str(errors)},
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response(
                message=message,
                error_code="VALIDATION_ERROR",
                errors=errors,
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=str(exc.detail),
                error_code=f"HTTP_{exc.status_code}",
            ),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Unhandled exception",
            extra={"path": request.url.path, "error": str(exc)},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Internal server error",
                error_code="INTERNAL_ERROR",
            ),
        )
