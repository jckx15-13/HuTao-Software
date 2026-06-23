export type WwvVisualAsset = {
  id: string;
  label: string;
  type: 'svg-icon' | 'gltf-model' | 'archive' | 'brand-image' | 'geojson-data' | 'derived-svg-icon';
  url: string;
  sourcePath: string;
  intendedUse: string;
};

export type WwvSourcePublicAsset = {
  path: string;
  url: string;
  sourcePath: string;
  category: 'aircraft' | 'brand' | 'geojson-data' | 'camera-data' | 'plugin-fixture' | 'site-meta';
  securityNote?: string;
};

export const WWV_SOURCE_PUBLIC_ASSETS: WwvSourcePublicAsset[] = [
  { path: 'ads.txt', url: '/wwv-assets/source-public/ads.txt', sourcePath: 'worldwideview/public/ads.txt', category: 'site-meta' },
  { path: 'airplane.zip', url: '/wwv-assets/source-public/airplane.zip', sourcePath: 'worldwideview/public/airplane.zip', category: 'aircraft' },
  { path: 'airplane/license.txt', url: '/wwv-assets/source-public/airplane/license.txt', sourcePath: 'worldwideview/public/airplane/license.txt', category: 'aircraft' },
  { path: 'airplane/scene.bin', url: '/wwv-assets/source-public/airplane/scene.bin', sourcePath: 'worldwideview/public/airplane/scene.bin', category: 'aircraft' },
  { path: 'airplane/scene.gltf', url: '/wwv-assets/source-public/airplane/scene.gltf', sourcePath: 'worldwideview/public/airplane/scene.gltf', category: 'aircraft' },
  { path: 'borders.geojson', url: '/wwv-assets/source-public/borders.geojson', sourcePath: 'worldwideview/public/borders.geojson', category: 'geojson-data' },
  {
    path: 'cameras_geojson.json',
    url: '/wwv-assets/source-public/cameras_geojson.json',
    sourcePath: 'worldwideview/public/cameras_geojson.json',
    category: 'camera-data',
    securityNote: 'Served copy removes raw camera stream and thumbnail URLs; only location data and source-presence flags remain.',
  },
  { path: 'e2e-fixtures/e2e-mock-bottom-panel-manifest.json', url: '/wwv-assets/source-public/e2e-fixtures/e2e-mock-bottom-panel-manifest.json', sourcePath: 'worldwideview/public/e2e-fixtures/e2e-mock-bottom-panel-manifest.json', category: 'plugin-fixture' },
  { path: 'e2e-fixtures/e2e-mock-bottom-panel.js', url: '/wwv-assets/source-public/e2e-fixtures/e2e-mock-bottom-panel.js', sourcePath: 'worldwideview/public/e2e-fixtures/e2e-mock-bottom-panel.js', category: 'plugin-fixture' },
  { path: 'e2e-fixtures/manifest.json', url: '/wwv-assets/source-public/e2e-fixtures/manifest.json', sourcePath: 'worldwideview/public/e2e-fixtures/manifest.json', category: 'plugin-fixture' },
  { path: 'e2e-fixtures/mock-plugin.js', url: '/wwv-assets/source-public/e2e-fixtures/mock-plugin.js', sourcePath: 'worldwideview/public/e2e-fixtures/mock-plugin.js', category: 'plugin-fixture' },
  { path: 'favicon.svg', url: '/wwv-assets/source-public/favicon.svg', sourcePath: 'worldwideview/public/favicon.svg', category: 'brand' },
  { path: 'logo/app-icon-inverted.png', url: '/wwv-assets/source-public/logo/app-icon-inverted.png', sourcePath: 'worldwideview/public/logo/app-icon-inverted.png', category: 'brand' },
  { path: 'logo/favicon-inverted.svg', url: '/wwv-assets/source-public/logo/favicon-inverted.svg', sourcePath: 'worldwideview/public/logo/favicon-inverted.svg', category: 'brand' },
  { path: 'logo/favicon.svg', url: '/wwv-assets/source-public/logo/favicon.svg', sourcePath: 'worldwideview/public/logo/favicon.svg', category: 'brand' },
  { path: 'logo/logo-full.png', url: '/wwv-assets/source-public/logo/logo-full.png', sourcePath: 'worldwideview/public/logo/logo-full.png', category: 'brand' },
  { path: 'logo/logo-icon.jpg', url: '/wwv-assets/source-public/logo/logo-icon.jpg', sourcePath: 'worldwideview/public/logo/logo-icon.jpg', category: 'brand' },
  { path: 'logo/logo-icon.png', url: '/wwv-assets/source-public/logo/logo-icon.png', sourcePath: 'worldwideview/public/logo/logo-icon.png', category: 'brand' },
  { path: 'logo/logo-icon.svg', url: '/wwv-assets/source-public/logo/logo-icon.svg', sourcePath: 'worldwideview/public/logo/logo-icon.svg', category: 'brand' },
  { path: 'military_bases.geojson', url: '/wwv-assets/source-public/military_bases.geojson', sourcePath: 'worldwideview/public/military_bases.geojson', category: 'geojson-data' },
  { path: 'military-plane-icon.svg', url: '/wwv-assets/source-public/military-plane-icon.svg', sourcePath: 'worldwideview/public/military-plane-icon.svg', category: 'aircraft' },
  { path: 'plane-icon.svg', url: '/wwv-assets/source-public/plane-icon.svg', sourcePath: 'worldwideview/public/plane-icon.svg', category: 'aircraft' },
  {
    path: 'public-cameras.json',
    url: '/wwv-assets/source-public/public-cameras.json',
    sourcePath: 'worldwideview/public/public-cameras.json',
    category: 'camera-data',
    securityNote: 'Served copy removes raw camera stream and thumbnail URLs; retained only for sanitized provenance.',
  },
];

