from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    crop_type = Column(String(64), nullable=False)
    variety = Column(String(64), nullable=True)
    sowing_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=True)
    growth_stage = Column(String(64), nullable=False)
    irrigation_method = Column(String(64), nullable=True)
    historical_yield_per_ha = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="crops")
    yield_predictions = relationship("YieldPrediction", back_populates="crop", cascade="all, delete-orphan")
