import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeatherData } from '../services/weatherService';
import { SATELLITE_CATEGORY_DEFAULTS, SATELLITE_SETTINGS_DEFAULTS } from '../core/defaults/uiDefaults';

export interface SystemMetrics {
  ramUsage: number;
  networkLatency: number;
  storageUsage: number;
  batteryLevel: number;
}

export interface DiagnosticEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  source: string;
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'primary';
}

export interface SatelliteData {
  tle: string[];
  timestamp: number;
}

export interface TelemetryState {
  cpuLoad: number;
  systemMetrics: SystemMetrics;
  diagnostics: DiagnosticEntry[];
  changeLogs: ChangeLogEntry[];
  issFeedOpen: boolean;
  issTelemetry: {
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    timestamp: number;
    simulated?: boolean;
  } | null;
  activeSatelliteId: string | null;
  satelliteCategories: Record<string, boolean>;
  satelliteSettings: {
    showTrails: boolean;
    showAllTrails: boolean;
    occludeByGlobe: boolean;
    trailLength: number;
    iconSize: number;
  };
  satelliteData: Record<string, SatelliteData>;
  weatherData: WeatherData | null;
  odysseusReady: boolean;
  forceFallback: boolean;
  engineUrlOverride: string;

  setCpuLoad: (load: number) => void;
  updateSystemMetrics: (m: Partial<SystemMetrics>) => void;
  addDiagnostic: (entry: Omit<DiagnosticEntry, 'id' | 'timestamp'>) => void;
  clearDiagnostics: () => void;
  addChangeLog: (category: string, message: string, level?: ChangeLogEntry['level']) => void;
  clearChangeLogs: () => void;
  setIssFeedOpen: (open: boolean) => void;
  setIssTelemetry: (telemetry: TelemetryState['issTelemetry']) => void;
  setActiveSatelliteId: (id: string | null) => void;
  toggleSatelliteCategory: (category: string) => void;
  updateSatelliteSettings: (settings: Partial<TelemetryState['satelliteSettings']>) => void;
  setSatelliteData: (id: string, data: SatelliteData) => void;
  setWeatherData: (data: WeatherData | null) => void;
  setOdysseusReady: (ready: boolean) => void;
  setForceFallback: (fallback: boolean) => void;
  setEngineUrlOverride: (url: string) => void;
}

let diagCounter = 0;

export const useTelemetryStore = create<TelemetryState>()(
  persist(
    (set) => ({
      cpuLoad: 0.2,
      systemMetrics: {
        ramUsage: 0.35,
        networkLatency: 0.6,
        storageUsage: 0.45,
        batteryLevel: 0.9
      },
      diagnostics: [],
      changeLogs: [
        {
          id: 'init-log-1',
          timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
          category: 'SYSTEM',
          message: 'Cesium 3D render engine bound to main viewport.',
          level: 'success'
        },
        {
          id: 'init-log-2',
          timestamp: new Date(Date.now() - 200000).toLocaleTimeString(),
          category: 'WORK_SPACE',
          message: 'UI layout transitioned to 3-panel space shell.',
          level: 'primary'
        },
        {
          id: 'init-log-3',
          timestamp: new Date(Date.now() - 100000).toLocaleTimeString(),
          category: 'ORBITAL_ARRAY',
          message: 'ISS Satcom live telemetry active.',
          level: 'info'
        }
      ],
      issFeedOpen: false,
      issTelemetry: null,
      activeSatelliteId: null,
      satelliteCategories: { ...SATELLITE_CATEGORY_DEFAULTS },
      satelliteSettings: { ...SATELLITE_SETTINGS_DEFAULTS },
      satelliteData: {},
      weatherData: null,
      odysseusReady: false,
      forceFallback: false,
      engineUrlOverride: '',

      setCpuLoad: (cpuLoad) => set({ cpuLoad }),
      updateSystemMetrics: (m) => set((s) => ({ systemMetrics: { ...s.systemMetrics, ...m } })),
      addDiagnostic: (entry) => {
        diagCounter += 1;
        set((s) => ({
          diagnostics: [
            ...s.diagnostics,
            { ...entry, id: `diag-${Date.now()}-${diagCounter}`, timestamp: Date.now() }
          ]
        }));
      },
      clearDiagnostics: () => set({ diagnostics: [] }),
      addChangeLog: (category, message, level = 'info') => {
        const newEntry: ChangeLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          category: category.toUpperCase().replace(/\s+/g, '_'),
          message,
          level
        };
        set((s) => ({ changeLogs: [newEntry, ...s.changeLogs].slice(0, 100) }));
      },
      clearChangeLogs: () => set({ changeLogs: [] }),
      setIssFeedOpen: (issFeedOpen) => set({ issFeedOpen }),
      setIssTelemetry: (issTelemetry) => set({ issTelemetry }),
      setActiveSatelliteId: (activeSatelliteId) => set({ activeSatelliteId }),
      toggleSatelliteCategory: (category) =>
        set((s) => ({
          satelliteCategories: {
            ...s.satelliteCategories,
            [category]: !s.satelliteCategories[category]
          }
        })),
      updateSatelliteSettings: (settings) =>
        set((s) => ({
          satelliteSettings: { ...s.satelliteSettings, ...settings }
        })),
      setSatelliteData: (id, data) =>
        set((s) => ({
          satelliteData: { ...s.satelliteData, [id]: data }
        })),
      setWeatherData: (weatherData) => set({ weatherData }),
      setOdysseusReady: (odysseusReady) => set({ odysseusReady }),
      setForceFallback: (forceFallback) => set({ forceFallback }),
      setEngineUrlOverride: (engineUrlOverride) => set({ engineUrlOverride })
    }),
    {
      name: 'silver-wolf-v6-telemetry',
      partialize: (s) => ({
        changeLogs: s.changeLogs,
        activeSatelliteId: s.activeSatelliteId,
        satelliteCategories: s.satelliteCategories,
        satelliteSettings: s.satelliteSettings,
        satelliteData: s.satelliteData,
        forceFallback: s.forceFallback,
        engineUrlOverride: s.engineUrlOverride
      })
    }
  )
);
