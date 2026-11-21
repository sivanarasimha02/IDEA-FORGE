import React, { useState } from 'react';
import {
  Sprout, Bell, RefreshCw, LogOut, ChevronDown, Check,
  AlertTriangle, ShieldCheck
} from 'lucide-react';
import { Farm, Notification, User } from '../types';

interface NavbarProps {
  user: User | null;
  farms: Farm[];
  selectedFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onRefreshAnalysis: () => Promise<void>;
  onLogout: () => void;
  isAnalyzing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  farms,
  selectedFarm,
  onSelectFarm,
  notifications,
  onMarkNotificationRead,
  onRefreshAnalysis,
  onLogout,
  isAnalyzing
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFarmDropdown, setShowFarmDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Climate & Yield Engine</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              Micro-Location AI
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Sentinel-2 • PostGIS • Agrometeorological Intelligence</p>
        </div>
      </div>

      {/* Center: Farm Selector */}
      <div className="relative">
        <button
          onClick={() => setShowFarmDropdown(!showFarmDropdown)}
          className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-750 px-4 py-2 rounded-lg border border-slate-700/80 text-sm font-medium text-slate-200 transition-colors shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="max-w-[200px] truncate">{selectedFarm ? selectedFarm.name : 'Select Farm'}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {showFarmDropdown && (
          <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
              Registered Farms ({farms.length})
            </div>
            <div className="max-h-60 overflow-y-auto">
              {farms.map((farm) => (
                <button
                  key={farm.id}
                  onClick={() => {
                    onSelectFarm(farm);
                    setShowFarmDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                    selectedFarm?.id === farm.id ? 'bg-emerald-950/40 text-emerald-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate">{farm.name}</p>
                    <p className="text-[10px] text-slate-500">{farm.area_hectares.toFixed(1)} ha • {farm.active_crop?.crop_type || 'Unspecified crop'}</p>
                  </div>
                  {selectedFarm?.id === farm.id && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3.5">
        {/* Run AI Analysis Refresh */}
        <button
          onClick={onRefreshAnalysis}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700/80 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Field Risk Alerts</span>
                <span className="text-[10px] font-mono text-emerald-400">{unreadCount} Unread</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">No alerts at this moment</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-800/60 ${
                        !n.is_read ? 'bg-slate-850' : 'opacity-70'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          n.severity === 'danger' ? 'text-rose-400' : 'text-amber-400'
                        }`} />
                        <div>
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile / Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.name || 'Agri User'}</div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{user?.role || 'Farmer'}</div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
