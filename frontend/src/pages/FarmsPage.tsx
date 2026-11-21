import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Check, RefreshCw } from 'lucide-react';
import { Farm } from '../types';
import { FarmMap } from '../maps/FarmMap';
import { api } from '../services/api';

interface FarmsPageProps {
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onFarmCreated: (farm: Farm) => void;
}

export const FarmsPage: React.FC<FarmsPageProps> = ({
  farms,
  selectedFarm,
  onSelectFarm,
  onFarmCreated
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [soilType, setSoilType] = useState('Black Cotton Clay Loam');
  const [irrigationType, setIrrigationType] = useState('Drip Irrigation');
  const [cropType, setCropType] = useState('Wheat');
  const [variety, setVariety] = useState('HD-2967');
  const [growthStage, setGrowthStage] = useState('Vegetative');

  // Interactive Polygon Drawing Points [lon, lat]
  const [drawnPoints, setDrawnPoints] = useState<number[][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddPoint = (pt: number[]) => {
    setDrawnPoints([...drawnPoints, pt]);
  };

  const handleClearPoints = () => {
    setDrawnPoints([]);
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (drawnPoints.length < 3) {
      setErrorMsg('Please click on the map to place at least 3 boundary vertices.');
      return;
    }

    // Close ring if not closed
    const ring = [...drawnPoints];
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push(ring[0]);
    }

    const payload = {
      name: farmName || 'New Micro-Location Plot',
      boundary: {
        type: 'Polygon',
        coordinates: [ring]
      },
      soil_type: soilType,
      irrigation_type: irrigationType,
      crop: {
        crop_type: cropType,
        variety: variety,
        sowing_date: new Date().toISOString().split('T')[0],
        growth_stage: growthStage,
        irrigation_method: irrigationType
      }
    };

    setIsSubmitting(true);
    try {
      const created = await api.createFarm(payload);
      onFarmCreated(created);
      setIsCreating(false);
      setDrawnPoints([]);
      setFarmName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save farm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Micro-Location Farm Management</h2>
          <p className="text-xs text-slate-400 mt-1">Register field boundaries using satellite imagery and configure crop parameters</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setDrawnPoints([]);
          }}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel Registration' : 'Register New Farm'}</span>
        </button>
      </div>

      {isCreating ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Draw Field Boundary & Specify Metadata</h3>
            <p className="text-xs text-slate-400 mt-1">Click points on the satellite map to trace the field perimeter.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map drawing pane */}
            <div className="lg:col-span-2 space-y-2">
              <div className="h-[460px] w-full">
                <FarmMap
                  centroidLat={12.52}
                  centroidLon={76.89}
                  isDrawingMode={true}
                  drawnPoints={drawnPoints}
                  onAddPoint={handleAddPoint}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Vertices Placed: <strong>{drawnPoints.length}</strong></span>
                <button
                  type="button"
                  onClick={handleClearPoints}
                  className="text-xs text-rose-400 hover:text-rose-300"
                >
                  Clear Boundary Points
                </button>
              </div>
            </div>

            {/* Farm form */}
            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Plot 2 - Wheat Field"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option>Black Cotton Clay Loam</option>
                    <option>Sandy Loam</option>
                    <option>Clay Loam</option>
                    <option>Alluvial Silt</option>
                    <option>Red Sandy Soil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Irrigation System</label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option>Drip Irrigation</option>
                    <option>Sprinkler</option>
                    <option>Canal / Flood</option>
                    <option>Rainfed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Crop Configuration</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Crop Species</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option>Wheat</option>
                    <option>Rice / Paddy</option>
                    <option>Maize</option>
                    <option>Cotton</option>
                    <option>Soybean</option>
                    <option>Pulses / Gram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Variety / Hybrid</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Growth Stage</label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option>Germination / Emergence</option>
                  <option>Vegetative</option>
                  <option>Flowering / Anthesis</option>
                  <option>Grain Filling / Pod Formation</option>
                  <option>Physiological Maturity</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || drawnPoints.length < 3}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Farm Boundary & Initialize AI</span>
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* List of Registered Farms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {farms.map((farm) => {
          const isSelected = selectedFarm?.id === farm.id;
          return (
            <div
              key={farm.id}
              onClick={() => onSelectFarm(farm)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    {farm.area_hectares.toFixed(1)} Hectares
                  </span>
                  {isSelected && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mt-3 truncate">{farm.name}</h3>
                
                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Crop:</span>
                    <strong className="text-slate-200">{farm.active_crop?.crop_type || 'Field Crop'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Soil:</span>
                    <span className="text-slate-300">{farm.soil_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Irrigation:</span>
                    <span className="text-slate-300">{farm.irrigation_type}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex justify-between">
                <span>Lat: {farm.centroid_lat.toFixed(4)}</span>
                <span>Lon: {farm.centroid_lon.toFixed(4)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
