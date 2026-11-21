import React, { useState } from 'react';
import { Activity, Thermometer, Droplets, Zap, RefreshCw, Cpu, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { SoilSummary, SoilReading } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface SoilPageProps {
  soil: SoilSummary | null;
  farmId: string;
  onRefreshSoil: () => void;
}

export const SoilPage: React.FC<SoilPageProps> = ({ soil, farmId, onRefreshSoil }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState('');

  if (!soil) {
    return <div className="p-8 text-center text-slate-400">Loading soil telemetry...</div>;
  }

  const latest = soil.latest_reading;

  const handleSimulatePulse = async () => {
    setIsSimulating(true);
    setSimulationToast('');
    try {
      const reading = await api.simulateSoilPulse(farmId);
      setSimulationToast(`Telemetry pulse ingested: ${reading.moisture_pct}% moisture at ${reading.recorded_at.slice(11, 19)} UTC`);
      onRefreshSoil();
    } catch (err: any) {
      setSimulationToast(err.message || 'Simulation error');
    } finally {
      setIsSimulating(false);
    }
  };

  const chartData = soil.recent_readings.map((r) => ({
    time: r.recorded_at.slice(5, 16).replace('T', ' '),
    moisture: r.moisture_pct,
    temp: r.temperature_c,
    ph: r.ph || 6.8
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Soil Sensor Telemetry & In-Situ IoT</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time volumetric water content, root-zone thermal dynamics, and soil chemistry</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSimulatePulse}
            disabled={isSimulating}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/40 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Simulate Sensor Pulse</span>
          </button>
        </div>
      </div>

      {simulationToast && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{simulationToast}</span>
        </div>
      )}

      {/* Sensor KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Root-Zone Moisture"
          value={latest ? `${latest.moisture_pct}%` : '28.4%'}
          subtitle={`Status: ${soil.status_label}`}
          icon={<Droplets className="w-5 h-5" />}
          badge={<StatusBadge status={soil.status_label} size="sm" />}
          alertLevel={latest && latest.moisture_pct < 20 ? 'danger' : 'none'}
        />

        <MetricCard
          title="Soil Temperature"
          value={latest ? `${latest.temperature_c}°C` : '24.8°C'}
          subtitle="Sub-surface probe at 15cm"
          icon={<Thermometer className="w-5 h-5" />}
        />

        <MetricCard
          title="Soil pH Level"
          value={latest?.ph ? `${latest.ph}` : '6.8'}
          subtitle="Slightly acidic / neutral"
          icon={<Activity className="w-5 h-5" />}
        />

        <MetricCard
          title="Electrical Cond. (EC)"
          value={latest?.ec_ds_m ? `${latest.ec_ds_m} dS/m` : '1.3 dS/m'}
          subtitle="Root-zone salinity balance"
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      {/* Soil Moisture Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Volumetric Soil Moisture Trend (%)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Continuous telemetry against agronomic field capacity and wilting thresholds</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-emerald-400">Field Capacity: 35%</span>
            <span className="text-rose-400">Wilting Point: 15%</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[10, 45]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#moistureGrad)" name="Moisture (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connected Hardware Device Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{soil.device.device_name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hardware ID: <span className="font-mono text-slate-300">{soil.device.id}</span></p>
            </div>
          </div>
          <StatusBadge status={soil.device.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Battery Reserve</span>
            <span className="font-bold text-emerald-400">{soil.device.battery_level || 94}%</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Data Source</span>
            <span className="font-medium text-slate-300">{latest?.data_source || 'IoT Hardware'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Simulated Flag</span>
            <span className="font-mono text-amber-400">{latest?.is_simulated ? 'True (Lab Mode)' : 'False (Hardware)'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Last Seen</span>
            <span className="text-slate-400">{soil.device.last_seen ? soil.device.last_seen.slice(11, 19) + ' UTC' : 'Active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
