# API Documentation: Predictive Climate & Micro-Location Yield Engine

All endpoints are prefixed with `/api` unless otherwise noted. Responses use standard JSON formatting.

## Authentication & Headers

Protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```
Sensor ingestion endpoints require device token:
```
X-Device-Token: <sensor_device_secret>
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user profile.
- **Request Body:**
  ```json
  {
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "password": "SecurePassword123!",
    "role": "farmer",
    "phone_number": "+919876543210"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "id": "usr-uuid-1",
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "role": "farmer"
  }
  ```

### `POST /api/auth/login`
Authenticates user and returns JWT token.
- **Request Body:**
  ```json
  {
    "email": "ramesh@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "usr-uuid-1",
      "name": "Ramesh Kumar",
      "email": "ramesh@example.com",
      "role": "farmer"
    }
  }
  ```

### `GET /api/users/me`
Fetches current authenticated user profile.

---

## 2. Farm Management (`/api/farms`)

### `POST /api/farms`
Registers a new farm boundary and metadata.
- **Request Body:**
  ```json
  {
    "name": "Green Acres - Plot 1",
    "boundary": {
      "type": "Polygon",
      "coordinates": [
        [
          [77.585, 12.971],
          [77.590, 12.971],
          [77.590, 12.976],
          [77.585, 12.976],
          [77.585, 12.971]
        ]
      ]
    },
    "soil_type": "Black Cotton",
    "irrigation_type": "Drip"
  }
  ```
- **Response `201 Created`:** Farm object with calculated area in hectares and centroid.

### `GET /api/farms`
List all farms belonging to the current user (or authorized agronomist).

### `GET /api/farms/{farm_id}`
Retrieve farm details including active crop and latest summary status.

### `PATCH /api/farms/{farm_id}`
Update farm name, soil type, irrigation type or boundary.

### `DELETE /api/farms/{farm_id}`
Delete farm and cascaded records.

---

## 3. Crop Management (`/api/farms/{farm_id}/crops`)

### `POST /api/farms/{farm_id}/crops`
Registers an active crop cycle for the farm.
- **Request Body:**
  ```json
  {
    "crop_type": "Wheat",
    "variety": "HD-2967",
    "sowing_date": "2026-10-15",
    "expected_harvest_date": "2027-03-20",
    "growth_stage": "Flowering",
    "irrigation_method": "Drip",
    "historical_yield_per_ha": 4.2
  }
  ```

### `GET /api/farms/{farm_id}/crops`
List crop cycles for the farm.

---

## 4. Environmental & Intelligence Endpoints

### `POST /api/farms/{farm_id}/analyze`
Triggers an on-demand refresh of weather, satellite imagery, risk models, and yield forecasts.

### `GET /api/farms/{farm_id}/weather`
Returns current weather observations, 14-day forecasts, and 30-day historical precipitation/temperature baseline.
- Includes data source provenance (`Open-Meteo API`) and observation timestamps.

### `GET /api/farms/{farm_id}/satellite`
Returns latest satellite passes (Sentinel-2) covering the farm AOI, cloud cover, and spectral reflectance bands.

### `GET /api/farms/{farm_id}/vegetation-indices`
Returns time series of NDVI, EVI, SAVI, and NDWI indices with vigor classifications and historical anomaly metrics.

### `GET /api/farms/{farm_id}/soil`
Returns recent soil sensor readings (moisture %, temp °C, pH, EC) along with device telemetry status.

### `GET /api/farms/{farm_id}/risks`
Returns climate risk predictions:
- Drought / Rainfall Deficit
- Excess Rainfall / Flooding
- Heat Stress
- Soil Moisture Stress
Outputs include severity, calibrated score (0-1), prediction horizon, uncertainty %, and contributing features.

### `GET /api/farms/{farm_id}/yield`
Returns crop yield prediction:
- Estimated yield (t/ha) and total farm harvest (metric tons).
- 80% confidence interval lower and upper bounds.
- Comparison against regional/historical benchmarks.
- Key driving factors (e.g. cumulative rainfall, temperature stress days, vegetative NDVI).

### `GET /api/farms/{farm_id}/recommendations`
Returns prioritized agronomic mitigation recommendations with actionable advice, scientific rationale, and standard agronomist disclaimer.

---

## 5. IoT Sensor Telemetry (`/api/sensors`)

### `POST /api/sensors/register`
Register a new hardware sensor or simulated gateway to a farm.

### `POST /api/sensors/data`
Device ingestion endpoint. Authenticated via `X-Device-Token`.
- **Payload:**
  ```json
  {
    "device_id": "SN-ESP32-0042",
    "moisture_pct": 28.4,
    "temperature_c": 26.2,
    "ph": 6.8,
    "ec_ds_m": 1.2,
    "is_simulated": false,
    "recorded_at": "2026-11-17T18:20:00Z"
  }
  ```

---

## 6. Notifications & Reports

### `GET /api/notifications`
List in-app alerts and notifications.

### `PATCH /api/notifications/{id}/read`
Mark a notification as read.

### `GET /api/reports/{farm_id}`
Generates a structured Farm Intelligence Report containing climate risks, NDVI trends, soil status, yield estimates, and mitigations.
