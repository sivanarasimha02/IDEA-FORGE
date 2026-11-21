import {
  User, Farm, WeatherSummary, SatelliteSummary, VegetationIndex,
  RiskSummary, YieldPrediction, AgronomicRecommendation,
  SoilSummary, SoilReading, Notification, FarmReport
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? '';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async register(name: string, email: string, password: string, role = 'farmer'): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Farms
  async getFarms(): Promise<Farm[]> {
    const res = await fetch(`${API_BASE_URL}/api/farms`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch farms');
    return res.json();
  }

  async createFarm(data: {
    name: string;
    boundary: { type: string; coordinates: number[][][] };
    soil_type: string;
    irrigation_type: string;
    crop?: any;
  }): Promise<Farm> {
    const res = await fetch(`${API_BASE_URL}/api/farms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create farm');
    }
    return res.json();
  }

  async triggerAnalysis(farmId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/analyze`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Analysis refresh failed');
    return res.json();
  }

  // Weather
  async getWeather(farmId: string): Promise<WeatherSummary> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/weather`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch weather');
    return res.json();
  }

  // Satellite
  async getSatellite(farmId: string): Promise<SatelliteSummary> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/satellite`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch satellite data');
    return res.json();
  }

  async getVegetationIndices(farmId: string): Promise<VegetationIndex[]> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/vegetation-indices`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch vegetation indices');
    return res.json();
  }

  // Soil
  async getSoil(farmId: string): Promise<SoilSummary> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/soil`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch soil data');
    return res.json();
  }

  async simulateSoilPulse(farmId: string): Promise<SoilReading> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/soil/simulate`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to simulate reading');
    return res.json();
  }

  // Risks
  async getRisks(farmId: string): Promise<RiskSummary> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/risks`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch risk assessment');
    return res.json();
  }

  // Yield
  async getYield(farmId: string): Promise<YieldPrediction> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/yield`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch yield prediction');
    return res.json();
  }

  // Recommendations
  async getRecommendations(farmId: string): Promise<AgronomicRecommendation[]> {
    const res = await fetch(`${API_BASE_URL}/api/farms/${farmId}/recommendations`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to update notification');
    return res.json();
  }

  // Reports
  async getReport(farmId: string): Promise<FarmReport> {
    const res = await fetch(`${API_BASE_URL}/api/reports/${farmId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  }
}

export const api = new ApiService();
