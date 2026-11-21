# Database Schema: Predictive Climate & Micro-Location Yield Engine

The platform supports both PostgreSQL with PostGIS (for enterprise production) and SQLite with GeoJSON spatial utilities (for self-contained local development, lightweight environments, and testing).

## Entity Relationship Overview

```
 [User] 1---N [Farm] 1---N [Crop]
   |            |
   |            +---1---N [SensorDevice] 1---N [SoilReading]
   |            |
   |            +---1---N [WeatherObservation]
   |            |
   |            +---1---N [SatelliteObservation] 1---N [VegetationIndex]
   |            |
   |            +---1---N [ClimateRisk]
   |            |
   |            +---1---N [YieldPrediction]
   |            |
   |            +---1---N [AgronomicRecommendation]
   |            |
   +---1---N [Notification]
```

## Table Specifications

### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `name` | VARCHAR(128) | NOT NULL | Full user name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Account email |
| `password_hash` | VARCHAR(255) | NOT NULL | Salted Argon2/Bcrypt hash |
| `role` | VARCHAR(32) | NOT NULL, DEFAULT 'farmer' | farmer, agronomist, researcher, admin |
| `phone_number` | VARCHAR(32) | NULLABLE | Contact telephone |
| `created_at` | TIMESTAMP | NOT NULL | Account creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last modification timestamp |

### 2. `farms`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `user_id` | VARCHAR(36) | FOREIGN KEY (users.id) | Farm owner |
| `name` | VARCHAR(128) | NOT NULL | Farm designation (e.g., "North Field Plot 3") |
| `boundary_geojson` | TEXT / JSONB | NOT NULL | GeoJSON Polygon string |
| `centroid_lat` | FLOAT | NOT NULL | Latitude (-90 to +90) |
| `centroid_lon` | FLOAT | NOT NULL | Longitude (-180 to +180) |
| `area_hectares` | FLOAT | NOT NULL | Calculated area in ha |
| `soil_type` | VARCHAR(64) | NOT NULL | Clay, Sandy Loam, Silt, Black Cotton, etc. |
| `irrigation_type` | VARCHAR(64) | NOT NULL | Drip, Sprinkler, Flood, Rainfed, Canal |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

### 3. `crops`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Associated farm |
| `crop_type` | VARCHAR(64) | NOT NULL | Wheat, Rice, Cotton, Maize, Soybean, etc. |
| `variety` | VARCHAR(64) | NULLABLE | Specific variety/hybrid name |
| `sowing_date` | DATE | NOT NULL | Date planted |
| `expected_harvest_date` | DATE | NULLABLE | Projected harvest date |
| `growth_stage` | VARCHAR(64) | NOT NULL | Germination, Vegetative, Flowering, Grain-Filling, Maturity |
| `irrigation_method` | VARCHAR(64) | NULLABLE | Method deployed |
| `historical_yield_per_ha` | FLOAT | NULLABLE | Past known yield in tonnes/ha |

### 4. `sensor_devices`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier (or hardware serial) |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Associated farm |
| `device_name` | VARCHAR(64) | NOT NULL | Friendly label (e.g. "Field Node A1") |
| `api_key_hash` | VARCHAR(255) | NOT NULL | Hash of the authentication token |
| `status` | VARCHAR(32) | NOT NULL, DEFAULT 'active' | active, offline, maintenance |
| `battery_level` | FLOAT | NULLABLE | Battery percentage |
| `last_seen` | TIMESTAMP | NULLABLE | Last ping from device |

### 5. `soil_readings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `device_id` | VARCHAR(36) | FOREIGN KEY (sensor_devices.id) | Source device |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Target farm |
| `moisture_pct` | FLOAT | NOT NULL | Volumetric water content (%) |
| `temperature_c` | FLOAT | NOT NULL | Soil temperature (°C) |
| `ph` | FLOAT | NULLABLE | Soil pH level (0-14) |
| `ec_ds_m` | FLOAT | NULLABLE | Electrical conductivity (dS/m) |
| `is_simulated` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether data is hardware or demo |
| `data_source` | VARCHAR(128) | NOT NULL | Hardware ID or Simulator tag |
| `recorded_at` | TIMESTAMP | NOT NULL | Observation timestamp |

### 6. `weather_observations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Target farm |
| `temperature_max` | FLOAT | NOT NULL | Daily maximum temp (°C) |
| `temperature_min` | FLOAT | NOT NULL | Daily minimum temp (°C) |
| `temperature_mean` | FLOAT | NOT NULL | Daily average temp (°C) |
| `precipitation_mm` | FLOAT | NOT NULL | Total precipitation (mm) |
| `relative_humidity_pct` | FLOAT | NOT NULL | Relative humidity (%) |
| `wind_speed_kmh` | FLOAT | NOT NULL | Mean wind speed (km/h) |
| `solar_radiation_mj` | FLOAT | NULLABLE | Surface solar radiation (MJ/m²) |
| `et0_mm` | FLOAT | NULLABLE | Reference evapotranspiration (mm) |
| `is_forecast` | BOOLEAN | NOT NULL | Observed vs forecast |
| `data_source` | VARCHAR(128) | NOT NULL | Provider name & endpoint |
| `observed_date` | DATE | NOT NULL | Target calendar date |
| `recorded_at` | TIMESTAMP | NOT NULL | Extraction timestamp |

