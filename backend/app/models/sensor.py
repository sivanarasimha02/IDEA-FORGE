from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    device_name = Column(String(64), nullable=False)
    api_key_hash = Column(String(255), nullable=False)
    status = Column(String(32), default="active", nullable=False)
    battery_level = Column(Float, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="sensor_devices")
    readings = relationship("SoilReading", back_populates="device", cascade="all, delete-orphan")

class SoilReading(Base):
    __tablename__ = "soil_readings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(36), ForeignKey("sensor_devices.id"), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    moisture_pct = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    ph = Column(Float, nullable=True)
    ec_ds_m = Column(Float, nullable=True)
    is_simulated = Column(Boolean, default=False, nullable=False)
    data_source = Column(String(128), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    device = relationship("SensorDevice", back_populates="readings")
    farm = relationship("Farm", back_populates="soil_readings")
