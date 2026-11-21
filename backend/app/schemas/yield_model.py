from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class YieldFactor(BaseModel):
    feature: str
    contribution: float
    description: str

class YieldPredictionResponse(BaseModel):
    id: str
    farm_id: str
    crop_id: str
    crop_type: Optional[str] = None
    estimated_yield_per_ha: float
    estimated_total_yield: float
    lower_bound_80: float
    upper_bound_80: float
    benchmark_comparison_pct: float
    influencing_factors: List[YieldFactor]
    model_version: str
    created_at: datetime
    data_quality_indicator: str = "High Confidence (Vegetation & Meteorological Co-Alignment)"

    model_config = ConfigDict(from_attributes=True)