### 7. `satellite_observations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Target farm |
| `platform` | VARCHAR(64) | NOT NULL | Sentinel-2A/B, Landsat-8/9 |
| `acquisition_date` | TIMESTAMP | NOT NULL | Observation date & time |
| `cloud_cover_pct` | FLOAT | NOT NULL | Granule / AOI cloud percentage |
| `band_b02_blue` | FLOAT | NULLABLE | Mean reflectance |
| `band_b03_green` | FLOAT | NULLABLE | Mean reflectance |
| `band_b04_red` | FLOAT | NULLABLE | Mean reflectance |
| `band_b08_nir` | FLOAT | NULLABLE | Mean reflectance |
| `band_b11_swir` | FLOAT | NULLABLE | Mean reflectance |
| `is_simulated` | BOOLEAN | NOT NULL, DEFAULT FALSE | Real satellite vs demonstration |
| `data_source` | VARCHAR(128) | NOT NULL | Copernicus Open Access / Catalog |

### 8. `vegetation_indices`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `observation_id` | VARCHAR(36) | FOREIGN KEY (satellite_observations.id) | Parent observation |
| `ndvi` | FLOAT | NOT NULL | Normalized Difference Veg Index |
| `evi` | FLOAT | NOT NULL | Enhanced Vegetation Index |
| `savi` | FLOAT | NOT NULL | Soil Adjusted Veg Index |
| `ndwi` | FLOAT | NOT NULL | Normalized Difference Water Index |
| `vigor_category` | VARCHAR(32) | NOT NULL | Poor, Moderate, Good, Excellent |
| `anomaly_vs_baseline`| FLOAT | NULLABLE | Deviation from seasonal norm |

### 9. `climate_risks`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Target farm |
| `risk_type` | VARCHAR(64) | NOT NULL | drought, excess_rain, heat_stress, soil_stress |
| `category` | VARCHAR(32) | NOT NULL | Low, Moderate, High, Critical |
| `calibrated_score` | FLOAT | NOT NULL | 0.0 to 1.0 risk probability/score |
| `horizon_days` | INT | NOT NULL | e.g., 7 or 14 days |
| `contributing_factors` | TEXT / JSON | NOT NULL | Key driving variables & feature impact |
| `uncertainty_pct` | FLOAT | NOT NULL | Degree of model uncertainty |
| `model_version` | VARCHAR(32) | NOT NULL | e.g. "climate-risk-xgb-v1.0" |
| `created_at` | TIMESTAMP | NOT NULL | Analysis timestamp |

### 10. `yield_predictions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Target farm |
| `crop_id` | VARCHAR(36) | FOREIGN KEY (crops.id) | Evaluated crop |
| `estimated_yield_per_ha` | FLOAT | NOT NULL | Metric tonnes / ha |
| `estimated_total_yield` | FLOAT | NOT NULL | Total farm production (t) |
| `lower_bound_80` | FLOAT | NOT NULL | 80% CI lower estimate |
| `upper_bound_80` | FLOAT | NOT NULL | 80% CI upper estimate |
| `benchmark_comparison_pct` | FLOAT | NOT NULL | % vs historical / regional average |
| `influencing_factors` | TEXT / JSON | NOT NULL | Feature importance and impact |
| `model_version` | VARCHAR(32) | NOT NULL | e.g. "yield-ensemble-rf-v1.2" |
| `created_at` | TIMESTAMP | NOT NULL | Prediction timestamp |

### 11. `recommendations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Target farm |
| `risk_id` | VARCHAR(36) | NULLABLE | Associated risk |
| `category` | VARCHAR(64) | NOT NULL | Irrigation, Drainage, Heat Shield, Soil Care |
| `priority` | VARCHAR(32) | NOT NULL | Low, Medium, High, Urgent |
| `title` | VARCHAR(128) | NOT NULL | Action headline |
| `action` | TEXT | NOT NULL | Concrete step-by-step guidance |
| `rationale` | TEXT | NOT NULL | Scientific and agronomic reasoning |
| `disclaimer` | TEXT | NOT NULL | Agricultural advisory disclaimer |
| `created_at` | TIMESTAMP | NOT NULL | Generation timestamp |

### 12. `notifications`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | UUID identifier |
| `user_id` | VARCHAR(36) | FOREIGN KEY (users.id) | Recipient |
| `farm_id` | VARCHAR(36) | FOREIGN KEY (farms.id) | Subject farm |
| `severity` | VARCHAR(32) | NOT NULL | info, warning, danger, success |
| `title` | VARCHAR(128) | NOT NULL | Notification title |
| `message` | TEXT | NOT NULL | Body text |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT FALSE | Read state |
| `created_at` | TIMESTAMP | NOT NULL | Dispatch timestamp |
