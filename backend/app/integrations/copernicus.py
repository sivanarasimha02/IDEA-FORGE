import math
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from app.config import settings

class CopernicusSentinelClient:
    def __init__(self, api_key: str = settings.COPERNICUS_API_KEY):
        self.api_key = api_key

    def fetch_farm_observations(self, lat: float, lon: float, count: int = 6) -> List[Dict[str, Any]]:
        """
        Retrieves satellite observations for the specified coordinate location.
        If live Copernicus connection is not active, produces realistic Sentinel-2 multispectral
        acquisitions with full band reflectance, strictly flagged with is_simulated=True.
        """
        results = []
        today = datetime.utcnow()
        
        # Sentinel-2 has a 5-day revisit cycle with A and B constellations
        for i in range(count):
            acquisition_dt = today - timedelta(days=i * 5 + 1)
            
            # Deterministic reflectance generation based on location and cycle
            seed = int(abs(lat * 1000) + abs(lon * 1000) + acquisition_dt.day * 17 + i * 31)
            rnd = random.Random(seed)
            
            # Cloud cover
            cloud_cover = round(rnd.uniform(0.0, 25.0) if rnd.random() > 0.3 else rnd.uniform(25.0, 65.0), 1)
            
            # Healthy crop surface reflectance (normalized 0.0 - 1.0)
            # Photosynthetic vegetation absorbs Red/Blue and reflects NIR
            vegetative_vigor = 0.55 + 0.25 * math.sin((acquisition_dt.timetuple().tm_yday - 50) * 2 * math.pi / 200)
            vegetative_vigor = max(0.15, min(0.88, vegetative_vigor + rnd.uniform(-0.06, 0.06)))
            
            red_reflectance = round(max(0.02, 0.18 - (vegetative_vigor * 0.14) + rnd.uniform(-0.01, 0.02)), 3)
            nir_reflectance = round(max(0.08, 0.20 + (vegetative_vigor * 0.50) + rnd.uniform(-0.03, 0.03)), 3)
            green_reflectance = round(max(0.03, 0.10 + (vegetative_vigor * 0.08) + rnd.uniform(-0.01, 0.02)), 3)
            blue_reflectance = round(max(0.02, 0.08 - (vegetative_vigor * 0.04) + rnd.uniform(-0.01, 0.01)), 3)
            swir_reflectance = round(max(0.05, 0.22 - (vegetative_vigor * 0.12) + rnd.uniform(-0.02, 0.02)), 3)

            # Calculate indices
            indices = self.calculate_indices(
                nir=nir_reflectance,
                red=red_reflectance,
                green=green_reflectance,
                blue=blue_reflectance,
                swir=swir_reflectance
            )

            results.append({
                "platform": "Sentinel-2B" if i % 2 == 0 else "Sentinel-2A",
                "acquisition_date": acquisition_dt,
                "cloud_cover_pct": cloud_cover,
                "band_b02_blue": blue_reflectance,
                "band_b03_green": green_reflectance,
                "band_b04_red": red_reflectance,
                "band_b08_nir": nir_reflectance,
                "band_b11_swir": swir_reflectance,
                "indices": indices,
                "is_simulated": True,
                "data_source": "Copernicus Sentinel-2 Level-2A (Simulated AOI Extract)"
            })
            
        return results

    @staticmethod
    def calculate_indices(nir: float, red: float, green: float, blue: float, swir: float) -> Dict[str, Any]:
        """Compute NDVI, EVI, SAVI, and NDWI indices from raw band reflectances."""
        # 1. NDVI = (NIR - Red) / (NIR + Red)
        denom_ndvi = nir + red
        ndvi = (nir - red) / denom_ndvi if denom_ndvi != 0 else 0.0
        ndvi = max(-1.0, min(1.0, round(ndvi, 3)))

        # 2. EVI = 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)
        denom_evi = (nir + (6.0 * red) - (7.5 * blue) + 1.0)
        evi = 2.5 * ((nir - red) / denom_evi) if denom_evi != 0 else 0.0
        evi = max(-1.0, min(1.5, round(evi, 3)))

        # 3. SAVI = ((NIR - Red) / (NIR + Red + L)) * (1 + L) with L = 0.5
        L = 0.5
        denom_savi = nir + red + L
        savi = (((nir - red) / denom_savi) * (1.0 + L)) if denom_savi != 0 else 0.0
        savi = max(-1.0, min(1.0, round(savi, 3)))

        # 4. NDWI = (Green - NIR) / (Green + NIR)
        denom_ndwi = green + nir
        ndwi = (green - nir) / denom_ndwi if denom_ndwi != 0 else 0.0
        ndwi = max(-1.0, min(1.0, round(ndwi, 3)))

        # Vigor classification
        if ndvi >= 0.70:
            vigor = "Excellent (Dense Canopy)"
        elif ndvi >= 0.55:
            vigor = "Good (Active Biomass)"
        elif ndvi >= 0.38:
            vigor = "Moderate (Vegetative)"
        elif ndvi >= 0.20:
            vigor = "Poor (Sparse / Stressed)"
        else:
            vigor = "Very Low / Bare Ground"

        return {
            "ndvi": ndvi,
            "evi": evi,
            "savi": savi,
            "ndwi": ndwi,
            "vigor_category": vigor
        }

copernicus_client = CopernicusSentinelClient()
