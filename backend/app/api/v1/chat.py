from __future__ import annotations

import io
import uuid

from docx import Document
from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.chat import ChatMessage, ChatResponse
from app.services.chatbot import ChatbotService
from app.utils.response import error_response, success_response

router = APIRouter(prefix="/chat", tags=["Chatbot"])

ALLOWED_MIME_TYPES = {
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 5 * 1024 * 1024


def get_chatbot_service(session: AsyncSession = Depends(get_db_session)) -> ChatbotService:
    return ChatbotService(session)


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Send a message to the AI financial chatbot",
)
async def chat(
    request: Request,
    message: ChatMessage,
    service: ChatbotService = Depends(get_chatbot_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Process a chat message through the guarded financial chatbot."""
    user_uuid = uuid.UUID(user_id)
    response = await service.process_message(user_uuid, message)
    request.state.user_id = user_uuid
    return success_response(
        data=response.model_dump(),
        message="Message processed",
    )


@router.post(
    "/upload",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Upload a document and extract text",
)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Extract text from an uploaded .txt, .pdf, or .docx file."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        return error_response(
            message="Unsupported file type. Allowed: .txt, .pdf, .docx",
            error_code="INVALID_FILE_TYPE",
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        return error_response(
            message="File exceeds 5 MB limit.",
            error_code="FILE_TOO_LARGE",
        )

    try:
        if file.content_type == "text/plain":
            text = content.decode("utf-8", errors="ignore")
        elif file.content_type == "application/pdf":
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(
                page.extract_text() or "" for page in reader.pages
            )
        else:  # .docx
            document = Document(io.BytesIO(content))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    except Exception as exc:
        return error_response(
            message=f"Failed to extract text: {exc}",
            error_code="EXTRACTION_ERROR",
        )

    return success_response(
        data={"text": text, "filename": file.filename},
        message="Text extracted",
    )
