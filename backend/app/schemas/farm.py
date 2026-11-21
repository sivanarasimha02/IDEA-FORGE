from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.schemas.crop import CropResponse

class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]

class FarmBase(BaseModel):
    name: str
    boundary: GeoJSONPolygon
    soil_type: str = "Sandy Loam"
    irrigation_type: str = "Drip"

class FarmCreate(FarmBase):
    crop: Optional[Dict[str, Any]] = None

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    boundary: Optional[GeoJSONPolygon] = None
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None

class FarmResponse(BaseModel):
    id: str
    user_id: str
    name: str
    boundary_geojson: str
    centroid_lat: float
    centroid_lon: float
    area_hectares: float
    soil_type: str
    irrigation_type: str
    created_at: datetime
    updated_at: datetime
    active_crop: Optional[CropResponse] = None

    model_config = ConfigDict(from_attributes=True)
