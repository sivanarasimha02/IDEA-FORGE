from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.schemas.report import FarmReportResponse
from app.auth.dependencies import get_farm_for_user
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{farm_id}", response_model=FarmReportResponse)
def get_farm_report(
    farm_id: str,
    farm: Farm = Depends(get_farm_for_user),
    db: Session = Depends(get_db)
):
    """Compiles a complete, exportable Farm Agrometeorological & Yield Intelligence Report."""
    return report_service.generate_comprehensive_report(farm, db)
