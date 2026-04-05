from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
from supabase import create_client
from config import settings
from auth import get_current_user
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
except Exception as e:
    logger.warning(f"OpenAI not configured: {e}")
    openai_client = None

class SymptomCheckRequest(BaseModel):
    symptoms: List[str]
    duration: str | None = None
    severity: str | None = None
    additional_info: str | None = None

class SymptomCheckResponse(BaseModel):
    id: str
    symptoms: List[str]
    ai_analysis: Dict[str, Any]
    suggested_conditions: List[str]
    confidence_scores: Dict[str, float]
    severity: str | None
    recommendations: str

async def analyze_symptoms_with_ai(symptoms: List[str], duration: str | None, severity: str | None, additional_info: str | None) -> Dict[str, Any]:
    """Use OpenAI to analyze symptoms"""
    if not openai_client:
        return {
            "error": "AI service not configured",
            "suggestions": ["Please consult with a healthcare professional"]
        }
    
    try:
        prompt = f"""You are a medical AI assistant. Analyze the following symptoms and provide a response in JSON format.

Symptoms: {', '.join(symptoms)}
Duration: {duration or 'Not specified'}
Severity: {severity or 'Not specified'}
Additional Info: {additional_info or 'None'}

Provide a JSON response with these fields:
- possible_conditions: List of possible medical conditions (max 5)
- confidence_scores: Dictionary of condition names to confidence scores (0-1)
- severity_assessment: Overall severity level (mild/moderate/severe/critical)
- urgent_warning: Boolean - true if immediate medical attention needed
- recommendations: String with recommended actions
- when_to_seek_help: String with guidance on when to see a doctor

IMPORTANT: Always recommend consulting a healthcare professional. This is for informational purposes only."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful medical information assistant. Always encourage users to consult healthcare professionals."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content
        # Parse JSON from response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            analysis = json.loads(content[json_start:json_end])
        else:
            analysis = {
                "possible_conditions": [],
                "confidence_scores": {},
                "severity_assessment": "unknown",
                "urgent_warning": False,
                "recommendations": content,
                "when_to_seek_help": "Contact a healthcare professional for proper diagnosis"
            }
        
        return analysis
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        return {
            "error": f"AI analysis failed: {str(e)}",
            "recommendations": "Please consult with a healthcare professional"
        }

@router.post("")
async def check_symptoms(
    request: SymptomCheckRequest,
    current_user = Depends(get_current_user)
):
    """Analyze symptoms using AI"""
    try:
        # Analyze symptoms with AI
        ai_analysis = await analyze_symptoms_with_ai(
            request.symptoms,
            request.duration,
            request.severity,
            request.additional_info
        )
        
        # Extract data for storage
        suggested_conditions = ai_analysis.get("possible_conditions", [])
        confidence_scores = ai_analysis.get("confidence_scores", {})
        severity = ai_analysis.get("severity_assessment")
        recommendations = ai_analysis.get("recommendations", "")
        
        # Store in database
        record = {
            "patient_id": current_user.id,
            "symptoms": request.symptoms,
            "ai_analysis": ai_analysis,
            "suggested_conditions": suggested_conditions,
            "confidence_scores": confidence_scores,
            "severity": severity,
            "recommendations": recommendations
        }
        
        response = supabase.table("symptoms_checklist").insert(record).execute()
        
        return {
            "id": response.data[0]["id"],
            "symptoms": request.symptoms,
            "ai_analysis": ai_analysis,
            "suggested_conditions": suggested_conditions,
            "confidence_scores": confidence_scores,
            "severity": severity,
            "recommendations": recommendations,
            "message": "Please consult with a healthcare professional for proper diagnosis"
        }
    except Exception as e:
        logger.error(f"Error analyzing symptoms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to analyze symptoms"
        )

@router.get("/history")
async def get_symptom_history(current_user = Depends(get_current_user)):
    """Get patient's symptom check history"""
    try:
        response = supabase.table("symptoms_checklist").select("*").eq("patient_id", current_user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching symptom history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch symptom history"
        )

@router.get("/{symptom_id}")
async def get_symptom_check(symptom_id: str, current_user = Depends(get_current_user)):
    """Get specific symptom check details"""
    try:
        response = supabase.table("symptoms_checklist").select("*").eq("id", symptom_id).single().execute()
        check = response.data
        
        # Check permissions
        if check["patient_id"] != current_user.id:
            user_response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
            if user_response.data["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        return check
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching symptom check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom check not found"
        )
