from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.schemas.recommendation import AgronomicRecommendationResponse
from app.auth.dependencies import get_farm_for_user
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/farms/{farm_id}/recommendations", tags=["Agronomic Recommendations"])

@router.get("", response_model=List[AgronomicRecommendationResponse])
def get_recommendations(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Retrieves prioritized, actionable mitigations based on current risk assessments."""
    return recommendation_service.generate_farm_recommendations(farm, db)