export const WWV_VISUAL_ASSETS: WwvVisualAsset[] = [
  {
    id: 'plane-icon',
    label: 'WWV civilian aircraft icon',
    type: 'svg-icon',
    url: '/wwv-assets/plane-icon.svg',
    sourcePath: 'worldwideview/public/plane-icon.svg',
    intendedUse: 'Aircraft and aviation overlays, not satellite markers.',
  },
  {
    id: 'military-plane-icon',
    label: 'WWV military aircraft icon',
    type: 'svg-icon',
    url: '/wwv-assets/military-plane-icon.svg',
    sourcePath: 'worldwideview/public/military-plane-icon.svg',
    intendedUse: 'Military aircraft overlays, not orbital satellites.',
  },
  {
    id: 'airplane-model',
    label: 'WWV airplane glTF model',
    type: 'gltf-model',
    url: '/wwv-assets/airplane/scene.gltf',
    sourcePath: 'worldwideview/public/airplane/scene.gltf',
    intendedUse: 'Future aircraft model rendering when an aviation layer is enabled.',
  },
  {
    id: 'airplane-archive',
    label: 'WWV airplane source archive',
    type: 'archive',
    url: '/wwv-assets/airplane.zip',
    sourcePath: 'worldwideview/public/airplane.zip',
    intendedUse: 'Source archive retained for provenance and asset rebuilds.',
  },
  {
    id: 'wwv-logo-full',
    label: 'WWV full logo',
    type: 'brand-image',
    url: '/wwv-assets/logo/logo-full.png',
    sourcePath: 'worldwideview/public/logo/logo-full.png',
    intendedUse: 'Source provenance and optional integration-credit surfaces.',
  },
  {
    id: 'wwv-logo-icon',
    label: 'WWV logo icon',
    type: 'brand-image',
    url: '/wwv-assets/logo/logo-icon.svg',
    sourcePath: 'worldwideview/public/logo/logo-icon.svg',
    intendedUse: 'Source provenance and optional integration-credit surfaces.',
  },
  {
    id: 'military-bases-dataset',
    label: 'WWV military bases dataset',
    type: 'geojson-data',
    url: '/wwv-assets/data/military_bases.geojson',
    sourcePath: 'worldwideview/public/military_bases.geojson',
    intendedUse: 'Static military-site globe layer with explicit non-live telemetry labeling.',
  },
  {
    id: 'orbital-space-station',
    label: 'Silver Wolf orbital space-station silhouette',
    type: 'derived-svg-icon',
    url: '/wwv-assets/orbital/space-station.svg',
    sourcePath: 'silver-wolf-vi/public/wwv-assets/orbital/space-station.svg',
    intendedUse: 'Derived orbital marker shaped for space-station entities because WWV has no satellite-specific source asset.',
  },
  {
    id: 'orbital-observatory-satellite',
    label: 'Silver Wolf orbital observatory silhouette',
    type: 'derived-svg-icon',
    url: '/wwv-assets/orbital/observatory-satellite.svg',
    sourcePath: 'silver-wolf-vi/public/wwv-assets/orbital/observatory-satellite.svg',
    intendedUse: 'Derived orbital marker for observatory and bright-object satellite entities.',
  },
  {
    id: 'orbital-weather-satellite',
    label: 'Silver Wolf orbital weather satellite silhouette',
    type: 'derived-svg-icon',
    url: '/wwv-assets/orbital/weather-satellite.svg',
    sourcePath: 'silver-wolf-vi/public/wwv-assets/orbital/weather-satellite.svg',
    intendedUse: 'Derived orbital marker for weather and environmental monitoring satellites.',
  },
  {
    id: 'orbital-navigation-satellite',
    label: 'Silver Wolf orbital navigation satellite silhouette',
    type: 'derived-svg-icon',
    url: '/wwv-assets/orbital/navigation-satellite.svg',
    sourcePath: 'silver-wolf-vi/public/wwv-assets/orbital/navigation-satellite.svg',
    intendedUse: 'Derived orbital marker for GPS/GNSS navigation satellites.',
  },
  {
    id: 'orbital-comms-satellite',
    label: 'Silver Wolf orbital communications satellite silhouette',
    type: 'derived-svg-icon',
    url: '/wwv-assets/orbital/comms-satellite.svg',
    sourcePath: 'silver-wolf-vi/public/wwv-assets/orbital/comms-satellite.svg',
    intendedUse: 'Derived orbital marker for communications satellite constellations.',
  },
  {
    id: 'orbital-recon-satellite',
    label: 'Silver Wolf orbital reconnaissance satellite silhouette',
    type: 'derived-svg-icon',
    url: '/wwv-assets/orbital/recon-satellite.svg',
    sourcePath: 'silver-wolf-vi/public/wwv-assets/orbital/recon-satellite.svg',
    intendedUse: 'Derived orbital marker for military and reconnaissance satellites.',
  },
];

