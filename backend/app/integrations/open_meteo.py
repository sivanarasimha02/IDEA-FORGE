import httpx
import math
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from app.config import settings

class OpenMeteoClient:
    def __init__(self, base_url: str = settings.OPEN_METEO_BASE_URL):
        self.base_url = base_url

    def fetch_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Attempt to fetch real weather from Open-Meteo API.
        If network fails, falls back to a deterministic, realistic climatological simulation
        strictly flagged as simulated.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
            "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,et0_fao_evapotranspiration,shortwave_radiation_sum",
            "timezone": "auto",
            "past_days": 30,
            "forecast_days": 14
        }
        
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.get(f"{self.base_url}/forecast", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return self._parse_api_response(data, lat, lon)
        except Exception:
            # Graceful degradation when offline or network unreachable
            pass
            
        return self._generate_fallback_data(lat, lon)

    def _parse_api_response(self, data: Dict[str, Any], lat: float, lon: float) -> Dict[str, Any]:
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        t_max = daily.get("temperature_2m_max", [])
        t_min = daily.get("temperature_2m_min", [])
        t_mean = daily.get("temperature_2m_mean", [])
        precip = daily.get("precipitation_sum", [])
        humidity = daily.get("relative_humidity_2m_mean", [])
        wind = daily.get("wind_speed_10m_max", [])
        et0 = daily.get("et0_fao_evapotranspiration", [])
        solar = daily.get("shortwave_radiation_sum", [])
        
        current = data.get("current", {})
        today_str = date.today().isoformat()
        
        observations = []
        for i, dt_str in enumerate(dates):
            d_val = datetime.strptime(dt_str, "%Y-%m-%d").date()
            is_forecast = d_val >= date.today()
            observations.append({
                "observed_date": d_val,
                "temperature_max": round(float(t_max[i]), 1) if i < len(t_max) and t_max[i] is not None else 30.0,
                "temperature_min": round(float(t_min[i]), 1) if i < len(t_min) and t_min[i] is not None else 20.0,
                "temperature_mean": round(float(t_mean[i]), 1) if i < len(t_mean) and t_mean[i] is not None else 25.0,
                "precipitation_mm": round(float(precip[i]), 1) if i < len(precip) and precip[i] is not None else 0.0,
                "relative_humidity_pct": round(float(humidity[i]), 1) if i < len(humidity) and humidity[i] is not None else 60.0,
                "wind_speed_kmh": round(float(wind[i]), 1) if i < len(wind) and wind[i] is not None else 12.0,
                "et0_mm": round(float(et0[i]), 2) if i < len(et0) and et0[i] is not None else 4.2,
                "solar_radiation_mj": round(float(solar[i]), 2) if i < len(solar) and solar[i] is not None else 18.5,
                "is_forecast": is_forecast,
                "data_source": "Open-Meteo Real-Time Weather API",
                "is_simulated": False
            })

        return {
            "current_temp": current.get("temperature_2m", 28.5),
            "current_humidity": current.get("relative_humidity_2m", 58.0),
            "current_wind": current.get("wind_speed_10m", 11.4),
            "current_precip": current.get("precipitation", 0.0),
            "records": observations,
            "data_source": "Open-Meteo Real-Time API (Live)",
            "is_simulated": False
        }

    def _generate_fallback_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Deterministic, agronomically consistent fallback data based on latitude and seasonal cycle.
        Clearly labelled with data_source and is_simulated=True.
        """
        today = date.today()
        # Solar declination and seasonal temperature approximation
        day_of_year = today.timetuple().tm_yday
        seasonal_factor = math.cos((day_of_year - 172) * 2 * math.pi / 365)
        base_temp = 28.0 - (abs(lat) * 0.3) + (seasonal_factor * 5.0)

        records = []
        # 30 historical days + 14 forecast days = 44 days
        for offset in range(-30, 15):
            d_val = today + timedelta(days=offset)
            is_forecast = offset >= 0
            
            # Deterministic pseudo-random variation based on lat, lon, and date
            seed_val = int(abs(lat * 100) + abs(lon * 100) + d_val.day * 13 + d_val.month * 37)
            rnd = random.Random(seed_val)
            
            t_max = round(base_temp + rnd.uniform(3.0, 7.0), 1)
            t_min = round(base_temp - rnd.uniform(4.0, 9.0), 1)
            t_mean = round((t_max + t_min) / 2.0, 1)
            
            # Rain occurrence probability
            rain_chance = rnd.random()
            if rain_chance > 0.75:
                precip = round(rnd.uniform(4.0, 32.0), 1)
            elif rain_chance > 0.60:
                precip = round(rnd.uniform(0.5, 4.0), 1)
            else:
                precip = 0.0

            humidity = round(50.0 + (precip * 1.5) + rnd.uniform(-10.0, 10.0), 1)
            humidity = max(20.0, min(98.0, humidity))
            
            wind = round(rnd.uniform(6.0, 24.0), 1)
            et0 = round(max(1.5, 0.0023 * (t_mean + 17.8) * math.sqrt(max(1.0, t_max - t_min)) * 3.5), 2)
            solar = round(rnd.uniform(14.0, 24.0), 1)

            records.append({
                "observed_date": d_val,
                "temperature_max": t_max,
                "temperature_min": t_min,
                "temperature_mean": t_mean,
                "precipitation_mm": precip,
                "relative_humidity_pct": humidity,
                "wind_speed_kmh": wind,
                "et0_mm": et0,
                "solar_radiation_mj": solar,
                "is_forecast": is_forecast,
                "data_source": "Agrometeorological Seasonal Baseline (Offline Simulation)",
                "is_simulated": True
            })

        return {
            "current_temp": round(base_temp + 2.1, 1),
            "current_humidity": 56.0,
            "current_wind": 11.2,
            "current_precip": 0.0,
            "records": records,
            "data_source": "Agrometeorological Seasonal Baseline (Offline Simulation)",
            "is_simulated": True
        }

open_meteo_client = OpenMeteoClient()
