from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date

class SatelliteObservationResponse(BaseModel):
    id: str
    farm_id: str
    platform: str
    acquisition_date: datetime
    cloud_cover_pct: float
    band_b02_blue: Optional[float] = None
    band_b03_green: Optional[float] = None
    band_b04_red: Optional[float] = None
    band_b08_nir: Optional[float] = None
    band_b11_swir: Optional[float] = None
    is_simulated: bool
    data_source: str

    model_config = ConfigDict(from_attributes=True)

class VegetationIndexResponse(BaseModel):
    id: str
    observation_id: Optional[str] = None
    farm_id: str
    recorded_date: date
    ndvi: float
    evi: float
    savi: float
    ndwi: float
    vigor_category: str
    anomaly_vs_baseline: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SatelliteSummaryResponse(BaseModel):
    farm_id: str
    latest_observation: Optional[SatelliteObservationResponse] = None
    latest_indices: Optional[VegetationIndexResponse] = None
    indices_history: List[VegetationIndexResponse]
    cloud_cover_status: str
    data_provenance: str
    observation_count: int
