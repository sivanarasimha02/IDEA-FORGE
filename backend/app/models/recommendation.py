from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class AgronomicRecommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    risk_id = Column(String(36), ForeignKey("climate_risks.id"), nullable=True)
    category = Column(String(64), nullable=False)  # Irrigation, Drainage, Heat Shield, Soil Care
    priority = Column(String(32), default="Medium", nullable=False)  # Low, Medium, High, Urgent
    title = Column(String(128), nullable=False)
    action = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    disclaimer = Column(Text, default="These recommendations are advisory decision-support outputs based on remote sensing and agrometeorological models. Always verify with local agricultural extension officers before major interventions.", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="recommendations")
