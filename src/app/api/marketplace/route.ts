import { getInstalledPlugins, savePluginConfig } from '@/lib/jsonStorage';

export const BUILTIN_MARKETPLACE_PLUGINS = [
  {
    id: 'geojson-importer',
    name: 'GeoJSON & Vector Importer',
    version: '1.0.0',
    description: 'Import custom GeoJSON features, administrative borders, and KML overlays directly onto 3D Cesium globe canvas.',
    author: 'SilverWolf Community',
    enabled: true,
  },
  {
    id: 'weather-tiles',
    name: 'Real-Time Global Weather Tiles',
    version: '1.2.0',
    description: 'Dynamic precipitation radar, cloud cover, and surface wind vector overlays.',
    author: 'SilverWolf Core',
    enabled: true,
  },
  {
    id: 'iss-tracker',
    name: 'ISS & Low-Earth Orbit Satellite Tracker',
    version: '2.0.0',
    description: 'Programmatic satellite orbit tracking using SGP4 TLE math, PointGraphics vector dots, and trailing PathGraphics lines.',
    author: 'AAS / WWT Engine',
    enabled: true,
  },
  {
    id: 'odysseus-hardware',
    name: 'Odysseus Hardware & LoRa Bridge',
    version: '1.0.0',
    description: 'Direct interface to physical devices, LoRa wireless sensors, and edge LLM inference engine on port 8000.',
    author: 'HuTao Systems',
    enabled: true,
  },
];

/**
 * GET /api/marketplace
 * Returns available marketplace plugins and installation statuses without authentication constraints.
 */
export async function GET() {
  const installed = getInstalledPlugins();
  const plugins = BUILTIN_MARKETPLACE_PLUGINS.map((p) => {
    const inst = installed.find((item) => item.pluginId === p.id);
    return {
      ...p,
      installed: Boolean(inst),
      enabled: inst ? inst.enabled : p.enabled,
      config: inst ? inst.config : {},
    };
  });

  return Response.json({
    success: true,
    operatorId: 'local-anon-operator',
    plugins,
  });
}

/**
 * POST /api/marketplace
 * Install, update, enable/disable, or sideload local plugins without authentication credentials.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pluginId, config, enabled } = body;

    if (!pluginId) {
      return Response.json({ success: false, error: 'Missing pluginId' }, { status: 400 });
    }

    const updated = savePluginConfig(pluginId, config || {}, enabled ?? true);
    return Response.json({
      success: true,
      plugin: updated,
    });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
