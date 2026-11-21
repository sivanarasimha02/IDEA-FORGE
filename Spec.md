# Predictive Climate & Micro-Location Yield Engine
## Software Requirements Specification (SRS) and Single Source of Truth (SSOT)

**Project type:** AI-powered agricultural climate intelligence platform  
**Domain:** AgriTech, climate intelligence, precision agriculture, geospatial analytics  
**Primary users:** Farmers, agronomists, agricultural researchers, agri-businesses and government agencies  
**Document purpose:** Master specification for planning, implementation, testing and deployment.

---

## 1. Project Overview

The **Predictive Climate & Micro-Location Yield Engine** is an AI-powered platform that combines satellite imagery, historical weather and monsoon records, weather forecasts, soil sensor measurements and crop information to assess climate risks for a specific agricultural location.

Unlike general weather applications that provide forecasts for cities or districts, this platform focuses on a farm or user-defined geographical boundary. It identifies possible drought, excessive rainfall, heat stress and vegetation stress, estimates potential crop-yield impacts, and recommends practical actions to reduce losses.

### Core value proposition

Turn environmental data into **location-specific, crop-aware and actionable agricultural intelligence**.

### Questions the platform should help answer

- Is this field likely to experience drought or water stress?
- Is unusually heavy rainfall likely during a sensitive crop-growth stage?
- How healthy is the vegetation in this field?
- Which environmental factors may affect the crop?
- What is the estimated crop yield, and how uncertain is that estimate?
- What actions could reduce potential losses?

---

## 2. Problem Statement

Farmers often rely on general weather forecasts and personal experience when making agricultural decisions. These sources may not represent conditions within an individual field. Climate variability, irregular monsoons, unexpected rainfall, heat stress and changing soil moisture can damage crops and reduce yield.

There is a need for a platform that combines location-specific satellite observations, weather information, soil conditions and crop data to identify risks early and support better decisions.

### Proposed solution

Build a platform that:

1. Allows a user to register and map one or more farms.
2. Collects satellite, weather, soil and crop information for each farm.
3. Calculates vegetation and environmental indicators.
4. Predicts selected climate risks using validated analytical and machine-learning methods.
5. Estimates crop yield and communicates uncertainty.
6. Provides explainable, crop-specific mitigation recommendations.
7. Displays results through maps, dashboards, reports and alerts.

---

## 3. Project Objectives

1. Support farm-level monitoring using GPS coordinates or user-drawn field boundaries.
2. Analyze satellite imagery to monitor vegetation condition and changes over time.
3. Combine historical weather, monsoon records and forecasts for climate-risk assessment.
4. Integrate soil sensor data such as moisture and temperature.
5. Predict drought, excessive rainfall and heat-stress risks.
6. Estimate crop yield using crop, soil, weather and vegetation features.
7. Explain the factors contributing to each risk or yield estimate.
8. Recommend practical mitigation actions appropriate to crop and growth stage.
9. Notify users when important risks are detected.
10. Make the platform extensible to additional districts, crops and data providers.

---

## 4. Target Users and Roles

| User role | Main purpose |
|---|---|
| Farmer | Monitor farms, understand risks and receive recommendations |
| Agronomist | Review field conditions and provide crop guidance |
| Researcher | Analyze environmental and crop trends |
| Agri-business | Support farm planning and agricultural services |
| Administrator | Manage users, data integrations and system operations |

### Role-based access

- **Farmer:** Manage only their own farms, crops, sensor devices and reports.
- **Agronomist:** Access farms explicitly shared with them.
- **Administrator:** Manage platform configuration and operational status.
- **Researcher:** Access only authorized or appropriately anonymized datasets.

---

## 5. Functional Requirements and Modules

### 5.1 Authentication and User Management

**Features**
- User registration, login and logout.
- Secure password hashing.
- User profile management.
- Password reset workflow.
- Role-based access control.
- Session/token expiry and refresh handling.

**Acceptance criteria**
- A user can register and log in.
- Protected endpoints reject unauthenticated requests.
- A user cannot access another user's private farm data without authorization.

### 5.2 Farm Management and Micro-Location Selection

