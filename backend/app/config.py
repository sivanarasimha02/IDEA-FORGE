import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Predictive Climate & Micro-Location Yield Engine"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_antigravity_climate_engine_2026_super_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./climate_engine.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # External APIs
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    COPERNICUS_API_KEY: str = os.getenv("COPERNICUS_API_KEY", "")
    
    # IoT Gateway Auth
    DEFAULT_SENSOR_GATEWAY_TOKEN: str = os.getenv("DEFAULT_SENSOR_GATEWAY_TOKEN", "iot-gateway-dev-token-9988")

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
