from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class RiskFactor(BaseModel):
    name: str
    impact: str
    detail: str
    value: Optional[str] = None

class ClimateRiskResponse(BaseModel):
    id: str
    farm_id: str
    risk_type: str
    category: str
    calibrated_score: float
    horizon_days: int
    contributing_factors: List[RiskFactor]
    uncertainty_pct: float
    model_version: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RiskSummaryResponse(BaseModel):
    farm_id: str
    overall_status: str
    critical_risks_count: int
    risks: List[ClimateRiskResponse]
    evaluated_at: datetime
    data_freshness_status: str
