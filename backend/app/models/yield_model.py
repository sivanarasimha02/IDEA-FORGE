from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class YieldPrediction(Base):
    __tablename__ = "yield_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    crop_id = Column(String(36), ForeignKey("crops.id"), nullable=False, index=True)
    estimated_yield_per_ha = Column(Float, nullable=False)
    estimated_total_yield = Column(Float, nullable=False)
    lower_bound_80 = Column(Float, nullable=False)
    upper_bound_80 = Column(Float, nullable=False)
    benchmark_comparison_pct = Column(Float, nullable=False)
    influencing_factors = Column(Text, nullable=False)  # JSON encoded list of impact factors
    model_version = Column(String(64), default="yield-ensemble-rf-v1.2", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="yield_predictions")
    crop = relationship("Crop", back_populates="yield_predictions")
