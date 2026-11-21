from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class SensorRegister(BaseModel):
    farm_id: str
    device_name: str
    custom_device_id: Optional[str] = None

class SensorDeviceResponse(BaseModel):
    id: str
    farm_id: str
    device_name: str
    status: str
    battery_level: Optional[float] = None
    last_seen: Optional[datetime] = None
    created_at: datetime
    api_token: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SoilReadingCreate(BaseModel):
    device_id: str
    moisture_pct: float = Field(..., ge=0.0, le=100.0)
    temperature_c: float = Field(..., ge=-20.0, le=70.0)
    ph: Optional[float] = Field(None, ge=0.0, le=14.0)
    ec_ds_m: Optional[float] = Field(None, ge=0.0, le=30.0)
    is_simulated: bool = False
    data_source: Optional[str] = "IoT Node Hardware"
    recorded_at: Optional[datetime] = None

class SoilReadingResponse(BaseModel):
    id: str
    device_id: str
    farm_id: str
    moisture_pct: float
    temperature_c: float
    ph: Optional[float] = None
    ec_ds_m: Optional[float] = None
    is_simulated: bool
    data_source: str
    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)
