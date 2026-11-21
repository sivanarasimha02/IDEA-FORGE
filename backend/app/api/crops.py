from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.crop import Crop
from app.models.farm import Farm
from app.schemas.crop import CropCreate, CropResponse
from app.auth.dependencies import get_farm_for_user

router = APIRouter(prefix="/farms/{farm_id}/crops", tags=["Crops"])

@router.post("", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def add_crop_cycle(
    farm_id: str,
    crop_in: CropCreate,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    crop = Crop(
        farm_id=farm.id,
        crop_type=crop_in.crop_type,
        variety=crop_in.variety,
        sowing_date=crop_in.sowing_date,
        expected_harvest_date=crop_in.expected_harvest_date,
        growth_stage=crop_in.growth_stage,
        irrigation_method=crop_in.irrigation_method,
        historical_yield_per_ha=crop_in.historical_yield_per_ha
    )
    db.add(crop)
    db.commit()
    db.refresh(crop)
    return crop

@router.get("", response_model=List[CropResponse])
def list_crops(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    crops = db.query(Crop).filter(Crop.farm_id == farm.id).order_by(Crop.sowing_date.desc()).all()
    return crops
