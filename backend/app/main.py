import json
from datetime import datetime, date, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import engine, Base, SessionLocal
from app.models import (
    User, Farm, Crop, SensorDevice, SoilReading,
    WeatherObservation, SatelliteObservation, VegetationIndex,
    ClimateRisk, YieldPrediction, AgronomicRecommendation, Notification
)
from app.auth.security import get_password_hash
from app.api import (
    auth, farms, crops, sensors, weather,
    satellite, risks, yield_prediction, recommendations,
    notifications, reports
)
from app.services.geometry import compute_polygon_centroid, compute_geodesic_area_hectares
from app.services.weather_service import weather_service
from app.services.satellite_service import satellite_service
from app.services.sensor_service import sensor_service
from app.services.risk_service import risk_service
from app.services.yield_service import yield_service
from app.services.recommendation_service import recommendation_service

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Field-level predictive climate intelligence and crop yield engine.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(farms.router, prefix=settings.API_V1_STR)
app.include_router(crops.router, prefix=settings.API_V1_STR)
app.include_router(sensors.router)
app.include_router(weather.router, prefix=settings.API_V1_STR)
app.include_router(satellite.router, prefix=settings.API_V1_STR)
app.include_router(risks.router, prefix=settings.API_V1_STR)
app.include_router(yield_prediction.router, prefix=settings.API_V1_STR)
app.include_router(recommendations.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "documentation": "/docs",
        "health": "/health"
    }

@app.on_event("startup")
def seed_demo_data_if_empty():
    """Seeds a demonstration farmer and pilot farm if the database is newly initialized."""
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "farmer@climate-engine.org").first()
        if not demo_user:
            demo_user = User(
                name="Anand Rao",
                email="farmer@climate-engine.org",
                password_hash=get_password_hash("FarmerDemo123!"),
                role="farmer",
                phone_number="+91-98450-12345"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Pilot Farm Polygon (Near Mandya, Karnataka agricultural belt)
            # Coordinates: ~12.52 Lat, 76.89 Lon
            pilot_polygon = {
                "type": "Polygon",
                "coordinates": [
                    [
                        [76.8920, 12.5210],
                        [76.8980, 12.5215],
                        [76.8975, 12.5270],
                        [76.8915, 12.5265],
                        [76.8920, 12.5210]
                    ]
                ]
            }
            coords = pilot_polygon["coordinates"][0]
            lat, lon = compute_polygon_centroid(coords)
            area_ha = compute_geodesic_area_hectares(coords)

            farm = Farm(
                user_id=demo_user.id,
                name="Cauvery Basin Pilot Plot - North 4",
                boundary_geojson=json.dumps(pilot_polygon),
                centroid_lat=lat,
                centroid_lon=lon,
                area_hectares=area_ha,
                soil_type="Black Cotton Clay Loam",
                irrigation_type="Drip Irrigation"
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)

            # Crop cycle
            crop = Crop(
                farm_id=farm.id,
                crop_type="Wheat",
                variety="HD-2967 High Vigor",
                sowing_date=date.today() - timedelta(days=68),
                expected_harvest_date=date.today() + timedelta(days=52),
                growth_stage="Flowering / Grain Filling",
                irrigation_method="Drip Irrigation",
                historical_yield_per_ha=4.1
            )
            db.add(crop)
            db.commit()

            # Seed telemetry and analytics
            sensor_service.generate_demo_readings(farm, db, count=14)
            weather_service.sync_farm_weather(farm, db)
            satellite_service.sync_farm_satellite_data(farm, db)
            risk_service.evaluate_farm_risks(farm, db)
            yield_service.predict_farm_yield(farm, db)
            recommendation_service.generate_farm_recommendations(farm, db)

            # Seed welcome notification
            notif = Notification(
                user_id=demo_user.id,
                farm_id=farm.id,
                severity="info",
                title="Cauvery Basin Pilot Monitoring Active",
                message="Sentinel-2 vegetation analysis (NDVI: 0.68) and micro-location climate models calibrated successfully.",
                is_read=False
            )
            db.add(notif)
            db.commit()
            print("Successfully initialized demo farm and user credentials!")
    finally:
        db.close()
