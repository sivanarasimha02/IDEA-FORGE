from datetime import datetime, timedelta
import random
import math
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.sensor import SensorDevice, SoilReading
from app.models.farm import Farm
from app.schemas.sensor import SoilReadingCreate, SoilReadingResponse, SensorDeviceResponse

class SensorService:
    @staticmethod
    def get_or_create_default_device(farm: Farm, db: Session) -> SensorDevice:
        """Finds or creates a default IoT node for the farm."""
        device = db.query(SensorDevice).filter(SensorDevice.farm_id == farm.id).first()
        if not device:
            device = SensorDevice(
                farm_id=farm.id,
                device_name=f"{farm.name} - IoT Node A1",
                api_key_hash="hash_dev_token_default",
                status="active",
                battery_level=94.5,
                last_seen=datetime.utcnow()
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        return device

    @staticmethod
    def ingest_reading(payload: SoilReadingCreate, db: Session) -> SoilReading:
        """Validates and persists incoming hardware or simulated soil sensor reading."""
        # Find device
        device = db.query(SensorDevice).filter(SensorDevice.id == payload.device_id).first()
        if not device:
            # Check by friendly name or create if needed
            device = db.query(SensorDevice).filter(SensorDevice.device_name == payload.device_id).first()
            if not device:
                raise ValueError(f"Sensor device '{payload.device_id}' is not registered.")

        reading = SoilReading(
            device_id=device.id,
            farm_id=device.farm_id,
            moisture_pct=payload.moisture_pct,
            temperature_c=payload.temperature_c,
            ph=payload.ph,
            ec_ds_m=payload.ec_ds_m,
            is_simulated=payload.is_simulated,
            data_source=payload.data_source or ("Simulated Sensor Node" if payload.is_simulated else "Hardware Field Sensor"),
            recorded_at=payload.recorded_at or datetime.utcnow()
        )
        db.add(reading)
        
        # Update device status and heartbeat
        device.last_seen = datetime.utcnow()
        device.status = "active"
        db.commit()
        db.refresh(reading)
        return reading

    @staticmethod
    def generate_demo_readings(farm: Farm, db: Session, count: int = 14) -> List[SoilReading]:
        """
        Creates historical daily simulated sensor readings for initial setup,
        explicitly marked with is_simulated=True.
        """
        device = SensorService.get_or_create_default_device(farm, db)
        now = datetime.utcnow()
        created = []
        
        # Base moisture depends on soil type
        base_moisture = 28.0
        if "clay" in farm.soil_type.lower():
            base_moisture = 34.0
        elif "sandy" in farm.soil_type.lower():
            base_moisture = 21.0

        for i in range(count, -1, -1):
            ts = now - timedelta(days=i)
            # Daily moisture diurnal variation
            moisture = max(8.0, min(50.0, round(base_moisture + math.sin(i * 0.5) * 5.0 + random.uniform(-1.5, 1.5), 1)))
            temp = round(24.0 + random.uniform(-2.5, 4.0), 1)
            ph = round(6.6 + random.uniform(-0.3, 0.4), 2)
            ec = round(1.2 + random.uniform(-0.15, 0.25), 2)

            r = SoilReading(
                device_id=device.id,
                farm_id=farm.id,
                moisture_pct=moisture,
                temperature_c=temp,
                ph=ph,
                ec_ds_m=ec,
                is_simulated=True,
                data_source="Calibrated Micro-Climate IoT Simulator (Lab Mode)",
                recorded_at=ts
            )
            db.add(r)
            created.append(r)

        db.commit()
        return created

    @staticmethod
    def get_farm_soil_summary(farm: Farm, db: Session) -> Dict[str, Any]:
        """Returns latest reading and recent historical readings."""
        device = SensorService.get_or_create_default_device(farm, db)
        readings = db.query(SoilReading).filter(
            SoilReading.farm_id == farm.id
        ).order_by(SoilReading.recorded_at.desc()).limit(30).all()

        if not readings:
            # Seed initial telemetry
            readings = SensorService.generate_demo_readings(farm, db)
            readings.reverse()

        latest = readings[0] if readings else None

        # Determine soil condition status
        status_label = "Optimal"
        if latest:
            if latest.moisture_pct < 18.0:
                status_label = "Water Deficit / Stressed"
            elif latest.moisture_pct > 38.0:
                status_label = "High Water Saturation"
            else:
                status_label = "Adequate Root-Zone Moisture"

        return {
            "device": SensorDeviceResponse.model_validate(device),
            "latest_reading": SoilReadingResponse.model_validate(latest) if latest else None,
            "recent_readings": [SoilReadingResponse.model_validate(r) for r in reversed(readings)],
            "status_label": status_label,
            "soil_type": farm.soil_type
        }

sensor_service = SensorService()
