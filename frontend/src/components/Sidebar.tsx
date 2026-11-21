import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  CloudRain,
  Satellite,
  Activity,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  FileText
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'farms'
  | 'weather'
  | 'satellite'
  | 'soil'
  | 'risks'
  | 'yield'
  | 'recommendations'
  | 'reports';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  criticalRisksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  criticalRisksCount
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'farms', label: 'Farm Management', icon: <MapPin className="w-4 h-4" /> },
    { id: 'weather', label: 'Climate & Weather', icon: <CloudRain className="w-4 h-4" /> },
    { id: 'satellite', label: 'Satellite Intelligence', icon: <Satellite className="w-4 h-4" /> },
    { id: 'soil', label: 'Soil & IoT Sensors', icon: <Activity className="w-4 h-4" /> },
    { id: 'risks', label: 'Risk Predictions', icon: <AlertTriangle className="w-4 h-4" />, badge: criticalRisksCount },
    { id: 'yield', label: 'Yield Forecasting', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'recommendations', label: 'Mitigation Actions', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'reports', label: 'Intelligence Reports', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-5 px-3 flex-shrink-0">
      <div className="space-y-1">
        <div className="px-3 pb-3 text-[10px] font-mono tracking-wider uppercase text-slate-500 font-semibold">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl space-y-2 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>System Engine Active</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Open-Meteo & Copernicus Sentinel-2 pipelines synchronized for micro-location boundary.
        </p>
      </div>
    </aside>
  );
};
