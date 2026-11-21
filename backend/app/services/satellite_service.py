from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.satellite import SatelliteObservation, VegetationIndex
from app.models.farm import Farm
from app.integrations.copernicus import copernicus_client
from app.schemas.satellite import (
    SatelliteObservationResponse,
    VegetationIndexResponse,
    SatelliteSummaryResponse
)

class SatelliteService:
    @staticmethod
    def sync_farm_satellite_data(farm: Farm, db: Session) -> SatelliteSummaryResponse:
        """
        Synchronizes Copernicus Sentinel-2 observations and vegetation indices.
        """
        existing_count = db.query(SatelliteObservation).filter(
            SatelliteObservation.farm_id == farm.id
        ).count()

        if existing_count == 0:
            # Ingest initial 6 passes (spanning past 30 days)
            raw_passes = copernicus_client.fetch_farm_observations(farm.centroid_lat, farm.centroid_lon, count=6)
            for p in reversed(raw_passes):
                sat_obs = SatelliteObservation(
                    farm_id=farm.id,
                    platform=p["platform"],
                    acquisition_date=p["acquisition_date"],
                    cloud_cover_pct=p["cloud_cover_pct"],
                    band_b02_blue=p["band_b02_blue"],
                    band_b03_green=p["band_b03_green"],
                    band_b04_red=p["band_b04_red"],
                    band_b08_nir=p["band_b08_nir"],
                    band_b11_swir=p["band_b11_swir"],
                    is_simulated=p["is_simulated"],
                    data_source=p["data_source"]
                )
                db.add(sat_obs)
                db.flush()

                idx_data = p["indices"]
                veg_index = VegetationIndex(
                    observation_id=sat_obs.id,
                    farm_id=farm.id,
                    recorded_date=sat_obs.acquisition_date.date(),
                    ndvi=idx_data["ndvi"],
                    evi=idx_data["evi"],
                    savi=idx_data["savi"],
                    ndwi=idx_data["ndwi"],
                    vigor_category=idx_data["vigor_category"],
                    anomaly_vs_baseline=round(idx_data["ndvi"] - 0.52, 3)
                )
                db.add(veg_index)
            db.commit()

        # Query all observations and indices for this farm
        indices = db.query(VegetationIndex).filter(
            VegetationIndex.farm_id == farm.id
        ).order_by(VegetationIndex.recorded_date.asc()).all()

        latest_obs = db.query(SatelliteObservation).filter(
            SatelliteObservation.farm_id == farm.id
        ).order_by(SatelliteObservation.acquisition_date.desc()).first()

        latest_idx = indices[-1] if indices else None

        cloud_status = "Optimal (< 10% Cloud)" if latest_obs and latest_obs.cloud_cover_pct < 10 else "Moderate Cloud Cover Masked"

        return SatelliteSummaryResponse(
            farm_id=farm.id,
            latest_observation=SatelliteObservationResponse.model_validate(latest_obs) if latest_obs else None,
            latest_indices=VegetationIndexResponse.model_validate(latest_idx) if latest_idx else None,
            indices_history=[VegetationIndexResponse.model_validate(idx) for idx in indices],
            cloud_cover_status=cloud_status,
            data_provenance=latest_obs.data_source if latest_obs else "Copernicus Sentinel-2",
            observation_count=len(indices)
        )

satellite_service = SatelliteService()
