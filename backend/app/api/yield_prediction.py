from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.schemas.yield_model import YieldPredictionResponse
from app.auth.dependencies import get_farm_for_user
from app.services.yield_service import yield_service

router = APIRouter(prefix="/farms/{farm_id}/yield", tags=["Crop Yield"])

@router.get("", response_model=YieldPredictionResponse)
def get_crop_yield_prediction(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Retrieves field yield estimate with 80% confidence interval and feature contributions."""
    return yield_service.predict_farm_yield(farm, db)
