import React from 'react';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { WeatherSummary } from '../types';
import { MetricCard } from '../components/MetricCard';

interface WeatherPageProps {
  weather: WeatherSummary | null;
}

export const WeatherPage: React.FC<WeatherPageProps> = ({ weather }) => {
  if (!weather) {
    return <div className="p-8 text-center text-slate-400">Loading agrometeorological records...</div>;
  }

  // Combine historical and forecast for timeline chart
  const timelineData = [
    ...weather.historical_30days.slice(-15).map((d) => ({
      date: d.observed_date.slice(5),
      tMax: d.temperature_max,
      tMin: d.temperature_min,
      precip: d.precipitation_mm,
      et0: d.et0_mm || 4.0,
      type: 'Observed'
    })),
    ...weather.forecast_7days.map((d) => ({
      date: d.observed_date.slice(5),
      tMax: d.temperature_max,
      tMin: d.temperature_min,
      precip: d.precipitation_mm,
      et0: d.et0_mm || 4.2,
      type: 'Forecast'
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Weather & Historical Climate Analysis</h2>
          <p className="text-xs text-slate-400 mt-0.5">High-resolution micro-location forecasts and 30-day precipitation baselines</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Source: <strong className="text-emerald-400">{weather.data_source}</strong>
        </div>
      </div>

      {/* Primary Weather KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ambient Temperature"
          value={`${weather.current_temperature_c}°C`}
          subtitle="Real-time thermal reading"
          icon={<Sun className="w-5 h-5" />}
        />
        <MetricCard
          title="Relative Humidity"
          value={`${weather.current_humidity_pct}%`}
          subtitle="Canopy vapor pressure"
          icon={<Droplets className="w-5 h-5" />}
        />
        <MetricCard
          title="Wind Velocity"
          value={`${weather.current_wind_speed_kmh} km/h`}
          subtitle="Surface aerodynamic drag"
          icon={<Wind className="w-5 h-5" />}
        />
        <MetricCard
          title="30-Day Rain Anomaly"
          value={`${weather.rainfall_anomaly_pct > 0 ? '+' : ''}${weather.rainfall_anomaly_pct}%`}
          subtitle={weather.baseline_period}
          icon={<CloudRain className="w-5 h-5" />}
          alertLevel={weather.rainfall_anomaly_pct < -25 ? 'danger' : 'none'}
        />
      </div>

      {/* Weather Chart: Precipitation & Temperatures */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Precipitation & Temperature Trajectory</h3>
            <p className="text-xs text-slate-400 mt-0.5">Observed history (past 15 days) and 7-day forecast</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
              <span>Rainfall (mm)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              <span>Max Temp (°C)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              <span>Min Temp (°C)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11 }} unit="°C" domain={[10, 45]} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tick={{ fontSize: 11 }} unit="mm" domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar yAxisId="right" dataKey="precip" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Precipitation (mm)" />
              <Line yAxisId="left" type="monotone" dataKey="tMax" stroke="#f43f5e" strokeWidth={2.5} dot={false} name="Max Temp (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="tMin" stroke="#fbbf24" strokeWidth={2} dot={false} name="Min Temp (°C)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Forecast Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>7-Day Agrometeorological Outlook</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weather.forecast_7days.map((day) => (
            <div key={day.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center space-y-2">
              <div className="text-[11px] font-mono text-slate-400 uppercase">{day.observed_date.slice(5)}</div>
              <div className="flex justify-center">
                {day.precipitation_mm > 5 ? (
                  <CloudRain className="w-6 h-6 text-blue-400" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div className="text-xs font-bold text-white">{day.temperature_max}° / {day.temperature_min}°</div>
              <div className="text-[11px] text-blue-400">{day.precipitation_mm} mm</div>
              <div className="text-[10px] text-slate-500 font-mono">ET0: {day.et0_mm || 4.1}mm</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
