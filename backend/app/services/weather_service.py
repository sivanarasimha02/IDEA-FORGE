from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.weather import WeatherObservation
from app.models.farm import Farm
from app.integrations.open_meteo import open_meteo_client
from app.schemas.weather import WeatherSummaryResponse, WeatherObservationResponse

class WeatherService:
    @staticmethod
    def sync_farm_weather(farm: Farm, db: Session) -> WeatherSummaryResponse:
        """
        Fetches current, forecast, and historical weather records for the farm location.
        Persists newly fetched records to database and returns a comprehensive summary.
        """
        raw_weather = open_meteo_client.fetch_weather(farm.centroid_lat, farm.centroid_lon)
        records_data = raw_weather.get("records", [])

        # Persist or update in database
        for rec in records_data:
            existing = db.query(WeatherObservation).filter(
                WeatherObservation.farm_id == farm.id,
                WeatherObservation.observed_date == rec["observed_date"]
            ).first()

            if existing:
                existing.temperature_max = rec["temperature_max"]
                existing.temperature_min = rec["temperature_min"]
                existing.temperature_mean = rec["temperature_mean"]
                existing.precipitation_mm = rec["precipitation_mm"]
                existing.relative_humidity_pct = rec["relative_humidity_pct"]
                existing.wind_speed_kmh = rec["wind_speed_kmh"]
                existing.et0_mm = rec.get("et0_mm")
                existing.solar_radiation_mj = rec.get("solar_radiation_mj")
                existing.is_forecast = rec["is_forecast"]
                existing.data_source = rec["data_source"]
            else:
                new_obs = WeatherObservation(
                    farm_id=farm.id,
                    observed_date=rec["observed_date"],
                    temperature_max=rec["temperature_max"],
                    temperature_min=rec["temperature_min"],
                    temperature_mean=rec["temperature_mean"],
                    precipitation_mm=rec["precipitation_mm"],
                    relative_humidity_pct=rec["relative_humidity_pct"],
                    wind_speed_kmh=rec["wind_speed_kmh"],
                    et0_mm=rec.get("et0_mm"),
                    solar_radiation_mj=rec.get("solar_radiation_mj"),
                    is_forecast=rec["is_forecast"],
                    data_source=rec["data_source"]
                )
                db.add(new_obs)

        db.commit()

        # Query all records sorted by date
        all_records = db.query(WeatherObservation).filter(
            WeatherObservation.farm_id == farm.id
        ).order_by(WeatherObservation.observed_date.asc()).all()

        today = date.today()
        historical = [r for r in all_records if r.observed_date < today]
        forecast = [r for r in all_records if r.observed_date >= today]

        # Calculate 30-day rainfall anomaly vs regional expected normal (e.g., 65mm for 30d)
        recent_30d_rain = sum(r.precipitation_mm for r in historical[-30:]) if historical else 0.0
        expected_baseline_rain = 55.0  # reference seasonal normal
        rainfall_anomaly_pct = round(((recent_30d_rain - expected_baseline_rain) / expected_baseline_rain) * 100.0, 1)

        # Today's observation
        today_obs = next((r for r in forecast if r.observed_date == today), None)
        today_precip = today_obs.precipitation_mm if today_obs else 0.0

        return WeatherSummaryResponse(
            farm_id=farm.id,
            current_temperature_c=float(raw_weather.get("current_temp", 28.0)),
            current_humidity_pct=float(raw_weather.get("current_humidity", 58.0)),
            current_wind_speed_kmh=float(raw_weather.get("current_wind", 11.5)),
            rain_probability_pct=min(95.0, round(today_precip * 14.0 + 10.0, 1)),
            today_precipitation_mm=today_precip,
            forecast_7days=[WeatherObservationResponse.model_validate(r) for r in forecast[:7]],
            historical_30days=[WeatherObservationResponse.model_validate(r) for r in historical[-30:]],
            rainfall_anomaly_pct=rainfall_anomaly_pct,
            baseline_period="30-Day Agrometeorological Baseline (55mm Norm)",
            data_source=raw_weather.get("data_source", "Open-Meteo Weather API"),
            last_updated=datetime.utcnow()
        )

weather_service = WeatherService()