**Features**
- Create, edit, view and delete farms.
- Search for a location by place name or coordinates.
- Use device GPS where permission is granted.
- Draw or upload a farm boundary polygon.
- Store the farm boundary as GeoJSON/PostGIS geometry.
- Calculate farm area.
- Associate crops, soil information, irrigation type and sowing date with a farm.
- Support multiple farms per user.

**Farm fields**

| Field | Description |
|---|---|
| farm_id | Unique farm identifier |
| user_id | Owner of the farm |
| farm_name | User-defined farm name |
| boundary | GeoJSON polygon / PostGIS geometry |
| latitude, longitude | Representative farm location |
| area | Area in hectares or acres |
| soil_type | Known or user-provided soil type |
| irrigation_type | Rainfed, irrigated or mixed |
| created_at | Creation timestamp |

**Crop fields**
- Crop type and variety, if known.
- Sowing or transplanting date.
- Expected harvest date, if known.
- Growth stage.
- Irrigation method.
- Historical yield, if available.

### 5.3 Satellite Image Analysis

**Purpose:** Retrieve and process satellite observations covering a selected farm.

**Potential data sources**
- Copernicus Sentinel-2.
- ISRO Bhuvan and Bhoonidhi, subject to dataset availability and access terms.
- Other approved Earth-observation datasets when needed.

**Features**
- Search for imagery intersecting the farm boundary.
- Filter by date, cloud cover and image quality.
- Apply cloud and shadow masking where supported.
- Calculate vegetation indices.
- Compare observations over time.
- Display imagery and index layers on the farm map.
- Record data source, acquisition date, resolution and processing details.

**Vegetation and water indices**

| Index | Typical use |
|---|---|
| NDVI | Vegetation greenness and vigor |
| EVI | Vegetation monitoring in conditions where NDVI may be less sensitive |
| SAVI | Vegetation analysis where soil background has an effect |
| NDWI | Water-related analysis; interpretation depends on the selected formula and bands |

NDVI formula:

`NDVI = (NIR - RED) / (NIR + RED)`

Where `NIR` is near-infrared reflectance and `RED` is red reflectance.

**Important limitations**
- Cloud cover can prevent useful observations.
- Satellite revisit frequency and processing availability affect freshness.
- Spatial resolution varies by sensor and spectral band.
- A farm boundary smaller than the effective pixel size may not support reliable field-level interpretation.
- NDVI is an indicator, not a direct diagnosis of crop disease, nutrient deficiency or soil moisture.
- Every displayed layer must include its observation date and source.

### 5.4 Weather and Historical Climate Analysis

**Potential data sources**
- India Meteorological Department (IMD), subject to access and API terms.
- NASA POWER.
- Open-Meteo historical and forecast services.
- Other validated national or regional meteorological datasets.

**Parameters**
- Rainfall.
- Minimum and maximum temperature.
- Relative humidity.
- Wind speed.
- Solar radiation, where available.
- Evapotranspiration or reference evapotranspiration, where available.

**Features**
- Historical rainfall and temperature charts.
- Forecast weather for supported time horizons.
- Rainfall anomaly calculation.
- Comparison with a suitable historical baseline.
- Monsoon progress and irregularity analysis.
- Excess-rainfall and heat-risk indicators.
- Clear separation of observed, historical, forecast and modelled values.

### 5.5 Soil Sensor Integration

**Potential measurements**
- Soil moisture.
- Soil temperature.
- Soil pH.
- Electrical conductivity (EC).

**Hardware options**
- ESP32 or another supported IoT gateway.
- Calibrated soil-moisture sensor.
- Soil-temperature sensor.
- Optional pH and EC sensors.

**Data flow**

`Soil sensors → ESP32 / IoT gateway → HTTPS or MQTT → Backend ingestion API → Validation and storage → Dashboard and prediction pipeline`

**Features**
- Register sensor devices to a farm.
- Receive timestamped readings.
- Validate ranges, units and device identity.
- Display current and historical measurements.
- Detect stale, missing or abnormal readings.
- Show device connectivity status.
- Use soil measurements as model features only after quality checks.

**Important:** Simulated sensor readings may be used during early development, but must be labelled as simulated and must never be displayed as real measurements.

