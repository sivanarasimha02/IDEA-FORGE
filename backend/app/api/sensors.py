import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.sensor import SensorDevice, SoilReading
from app.models.farm import Farm
from app.schemas.sensor import SensorRegister, SensorDeviceResponse, SoilReadingCreate, SoilReadingResponse
from app.auth.dependencies import get_current_user, get_farm_for_user
from app.services.sensor_service import sensor_service
from app.config import settings

router = APIRouter(tags=["IoT Soil Sensors"])

@router.post("/api/sensors/register", response_model=SensorDeviceResponse, status_code=status.HTTP_201_CREATED)
def register_sensor(
    reg_in: SensorRegister,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    farm = db.query(Farm).filter(Farm.id == reg_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    dev_id = reg_in.custom_device_id or str(uuid.uuid4())
    api_token = f"sen_key_{uuid.uuid4().hex[:16]}"

    device = SensorDevice(
        id=dev_id,
        farm_id=farm.id,
        device_name=reg_in.device_name,
        api_key_hash=api_token,  # In production, store hash
        status="active",
        battery_level=100.0
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    resp = SensorDeviceResponse.model_validate(device)
    resp.api_token = api_token
    return resp

@router.post("/api/sensors/data", response_model=SoilReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_data(
    payload: SoilReadingCreate,
    x_device_token: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Direct IoT Device Telemetry endpoint.
    Authenticated via X-Device-Token or default gateway token.
    """
    if x_device_token and x_device_token != settings.DEFAULT_SENSOR_GATEWAY_TOKEN:
        # Check against device key
        dev = db.query(SensorDevice).filter(SensorDevice.id == payload.device_id).first()
        if dev and dev.api_key_hash != x_device_token:
            raise HTTPException(status_code=401, detail="Invalid X-Device-Token header.")

    try:
        reading = sensor_service.ingest_reading(payload, db)
        return reading
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/farms/{farm_id}/soil")
def get_farm_soil(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Fetches device telemetry and soil moisture trends."""
    return sensor_service.get_farm_soil_summary(farm, db)

@router.post("/api/farms/{farm_id}/soil/simulate")
def simulate_sensor_pulse(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Generates a sample reading to test the live telemetry loop."""
    device = sensor_service.get_or_create_default_device(farm, db)
    import random
    reading = SoilReadingCreate(
        device_id=device.id,
        moisture_pct=round(random.uniform(22.0, 36.0), 1),
        temperature_c=round(random.uniform(23.0, 29.0), 1),
        ph=round(random.uniform(6.4, 7.2), 2),
        ec_ds_m=round(random.uniform(1.0, 1.8), 2),
        is_simulated=True,
        data_source="Interactive Manual Trigger (IoT Node Simulator)"
    )
    result = sensor_service.ingest_reading(reading, db)
    return SoilReadingResponse.model_validate(result)
