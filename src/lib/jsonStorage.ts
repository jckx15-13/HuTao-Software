export const SYSTEM_OPERATOR_ID = 'local-anon-operator';
export const DEFAULT_TENANT_ID = 'local-tenant';

export interface StorageFavorite {
  id: string;
  tenantId: string;
  entityId: string;
  pluginId: string;
  label: string;
  pluginName: string;
  lastSeen: string;
  userId: string;
  notes?: string;
}

export interface StoragePlugin {
  id: string;
  tenantId: string;
  pluginId: string;
  version: string;
  config: Record<string, unknown>;
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
}

export interface StorageTelemetryLog {
  id: string;
  source: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  velocity?: number;
  rawPayload?: Record<string, unknown>;
}

export interface StorageFlowchart {
  id: string;
  title: string;
  nodesJson: string;
  edgesJson: string;
  updatedAt: string;
}

export interface JsonStorageStructure {
  operatorId: string;
  tenantId: string;
  favorites: StorageFavorite[];
  installedPlugins: StoragePlugin[];
  settings: Record<string, string>;
  telemetryLogs: StorageTelemetryLog[];
  hardwareParameters: Record<string, Record<string, string>>;
  flowcharts: StorageFlowchart[];
}

const LOCAL_STORAGE_KEY = 'silverwolf_storage_json';

const INITIAL_STORAGE: JsonStorageStructure = {
  operatorId: SYSTEM_OPERATOR_ID,
  tenantId: DEFAULT_TENANT_ID,
  favorites: [],
  installedPlugins: [
    {
      id: 'builtin-geojson-plugin',
      tenantId: DEFAULT_TENANT_ID,
      pluginId: 'geojson-importer',
      version: '1.0.0',
      config: { autoParse: true },
      enabled: true,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  settings: {
    theme: 'silverwolf-dark',
    defaultProjection: 'GLOBE',
    enableOdysseusBridge: 'true',
  },
  telemetryLogs: [],
  hardwareParameters: {},
  flowcharts: [],
};

// Memory fallback cache
let inMemoryStorage: JsonStorageStructure = { ...INITIAL_STORAGE };

/**
 * Browser vs Node environment detection
 */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Read the entire JSON storage structure safely across Browser and Node environments.
 */
export function readJsonStorage(): JsonStorageStructure {
  if (isBrowser) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as JsonStorageStructure;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_STORAGE));
      return INITIAL_STORAGE;
    } catch (e) {
      return inMemoryStorage;
    }
  }

  // Node.js environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    const filePath = path.resolve(process.cwd(), 'data/storage.json');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(INITIAL_STORAGE, null, 2), 'utf-8');
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as JsonStorageStructure;
  } catch (err) {
    return inMemoryStorage;
  }
}

/**
 * Write updated structure to storage safely across Browser and Node environments.
 */
export function writeJsonStorage(data: JsonStorageStructure): void {
  inMemoryStorage = data;
  if (isBrowser) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // quota fallback
    }
    return;
  }

  // Node.js environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    const filePath = path.resolve(process.cwd(), 'data/storage.json');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // safe fallback
  }
}

// ============================================================================
// FAVORITES CRUD
// ============================================================================
export function getFavorites(): StorageFavorite[] {
  return readJsonStorage().favorites;
}

export function addFavorite(fav: Omit<StorageFavorite, 'id' | 'lastSeen' | 'userId' | 'tenantId'>): StorageFavorite {
  const store = readJsonStorage();
  const newFav: StorageFavorite = {
    ...fav,
    id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tenantId: DEFAULT_TENANT_ID,
    userId: SYSTEM_OPERATOR_ID,
    lastSeen: new Date().toISOString(),
  };
  const existingIdx = store.favorites.findIndex((f) => f.entityId === fav.entityId);
  if (existingIdx >= 0) {
    store.favorites[existingIdx] = newFav;
  } else {
    store.favorites.push(newFav);
  }
  writeJsonStorage(store);
  return newFav;
}

export function removeFavorite(entityId: string): void {
  const store = readJsonStorage();
  store.favorites = store.favorites.filter((f) => f.entityId !== entityId);
  writeJsonStorage(store);
}

// ============================================================================
// PLUGINS CRUD
// ============================================================================
export function getInstalledPlugins(): StoragePlugin[] {
  return readJsonStorage().installedPlugins;
}

export function savePluginConfig(pluginId: string, config: Record<string, unknown>, enabled = true): StoragePlugin {
  const store = readJsonStorage();
  const idx = store.installedPlugins.findIndex((p) => p.pluginId === pluginId);
  const now = new Date().toISOString();
  if (idx >= 0) {
    store.installedPlugins[idx] = {
      ...store.installedPlugins[idx],
      config,
      enabled,
      updatedAt: now,
    };
    writeJsonStorage(store);
    return store.installedPlugins[idx];
  }
  const newPlugin: StoragePlugin = {
    id: `plugin-${Date.now()}`,
    tenantId: DEFAULT_TENANT_ID,
    pluginId,
    version: '1.0.0',
    config,
    enabled,
    installedAt: now,
    updatedAt: now,
  };
  store.installedPlugins.push(newPlugin);
  writeJsonStorage(store);
  return newPlugin;
}

// ============================================================================
// TELEMETRY LOGS & HARDWARE PARAMS
// ============================================================================
export function addTelemetryLog(log: Omit<StorageTelemetryLog, 'id' | 'timestamp'>): StorageTelemetryLog {
  const store = readJsonStorage();
  const newLog: StorageTelemetryLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
  };
  store.telemetryLogs.unshift(newLog);
  if (store.telemetryLogs.length > 1000) {
    store.telemetryLogs = store.telemetryLogs.slice(0, 1000);
  }
  writeJsonStorage(store);
  return newLog;
}

export function getTelemetryLogs(source?: string): StorageTelemetryLog[] {
  const logs = readJsonStorage().telemetryLogs;
  return source ? logs.filter((l) => l.source === source) : logs;
}

export function setHardwareParameter(deviceId: string, key: string, value: string): void {
  const store = readJsonStorage();
  if (!store.hardwareParameters[deviceId]) {
    store.hardwareParameters[deviceId] = {};
  }
  store.hardwareParameters[deviceId][key] = value;
  writeJsonStorage(store);
}

export function getHardwareParameters(deviceId: string): Record<string, string> {
  return readJsonStorage().hardwareParameters[deviceId] || {};
}

// ============================================================================
// FLOWCHARTS
// ============================================================================
export function saveFlowchart(title: string, nodesJson: string, edgesJson: string, id?: string): StorageFlowchart {
  const store = readJsonStorage();
  const now = new Date().toISOString();
  const chartId = id || `fc-${Date.now()}`;
  const idx = store.flowcharts.findIndex((f) => f.id === chartId);
  const chart: StorageFlowchart = {
    id: chartId,
    title,
    nodesJson,
    edgesJson,
    updatedAt: now,
  };
  if (idx >= 0) {
    store.flowcharts[idx] = chart;
  } else {
    store.flowcharts.push(chart);
  }
  writeJsonStorage(store);
  return chart;
}

export function getFlowcharts(): StorageFlowchart[] {
  return readJsonStorage().flowcharts;
}
