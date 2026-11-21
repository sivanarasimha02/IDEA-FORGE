from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.recommendation import AgronomicRecommendation
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.risk import ClimateRisk
from app.schemas.recommendation import AgronomicRecommendationResponse

DISCLAIMER_TEXT = (
    "These agronomic recommendations are advisory decision-support outputs based on remote sensing, "
    "local weather forecasts, and soil telemetry. They support, but do not replace, qualified local agricultural extension advice."
)

class RecommendationService:
    @staticmethod
    def generate_farm_recommendations(farm: Farm, db: Session) -> List[AgronomicRecommendationResponse]:
        """
        Translates detected risks, crop type, and growth stage into actionable agronomic interventions.
        """
        active_crop = db.query(Crop).filter(Crop.farm_id == farm.id).first()
        crop_name = active_crop.crop_type if active_crop else "Field Crop"
        growth_stage = active_crop.growth_stage if active_crop else "Vegetative"

        risks = db.query(ClimateRisk).filter(ClimateRisk.farm_id == farm.id).all()
        
        # Clear previous recommendations for this farm
        db.query(AgronomicRecommendation).filter(AgronomicRecommendation.farm_id == farm.id).delete()

        generated = []

        for r in risks:
            if r.risk_type == "drought" and r.category in ["Moderate", "High", "Critical"]:
                priority = "Urgent" if r.category == "Critical" else ("High" if r.category == "High" else "Medium")
                rec = AgronomicRecommendation(
                    farm_id=farm.id,
                    risk_id=r.id,
                    category="Irrigation & Soil Moisture Conservation",
                    priority=priority,
                    title=f"Activate Regulated Deficit Irrigation for {crop_name}",
                    action=(
                        f"Schedule irrigation during early morning (5:00 AM - 8:00 AM) or late evening to minimize evaporative loss. "
                        f"Prioritize water allocation to the {growth_stage} zones. Apply organic mulch or crop residue (3-5 cm depth) "
                        f"across rows to conserve soil moisture if practical."
                    ),
                    rationale=(
                        f"Precipitation is significantly below seasonal baseline with high atmospheric ET0 demand. "
                        f"Timely moisture conservation prevents floral abortion and maintains stomatal conductance in {crop_name}."
                    ),
                    disclaimer=DISCLAIMER_TEXT
                )
                db.add(rec)
                generated.append(rec)

            elif r.risk_type == "excess_rain" and r.category in ["Moderate", "High", "Critical"]:
                priority = "Urgent" if r.category == "Critical" else "High"
                rec = AgronomicRecommendation(
                    farm_id=farm.id,
                    risk_id=r.id,
                    category="Drainage & Waterlogging Prevention",
                    priority=priority,
                    title=f"Clear Field Drainage Channels and Protect Harvest Storage",
                    action=(
                        f"Inspect and clear boundary trenches and drainage swales to allow rapid surface runoff. "
                        f"Avoid field machinery transit on waterlogged clay soil to prevent severe soil compaction. "
                        f"If {crop_name} is nearing physiological maturity, secure dry storage sheds for harvested grain."
                    ),
                    rationale=(
                        f"Heavy precipitation is forecasted over poorly drained soils, posing anoxia risks to the root zone "
                        f"and creating favorable micro-climates for fungal pathogen proliferation."
                    ),
                    disclaimer=DISCLAIMER_TEXT
                )
                db.add(rec)
                generated.append(rec)

            elif r.risk_type == "heat_stress" and r.category in ["Moderate", "High", "Critical"]:
                priority = "High" if r.category in ["Critical", "High"] else "Medium"
                rec = AgronomicRecommendation(
                    farm_id=farm.id,
                    risk_id=r.id,
                    category="Heat Shield & Thermal Mitigation",
                    priority=priority,
                    title=f"Protective Micro-Irrigation during Thermal Peak for {crop_name}",
                    action=(
                        f"Apply a light sprinkle or drip cycle (10-15 mm) before peak midday solar radiation. "
                        f"Consider applying foliar potassium nitrate (1-2%) or anti-transpirant kaolin spray to reduce canopy temperature."
                    ),
                    rationale=(
                        f"Sustained ambient temperatures above critical limits during the {growth_stage} phase induce "
                        f"canopy heat shock and reduce pollen viability."
                    ),
                    disclaimer=DISCLAIMER_TEXT
                )
                db.add(rec)
                generated.append(rec)

            elif r.risk_type == "soil_stress" and r.category in ["High", "Critical"]:
                rec = AgronomicRecommendation(
                    farm_id=farm.id,
                    risk_id=r.id,
                    category="Soil Health & Sensor Verification",
                    priority="Medium",
                    title="Verify Field Sensor Node and Soil Water Depletion",
                    action=(
                        f"Check in-situ soil moisture sensor calibration and inspect root-zone depth (15-30 cm) for uniform moisture spread."
                    ),
                    rationale="Sensor telemetry indicates root-zone moisture has approached field deficit limits.",
                    disclaimer=DISCLAIMER_TEXT
                )
                db.add(rec)
                generated.append(rec)

        # If no severe risk was triggered, add a positive maintenance advisory
        if not generated:
            rec = AgronomicRecommendation(
                farm_id=farm.id,
                category="Standard Field Maintenance",
                priority="Low",
                title=f"Maintain Standard Agronomic Protocol for {crop_name}",
                action=f"Continue scheduled weed scouting and maintain standard crop management for {growth_stage} stage.",
                rationale="Current agro-meteorological metrics indicate favorable growing conditions across the field.",
                disclaimer=DISCLAIMER_TEXT
            )
            db.add(rec)
            generated.append(rec)

        db.commit()

        return [AgronomicRecommendationResponse.model_validate(r) for r in generated]

recommendation_service = RecommendationService()
