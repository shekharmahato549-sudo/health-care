from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from typing import List, Dict, Any
from supabase import create_client
from config import settings
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

class HealthRecordCreate(BaseModel):
    patient_id: str
    record_type: str  # consultation, lab, imaging, prescription, diagnosis, vital_signs
    title: str
    description: str | None = None
    document_url: str | None = None
    metadata: Dict[str, Any] | None = None

class HealthRecordUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    document_url: str | None = None
    metadata: Dict[str, Any] | None = None

@router.post("")
async def create_health_record(
    record_data: HealthRecordCreate,
    current_user = Depends(get_current_user)
):
    """Create health record (doctors and nurses)"""
    try:
        # Check if user is doctor or nurse
        user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
        if user_response.data["role"] not in ["doctor", "nurse", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors and nurses can create health records"
            )
        
        record = {
            "patient_id": record_data.patient_id,
            "record_type": record_data.record_type,
            "title": record_data.title,
            "description": record_data.description,
            "document_url": record_data.document_url,
            "metadata": record_data.metadata or {},
            "created_by": current_user.id
        }
        
        response = supabase.table("health_records").insert(record).execute()
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating health record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create health record"
        )

@router.get("/patient/{patient_id}")
async def get_patient_health_records(patient_id: str, current_user = Depends(get_current_user)):
    """Get health records for a patient"""
    try:
        # Check permissions
        if patient_id != current_user.id:
            user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
            user_role = user_response.data["role"]
            
            if user_role not in ["doctor", "nurse", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        response = supabase.table("health_records").select("*").eq("patient_id", patient_id).order("created_at", desc=True).execute()
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching health records: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch health records"
        )

@router.get("/{record_id}")
async def get_health_record(record_id: str, current_user = Depends(get_current_user)):
    """Get specific health record"""
    try:
        response = supabase.table("health_records").select("*").eq("id", record_id).single().execute()
        record = response.data
        
        # Check permissions
        if record["patient_id"] != current_user.id:
            user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
            user_role = user_response.data["role"]
            
            if user_role not in ["doctor", "nurse", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return record
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching health record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found"
        )

@router.put("/{record_id}")
async def update_health_record(
    record_id: str,
    record_data: HealthRecordUpdate,
    current_user = Depends(get_current_user)
):
    """Update health record"""
    try:
        record = supabase.table("health_records").select("*").eq("id", record_id).single().execute()
        
        # Check if user created this record
        if record.data["created_by"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only update your own records"
            )
        
        update_data = {k: v for k, v in record_data.dict().items() if v is not None}
        response = supabase.table("health_records").update(update_data).eq("id", record_id).execute()
        
        return response.data[0] if response.data else {"message": "Updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating health record: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update health record"
        )
