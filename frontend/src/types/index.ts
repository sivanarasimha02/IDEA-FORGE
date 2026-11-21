export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone_number?: string;
  created_at: string;
}

export interface GeoJSONPolygon {
  type: string;
  coordinates: number[][][]; // [[[lon, lat], ...]]
}

export interface Crop {
  id: string;
  farm_id: string;
  crop_type: string;
  variety?: string;
  sowing_date: string;
  expected_harvest_date?: string;
  growth_stage: string;
  irrigation_method?: string;
  historical_yield_per_ha?: number;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  boundary_geojson: string;
  centroid_lat: number;
  centroid_lon: number;
  area_hectares: number;
  soil_type: string;
  irrigation_type: string;
  created_at: string;
  updated_at: string;
  active_crop?: Crop;
}

export interface WeatherObservation {
  id: string;
  farm_id: string;
  observed_date: string;
  temperature_max: number;
  temperature_min: number;
  temperature_mean: number;
  precipitation_mm: number;
  relative_humidity_pct: number;
  wind_speed_kmh: number;
  solar_radiation_mj?: number;
  et0_mm?: number;
  is_forecast: boolean;
  data_source: string;
}

export interface WeatherSummary {
  farm_id: string;
  current_temperature_c: number;
  current_humidity_pct: number;
  current_wind_speed_kmh: number;
  rain_probability_pct: number;
  today_precipitation_mm: number;
  forecast_7days: WeatherObservation[];
  historical_30days: WeatherObservation[];
  rainfall_anomaly_pct: number;
  baseline_period: string;
  data_source: string;
  last_updated: string;
}

export interface VegetationIndex {
  id: string;
  farm_id: string;
  recorded_date: string;
  ndvi: number;
  evi: number;
  savi: number;
  ndwi: number;
  vigor_category: string;
  anomaly_vs_baseline?: number;
}

export interface SatelliteObservation {
  id: string;
  farm_id: string;
  platform: string;
  acquisition_date: string;
  cloud_cover_pct: number;
  band_b02_blue?: number;
  band_b03_green?: number;
  band_b04_red?: number;
  band_b08_nir?: number;
  band_b11_swir?: number;
  is_simulated: boolean;
  data_source: string;
}

export interface SatelliteSummary {
  farm_id: string;
  latest_observation?: SatelliteObservation;
  latest_indices?: VegetationIndex;
  indices_history: VegetationIndex[];
  cloud_cover_status: string;
  data_provenance: string;
  observation_count: number;
}

export interface RiskFactor {
  name: string;
  impact: string;
  detail: string;
  value?: string;
}

export interface ClimateRisk {
  id: string;
  farm_id: string;
  risk_type: string;
  category: "Low" | "Moderate" | "High" | "Critical";
  calibrated_score: number;
  horizon_days: number;
  contributing_factors: RiskFactor[];
  uncertainty_pct: number;
  model_version: string;
  created_at: string;
}

export interface RiskSummary {
  farm_id: string;
  overall_status: string;
  critical_risks_count: number;
  risks: ClimateRisk[];
  evaluated_at: string;
  data_freshness_status: string;
}

export interface YieldFactor {
  feature: string;
  contribution: number;
  description: string;
}

export interface YieldPrediction {
  id: string;
  farm_id: string;
  crop_id: string;
  crop_type?: string;
  estimated_yield_per_ha: number;
  estimated_total_yield: number;
  lower_bound_80: number;
  upper_bound_80: number;
  benchmark_comparison_pct: number;
  influencing_factors: YieldFactor[];
  model_version: string;
  created_at: string;
  data_quality_indicator: string;
}

export interface AgronomicRecommendation {
  id: string;
  farm_id: string;
  risk_id?: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  title: string;
  action: string;
  rationale: string;
  disclaimer: string;
  created_at: string;
}

export interface SensorDevice {
  id: string;
  farm_id: string;
  device_name: string;
  status: string;
  battery_level?: number;
  last_seen?: string;
  created_at: string;
  api_token?: string;
}

export interface SoilReading {
  id: string;
  device_id: string;
  farm_id: string;
  moisture_pct: number;
  temperature_c: number;
  ph?: number;
  ec_ds_m?: number;
  is_simulated: boolean;
  data_source: string;
  recorded_at: string;
}

export interface SoilSummary {
  device: SensorDevice;
  latest_reading?: SoilReading;
  recent_readings: SoilReading[];
  status_label: string;
  soil_type: string;
}

export interface Notification {
  id: string;
  user_id: string;
  farm_id?: string;
  severity: "info" | "warning" | "danger" | "success";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface FarmReport {
  generated_at: string;
  farm: Farm;
  weather_summary: WeatherSummary;
  satellite_summary: SatelliteSummary;
  climate_risks: ClimateRisk[];
  yield_prediction?: YieldPrediction;
  recommendations: AgronomicRecommendation[];
  disclaimer: string;
  export_format: string;
}
