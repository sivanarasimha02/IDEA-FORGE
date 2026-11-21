# System Architecture: Predictive Climate & Micro-Location Yield Engine

## 1. System Overview

The **Predictive Climate & Micro-Location Yield Engine** is an end-to-end AI-powered agricultural intelligence platform designed to provide field-level risk assessment, vegetation health monitoring, weather anomaly tracking, and crop yield forecasting.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|   React + TypeScript + Vite + Tailwind CSS + Leaflet (Geospatial) + Recharts     |
+-----------------------------------------------------------------------------------+
                                        | (HTTPS / REST)
+-----------------------------------------------------------------------------------+
|                             API GATEWAY & BACKEND                                 |
|                       FastAPI (Python 3.11+) + Uvicorn                            |
|  - JWT Authentication & RBAC (Farmer, Agronomist, Researcher, Admin)             |
|  - Farm & Polygon Boundary Management (GeoJSON / Shapely / PostGIS)              |
|  - IoT Sensor Telemetry Ingestion & Validation API                                |
|  - Background Task Dispatcher & Data Pipelines                                   |
+-----------------------------------------------------------------------------------+
             |                          |                         |
+------------------------+  +------------------------+  +--------------------------+
|  DATA INTEGRATIONS     |  |   STORAGE & DATABASE   |  |   AI / ML ENGINES        |
| - Open-Meteo API       |  | - PostgreSQL / PostGIS |  | - Climate Risk Engine    |
|   (Forecast & History) |  |   (or SQLite+Shapely)  |  |   (XGBoost / Rule Base)  |
| - Copernicus Sentinel-2|  | - Sensor Telemetry     |  | - Crop Yield Predictor   |
|   (Bands / Indices)    |  | - Farm Geometries      |  |   (RandomForest Ensemble)|
| - IoT Sensor Gateways  |  | - Analysis Results     |  | - Vegetation Index Calc  |
|   (Moisture/Temp/pH/EC)|  | - Caching & Cache Store|  | - Mitigation Rule Engine |
+------------------------+  +------------------------+  +--------------------------+
```

## 2. Core Modules

### 2.1 Authentication & Authorization
- **Security:** Argon2/Bcrypt password hashing, JSON Web Tokens (JWT) with configurable TTL.
- **RBAC:** Roles for Farmer (farm-scoped), Agronomist (authorized farms), Researcher (anonymized aggregates), and Administrator (global).
- **Isolation:** Farm ownership verification on all resource endpoints.

### 2.2 Farm & Spatial Data Service
- Stores exact boundaries in standard GeoJSON Polygon format.
- Computes geodesic surface area (hectares and acres) using ellipsoidal / polygon algorithms.
- Validates coordinates and ensures topological validity without self-intersections.

### 2.3 Environmental Data Ingestion Layer
- **Weather Service:** Connects to Open-Meteo for hourly and daily weather metrics:
  - Temperature (Min, Max, Mean)
  - Precipitation & Rain accumulation
  - Relative Humidity & Dew Point
  - Solar Radiation & Evapotranspiration (ET0)
  - Historical 30-year climatological baselines
- **Satellite Data Service:**
  - Copernicus Sentinel-2 Level-2A surface reflectance data.
  - Spectral bands: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR).
  - Cloud-masking, cloud-cover filtering, and acquisition timestamps.
  - Vegetation indices: NDVI, EVI, SAVI, NDWI.
- **IoT Sensor Gateway:**
  - Ingestion endpoint: `POST /api/sensors/data`
  - Per-device API authentication (`X-Device-Token`)
  - Range validation, anomaly detection, and heartbeat tracking.

### 2.4 ML & Analytics Engines
- **Climate Risk Engine:**
  - Evaluates Drought Risk via Standardized Precipitation Index (SPI) approximation, soil moisture deficit, and cumulative evapotranspiration.
  - Excess Rainfall & Flood Risk via forecast precipitation intensity against soil infiltration capacity.
  - Heat Stress Risk tracking thermal threshold exceedances during sensitive phenological stages (e.g. flowering).
- **Crop Yield Predictor:**
  - Multi-variate regression ensemble incorporating crop type, growing degree days (GDD), cumulative rainfall, soil characteristics, and peak vegetative NDVI.
  - Predicts yield in metric tons per hectare (t/ha) and total farm harvest with 80% and 95% confidence intervals.
- **Agronomic Recommendation Engine:**
  - Generates clear, prioritized agronomic interventions backed by scientific rationales and data citations.

## 3. Data Flow Diagram

```
[Farmer / Agronomist] ---> Create Farm Boundary ---> [FastAPI Service]
                                                           |
           +-----------------------------------------------+
           |
           v
[Fetch Weather (Open-Meteo)] <---> [Fetch Satellite (Copernicus)] <---> [Ingest IoT Sensors]
           |                                     |                               |
           +-------------------------------------+-------------------------------+
                                                 |
                                                 v
                                  [Feature Extraction Pipeline]
                                                 |
                                                 v
                                 +-------------------------------+
                                 |  Climate Risk & Yield Engine  |
                                 +-------------------------------+
                                                 |
                                                 v
                                 [Agronomic Recommendation Logic]
                                                 |
                                                 v
                                 [Persist & Serve to Dashboard]
```

## 4. Reliability & Graceful Degradation
- All external calls implement retries, timeouts, and fallback caches.
- Simulated or synthetic data is strictly flagged with `is_simulated: true` and documented source provenance.
- Incomplete datasets yield explicit "Insufficient Data" indicators rather than fabricated estimates.
