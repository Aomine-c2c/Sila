"""Domain exceptions and FastAPI exception handlers."""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ── Domain Exceptions ──────────────────────────────────────────────────────


class NexoraError(Exception):
    """Base exception for all NEXORA domain errors."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "An unexpected error occurred."

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


class NotFoundError(NexoraError):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "Resource not found."


class ConflictError(NexoraError):
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource already exists."


class ForbiddenError(NexoraError):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "You do not have permission to perform this action."


class UnauthorizedError(NexoraError):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Authentication required."


class ValidationError(NexoraError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    detail = "Validation failed."


class BusinessRuleError(NexoraError):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Business rule violation."


# ── FastAPI Exception Handlers ─────────────────────────────────────────────


async def nexora_exception_handler(request: Request, exc: NexoraError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.detail,
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(NexoraError, nexora_exception_handler)  # type: ignore[arg-type]
