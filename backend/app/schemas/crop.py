from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class CropBase(BaseModel):
    crop_type: str
    variety: Optional[str] = None
    sowing_date: date
    expected_harvest_date: Optional[date] = None
    growth_stage: str
    irrigation_method: Optional[str] = "Drip"
    historical_yield_per_ha: Optional[float] = None

class CropCreate(CropBase):
    pass

class CropResponse(CropBase):
    id: str
    farm_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
