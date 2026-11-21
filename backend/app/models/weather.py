from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Boolean, Date
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import generate_uuid

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False, index=True)
    observed_date = Column(Date, nullable=False, index=True)
    temperature_max = Column(Float, nullable=False)
    temperature_min = Column(Float, nullable=False)
    temperature_mean = Column(Float, nullable=False)
    precipitation_mm = Column(Float, nullable=False)
    relative_humidity_pct = Column(Float, nullable=False)
    wind_speed_kmh = Column(Float, nullable=False)
    solar_radiation_mj = Column(Float, nullable=True)
    et0_mm = Column(Float, nullable=True)
    is_forecast = Column(Boolean, default=False, nullable=False)
    data_source = Column(String(128), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="weather_records")
