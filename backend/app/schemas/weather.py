from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime

class WeatherObservationResponse(BaseModel):
    id: str
    farm_id: str
    observed_date: date
    temperature_max: float
    temperature_min: float
    temperature_mean: float
    precipitation_mm: float
    relative_humidity_pct: float
    wind_speed_kmh: float
    solar_radiation_mj: Optional[float] = None
    et0_mm: Optional[float] = None
    is_forecast: bool
    data_source: str
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WeatherSummaryResponse(BaseModel):
    farm_id: str
    current_temperature_c: float
    current_humidity_pct: float
    current_wind_speed_kmh: float
    rain_probability_pct: float
    today_precipitation_mm: float
    forecast_7days: List[WeatherObservationResponse]
    historical_30days: List[WeatherObservationResponse]
    rainfall_anomaly_pct: float
    baseline_period: str = "30-Day Agrometeorological Baseline"
    data_source: str
    last_updated: datetime
