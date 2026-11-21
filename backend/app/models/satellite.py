from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, Date
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    platform = Column(String(64), default="Sentinel-2A", nullable=False)
    acquisition_date = Column(DateTime, nullable=False, index=True)
    cloud_cover_pct = Column(Float, nullable=False)
    band_b02_blue = Column(Float, nullable=True)
    band_b03_green = Column(Float, nullable=True)
    band_b04_red = Column(Float, nullable=True)
    band_b08_nir = Column(Float, nullable=True)
    band_b11_swir = Column(Float, nullable=True)
    is_simulated = Column(Boolean, default=False, nullable=False)
    data_source = Column(String(128), default="Copernicus Data Space Sentinel-2", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="satellite_observations")
    vegetation_indices = relationship("VegetationIndex", back_populates="observation", cascade="all, delete-orphan")

class VegetationIndex(Base):
    __tablename__ = "vegetation_indices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    observation_id = Column(String(36), ForeignKey("satellite_observations.id"), nullable=True)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    recorded_date = Column(Date, nullable=False, index=True)
    ndvi = Column(Float, nullable=False)
    evi = Column(Float, nullable=False)
    savi = Column(Float, nullable=False)
    ndwi = Column(Float, nullable=False)
    vigor_category = Column(String(32), nullable=False)
    anomaly_vs_baseline = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    observation = relationship("SatelliteObservation", back_populates="vegetation_indices")
    farm = relationship("Farm", back_populates="vegetation_indices")