### 5.6 Climate Risk Prediction Engine

**Core module:** Combine relevant environmental features to estimate selected agricultural risks.

**Initial risks**
- Drought / rainfall deficit.
- Excess rainfall.
- Heat stress.
- Soil-moisture stress.
- Vegetation stress.
- Monsoon irregularity, where appropriate data and definitions are available.

**Example feature inputs**
- Recent and forecast rainfall.
- Historical rainfall baseline.
- Temperature and heat duration.
- Soil moisture and its trend.
- Evapotranspiration indicators.
- NDVI/EVI trends.
- Crop type and growth stage.
- Soil type and irrigation availability.
- Location and season.

**Outputs**
- Risk category: Low, Moderate, High or Critical.
- Probability or calibrated risk score, where a probabilistic model is available.
- Prediction time horizon.
- Main contributing factors.
- Data freshness and completeness.
- Model version and uncertainty information.
- Recommended next action.

**Risk score policy**
- Do not label a heuristic score as a statistically calibrated probability.
- Document thresholds and their agronomic basis.
- Calibrate probabilities against independent validation data before presenting them as probabilities.
- Provide an “insufficient data” state when input coverage is inadequate.
- Do not imply certainty or guarantee that an event will occur.

### 5.7 Crop Yield Prediction

**Purpose:** Estimate potential crop production using relevant farm, crop and environmental data.

**Potential input features**
- Crop type and variety.
- Farm area.
- Sowing date and growth stage.
- Soil characteristics.
- Historical yield records.
- Rainfall and temperature history.
- Soil moisture.
- Vegetation-index trends.
- Irrigation information.
- Relevant regional or seasonal features.

**Outputs**
- Estimated yield per hectare.
- Estimated total production.
- Comparison with a clearly defined baseline.
- Main factors influencing the estimate.
- Prediction interval or uncertainty range.
- Model version and date of prediction.

**Important**
- Yield models require representative historical yield labels.
- Do not train or evaluate using information that would not have been available at prediction time.
- Split training and test data by time and, where possible, by geography to reduce data leakage.
- Clearly label estimates as experimental until validated for the target crop and region.

### 5.8 Mitigation Recommendation Engine

**Purpose:** Convert validated risk outputs into practical, understandable actions.

| Detected condition | Example recommendation |
|---|---|
| Drought risk | Review irrigation availability, prioritize water use and consider soil-moisture conservation |
| Excess rainfall risk | Check drainage, clear safe drainage channels and protect stored inputs |
| Heat stress risk | Follow crop-specific heat management and irrigation guidance |
| Low soil moisture | Verify sensor readings and assess irrigation need |
| Heavy rain near harvest | Review crop maturity and local advisory before changing harvest plans |
| Vegetation stress | Inspect affected field zones and consult an agronomist |

**Rules**
- Recommendations must consider crop, growth stage, local conditions and available resources.
- Avoid unsafe or overly prescriptive chemical, fertilizer or irrigation advice.
- Show the reason behind each recommendation.
- Include a disclaimer that recommendations support, but do not replace, qualified local agricultural advice.

### 5.9 Interactive Agricultural Map

**Features**
- Interactive map with farm boundaries.
- Satellite basemap or imagery layer.
- NDVI and other supported index layers.
- Rainfall and temperature overlays where spatial data is available.
- Soil sensor locations.
- Climate-risk zones.
- Select a farm or map location to open its analysis.
- Legend, layer controls, scale and observation date.

### 5.10 Alerts and Notifications

**Alert types**
- Drought-risk increase.
- Heavy-rainfall warning.
- Heat-stress warning.
- Low soil moisture.
- Sensor offline or stale data.
- Satellite observation available.
- New yield estimate or risk report.

**Channels**
- In-app notifications for MVP.
- Email as a later integration.
- SMS or WhatsApp only after provider setup, consent and cost review.

**Alert requirements**
- Avoid repeated alerts for the same unchanged condition.
- Store alert creation and read status.
- Include farm, time, source and recommended action.
- Distinguish official weather warnings from model-generated risk alerts.

### 5.11 Reports

