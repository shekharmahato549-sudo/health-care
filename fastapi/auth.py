from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from supabase import create_client
from config import settings
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY)

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

async def get_user_from_token(token: str):
    """Get user info from token"""
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return None

async def verify_user_role(allowed_roles: list):
    """Factory to create role verification dependency"""
    async def role_checker(current_user = Depends(get_current_user)):
        # Get user from database to check role
        try:
            response = supabase.table("users").select("role").eq("auth_id", current_user.id).single().execute()
            user_data = response.data
            
            if not user_data or user_data["role"] not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to access this resource"
                )
            
            return current_user
        except Exception as e:
            logger.error(f"Role check error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
    
    return role_checker
