from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.models.satellite import VegetationIndex
from app.schemas.satellite import SatelliteSummaryResponse, VegetationIndexResponse
from app.auth.dependencies import get_farm_for_user
from app.services.satellite_service import satellite_service

router = APIRouter(prefix="/farms/{farm_id}", tags=["Satellite Intelligence"])

@router.get("/satellite", response_model=SatelliteSummaryResponse)
def get_satellite_summary(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Retrieves Sentinel-2 passes, cloud masking status, and vegetation indices."""
    return satellite_service.sync_farm_satellite_data(farm, db)

@router.get("/vegetation-indices", response_model=List[VegetationIndexResponse])
def get_vegetation_indices(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Retrieves NDVI, EVI, SAVI, and NDWI index history for time-series charts."""
    indices = db.query(VegetationIndex).filter(
        VegetationIndex.farm_id == farm.id
    ).order_by(VegetationIndex.recorded_date.asc()).all()
    return [VegetationIndexResponse.model_validate(idx) for idx in indices]