- Generate a farm analysis report.
- Include selected location and crop details.
- Include data sources and observation dates.
- Include satellite indices and charts where available.
- Include weather and soil summaries.
- Include climate-risk outputs and uncertainty.
- Include yield estimate and assumptions.
- Include recommendations.
- Allow export to PDF.

---

## 6. End-to-End System Workflow

1. User registers and signs in.
2. User creates a farm and defines its boundary.
3. User adds crop, sowing date, soil and irrigation details.
4. Backend validates the farm geometry and metadata.
5. Data services retrieve available satellite, weather and historical climate data.
6. IoT service receives soil sensor readings, if connected.
7. Processing services clean, align and validate the data.
8. Satellite processing calculates supported vegetation indices.
9. Climate models estimate selected risk indicators.
10. Yield model estimates crop production when sufficient inputs exist.
11. Recommendation engine maps risks to relevant actions.
12. Dashboard displays results, data freshness and uncertainty.
13. Notification service sends alerts based on configured rules.
14. User can review or export a report.

### High-level architecture

```text
                 FARMER / AGRONOMIST
                          |
                    React Frontend
                          |
                    FastAPI Backend
                          |
       +------------------+-------------------+
       |                  |                   |
   Farm & User        Data Integration    Notification
   Management             Layer             Service
       |                  |
   PostgreSQL /      +----+---------+----------------+
   PostGIS           |              |                |
                 Satellite       Weather          IoT Soil
                  Sources         Sources          Sensors
                     |              |                |
                 Geospatial     Climate Data     Sensor API
                 Processing     Processing       & Validation
                     |              |                |
                     +--------------+----------------+
                                    |
                             Feature Pipeline
                                    |
                         +----------+----------+
                         |                     |
                   Climate Risk          Crop Yield
                     Models                Model
                         |                     |
                         +----------+----------+
                                    |
                         Recommendation Engine
                                    |
                         Dashboard / Reports
```

---

## 7. Recommended Technology Stack

### Frontend
- React.js.
- TypeScript.
- Tailwind CSS.
- Leaflet or MapLibre GL JS.
- Recharts or another charting library.

### Backend
- Python.
- FastAPI.
- REST APIs.
- MQTT integration for IoT where required.
- Background task processing for longer satellite and ML jobs.

### AI, Machine Learning and Geospatial Processing
- Python.
- Pandas and NumPy.
- Scikit-learn.
- XGBoost.
- Rasterio.
- GeoPandas.
- Shapely.
- PyTorch for advanced image modelling, if justified by data and project scope.

### Database and Storage
- PostgreSQL.
- PostGIS for spatial data.
- Object storage for raster imagery and generated reports.
- Optional Redis for caching or background task coordination.

### Deployment
- Vercel or equivalent for frontend.
- Render, Railway or a suitable cloud service for backend.
- Docker for reproducible services.
- Managed PostgreSQL/PostGIS or self-hosted equivalent.

**Architecture recommendation:** Use React + FastAPI + PostgreSQL/PostGIS + Python ML as the primary stack. A single Python backend simplifies geospatial processing and machine-learning integration.

---

## 8. External Data Sources

| Provider | Potential data | Use |
|---|---|---|
| Copernicus Data Space | Sentinel-2 imagery | Vegetation and land monitoring |
| ISRO Bhuvan | Indian geospatial and thematic resources | Mapping and regional context |
| ISRO Bhoonidhi | Earth-observation datasets | Historical satellite data |
| IMD | Weather, rainfall, warnings and agrometeorological information | Indian climate monitoring |
| NASA POWER | Historical meteorological and solar parameters | Climate features |
| Open-Meteo | Forecast and historical weather endpoints | Weather analysis and prototyping |

### Integration requirements

- Review API documentation, registration requirements, quotas and licensing before implementation.
- Store provider credentials only in environment variables.
- Record source, retrieval time, observation time, units and processing version.
- Cache data where provider terms permit.
- Handle rate limits, unavailable services and incomplete responses.
- Do not assume all providers expose the same spatial resolution or temporal coverage.
- Provide a source-status indicator in the application.

---

## 9. AI and Machine-Learning Architecture

