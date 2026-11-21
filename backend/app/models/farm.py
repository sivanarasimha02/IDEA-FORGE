from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    boundary_geojson = Column(Text, nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    area_hectares = Column(Float, nullable=False)
    soil_type = Column(String(64), nullable=False)
    irrigation_type = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="farms")
    crops = relationship("Crop", back_populates="farm", cascade="all, delete-orphan")
    sensor_devices = relationship("SensorDevice", back_populates="farm", cascade="all, delete-orphan")
    soil_readings = relationship("SoilReading", back_populates="farm", cascade="all, delete-orphan")
    weather_records = relationship("WeatherObservation", back_populates="farm", cascade="all, delete-orphan")
    satellite_observations = relationship("SatelliteObservation", back_populates="farm", cascade="all, delete-orphan")
    vegetation_indices = relationship("VegetationIndex", back_populates="farm", cascade="all, delete-orphan")
    climate_risks = relationship("ClimateRisk", back_populates="farm", cascade="all, delete-orphan")
    yield_predictions = relationship("YieldPrediction", back_populates="farm", cascade="all, delete-orphan")
    recommendations = relationship("AgronomicRecommendation", back_populates="farm", cascade="all, delete-orphan")
