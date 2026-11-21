from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AgronomicRecommendationResponse(BaseModel):
    id: str
    farm_id: str
    risk_id: Optional[str] = None
    category: str
    priority: str
    title: str
    action: str
    rationale: str
    disclaimer: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