Do not use one model for every task. Treat each prediction task as a separate, testable component.

| Task | Initial approach | Possible later approach |
|---|---|---|
| Drought risk | Rule-based baseline and XGBoost | Calibrated probabilistic time-series model |
| Rainfall anomaly | Statistical anomaly detection | Seasonal forecasting model |
| Heat stress | Crop-specific thresholds and XGBoost | Crop-stage-aware predictive model |
| Yield prediction | Random Forest / XGBoost | Crop-specific ensemble or deep learning |
| Vegetation monitoring | NDVI/EVI trend analysis | CNN or temporal satellite model |
| Recommendations | Agronomic rules | Rules plus LLM-generated explanations |

### Model development stages

**Stage 1 – Baseline**
- Define transparent thresholds.
- Implement rainfall anomaly and soil-moisture indicators.
- Clearly label outputs as rule-based indicators.

**Stage 2 – Machine learning**
- Collect suitable historical datasets.
- Define target labels.
- Clean and engineer features.
- Train baseline models.
- Compare models using suitable metrics.

**Stage 3 – Validation and calibration**
- Use time-aware train/validation/test splits.
- Evaluate across locations and seasons.
- Check for data leakage.
- Calibrate probability outputs if they will be displayed as probabilities.
- Report limitations and uncertainty.

**Stage 4 – Advanced modelling**
- Add satellite time-series features.
- Evaluate image models only when enough labelled data exists.
- Monitor model drift and retrain when justified.

**Stage 5 – AI explanation assistant**
- Optionally integrate Gemini or another LLM.
- Supply only verified model outputs and relevant source context.
- Require the assistant to explain, not invent, predictions.
- Do not allow the LLM to fabricate rainfall forecasts, sensor readings or yield figures.

### Model evaluation

Select metrics according to the task:

- Classification: precision, recall, F1-score, ROC-AUC and PR-AUC where appropriate.
- Probability quality: Brier score and calibration analysis.
- Regression: MAE, RMSE and R².
- Forecasting: suitable time-series errors and comparison against baseline forecasts.

Always compare the ML model with a simple baseline. A complex model should not be used unless it provides measurable improvement.

---

## 10. Database Design

Recommended PostgreSQL/PostGIS tables:

| Table | Example fields |
|---|---|
| users | user_id, name, email, password_hash, role, created_at |
| farms | farm_id, user_id, name, boundary, area, soil_type, irrigation_type |
| crops | crop_id, farm_id, crop_type, variety, sowing_date, growth_stage |
| sensor_devices | device_id, farm_id, device_type, status, last_seen |
| soil_readings | reading_id, device_id, moisture, temperature, ph, ec, timestamp |
| weather_data | weather_id, farm_id, rainfall, temperature, humidity, source, observed_at |
| satellite_observations | observation_id, farm_id, source, image_date, cloud_cover, asset_reference |
| vegetation_indices | index_id, observation_id, index_type, value, geometry_reference |
| climate_risks | risk_id, farm_id, risk_type, score, category, horizon, model_version, created_at |
| yield_predictions | prediction_id, farm_id, crop_id, estimated_yield, lower_bound, upper_bound, model_version |
| recommendations | recommendation_id, farm_id, risk_id, action, rationale, created_at |
| notifications | notification_id, user_id, farm_id, message, status, created_at |
| analysis_jobs | job_id, farm_id, status, started_at, completed_at, error_message |

Use spatial indexes for farm geometry and other spatial queries. Store large raster files in object storage rather than directly in ordinary relational columns.

---

## 11. Backend API Structure

