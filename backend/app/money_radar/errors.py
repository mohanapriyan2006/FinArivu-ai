"""Money Radar errors — controlled codes, no stack traces to the client."""

from __future__ import annotations

import uuid

from app.exceptions import FinArivuException, NotFoundError
from app.money_radar.radar_types import RadarErrorCode


class RadarError(FinArivuException):
    """Base radar error carrying a controlled RadarErrorCode."""

    def __init__(
        self,
        code: RadarErrorCode,
        message: str,
        status_code: int = 400,
    ) -> None:
        super().__init__(message, status_code=status_code, error_code=code.value)
        self.code = code

    @classmethod
    def not_found(cls, insight_id: uuid.UUID) -> "RadarError":
        return cls(
            RadarErrorCode.INSIGHT_NOT_FOUND,
            "That insight does not exist.",
            status_code=404,
        )

    @classmethod
    def invalid_filter(cls, field: str) -> "RadarError":
        return cls(
            RadarErrorCode.INVALID_FILTER,
            f"Invalid filter value for '{field}'.",
            status_code=422,
        )


__all__ = ["RadarError", "NotFoundError"]
