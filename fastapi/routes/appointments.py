from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from typing import List
from supabase import create_client
from config import settings
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

class AppointmentCreate(BaseModel):
    doctor_id: str
    scheduled_date: str
    duration_minutes: int = 30
    appointment_type: str = "consultation"
    reason: str | None = None

class AppointmentUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
    cancellation_reason: str | None = None

@router.post("")
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user = Depends(get_current_user)
):
    """Create new appointment"""
    try:
        appointment_record = {
            "patient_id": current_user.id,
            "doctor_id": appointment_data.doctor_id,
            "scheduled_date": appointment_data.scheduled_date,
            "duration_minutes": appointment_data.duration_minutes,
            "appointment_type": appointment_data.appointment_type,
            "reason": appointment_data.reason,
            "status": "scheduled"
        }
        
        response = supabase.table("appointments").insert(appointment_record).execute()
        
        # Create notification
        user_response = supabase.table("users").select("first_name, last_name").eq("id", current_user.id).single().execute()
        doctor_response = supabase.table("users").select("first_name, last_name").eq("id", appointment_data.doctor_id).single().execute()
        
        notification = {
            "user_id": appointment_data.doctor_id,
            "notification_type": "in_app",
            "subject": "New Appointment",
            "message": f"New appointment booked with {user_response.data['first_name']} {user_response.data['last_name']}",
            "related_entity": "appointment",
            "related_id": response.data[0]["id"],
            "status": "pending"
        }
        supabase.table("notifications").insert(notification).execute()
        
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create appointment"
        )

@router.get("")
async def list_appointments(current_user = Depends(get_current_user)):
    """List user's appointments"""
    try:
        user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
        user_role = user_response.data["role"]
        
        if user_role == "patient":
            response = supabase.table("appointments").select("*").eq("patient_id", current_user.id).order("scheduled_date").execute()
        elif user_role in ["doctor", "nurse"]:
            response = supabase.table("appointments").select("*").eq("doctor_id", current_user.id).order("scheduled_date").execute()
        elif user_role == "admin":
            response = supabase.table("appointments").select("*").order("scheduled_date").execute()
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing appointments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to list appointments"
        )

@router.get("/{appointment_id}")
async def get_appointment(appointment_id: str, current_user = Depends(get_current_user)):
    """Get appointment details"""
    try:
        response = supabase.table("appointments").select("*").eq("id", appointment_id).single().execute()
        appointment = response.data
        
        # Check permissions
        if appointment["patient_id"] != current_user.id and appointment["doctor_id"] != current_user.id:
            user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
            if user_response.data["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return appointment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    appointment_data: AppointmentUpdate,
    current_user = Depends(get_current_user)
):
    """Update appointment"""
    try:
        appointment = supabase.table("appointments").select("*").eq("id", appointment_id).single().execute()
        apt = appointment.data
        
        # Check permissions - patient and doctor can modify
        if apt["patient_id"] != current_user.id and apt["doctor_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        update_data = {k: v for k, v in appointment_data.dict().items() if v is not None}
        response = supabase.table("appointments").update(update_data).eq("id", appointment_id).execute()
        
        return response.data[0] if response.data else {"message": "Updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update appointment"
        )
