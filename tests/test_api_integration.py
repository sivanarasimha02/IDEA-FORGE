import pytest
import sys
import os
import uuid
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("backend"))

from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Test Agronomist",
        "email": unique_email,
        "password": "Password123!",
        "role": "farmer"
    })
    assert reg_resp.status_code == 201

    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_farm_lifecycle(auth_headers):
    # 1. Create Farm
    farm_payload = {
        "name": "Integration Test Plot 10",
        "boundary": {
            "type": "Polygon",
            "coordinates": [
                [
                    [77.10, 13.10],
                    [77.15, 13.10],
                    [77.15, 13.15],
                    [77.10, 13.15],
                    [77.10, 13.10]
                ]
            ]
        },
        "soil_type": "Clay Loam",
        "irrigation_type": "Drip Irrigation",
        "crop": {
            "crop_type": "Wheat",
            "variety": "HD-2967",
            "sowing_date": "2026-10-15",
            "growth_stage": "Flowering",
            "historical_yield_per_ha": 4.2
        }
    }

    create_resp = client.post("/api/farms", json=farm_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    farm_data = create_resp.json()
    farm_id = farm_data["id"]
    assert farm_data["area_hectares"] > 0
    assert farm_data["name"] == "Integration Test Plot 10"

    # 2. Get Farm
    get_resp = client.get(f"/api/farms/{farm_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["active_crop"]["crop_type"] == "Wheat"

    # 3. Test Weather
    weather_resp = client.get(f"/api/farms/{farm_id}/weather", headers=auth_headers)
    assert weather_resp.status_code == 200
    assert "current_temperature_c" in weather_resp.json()
    assert len(weather_resp.json()["forecast_7days"]) > 0

    # 4. Test Satellite
    sat_resp = client.get(f"/api/farms/{farm_id}/satellite", headers=auth_headers)
    assert sat_resp.status_code == 200
    assert sat_resp.json()["observation_count"] > 0
    assert sat_resp.json()["latest_indices"]["ndvi"] is not None

    # 5. Test Climate Risks
    risk_resp = client.get(f"/api/farms/{farm_id}/risks", headers=auth_headers)
    assert risk_resp.status_code == 200
    risks = risk_resp.json()["risks"]
    assert len(risks) >= 3
    assert any(r["risk_type"] == "drought" for r in risks)

    # 6. Test Yield Prediction
    yield_resp = client.get(f"/api/farms/{farm_id}/yield", headers=auth_headers)
    assert yield_resp.status_code == 200
    assert yield_resp.json()["estimated_yield_per_ha"] > 0
    assert yield_resp.json()["lower_bound_80"] <= yield_resp.json()["estimated_yield_per_ha"]

    # 7. Test Recommendations
    rec_resp = client.get(f"/api/farms/{farm_id}/recommendations", headers=auth_headers)
    assert rec_resp.status_code == 200
    assert len(rec_resp.json()) > 0
    assert "action" in rec_resp.json()[0]

    # 8. Test Sensor Telemetry Ingestion
    sensor_reading_payload = {
        "device_id": f"TEST-DEV-{uuid.uuid4().hex[:6]}",
        "moisture_pct": 27.5,
        "temperature_c": 25.2,
        "ph": 6.8,
        "ec_ds_m": 1.3,
        "is_simulated": True,
        "data_source": "PyTest Ingestion Probe"
    }
    # Register device first
    reg_dev = client.post("/api/sensors/register", json={
        "farm_id": farm_id,
        "device_name": "Test Node 1"
    }, headers=auth_headers)
    assert reg_dev.status_code == 201
    dev_id = reg_dev.json()["id"]

    sensor_reading_payload["device_id"] = dev_id
    ingest_resp = client.post("/api/sensors/data", json=sensor_reading_payload)
    assert ingest_resp.status_code == 201
    assert ingest_resp.json()["moisture_pct"] == 27.5

    # 9. Test Soil Endpoint
    soil_resp = client.get(f"/api/farms/{farm_id}/soil", headers=auth_headers)
    assert soil_resp.status_code == 200
    assert soil_resp.json()["latest_reading"]["moisture_pct"] == 27.5

    # 10. Test Full Farm Report
    report_resp = client.get(f"/api/reports/{farm_id}", headers=auth_headers)
    assert report_resp.status_code == 200
    assert "weather_summary" in report_resp.json()
    assert "yield_prediction" in report_resp.json()
    assert "recommendations" in report_resp.json()

    # 11. Delete Farm
    del_resp = client.delete(f"/api/farms/{farm_id}", headers=auth_headers)
    assert del_resp.status_code == 204
