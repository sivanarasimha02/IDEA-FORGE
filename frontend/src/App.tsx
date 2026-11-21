import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { WeatherPage } from './pages/WeatherPage';
import { SatellitePage } from './pages/SatellitePage';
import { SoilPage } from './pages/SoilPage';
import { RisksPage } from './pages/RisksPage';
import { YieldPage } from './pages/YieldPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import {
  User, Farm, WeatherSummary, SatelliteSummary,
  RiskSummary, YieldPrediction, SoilSummary,
  AgronomicRecommendation, Notification
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Farm intelligence state
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [satellite, setSatellite] = useState<SatelliteSummary | null>(null);
  const [risks, setRisks] = useState<RiskSummary | null>(null);
  const [yieldPrediction, setYieldPrediction] = useState<YieldPrediction | null>(null);
  const [soil, setSoil] = useState<SoilSummary | null>(null);
  const [recommendations, setRecommendations] = useState<AgronomicRecommendation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [isLoadingFarmData, setIsLoadingFarmData] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Initial auth check
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsAuthLoading(false);
  }, []);

  // 2. Load farms on user login
  useEffect(() => {
    if (user) {
      loadFarms();
      loadNotifications();
    }
  }, [user]);

  // 3. Load all intelligence when selected farm changes
  useEffect(() => {
    if (selectedFarm) {
      loadAllFarmData(selectedFarm.id);
    }
  }, [selectedFarm?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadFarms = async () => {
    try {
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarm) {
        setSelectedFarm(data[0]);
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllFarmData = async (farmId: string) => {
    setIsLoadingFarmData(true);
    try {
      const [w, s, r, y, soilData, recs] = await Promise.all([
        api.getWeather(farmId),
        api.getSatellite(farmId),
        api.getRisks(farmId),
        api.getYield(farmId),
        api.getSoil(farmId),
        api.getRecommendations(farmId)
      ]);
      setWeather(w);
      setSatellite(s);
      setRisks(r);
      setYieldPrediction(y);
      setSoil(soilData);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading farm intelligence:', err);
    } finally {
      setIsLoadingFarmData(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    if (!selectedFarm) return;
    setIsAnalyzing(true);
    try {
      await api.triggerAnalysis(selectedFarm.id);
      await loadAllFarmData(selectedFarm.id);
      await loadNotifications();
      showToast('AI analysis models, weather, and Sentinel-2 indices refreshed successfully!');
    } catch (err: any) {
      showToast(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const updated = await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? updated : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setFarms([]);
    setSelectedFarm(null);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs px-4 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        user={user}
        farms={farms}
        selectedFarm={selectedFarm}
        onSelectFarm={(f) => setSelectedFarm(f)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onRefreshAnalysis={handleRefreshAnalysis}
        onLogout={handleLogout}
        isAnalyzing={isAnalyzing}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          criticalRisksCount={risks?.critical_risks_count || 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {isLoadingFarmData && !weather ? (
              <LoadingSpinner label="Loading satellite imagery and climate telemetry..." />
            ) : selectedFarm ? (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardPage
                    farm={selectedFarm}
                    weather={weather}
                    satellite={satellite}
                    risks={risks}
                    yieldPrediction={yieldPrediction}
                    soil={soil}
                    recommendations={recommendations}
                    onNavigateTab={(t) => setActiveTab(t)}
                  />
                )}

                {activeTab === 'farms' && (
                  <FarmsPage
                    farms={farms}
                    selectedFarm={selectedFarm}
                    onSelectFarm={(f) => setSelectedFarm(f)}
                    onFarmCreated={(f) => {
                      setFarms([...farms, f]);
                      setSelectedFarm(f);
                      showToast(`Farm '${f.name}' registered successfully!`);
                    }}
                  />
                )}

                {activeTab === 'weather' && (
                  <WeatherPage weather={weather} />
                )}

                {activeTab === 'satellite' && (
                  <SatellitePage satellite={satellite} />
                )}

                {activeTab === 'soil' && (
                  <SoilPage
                    soil={soil}
                    farmId={selectedFarm.id}
                    onRefreshSoil={() => {
                      api.getSoil(selectedFarm.id).then(setSoil);
                    }}
                  />
                )}

                {activeTab === 'risks' && (
                  <RisksPage risks={risks} />
                )}

                {activeTab === 'yield' && (
                  <YieldPage
                    yieldPrediction={yieldPrediction}
                    farm={selectedFarm}
                  />
                )}

                {activeTab === 'recommendations' && (
                  <RecommendationsPage recommendations={recommendations} />
                )}

                {activeTab === 'reports' && (
                  <ReportsPage farmId={selectedFarm.id} />
                )}
              </>
            ) : (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">No Farm Boundary Selected</h3>
                <p className="text-xs text-slate-400">Please register or select a farm to initiate environmental analysis.</p>
                <button
                  onClick={() => setActiveTab('farms')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Create Your First Farm
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
