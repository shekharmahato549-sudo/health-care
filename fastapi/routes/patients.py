from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from supabase import create_client
from config import settings
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

class PatientProfile(BaseModel):
    date_of_birth: str | None = None
    gender: str | None = None
    blood_type: str | None = None
    emergency_contact: str | None = None
    emergency_contact_phone: str | None = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    medications: List[str] = []
    insurance_provider: str | None = None
    insurance_id: str | None = None
    insurance_expiry: str | None = None

@router.get("/me")
async def get_my_patient_profile(current_user = Depends(get_current_user)):
    """Get current user's patient profile"""
    try:
        response = supabase.table("patients").select("*").eq("id", current_user.id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching patient profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )

@router.put("/me")
async def update_my_patient_profile(
    profile_data: PatientProfile,
    current_user = Depends(get_current_user)
):
    """Update current user's patient profile"""
    try:
        update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
        
        response = supabase.table("patients").update(update_data).eq("id", current_user.id).execute()
        return response.data[0] if response.data else {"message": "Updated successfully"}
    except Exception as e:
        logger.error(f"Error updating patient profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update patient profile"
        )

@router.get("/{patient_id}")
async def get_patient_profile(patient_id: str, current_user = Depends(get_current_user)):
    """Get patient profile (doctors can view their patients)"""
    try:
        # Get current user's role
        user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
        user_role = user_response.data["role"]
        
        # Check permissions
        if user_role not in ["doctor", "nurse", "admin"] and patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        response = supabase.table("patients").select("*").eq("id", patient_id).single().execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

@router.get("")
async def list_patients(current_user = Depends(get_current_user)):
    """List patients (doctors and admins only)"""
    try:
        user_response = supabase.table("users").select("role, id").eq("auth_id", current_user.id).single().execute()
        user_data = user_response.data
        user_role = user_data["role"]
        
        if user_role == "admin":
            # Admin sees all patients
            response = supabase.table("patients").select("*").execute()
        elif user_role in ["doctor", "nurse"]:
            # Doctor sees only their patients
            response = supabase.table("appointments").select("patient_id").eq("doctor_id", user_data["id"]).execute()
            patient_ids = [apt["patient_id"] for apt in response.data] if response.data else []
            
            if patient_ids:
                response = supabase.table("patients").select("*").in_("id", patient_ids).execute()
            else:
                response.data = []
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing patients: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to list patients"
        )