export const WWV_ASSET_AUDIT = {
  sourceRoot: 'worldwideview/public',
  copiedRoot: '/wwv-assets',
  sourceMirrorRoot: '/wwv-assets/source-public',
  sourcePublicFileCount: WWV_SOURCE_PUBLIC_ASSETS.length,
  copiedSourcePublicFiles: WWV_SOURCE_PUBLIC_ASSETS.map((asset) => asset.path),
  satelliteSpecificAssetPresent: false,
  derivedSatelliteAssetRoot: '/wwv-assets/orbital',
  satelliteAssetMessage:
    'The mirrored WorldWideView public asset set contains aircraft icons/model, geospatial datasets, sanitized camera location data, plugin fixtures, and logo artwork, but no satellite-specific bitmap or 3D satellite asset. Silver Wolf uses derived orbital hardware silhouettes for satellites.',
};

export const WWV_ORBITAL_ASSET_BY_CATEGORY: Record<string, string> = {
  spaceStations: '/wwv-assets/orbital/space-station.svg',
  brightest: '/wwv-assets/orbital/observatory-satellite.svg',
  weather: '/wwv-assets/orbital/weather-satellite.svg',
  gps: '/wwv-assets/orbital/navigation-satellite.svg',
  earthObs: '/wwv-assets/orbital/weather-satellite.svg',
  starlink: '/wwv-assets/orbital/comms-satellite.svg',
  military: '/wwv-assets/orbital/recon-satellite.svg',
  other: '/wwv-assets/orbital/observatory-satellite.svg',
};

export function getWwvAssetSummary(): string {
  return WWV_VISUAL_ASSETS.map((asset) => asset.label).join(', ');
}