Suggested REST endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/users/me` | Get current user |
| POST | `/api/farms` | Create farm |
| GET | `/api/farms` | List user's farms |
| GET | `/api/farms/{farm_id}` | Get farm details |
| PATCH | `/api/farms/{farm_id}` | Update farm |
| DELETE | `/api/farms/{farm_id}` | Delete farm |
| POST | `/api/farms/{farm_id}/analyze` | Start analysis job |
| GET | `/api/farms/{farm_id}/satellite` | Get satellite observations |
| GET | `/api/farms/{farm_id}/weather` | Get weather information |
| GET | `/api/farms/{farm_id}/soil` | Get soil readings |
| GET | `/api/farms/{farm_id}/risks` | Get climate risks |
| GET | `/api/farms/{farm_id}/yield` | Get yield predictions |
| GET | `/api/farms/{farm_id}/recommendations` | Get recommendations |
| POST | `/api/sensors/data` | Receive authenticated sensor readings |
| GET | `/api/notifications` | List notifications |
| GET | `/api/reports/{farm_id}` | Generate or retrieve report |

All endpoints must validate authorization, input types, farm ownership and response schemas.

---

## 12. User Interface and Pages

1. **Landing page:** Project overview, benefits and sign-in actions.
2. **Login/Register:** Secure account access.
3. **Dashboard:** Farm summaries, latest risks and recent alerts.
4. **Farm management:** Create, edit and select farms.
5. **Farm detail:** Crop, location, soil and irrigation details.
6. **Satellite intelligence:** Imagery, vegetation indices and time comparison.
7. **Climate monitoring:** Forecasts, historical trends and rainfall anomalies.
8. **Soil monitoring:** Sensor readings, charts and device status.
9. **Risk prediction:** Risk categories, scores, explanations and data freshness.
10. **Yield prediction:** Estimated production, uncertainty and contributing factors.
11. **Recommendations:** Prioritized mitigation actions.
12. **Notifications:** Alert history and read status.
13. **Reports:** Downloadable analysis reports.
14. **Settings:** Profile, preferences and connected devices.

### Dashboard information hierarchy

- Selected farm and crop.
- Last updated timestamp.
- Data availability and source status.
- Climate-risk summary.
- Satellite vegetation summary.
- Soil condition summary.
- Yield estimate and uncertainty.
- Recommended actions.
- Recent alerts.

The interface should be responsive, accessible and clear to non-technical users. Use a clean agriculture-inspired visual system without making risk indicators depend on color alone.

---

## 13. Non-Functional Requirements

| Requirement | Description |
|---|---|
| Performance | Load common dashboard views efficiently and process heavy jobs asynchronously |
| Scalability | Support more users, farms and datasets over time |
| Security | Protect accounts, farm data and API credentials |
| Reliability | Handle missing data and provider outages gracefully |
| Accuracy | Evaluate models using independent test data |
| Responsiveness | Support desktop, tablet and mobile |
| Data integrity | Validate units, timestamps, coordinates and sensor readings |
| Maintainability | Separate frontend, backend, data and ML components |
| Explainability | Show factors behind risk and yield outputs |
| Observability | Log failures, job status, provider health and model versions |

---

## 14. Security and Privacy

- Hash passwords using a modern password-hashing algorithm.
- Use secure authentication and authorization.
- Enforce ownership checks for every farm resource.
- Validate and sanitize user input.
- Keep API keys and secrets in environment variables or a secrets manager.
- Use HTTPS in production.
- Apply rate limits to public and sensitive endpoints.
- Authenticate sensor devices and prevent unauthorized data injection.
- Avoid exposing exact farm locations publicly.
- Define data retention and deletion policies.
- Follow data-provider licensing and usage terms.
- Collect only the personal information needed for the service.

---

## 15. MVP Scope

Build a limited but functional first version before attempting the complete platform.

### Recommended initial scope

| Component | MVP choice |
|---|---|
| Geography | One district or a small pilot region |
| Crops | One to three crops, selected based on data availability |
| Satellite | Sentinel-2 |
| Weather | One reliable forecast source plus historical data |
| Soil | Simulated sensor readings initially, clearly labelled |
| Map | Farm boundary drawing and map display |
| Vegetation | NDVI calculation and time comparison |
| Risk | Drought and excess-rainfall indicators |
| Yield | Basic model only if suitable labelled data exists |
| Recommendations | Transparent rule-based actions |
| Alerts | In-app notifications |

### MVP acceptance criteria

- User can register and sign in.
- User can create a farm and save its boundary.
- User can associate a crop with the farm.
- System can retrieve weather data for supported locations.
- System can retrieve a suitable satellite observation where available.
- System can calculate and display NDVI when required bands are available.
- System can generate at least one documented climate-risk indicator.
- Missing or stale data is clearly identified.
- Recommendations are linked to the detected condition.
- Dashboard works on desktop and mobile.
- No mock value is presented as a real measurement or prediction.

---

## 16. Development Roadmap

### Phase 1 – Foundation
- Set up repository and development environment.
- Create React frontend and FastAPI backend.
- Configure PostgreSQL/PostGIS.
- Implement authentication.
- Implement farm CRUD operations.
- Add map and farm boundary selection.

### Phase 2 – Data integration
- Integrate one weather provider.
- Integrate Copernicus data discovery and retrieval.
- Process farm geometry.
- Store metadata and source timestamps.
- Implement data validation and caching.

### Phase 3 – Satellite and climate analysis
- Implement cloud filtering where possible.
- Calculate NDVI.
- Display satellite and index layers.
- Add historical rainfall and temperature charts.
- Implement transparent drought and rainfall-anomaly baselines.

### Phase 4 – Soil and IoT
- Define sensor payload format.
- Implement authenticated ingestion endpoint.
- Add device registration and status.
- Display soil readings.
- Add simulated sensor mode for development.

### Phase 5 – Machine learning
- Identify suitable regional datasets and target labels.
- Build feature pipeline.
- Train and evaluate climate-risk models.
- Add yield modelling only when sufficient data exists.
- Version models and record evaluation results.

### Phase 6 – Recommendations and alerts
- Implement crop-aware rules.
- Add explanations and evidence references.
- Add in-app notifications.
- Prevent duplicate alert spam.

### Phase 7 – Testing and deployment
- Test APIs, permissions and data validation.
- Test with multiple farm geometries.
- Validate model performance.
- Test provider failures and missing data.
- Deploy frontend, backend and database.
- Document setup and operational procedures.

---

## 17. Suggested Project Folder Structure

```text
climate-yield-engine/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── dashboard/
│   │   ├── maps/
│   │   ├── charts/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   ├── integrations/
│   │   ├── workers/
│   │   └── main.py
│   └── requirements.txt
│
├── ml-engine/
│   ├── datasets/
│   ├── preprocessing/
│   ├── satellite/
│   ├── climate/
│   ├── drought/
│   ├── yield/
│   ├── training/
│   ├── evaluation/
│   └── saved_models/
│
├── iot/
│   ├── sensor_firmware/
│   └── gateway/
│
├── documentation/
│   ├── architecture.md
│   ├── api-documentation.md
│   ├── database-schema.md
│   └── model-documentation.md
│
├── tests/
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 18. Testing Strategy

