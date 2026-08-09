from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_id
from app.exceptions import AuthorizationError, ValidationError
from app.schemas.profiles import ProfileResponse, ProfileUpdate
from app.services.profiles import ProfileService
from app.utils.response import success_response

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def get_profile_service(session: AsyncSession = Depends(get_db_session)) -> ProfileService:
    return ProfileService(session)


@router.get("/me", response_model=dict, summary="Get current user profile")
async def get_my_profile(
    request: Request,
    service: ProfileService = Depends(get_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Return the profile for the authenticated user."""
    profile = await service.get_or_create_by_user(uuid.UUID(user_id))
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Profile retrieved successfully",
    )


@router.put("/me", response_model=dict, summary="Update current user profile")
async def update_my_profile(
    data: ProfileUpdate,
    request: Request,
    service: ProfileService = Depends(get_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Update or create the profile for the authenticated user."""
    profile = await service.update_by_user(uuid.UUID(user_id), data)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Profile updated successfully",
    )


ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024


@router.post("/avatar", response_model=dict, summary="Upload profile avatar")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    service: ProfileService = Depends(get_profile_service),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Upload and persist a profile avatar image."""
    if file.content_type not in ALLOWED_AVATAR_TYPES:
        raise ValidationError("Only JPEG, PNG and WEBP images are allowed")

    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise ValidationError("Avatar must be under 5MB")

    upload_dir = Path("static/avatars")
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "avatar.jpg").name.replace(" ", "_")
    filename = f"{user_id}_{safe_name}"
    file_path = upload_dir / filename

    with open(file_path, "wb") as f:
        f.write(contents)

    avatar_url = f"/static/avatars/{filename}"
    profile = await service.update_avatar(uuid.UUID(user_id), avatar_url)
    request.state.user_id = uuid.UUID(user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Avatar uploaded successfully",
    )


@router.get("/{profile_id}", response_model=dict, summary="Get profile by ID")
async def get_profile(
    profile_id: uuid.UUID,
    request: Request,
    service: ProfileService = Depends(get_profile_service),
    current_user_id: str = Depends(get_current_user_id),
) -> dict:
    """Fetch a profile by ID; only the owner can access it."""
    profile = await service.get(profile_id)
    if str(profile.user_id) != current_user_id:
        raise AuthorizationError("You can only view your own profile")
    request.state.user_id = uuid.UUID(current_user_id)
    return success_response(
        data=ProfileResponse.model_validate(profile).model_dump(),
        message="Profile retrieved successfully",
    )
