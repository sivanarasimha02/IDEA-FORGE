from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.schemas.weather import WeatherSummaryResponse
from app.auth.dependencies import get_farm_for_user
from app.services.weather_service import weather_service

router = APIRouter(prefix="/farms/{farm_id}/weather", tags=["Weather"])

@router.get("", response_model=WeatherSummaryResponse)
def get_farm_weather(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Retrieves 14-day forecasts and 30-day historical precipitation/temperature baselines."""
    return weather_service.sync_farm_weather(farm, db)