### Frontend tests
- Authentication flows.
- Farm creation and editing.
- Map boundary interactions.
- Dashboard rendering with missing data.
- Responsive layouts.

### Backend tests
- Authentication and authorization.
- Farm ownership checks.
- Geometry validation.
- API input validation.
- Provider timeout and failure handling.
- Sensor payload validation.

### Data and ML tests
- Unit and timestamp consistency.
- Missing-data handling.
- Satellite band alignment and masking.
- Feature pipeline reproducibility.
- Time-based model evaluation.
- Geographic generalization checks.
- Model performance and calibration.
- Prediction output range and uncertainty checks.

### End-to-end tests
- Register → create farm → add crop → retrieve data → run analysis → view risks → view recommendations → export report.

---

## 19. Risks, Constraints and Technical Challenges

| Challenge | Mitigation |
|---|---|
| Cloudy satellite images | Cloud masking and alternate observation dates |
| Satellite resolution too coarse | Communicate resolution and avoid unsupported field-level claims |
| Missing sensor data | Validate readings and show stale/missing status |
| Limited yield labels | Restrict yield scope and seek regional ground-truth data |
| Different soil and crop conditions | Include relevant features and validate by region/crop |
| Provider outages or rate limits | Caching, retries and graceful fallback |
| Model uncertainty | Display intervals, confidence limitations and data coverage |
| Data leakage | Use time-aware and geographic validation |
| Misleading recommendations | Use documented agronomic rules and expert review |

### Scientific and product limitations

