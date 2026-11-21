import React from 'react';
import { Satellite, Eye, Layers, Info, ShieldAlert } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { SatelliteSummary } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

interface SatellitePageProps {
  satellite: SatelliteSummary | null;
}

export const SatellitePage: React.FC<SatellitePageProps> = ({ satellite }) => {
  if (!satellite) {
    return <div className="p-8 text-center text-slate-400">Loading satellite intelligence...</div>;
  }

  const latest = satellite.latest_indices;
  const obs = satellite.latest_observation;

  const chartData = satellite.indices_history.map((idx) => ({
    date: idx.recorded_date.slice(5),
    NDVI: idx.ndvi,
    EVI: idx.evi,
    SAVI: idx.savi,
    NDWI: idx.ndwi
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Copernicus Sentinel-2 Satellite Intelligence</h2>
          <p className="text-xs text-slate-400 mt-0.5">Multispectral vegetation indices, canopy vigor, and moisture tracking</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Provenance: <strong className="text-emerald-400">{satellite.data_provenance}</strong>
        </div>
      </div>

      {/* Index Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="NDVI (Vigor)"
          value={latest ? latest.ndvi.toFixed(3) : '0.680'}
          subtitle="Normalized Difference Veg Index"
          icon={<Satellite className="w-5 h-5" />}
          badge={<StatusBadge status={latest?.vigor_category || 'Good'} size="sm" />}
          alertLevel="success"
        />

        <MetricCard
          title="EVI (Biomass)"
          value={latest ? latest.evi.toFixed(3) : '0.540'}
          subtitle="Enhanced Vegetation Index"
          icon={<Layers className="w-5 h-5" />}
        />

        <MetricCard
          title="SAVI (Soil-Adjusted)"
          value={latest ? latest.savi.toFixed(3) : '0.490'}
          subtitle="Corrects for soil background"
          icon={<Eye className="w-5 h-5" />}
        />

        <MetricCard
          title="NDWI (Canopy Water)"
          value={latest ? latest.ndwi.toFixed(3) : '-0.210'}
          subtitle="Water balance & moisture index"
          icon={<Info className="w-5 h-5" />}
        />
      </div>

      {/* NDVI & Index Trajectory Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Multispectral Index Evolution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sentinel-2 5-day revisit acquisitions over the active growth season</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span>NDVI</span>
            </span>
            <span className="flex items-center space-x-1 text-teal-400">
              <span className="w-3 h-0.5 bg-teal-400 inline-block" />
              <span>EVI</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span>SAVI</span>
            </span>
            <span className="flex items-center space-x-1 text-blue-400">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" />
              <span>NDWI</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[-0.4, 1.0]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey="NDVI" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="NDVI" />
              <Line type="monotone" dataKey="EVI" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="EVI" />
              <Line type="monotone" dataKey="SAVI" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="SAVI" />
              <Line type="monotone" dataKey="NDWI" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 3 }} name="NDWI" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentinel-2 Spectral Reflectance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Latest Sentinel-2 Surface Reflectance Bands</h3>
        
        {obs && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-center">
              <span className="text-[10px] font-mono text-blue-400 uppercase">B02 Blue (490nm)</span>
              <div className="text-base font-bold text-white mt-1">{obs.band_b02_blue?.toFixed(3) || '0.045'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase">B03 Green (560nm)</span>
              <div className="text-base font-bold text-white mt-1">{obs.band_b03_green?.toFixed(3) || '0.095'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-center">
              <span className="text-[10px] font-mono text-rose-400 uppercase">B04 Red (665nm)</span>
              <div className="text-base font-bold text-white mt-1">{obs.band_b04_red?.toFixed(3) || '0.052'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-center">
              <span className="text-[10px] font-mono text-purple-400 uppercase">B08 NIR (842nm)</span>
              <div className="text-base font-bold text-white mt-1">{obs.band_b08_nir?.toFixed(3) || '0.580'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase">B11 SWIR (1610nm)</span>
              <div className="text-base font-bold text-white mt-1">{obs.band_b11_swir?.toFixed(3) || '0.145'}</div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Agronomic Science Note:</strong> Satellite vegetation indices are indirect indicators of photosynthetic vigor and green canopy cover. They cannot independently diagnose specific pathogen strains or micronutrient deficiencies without ground truth verification.
          </p>
        </div>
      </div>
    </div>
  );
};
