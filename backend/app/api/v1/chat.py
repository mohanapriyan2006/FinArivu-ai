from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.schemas.chat import ChatMessage, ChatResponse
from app.services.chatbot import ChatbotService
from app.utils.response import success_response

router = APIRouter(prefix="/chat", tags=["Chatbot"])


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
