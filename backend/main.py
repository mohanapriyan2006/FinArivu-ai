"""FinArivu AI FastAPI application entry point."""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from api.v1.router import api_router
from core.config import settings
from core.logging import logger
from core.security import setup_security_middleware
from utils.exceptions import FinArivuException
from utils.response import error_response


def create_application() -> FastAPI:
    """Application factory for FinArivu API."""
    app = FastAPI(
        title="FinArivu AI API",
        description="AI Personal CFO for Indian Salaried Professionals",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
    )

    # Security middleware
    setup_security_middleware(app)

    # Include API routers
    app.include_router(api_router, prefix="/api")

    # Global exception handlers
    @app.exception_handler(FinArivuException)
    async def finarivu_exception_handler(
        request: Request,
        exc: FinArivuException,
    ):
        logger.error(
            "Application exception",
            extra={
                "error_code": exc.error_code,
                "path": request.url.path,
                "detail": exc.detail,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=str(exc.detail),
                error_code=exc.error_code,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
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
                error_code="VAL_001",
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                message=exc.detail,
                error_code=f"HTTP_{exc.status_code}",
            ),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(
            "Unhandled exception",
            extra={"path": request.url.path, "error": str(exc)},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                message="Internal server error",
                error_code="GEN_001",
            ),
        )

    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy"}

    return app


app = create_application()
