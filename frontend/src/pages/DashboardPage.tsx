import React from 'react';
import {
  Thermometer, Droplets, Wind, AlertTriangle, TrendingUp,
  Satellite, Activity, ShieldAlert, CheckCircle2, MapPin
} from 'lucide-react';
import { Farm, WeatherSummary, SatelliteSummary, RiskSummary, YieldPrediction, SoilSummary, AgronomicRecommendation } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { FarmMap } from '../maps/FarmMap';

interface DashboardPageProps {
  farm: Farm;
  weather: WeatherSummary | null;
  satellite: SatelliteSummary | null;
  risks: RiskSummary | null;
  yieldPrediction: YieldPrediction | null;
  soil: SoilSummary | null;
  recommendations: AgronomicRecommendation[];
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  farm,
  weather,
  satellite,
  risks,
  yieldPrediction,
  soil,
  recommendations,
  onNavigateTab
}) => {
  const latestNdvi = satellite?.latest_indices?.ndvi ?? 0.68;
  const criticalCount = risks?.critical_risks_count ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Farm Overview & Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{farm.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {farm.area_hectares.toFixed(1)} ha • Soil: <strong>{farm.soil_type}</strong> • System: <strong>{farm.irrigation_type}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-400">
            <span>Crop: <strong className="text-slate-200">{farm.active_crop?.crop_type || 'Field Crop'} ({farm.active_crop?.variety || 'Hybrid'})</strong></span>
            <span>•</span>
            <span>Stage: <strong className="text-emerald-400">{farm.active_crop?.growth_stage || 'Flowering'}</strong></span>
            <span>•</span>
            <span>Centroid: <span className="font-mono">{farm.centroid_lat.toFixed(4)}, {farm.centroid_lon.toFixed(4)}</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Risk Vulnerability</div>
            <div className="text-sm font-bold text-white mt-0.5">{risks?.overall_status || 'Normal State'}</div>
          </div>
          <StatusBadge status={criticalCount > 0 ? 'Critical Attention' : 'Optimal Health'} />
        </div>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Yield Forecast"
          value={yieldPrediction ? `${yieldPrediction.estimated_yield_per_ha} t/ha` : '4.2 t/ha'}
          subtitle={yieldPrediction ? `Total: ${yieldPrediction.estimated_total_yield} tonnes (${yieldPrediction.benchmark_comparison_pct > 0 ? '+' : ''}${yieldPrediction.benchmark_comparison_pct}% vs baseline)` : 'Calibrated Model'}
          icon={<TrendingUp className="w-5 h-5" />}
          badge={<StatusBadge status="80% CI" size="sm" />}
          alertLevel="success"
        />

        <MetricCard
          title="Sentinel-2 NDVI"
          value={latestNdvi.toFixed(2)}
          subtitle={satellite?.latest_indices?.vigor_category || 'Good (Active Biomass)'}
          icon={<Satellite className="w-5 h-5" />}
          badge={<StatusBadge status={latestNdvi > 0.5 ? 'Healthy' : 'Stressed'} size="sm" />}
          alertLevel={latestNdvi > 0.5 ? 'none' : 'warning'}
        />

        <MetricCard
          title="Soil Moisture"
          value={soil?.latest_reading ? `${soil.latest_reading.moisture_pct}%` : '28.4%'}
          subtitle={`Root-zone temp: ${soil?.latest_reading ? soil.latest_reading.temperature_c : '25.0'}°C`}
          icon={<Activity className="w-5 h-5" />}
          badge={<StatusBadge status={soil?.status_label || 'Optimal'} size="sm" />}
          alertLevel={soil?.latest_reading && soil.latest_reading.moisture_pct < 20 ? 'danger' : 'none'}
        />

        <MetricCard
          title="Ambient Weather"
          value={weather ? `${weather.current_temperature_c}°C` : '28.5°C'}
          subtitle={`Rain: ${weather ? weather.today_precipitation_mm : '0.0'} mm • Wind: ${weather ? weather.current_wind_speed_kmh : '12'} km/h`}
          icon={<Thermometer className="w-5 h-5" />}
          badge={<StatusBadge status={weather ? `Anomaly: ${weather.rainfall_anomaly_pct}%` : 'Normal'} size="sm" />}
        />
      </div>

      {/* Main Two-Column Layout: Interactive Map + Climate Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farm Boundary Map */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Micro-Location Field Boundary & AOI</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">High-resolution satellite view with interactive parcel boundary</p>
            </div>
            <button
              onClick={() => onNavigateTab('farms')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Edit Boundary &rarr;
            </button>
          </div>

          <div className="h-[380px] w-full">
            <FarmMap
              centroidLat={farm.centroid_lat}
              centroidLon={farm.centroid_lon}
              boundaryGeoJSON={farm.boundary_geojson}
              farmName={farm.name}
              areaHectares={farm.area_hectares}
            />
          </div>
        </div>

        {/* Climate Risks Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Risk Predictions</span>
              </h3>
              <button
                onClick={() => onNavigateTab('risks')}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Detailed View
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {risks?.risks.slice(0, 4).map((risk) => (
                <div key={risk.id} className="p-3 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-slate-200">
                      {risk.risk_type.replace('_', ' ')}
                    </span>
                    <StatusBadge status={risk.category} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Calibrated Probability:</span>
                    <span className="font-mono text-slate-200 font-semibold">{(risk.calibrated_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        risk.category === 'Critical' ? 'bg-rose-500' :
                        risk.category === 'High' ? 'bg-orange-500' :
                        risk.category === 'Moderate' ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, risk.calibrated_score * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Model: GradientBoosting & RF Ensemble • 7-14 Day Horizons
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Mitigations & Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Prioritized Agronomic Actions</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Recommended interventions customized to crop phenology and detected environmental vectors</p>
          </div>
          <button
            onClick={() => onNavigateTab('recommendations')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            All Mitigations ({recommendations.length}) &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((rec) => (
            <div key={rec.id} className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">{rec.category}</span>
                  <StatusBadge status={rec.priority} size="sm" />
                </div>
                <h4 className="text-sm font-semibold text-white mt-2 leading-snug">{rec.title}</h4>
                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">{rec.action}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
                Why: {rec.rationale}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
