from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any
from supabase import create_client
from config import settings
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

class DoctorProfile(BaseModel):
    specialization: str
    license_number: str
    bio: str | None = None
    consultation_fee: float | None = None
    availability: Dict[str, Any] | None = None

class DoctorUpdate(BaseModel):
    specialization: str | None = None
    bio: str | None = None
    consultation_fee: float | None = None
    availability: Dict[str, Any] | None = None

@router.get("/me")
async def get_my_doctor_profile(current_user = Depends(get_current_user)):
    """Get current doctor's profile"""
    try:
        response = supabase.table("doctors").select("*").eq("id", current_user.id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching doctor profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )

@router.put("/me")
async def update_my_doctor_profile(
    profile_data: DoctorUpdate,
    current_user = Depends(get_current_user)
):
    """Update doctor's profile"""
    try:
        update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
        
        response = supabase.table("doctors").update(update_data).eq("id", current_user.id).execute()
        return response.data[0] if response.data else {"message": "Updated successfully"}
    except Exception as e:
        logger.error(f"Error updating doctor profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update doctor profile"
        )

@router.get("/{doctor_id}")
async def get_doctor_profile(doctor_id: str):
    """Get doctor profile (public info)"""
    try:
        response = supabase.table("doctors").select("*").eq("id", doctor_id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching doctor profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

@router.get("")
async def list_doctors():
    """List all doctors with availability"""
    try:
        response = supabase.table("doctors").select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error listing doctors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to list doctors"
        )

@router.get("/specialization/{specialization}")
async def get_doctors_by_specialization(specialization: str):
    """Get doctors by specialization"""
    try:
        response = supabase.table("doctors").select("*").eq("specialization", specialization).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching doctors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch doctors"
        )
