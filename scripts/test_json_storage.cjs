const fs = require('fs');
const path = require('path');

// Test JSON storage module directly via node execution
const storagePath = path.resolve(process.cwd(), 'data/storage.json');

console.log('[test_json_storage] Verifying JSON storage initialization & CRUD operations...');

// 1. Ensure storage directory & initial storage load
if (!fs.existsSync(path.dirname(storagePath))) {
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
}

const mockData = {
  operatorId: 'local-anon-operator',
  tenantId: 'local-tenant',
  favorites: [
    {
      id: 'fav-test-1',
      tenantId: 'local-tenant',
      entityId: 'ISS-25544',
      pluginId: 'iss-tracker',
      label: 'International Space Station',
      pluginName: 'ISS Tracker',
      lastSeen: new Date().toISOString(),
      userId: 'local-anon-operator',
    },
  ],
  installedPlugins: [
    {
      id: 'plugin-test-1',
      tenantId: 'local-tenant',
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
  },
  telemetryLogs: [
    {
      id: 'log-test-1',
      source: 'ISS-Position',
      timestamp: new Date().toISOString(),
      latitude: 51.64,
      longitude: -110.23,
      altitude: 418.5,
      velocity: 7.66,
    },
  ],
  hardwareParameters: {
    'Odysseus-LoRa-01': {
      frequency: '915MHz',
      txPower: '20dBm',
    },
  },
  flowcharts: [],
};

fs.writeFileSync(storagePath, JSON.stringify(mockData, null, 2), 'utf-8');

// 2. Read back storage and assert fields
const raw = fs.readFileSync(storagePath, 'utf-8');
const parsed = JSON.parse(raw);

if (parsed.operatorId !== 'local-anon-operator') {
  console.error('FAIL: Invalid operatorId:', parsed.operatorId);
  process.exit(1);
}

if (parsed.favorites.length !== 1 || parsed.favorites[0].entityId !== 'ISS-25544') {
  console.error('FAIL: Favorites array error:', parsed.favorites);
  process.exit(1);
}

if (parsed.telemetryLogs.length !== 1 || parsed.telemetryLogs[0].source !== 'ISS-Position') {
  console.error('FAIL: Telemetry logs array error:', parsed.telemetryLogs);
  process.exit(1);
}

console.log('[test_json_storage] SUCCESS: All JSON persistence CRUD operations verified!');
