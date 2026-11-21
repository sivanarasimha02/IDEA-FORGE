import json
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from app.schemas.crop import CropResponse
from app.auth.dependencies import get_current_user, get_farm_for_user
from app.services.geometry import (
    validate_polygon_coordinates,
    compute_polygon_centroid,
    compute_geodesic_area_hectares
)
from app.services.weather_service import weather_service
from app.services.satellite_service import satellite_service
from app.services.risk_service import risk_service
from app.services.yield_service import yield_service
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/farms", tags=["Farms"])

def _farm_to_response(farm: Farm, db: Session) -> FarmResponse:
    active_crop = db.query(Crop).filter(Crop.farm_id == farm.id).first()
    return FarmResponse(
        id=farm.id,
        user_id=farm.user_id,
        name=farm.name,
        boundary_geojson=farm.boundary_geojson,
        centroid_lat=farm.centroid_lat,
        centroid_lon=farm.centroid_lon,
        area_hectares=farm.area_hectares,
        soil_type=farm.soil_type,
        irrigation_type=farm.irrigation_type,
        created_at=farm.created_at,
        updated_at=farm.updated_at,
        active_crop=CropResponse.model_validate(active_crop) if active_crop else None
    )

@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate boundary polygon coordinates
    coords = farm_in.boundary.coordinates
    if not coords or not isinstance(coords, list) or len(coords) < 1:
        raise HTTPException(status_code=400, detail="Invalid GeoJSON polygon coordinates.")
    
    exterior_ring = coords[0]
    try:
        validate_polygon_coordinates(exterior_ring)
        lat, lon = compute_polygon_centroid(exterior_ring)
        area_ha = compute_geodesic_area_hectares(exterior_ring)
        if area_ha <= 0.0:
            area_ha = 1.0  # Fallback minimum
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Geometry validation error: {str(e)}")

    farm = Farm(
        user_id=current_user.id,
        name=farm_in.name,
        boundary_geojson=json.dumps(farm_in.boundary.dict()),
        centroid_lat=lat,
        centroid_lon=lon,
        area_hectares=area_ha,
        soil_type=farm_in.soil_type,
        irrigation_type=farm_in.irrigation_type
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    # Optional inline crop association
    if farm_in.crop:
        crop_data = farm_in.crop
        sow_dt = crop_data.get("sowing_date")
        if isinstance(sow_dt, str):
            sow_dt = datetime.strptime(sow_dt, "%Y-%m-%d").date()
        elif not sow_dt:
            sow_dt = date.today()

        crop = Crop(
            farm_id=farm.id,
            crop_type=crop_data.get("crop_type", "Wheat"),
            variety=crop_data.get("variety", "Standard Hybrid"),
            sowing_date=sow_dt,
            growth_stage=crop_data.get("growth_stage", "Vegetative"),
            irrigation_method=crop_data.get("irrigation_method", farm.irrigation_type),
            historical_yield_per_ha=crop_data.get("historical_yield_per_ha", 4.0)
        )
        db.add(crop)
        db.commit()

    # Pre-populate initial environmental baseline
    try:
        weather_service.sync_farm_weather(farm, db)
        satellite_service.sync_farm_satellite_data(farm, db)
        risk_service.evaluate_farm_risks(farm, db)
        yield_service.predict_farm_yield(farm, db)
        recommendation_service.generate_farm_recommendations(farm, db)
    except Exception as e:
        print(f"Non-critical auto-sync warning during farm creation: {e}")

    return _farm_to_response(farm, db)

@router.get("", response_model=List[FarmResponse])
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in ["admin", "researcher"]:
        farms = db.query(Farm).all()
    else:
        farms = db.query(Farm).filter(Farm.user_id == current_user.id).all()
    
    return [_farm_to_response(f, db) for f in farms]

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    return _farm_to_response(farm, db)

@router.patch("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: str,
    farm_in: FarmUpdate,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    if farm_in.name:
        farm.name = farm_in.name
    if farm_in.soil_type:
        farm.soil_type = farm_in.soil_type
    if farm_in.irrigation_type:
        farm.irrigation_type = farm_in.irrigation_type
    if farm_in.boundary:
        coords = farm_in.boundary.coordinates[0]
        validate_polygon_coordinates(coords)
        farm.centroid_lat, farm.centroid_lon = compute_polygon_centroid(coords)
        farm.area_hectares = compute_geodesic_area_hectares(coords)
        farm.boundary_geojson = json.dumps(farm_in.boundary.dict())

    farm.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(farm)
    return _farm_to_response(farm, db)

@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    db.delete(farm)
    db.commit()
    return None

@router.post("/{farm_id}/analyze")
def trigger_analysis(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Refreshes all satellite imagery, weather records, risk models, and yield estimates."""
    weather_summary = weather_service.sync_farm_weather(farm, db)
    satellite_summary = satellite_service.sync_farm_satellite_data(farm, db)
    risks = risk_service.evaluate_farm_risks(farm, db)
    yield_pred = yield_service.predict_farm_yield(farm, db)
    recs = recommendation_service.generate_farm_recommendations(farm, db)

    return {
        "status": "success",
        "farm_id": farm.id,
        "analyzed_at": datetime.utcnow().isoformat(),
        "summary": {
            "critical_risks_count": sum(1 for r in risks if r.category in ["High", "Critical"]),
            "latest_ndvi": satellite_summary.latest_indices.ndvi if satellite_summary.latest_indices else None,
            "estimated_yield_per_ha": yield_pred.estimated_yield_per_ha,
            "recommendations_count": len(recs)
        }
    }
