from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from supabase import create_client
from config import settings
from auth import get_current_user
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

class NotificationCreate(BaseModel):
    user_id: str
    notification_type: str  # email, sms, in_app
    subject: str | None = None
    message: str
    related_entity: str | None = None
    related_id: str | None = None

class NotificationUpdate(BaseModel):
    status: str | None = None
    sent_at: str | None = None

class NotificationPreference(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = True
    in_app_enabled: bool = True

async def send_email_notification(email: str, subject: str, message: str) -> bool:
    """Send email notification via Resend"""
    if not settings.RESEND_API_KEY:
        logger.warning("Resend API key not configured")
        return False
    
    try:
        from resend import Resend
        client = Resend(api_key=settings.RESEND_API_KEY)
        
        response = client.emails.send({
            "from": "noreply@healthcare.pro",
            "to": email,
            "subject": subject,
            "html": f"<p>{message}</p>"
        })
        
        return response.get('id') is not None
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        return False

async def send_sms_notification(phone: str, message: str) -> bool:
    """Send SMS notification via Twilio"""
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio credentials not configured")
        return False
    
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message_obj = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone
        )
        
        return message_obj.sid is not None
    except Exception as e:
        logger.error(f"SMS send error: {str(e)}")
        return False

@router.post("")
async def create_notification(
    notification_data: NotificationCreate,
    current_user = Depends(get_current_user)
):
    """Create notification (system use)"""
    try:
        record = {
            "user_id": notification_data.user_id,
            "notification_type": notification_data.notification_type,
            "subject": notification_data.subject,
            "message": notification_data.message,
            "related_entity": notification_data.related_entity,
            "related_id": notification_data.related_id,
            "status": "pending"
        }
        
        response = supabase.table("notifications").insert(record).execute()
        notification = response.data[0]
        
        # Send based on type
        user_response = supabase.table("users").select("email, phone").eq("id", notification_data.user_id).single().execute()
        user = user_response.data
        
        if notification_data.notification_type == "email" and user.get("email"):
            success = await send_email_notification(
                user["email"],
                notification_data.subject or "Notification",
                notification_data.message
            )
            if success:
                supabase.table("notifications").update({
                    "status": "sent",
                    "sent_at": datetime.now().isoformat()
                }).eq("id", notification["id"]).execute()
        
        elif notification_data.notification_type == "sms" and user.get("phone"):
            success = await send_sms_notification(user["phone"], notification_data.message)
            if success:
                supabase.table("notifications").update({
                    "status": "sent",
                    "sent_at": datetime.now().isoformat()
                }).eq("id", notification["id"]).execute()
        
        return notification
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create notification"
        )

@router.get("")
async def get_my_notifications(current_user = Depends(get_current_user)):
    """Get current user's notifications"""
    try:
        response = supabase.table("notifications").select("*").eq("user_id", current_user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch notifications"
        )

@router.get("/unread")
async def get_unread_notifications(current_user = Depends(get_current_user)):
    """Get unread in-app notifications"""
    try:
        response = supabase.table("notifications").select("*").eq("user_id", current_user.id).eq("notification_type", "in_app").eq("status", "pending").execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching unread notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch notifications"
        )

@router.put("/{notification_id}")
async def update_notification(
    notification_id: str,
    notification_data: NotificationUpdate,
    current_user = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        notification = supabase.table("notifications").select("*").eq("id", notification_id).single().execute()
        
        # Check permissions
        if notification.data["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        update_data = {k: v for k, v in notification_data.dict().items() if v is not None}
        response = supabase.table("notifications").update(update_data).eq("id", notification_id).execute()
        
        return response.data[0] if response.data else {"message": "Updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update notification"
        )

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user = Depends(get_current_user)):
    """Delete notification"""
    try:
        notification = supabase.table("notifications").select("*").eq("id", notification_id).single().execute()
        
        # Check permissions
        if notification.data["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        supabase.table("notifications").delete().eq("id", notification_id).execute()
        return {"message": "Notification deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete notification"
        )
