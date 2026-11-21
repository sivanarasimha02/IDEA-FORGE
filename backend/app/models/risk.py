from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class ClimateRisk(Base):
    __tablename__ = "climate_risks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    risk_type = Column(String(64), nullable=False)  # drought, excess_rain, heat_stress, soil_stress
    category = Column(String(32), nullable=False)   # Low, Moderate, High, Critical
    calibrated_score = Column(Float, nullable=False)  # 0.0 - 1.0
    horizon_days = Column(Integer, default=7, nullable=False)
    contributing_factors = Column(Text, nullable=False)  # JSON encoded list of key driver objects
    uncertainty_pct = Column(Float, nullable=False)
    model_version = Column(String(64), default="climate-risk-xgb-v1.0", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="climate_risks")
