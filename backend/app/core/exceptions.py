from typing import Any

from starlette import status


class AppError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: str = "app_error",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message, code="not_found", status_code=status.HTTP_404_NOT_FOUND)


class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict.") -> None:
        super().__init__(message, code="conflict", status_code=status.HTTP_409_CONFLICT)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication failed.") -> None:
        super().__init__(message, code="unauthorized", status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Permission denied.") -> None:
        super().__init__(message, code="forbidden", status_code=status.HTTP_403_FORBIDDEN)