- A precise farm polygon does not guarantee that every satellite pixel represents only that farm.
- Satellite vegetation indices are indirect indicators and cannot independently diagnose all crop problems.
- Weather forecasts become less certain at longer lead times.
- Climate risk, weather forecasting and crop-yield estimation are separate tasks.
- Model outputs must be validated for the crop, season and geography where they are used.
- The platform is a decision-support tool, not a guarantee of weather outcomes or harvest yield.

---

## 20. Future Enhancements

- Drone imagery integration.
- Crop disease and pest monitoring.
- Soil nutrient analysis.
- Irrigation scheduling.
- Voice-based agricultural assistant.
- Regional climate-risk maps.
- Additional government agricultural advisory integrations.
- More crops and regions.
- Mobile application.
- Multilingual farmer support.
- Crop insurance risk analysis.
- Estimated financial loss and recovery planning.
- Farm-level historical performance tracking.

---

## 21. Project Success Criteria

The project is successful when:

1. Users can securely create and manage farms.
2. Farm boundaries are stored and queried correctly.
3. Supported satellite imagery can be retrieved and analyzed.
4. Vegetation indices are calculated correctly from appropriate data.
5. Weather observations and forecasts show their source and timestamp.
6. At least one climate-risk model or transparent baseline is evaluated.
7. Yield estimates are produced only where suitable data supports them.
8. Predictions communicate uncertainty and limitations.
9. Recommendations are connected to crop and risk context.
10. Users can view maps, charts, alerts and reports.
11. The system handles unavailable data without inventing results.

---

## 22. Final Product Identity

**Name:** Predictive Climate & Micro-Location Yield Engine

**Tagline:** Turning satellite intelligence and environmental data into actionable agricultural decisions.

**Main innovation:** Field-level climate intelligence that connects satellite observations, soil conditions and weather patterns to crop-specific risk assessment, yield estimation and preventive recommendations.

**Core technologies:** React, TypeScript, Python, FastAPI, PostgreSQL, PostGIS, satellite imagery, IoT and machine learning.

---

## 23. Codex / AI Coding Agent Instructions

Treat this document as the **Single Source of Truth (SSOT)** for implementation.

You are an expert full-stack developer, geospatial engineer and machine-learning engineer. Build the application according to this specification.

### Mandatory development rules

1. Read and analyze the complete specification before coding.
2. Do not silently remove or change core requirements.
3. Build modular, maintainable and testable components.
4. Implement backend APIs and data contracts before connecting dependent frontend features.
5. Use real external data when access is configured and available.
6. Never present mock satellite imagery, weather, sensor readings or predictions as real.
7. Clearly label all mock and simulated data.
8. Keep secrets in environment variables; provide `.env.example`.
9. Handle missing data, provider errors, timeouts and rate limits.
10. Keep satellite processing, climate-risk prediction and yield prediction as separate modules.
11. Record data source, timestamps, units and model versions.
12. Do not claim model accuracy without evaluation results.
13. Do not present heuristic scores as calibrated probabilities.
14. Add tests and update documentation as each phase is completed.
15. Do not implement advanced features at the expense of a working MVP.

### Required workflow

**Step 1:** Analyze requirements and identify dependencies.  
**Step 2:** Produce architecture, database schema and implementation plan.  
**Step 3:** Set up repository, frontend, backend and database.  
**Step 4:** Implement authentication, farm management and map selection.  
**Step 5:** Integrate weather and satellite data.  
**Step 6:** Implement geospatial processing and vegetation indices.  
**Step 7:** Implement soil sensor ingestion.  
**Step 8:** Build and evaluate climate-risk models.  
**Step 9:** Implement yield estimation when suitable data is available.  
**Step 10:** Implement recommendations, alerts and reports.  
**Step 11:** Complete integration, security and end-to-end testing.  
**Step 12:** Prepare deployment and setup documentation.

### Phase completion rule

After each phase:
- Run relevant tests.
- Verify the feature works.
- Fix errors before moving forward.
- Update documentation.
- List completed work, known limitations and next steps.

### Final requirement

The final product must be a functional AI-powered agricultural climate intelligence platform, not merely a static dashboard or UI prototype. Every displayed result must be traceable to real data, a documented calculation, or clearly labelled demonstration data.
