"""Data ingestion API — /v1/imports.

All endpoints are JWT-protected and strictly user-scoped. Uploading
extracts and reviews only — financial state changes exclusively on
``POST /{id}/confirm`` with the preview's confirm token.
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.data_ingestion.schemas import (
    ConfirmImportRequest,
    DecideCandidateRequest,
    IngestTextRequest,
)
from app.data_ingestion.service import DataIngestionService
from app.data_ingestion.types import DocumentType, MAX_FILE_SIZE
from app.dependencies.auth import get_current_user_id
from app.utils.response import success_response

router = APIRouter(prefix="/imports", tags=["Data Ingestion"])


def get_ingestion_service(
    session: AsyncSession = Depends(get_db_session),
) -> DataIngestionService:
    return DataIngestionService(session)


@router.post(
    "",
    response_model=dict,
    summary="Upload a financial document for import review",
)
async def upload_import(
    request: Request,
    file: UploadFile = File(...),
    document_type: Annotated[str | None, Form()] = None,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Extract → detect → normalize → candidates. Nothing is applied."""
    user_uuid = uuid.UUID(user_id)
    declared = DocumentType(document_type) if document_type else None
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        from app.data_ingestion.errors import IngestionError

        raise IngestionError.file_too_large()
    preview = await service.ingest_bytes(
        user_uuid,
        file.filename or "document",
        content,
        file.content_type,
        declared,
        source_name="upload",
    )
    request.state.user_id = user_uuid
    return success_response(
        data=preview.model_dump(mode="json"), message="Import ready for review"
    )


@router.post(
    "/from-text",
    response_model=dict,
    summary="Import from pre-extracted document text (copilot path)",
)
async def ingest_from_text(
    body: IngestTextRequest,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    preview = await service.ingest_text(
        user_uuid,
        body.file_name,
        body.content,
        body.mime_type,
        body.document_type,
        source_name="copilot",
    )
    request.state.user_id = user_uuid
    return success_response(
        data=preview.model_dump(mode="json"), message="Import ready for review"
    )


@router.get("", response_model=dict, summary="Import history")
async def list_imports(
    request: Request,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    rows = await service.list_batches(user_uuid, skip=skip, limit=limit)
    request.state.user_id = user_uuid
    return success_response(
        data=[r.model_dump(mode="json") for r in rows],
        message="Import history",
    )


@router.get("/{batch_id}", response_model=dict, summary="Import batch detail")
async def get_import(
    batch_id: uuid.UUID,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    batch = await service.get_batch(user_uuid, batch_id)
    request.state.user_id = user_uuid
    return success_response(
        data=batch.model_dump(mode="json"), message="Import batch"
    )


@router.get("/{batch_id}/preview", response_model=dict, summary="Review payload")
async def get_preview(
    batch_id: uuid.UUID,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    preview = await service.get_preview(user_uuid, batch_id)
    request.state.user_id = user_uuid
    return success_response(
        data=preview.model_dump(mode="json"), message="Import preview"
    )


@router.post(
    "/{batch_id}/candidates/{candidate_id}",
    response_model=dict,
    summary="Review a candidate (accept / edit / skip)",
)
async def decide_candidate(
    batch_id: uuid.UUID,
    candidate_id: uuid.UUID,
    body: DecideCandidateRequest,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    updated = await service.decide_candidate(
        user_uuid,
        batch_id,
        candidate_id,
        decision=body.decision,
        edited_value=body.edited_value,
    )
    request.state.user_id = user_uuid
    return success_response(
        data=updated.model_dump(mode="json"), message="Candidate updated"
    )


@router.post(
    "/{batch_id}/confirm",
    response_model=dict,
    summary="Confirm and apply the import",
)
async def confirm_import(
    batch_id: uuid.UUID,
    body: ConfirmImportRequest,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Apply reviewed candidates → commit → recompute → Radar + Plan."""
    user_uuid = uuid.UUID(user_id)
    result = await service.confirm(user_uuid, batch_id, body.confirm_token)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Import applied"
    )


@router.post(
    "/{batch_id}/cancel",
    response_model=dict,
    summary="Cancel a pending import",
)
async def cancel_import(
    batch_id: uuid.UUID,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    batch = await service.cancel(user_uuid, batch_id)
    request.state.user_id = user_uuid
    return success_response(
        data=batch.model_dump(mode="json"), message="Import cancelled"
    )


@router.get("/{batch_id}/changes", response_model=dict, summary="Applied changes")
async def import_changes(
    batch_id: uuid.UUID,
    request: Request,
    service: DataIngestionService = Depends(get_ingestion_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    user_uuid = uuid.UUID(user_id)
    result = await service.get_changes(user_uuid, batch_id)
    request.state.user_id = user_uuid
    return success_response(
        data=result.model_dump(mode="json"), message="Import changes"
    )
