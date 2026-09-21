"""Data-ingestion errors — controlled codes, no raw parser internals."""

from __future__ import annotations

import uuid
from typing import Any

from app.exceptions import FinArivuException
from app.data_ingestion.types import IngestionErrorCode


class IngestionError(FinArivuException):
    """Base ingestion error carrying a controlled IngestionErrorCode."""

    def __init__(
        self,
        code: IngestionErrorCode,
        message: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            error_code=code.value,
            details=details,
        )
        self.code = code

    @classmethod
    def unsupported_format(cls, detail: str = "") -> "IngestionError":
        return cls(
            IngestionErrorCode.UNSUPPORTED_FORMAT,
            detail or "This file format isn't supported yet.",
            status_code=422,
        )

    @classmethod
    def unreadable(cls, detail: str = "") -> "IngestionError":
        return cls(
            IngestionErrorCode.UNREADABLE_DOCUMENT,
            detail or "We couldn't reliably read this document.",
            status_code=422,
        )

    @classmethod
    def empty_document(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.EMPTY_DOCUMENT,
            "This document doesn't contain readable text.",
            status_code=422,
        )

    @classmethod
    def ambiguous_document(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.AMBIGUOUS_DOCUMENT,
            "We couldn't identify the document type. Please choose it "
            "manually.",
            status_code=422,
        )

    @classmethod
    def unsupported_document(cls, detected: str) -> "IngestionError":
        return cls(
            IngestionErrorCode.UNSUPPORTED_DOCUMENT,
            f"'{detected}' isn't a supported document type yet.",
            status_code=422,
        )

    @classmethod
    def duplicate_import(cls, batch_id: uuid.UUID) -> "IngestionError":
        return cls(
            IngestionErrorCode.DUPLICATE_IMPORT,
            "This document appears to have already been imported.",
            status_code=409,
            details={"existingBatchId": str(batch_id)},
        )

    @classmethod
    def not_found(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.IMPORT_NOT_FOUND,
            "That import does not exist.",
            status_code=404,
        )

    @classmethod
    def invalid_status(cls, status: str, action: str) -> "IngestionError":
        return cls(
            IngestionErrorCode.INVALID_STATUS,
            f"An import in status {status} cannot be {action}.",
            status_code=409,
        )

    @classmethod
    def already_applied(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.ALREADY_APPLIED,
            "This import has already been applied.",
            status_code=409,
        )

    @classmethod
    def already_cancelled(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.ALREADY_CANCELLED,
            "This import has already been cancelled.",
            status_code=409,
        )

    @classmethod
    def stale_preview(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.STALE_PREVIEW,
            "This preview changed since your review — please review again.",
            status_code=409,
        )

    @classmethod
    def invalid_candidate(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.INVALID_CANDIDATE,
            "That import candidate does not exist.",
            status_code=404,
        )

    @classmethod
    def invalid_value(cls, detail: str) -> "IngestionError":
        return cls(
            IngestionErrorCode.INVALID_VALUE,
            detail,
            status_code=422,
        )

    @classmethod
    def file_too_large(cls) -> "IngestionError":
        return cls(
            IngestionErrorCode.FILE_TOO_LARGE,
            "File exceeds the 5 MB limit.",
            status_code=413,
        )
