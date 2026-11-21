from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.schemas.risk import RiskSummaryResponse
from app.auth.dependencies import get_farm_for_user
from app.services.risk_service import risk_service

router = APIRouter(prefix="/farms/{farm_id}/risks", tags=["Climate Risks"])

@router.get("", response_model=RiskSummaryResponse)
def get_climate_risks(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Retrieves calibrated risk scores for Drought, Excess Rain, Heat Stress, and Soil Deficit."""
    return risk_service.get_risk_summary(farm, db)
