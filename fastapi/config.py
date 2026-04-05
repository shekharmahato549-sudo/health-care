import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_KEY")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Email (Resend)
    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY")
    
    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Snowflake
    SNOWFLAKE_USER: Optional[str] = os.getenv("SNOWFLAKE_USER")
    SNOWFLAKE_PASSWORD: Optional[str] = os.getenv("SNOWFLAKE_PASSWORD")
    SNOWFLAKE_ACCOUNT: Optional[str] = os.getenv("SNOWFLAKE_ACCOUNT")
    
    # App
    APP_NAME: str = "HealthCare API"
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    class Config:
        env_file = ".env.local"
        case_sensitive = True

settings = Settings()
