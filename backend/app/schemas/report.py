from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.schemas.farm import FarmResponse
from app.schemas.weather import WeatherSummaryResponse
from app.schemas.satellite import SatelliteSummaryResponse
from app.schemas.risk import ClimateRiskResponse
from app.schemas.yield_model import YieldPredictionResponse
from app.schemas.recommendation import AgronomicRecommendationResponse

class FarmReportResponse(BaseModel):
    generated_at: datetime
    farm: FarmResponse
    weather_summary: WeatherSummaryResponse
    satellite_summary: SatelliteSummaryResponse
    climate_risks: List[ClimateRiskResponse]
    yield_prediction: Optional[YieldPredictionResponse] = None
    recommendations: List[AgronomicRecommendationResponse]
    disclaimer: str
    export_format: str = "json"
