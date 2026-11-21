import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { FarmReport } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ReportsPageProps {
  farmId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ farmId }) => {
  const [report, setReport] = useState<FarmReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [farmId]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReport(farmId);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !report) {
    return <div className="p-8 text-center text-slate-400">Compiling comprehensive farm dossier...</div>;
  }

  const { farm, weather_summary, satellite_summary, climate_risks, yield_prediction, recommendations } = report;

  return (
    <div className="space-y-6">
      {/* Header with Print action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Farm Intelligence & Climate Assessment Report</h2>
          <p className="text-xs text-slate-400 mt-0.5">Comprehensive dossier exportable for agronomists, farm managers, and lenders</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Report Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-6 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/40 print:text-emerald-800 print:bg-emerald-100">
              Official Agrometeorological Intelligence Dossier
            </span>
            <h1 className="text-2xl font-black text-white print:text-black mt-3">{farm.name}</h1>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Field Centroid: {farm.centroid_lat.toFixed(4)} N, {farm.centroid_lon.toFixed(4)} E • Area: {farm.area_hectares.toFixed(1)} ha
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-slate-600 font-mono">
            <div>Report Date: {report.generated_at.slice(0, 10)}</div>
            <div>Ref ID: {farm.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* Section 1: Farm & Crop Profile */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold">
            1. Agricultural Setting & Crop Specification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-850 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Crop Species</span>
              <strong className="text-white print:text-black text-sm">{farm.active_crop?.crop_type || 'Wheat'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Growth Stage</span>
              <strong className="text-white print:text-black text-sm">{farm.active_crop?.growth_stage || 'Flowering'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Soil Type</span>
              <strong className="text-white print:text-black text-sm">{farm.soil_type}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Irrigation</span>
              <strong className="text-white print:text-black text-sm">{farm.irrigation_type}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Satellite Intelligence */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold">
            2. Copernicus Sentinel-2 Satellite Vegetation Analysis
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-850 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">NDVI Vigor</span>
              <strong className="text-emerald-400 print:text-emerald-700 text-base font-mono">
                {satellite_summary.latest_indices?.ndvi.toFixed(3) || '0.680'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">EVI Index</span>
              <strong className="text-teal-400 print:text-teal-700 text-base font-mono">
                {satellite_summary.latest_indices?.evi.toFixed(3) || '0.540'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Canopy Water (NDWI)</span>
              <strong className="text-blue-400 print:text-blue-700 text-base font-mono">
                {satellite_summary.latest_indices?.ndwi.toFixed(3) || '-0.210'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Observation Status</span>
              <strong className="text-white print:text-black text-xs">
                {satellite_summary.cloud_cover_status}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 3: Weather & 30-Day Precipitation Baseline */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold">
            3. Meteorological Indicators & Precipitation Baseline
          </h3>
          <div className="p-4 rounded-xl bg-slate-850 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs space-y-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Current Temperature</span>
                <strong className="text-white print:text-black">{weather_summary.current_temperature_c}°C</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Relative Humidity</span>
                <strong className="text-white print:text-black">{weather_summary.current_humidity_pct}%</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">30-Day Rain Anomaly</span>
                <strong className="text-emerald-400 print:text-emerald-700">
                  {weather_summary.rainfall_anomaly_pct > 0 ? '+' : ''}{weather_summary.rainfall_anomaly_pct}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Machine Learning Risk Assessment */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold">
            4. Climate Risk Prediction Matrix
          </h3>
          <div className="space-y-2">
            {climate_risks.map((risk) => (
              <div key={risk.id} className="p-3.5 rounded-xl bg-slate-850 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white print:text-black capitalize text-sm">{risk.risk_type.replace('_', ' ')}</span>
                  <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                    Horizon: {risk.horizon_days} Days • Model: {risk.model_version} • Uncertainty: ±{risk.uncertainty_pct}%
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-slate-200 print:text-black font-semibold">
                    {(risk.calibrated_score * 100).toFixed(1)}%
                  </span>
                  <StatusBadge status={risk.category} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Crop Yield Forecast */}
        {yield_prediction && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold">
              5. Crop Yield Estimation (Random Forest Regressor Ensemble)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-850 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Estimated Productivity</span>
                <strong className="text-emerald-400 print:text-emerald-700 text-xl font-bold">
                  {yield_prediction.estimated_yield_per_ha} t/ha
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Farm Production</span>
                <strong className="text-white print:text-black text-xl font-bold">
                  {yield_prediction.estimated_total_yield} tonnes
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">80% Confidence Interval</span>
                <strong className="text-slate-300 print:text-slate-700 text-base font-mono">
                  {yield_prediction.lower_bound_80} - {yield_prediction.upper_bound_80} t/ha
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Prioritized Agronomic Interventions */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 print:text-emerald-800 font-bold">
            6. Prescribed Mitigation Interventions
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl bg-slate-850 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <strong className="text-white print:text-black text-sm">{rec.title}</strong>
                  <StatusBadge status={rec.priority} size="sm" />
                </div>
                <p className="text-slate-300 print:text-slate-700">{rec.action}</p>
                <p className="text-[11px] text-slate-500 italic">Scientific Basis: {rec.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mandatory Regulatory Disclaimer */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-[11px] text-slate-500 print:text-slate-600 leading-relaxed space-y-1">
          <div className="font-semibold text-slate-400 print:text-slate-700">Advisory Disclaimer:</div>
          <p>{report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
