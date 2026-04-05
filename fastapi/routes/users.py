from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client
from config import settings
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

class UserProfile(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None
    profile_image_url: str | None = None

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    profile_image_url: str | None = None

@router.get("/me")
async def get_current_user_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    try:
        response = supabase.table("users").select("*").eq("auth_id", current_user.id).single().execute()
        user = response.data
        return user
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.put("/me")
async def update_current_user(
    user_data: UserUpdate,
    current_user = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        update_data = {k: v for k, v in user_data.dict().items() if v is not None}
        
        response = supabase.table("users").update(update_data).eq("auth_id", current_user.id).execute()
        return response.data[0] if response.data else {"message": "Updated successfully"}
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user profile"
        )

@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get user by ID (public profile info)"""
    try:
        response = supabase.table("users").select("id, first_name, last_name, profile_image_url, role").eq("id", user_id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.get("")
async def list_users(current_user = Depends(get_current_user)):
    """List all users (admin only)"""
    try:
        # Check if user is admin
        user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
        if user_response.data["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        response = supabase.table("users").select("*").execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to list users"
        )
