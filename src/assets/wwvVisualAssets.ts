import {
  getWwtAssetLocalUrl,
  getWwtAssetRemoteUrl,
  getWwtAssetSourcePath,
  WWT_ASSET_PATHS,
  WWT_LOCAL_ASSET_ROOT,
} from "@/lib/wwt/repositoryData";

export type WwvVisualAsset = {
  id: string;
  label: string;
  type: "svg-icon" | "gltf-model" | "archive" | "brand-image" | "geojson-data" | "derived-svg-icon";
  url: string;
  sourcePath: string;
  intendedUse: string;
};

export type WwvSourcePublicAsset = {
  path: string;
  url: string;
  sourcePath: string;
  category: "aircraft" | "brand" | "geojson-data" | "camera-data" | "plugin-fixture" | "site-meta";
  securityNote?: string;
};

const WWV_SOURCE_ROOT = getWwtAssetSourcePath("");
const ORBITAL_ICON_ROOT = "/wwv-assets/orbital";
const sourcePublicPath = (path: string) => `${WWT_LOCAL_ASSET_ROOT}/source-public/${path}`;

export const WWV_SOURCE_PUBLIC_ASSETS: WwvSourcePublicAsset[] = [
  { path: "ads.txt", url: sourcePublicPath("ads.txt"), sourcePath: `${WWV_SOURCE_ROOT}/ads.txt`, category: "site-meta" },
  { path: "airplane.zip", url: sourcePublicPath("airplane.zip"), sourcePath: `${WWV_SOURCE_ROOT}/airplane.zip`, category: "aircraft" },
  { path: "airplane/license.txt", url: sourcePublicPath("airplane/license.txt"), sourcePath: `${WWV_SOURCE_ROOT}/airplane/license.txt`, category: "aircraft" },
  { path: "airplane/scene.bin", url: sourcePublicPath("airplane/scene.bin"), sourcePath: `${WWV_SOURCE_ROOT}/airplane/scene.bin`, category: "aircraft" },
  { path: "airplane/scene.gltf", url: sourcePublicPath("airplane/scene.gltf"), sourcePath: `${WWV_SOURCE_ROOT}/airplane/scene.gltf`, category: "aircraft" },
  { path: "aircraft-samples.geojson", url: sourcePublicPath("aircraft-samples.geojson"), sourcePath: `${WWV_SOURCE_ROOT}/aircraft-samples.geojson`, category: "geojson-data" },
  { path: "borders.geojson", url: sourcePublicPath("borders.geojson"), sourcePath: `${WWV_SOURCE_ROOT}/borders.geojson`, category: "geojson-data" },
  { path: "satellites.json", url: sourcePublicPath("satellites.json"), sourcePath: `${WWV_SOURCE_ROOT}/satellites.json`, category: "geojson-data" },
  {
    path: "cameras_geojson.json",
    url: sourcePublicPath("cameras_geojson.json"),
    sourcePath: `${WWV_SOURCE_ROOT}/cameras_geojson.json`,
    category: "camera-data",
    securityNote: "Served copy removes raw camera stream and thumbnail URLs; only location data and source-presence flags remain.",
  },
  {
    path: "e2e-fixtures/e2e-mock-bottom-panel-manifest.json",
    url: sourcePublicPath("e2e-fixtures/e2e-mock-bottom-panel-manifest.json"),
    sourcePath: `${WWV_SOURCE_ROOT}/e2e-fixtures/e2e-mock-bottom-panel-manifest.json`,
    category: "plugin-fixture",
  },
  { path: "e2e-fixtures/e2e-mock-bottom-panel.js", url: sourcePublicPath("e2e-fixtures/e2e-mock-bottom-panel.js"), sourcePath: `${WWV_SOURCE_ROOT}/e2e-fixtures/e2e-mock-bottom-panel.js`, category: "plugin-fixture" },
  { path: "e2e-fixtures/manifest.json", url: sourcePublicPath("e2e-fixtures/manifest.json"), sourcePath: `${WWV_SOURCE_ROOT}/e2e-fixtures/manifest.json`, category: "plugin-fixture" },
  { path: "e2e-fixtures/mock-plugin.js", url: sourcePublicPath("e2e-fixtures/mock-plugin.js"), sourcePath: `${WWV_SOURCE_ROOT}/e2e-fixtures/mock-plugin.js`, category: "plugin-fixture" },
  { path: "favicon.svg", url: sourcePublicPath("favicon.svg"), sourcePath: `${WWV_SOURCE_ROOT}/favicon.svg`, category: "brand" },
  { path: "logo/app-icon-inverted.png", url: sourcePublicPath("logo/app-icon-inverted.png"), sourcePath: `${WWV_SOURCE_ROOT}/logo/app-icon-inverted.png`, category: "brand" },
  { path: "logo/favicon-inverted.svg", url: sourcePublicPath("logo/favicon-inverted.svg"), sourcePath: `${WWV_SOURCE_ROOT}/logo/favicon-inverted.svg`, category: "brand" },
  { path: "logo/favicon.svg", url: sourcePublicPath("logo/favicon.svg"), sourcePath: `${WWV_SOURCE_ROOT}/logo/favicon.svg`, category: "brand" },
  { path: "logo/logo-full.png", url: sourcePublicPath("logo/logo-full.png"), sourcePath: `${WWV_SOURCE_ROOT}/logo/logo-full.png`, category: "brand" },
  { path: "logo/logo-icon.jpg", url: sourcePublicPath("logo/logo-icon.jpg"), sourcePath: `${WWV_SOURCE_ROOT}/logo/logo-icon.jpg`, category: "brand" },
  { path: "logo/logo-icon.png", url: sourcePublicPath("logo/logo-icon.png"), sourcePath: `${WWV_SOURCE_ROOT}/logo/logo-icon.png`, category: "brand" },
  { path: "logo/logo-icon.svg", url: sourcePublicPath("logo/logo-icon.svg"), sourcePath: `${WWV_SOURCE_ROOT}/logo/logo-icon.svg`, category: "brand" },
  { path: "military_bases.geojson", url: sourcePublicPath("military_bases.geojson"), sourcePath: `${WWV_SOURCE_ROOT}/military_bases.geojson`, category: "geojson-data" },
  { path: "military-plane-icon.svg", url: sourcePublicPath("military-plane-icon.svg"), sourcePath: `${WWV_SOURCE_ROOT}/military-plane-icon.svg`, category: "aircraft" },
  { path: "plane-icon.svg", url: sourcePublicPath("plane-icon.svg"), sourcePath: `${WWV_SOURCE_ROOT}/plane-icon.svg`, category: "aircraft" },
  {
    path: "public-cameras.json",
    url: sourcePublicPath("public-cameras.json"),
    sourcePath: `${WWV_SOURCE_ROOT}/public-cameras.json`,
    category: "camera-data",
    securityNote: "Served copy removes raw camera stream and thumbnail URLs; retained only for sanitized provenance.",
  },
];

export const WWV_VISUAL_ASSETS: WwvVisualAsset[] = [
  {
    id: "plane-icon",
    label: "WWV civilian aircraft icon",
    type: "svg-icon",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.planeIcon),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.planeIcon}`,
    intendedUse: "Aircraft and aviation overlays, not satellite markers.",
  },
  {
    id: "military-plane-icon",
    label: "WWV military aircraft icon",
    type: "svg-icon",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.militaryPlaneIcon),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.militaryPlaneIcon}`,
    intendedUse: "Military aircraft overlays, not orbital satellites.",
  },
  {
    id: "airplane-model",
    label: "WWV airplane glTF model",
    type: "gltf-model",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.airplaneModel),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.airplaneModel}`,
    intendedUse: "Future aircraft model rendering when an aviation layer is enabled.",
  },
  {
    id: "airplane-archive",
    label: "WWV airplane source archive",
    type: "archive",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.airplaneArchive),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.airplaneArchive}`,
    intendedUse: "Source archive retained for provenance and asset rebuilds.",
  },
  {
    id: "wwv-logo-full",
    label: "WWV full logo",
    type: "brand-image",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.worldWideLogo),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.worldWideLogo}`,
    intendedUse: "Source provenance and optional integration-credit surfaces.",
  },
  {
    id: "wwv-logo-icon",
    label: "WWV logo icon",
    type: "brand-image",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.worldWideIcon),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.worldWideIcon}`,
    intendedUse: "Source provenance and optional integration-credit surfaces.",
  },
  {
    id: "military-bases-dataset",
    label: "WWV military bases dataset",
    type: "geojson-data",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.militaryBasesDataset),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.militaryBasesDataset}`,
    intendedUse: "Static military-site globe layer with explicit non-live telemetry labeling.",
  },
  {
    id: "aircraft-samples-dataset",
    label: "WWV aircraft sample dataset",
    type: "geojson-data",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.aircraftSamplesDataset),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.aircraftSamplesDataset}`,
    intendedUse: "WWV aircraft sample dataset consumed by the aviation plugin.",
  },
  {
    id: "satellites-catalog",
    label: "WWV satellite catalog dataset",
    type: "geojson-data",
    url: getWwtAssetRemoteUrl(WWT_ASSET_PATHS.satellitesCatalog),
    sourcePath: `${WWV_SOURCE_ROOT}/${WWT_ASSET_PATHS.satellitesCatalog}`,
    intendedUse: "WWV satellite catalog consumed by satellite plugin and live-TLE ingestion service.",
  },
  {
    id: "orbital-space-station",
    label: "Silver Wolf orbital space-station silhouette",
    type: "derived-svg-icon",
    url: `${ORBITAL_ICON_ROOT}/space-station.svg`,
    sourcePath: `${WWV_SOURCE_ROOT}/orbital/space-station.svg`,
    intendedUse: "Derived orbital marker shaped for space-station entities because WWV has no satellite-specific source asset.",
  },
  {
    id: "orbital-observatory-satellite",
    label: "Silver Wolf orbital observatory silhouette",
    type: "derived-svg-icon",
    url: `${ORBITAL_ICON_ROOT}/observatory-satellite.svg`,
    sourcePath: `${WWV_SOURCE_ROOT}/orbital/observatory-satellite.svg`,
    intendedUse: "Derived orbital marker for observatory and bright-object satellite entities.",
  },
  {
    id: "orbital-weather-satellite",
    label: "Silver Wolf orbital weather satellite silhouette",
    type: "derived-svg-icon",
    url: `${ORBITAL_ICON_ROOT}/weather-satellite.svg`,
    sourcePath: `${WWV_SOURCE_ROOT}/orbital/weather-satellite.svg`,
    intendedUse: "Derived orbital marker for weather and environmental monitoring satellites.",
  },
  {
    id: "orbital-navigation-satellite",
    label: "Silver Wolf orbital navigation satellite silhouette",
    type: "derived-svg-icon",
    url: `${ORBITAL_ICON_ROOT}/navigation-satellite.svg`,
    sourcePath: `${WWV_SOURCE_ROOT}/orbital/navigation-satellite.svg`,
    intendedUse: "Derived orbital marker for GPS/GNSS navigation satellites.",
  },
  {
    id: "orbital-comms-satellite",
    label: "Silver Wolf orbital communications satellite silhouette",
    type: "derived-svg-icon",
    url: `${ORBITAL_ICON_ROOT}/comms-satellite.svg`,
    sourcePath: `${WWV_SOURCE_ROOT}/orbital/comms-satellite.svg`,
    intendedUse: "Derived orbital marker for communications satellite constellations.",
  },
  {
    id: "orbital-recon-satellite",
    label: "Silver Wolf orbital reconnaissance satellite silhouette",
    type: "derived-svg-icon",
    url: `${ORBITAL_ICON_ROOT}/recon-satellite.svg`,
    sourcePath: `${WWV_SOURCE_ROOT}/orbital/recon-satellite.svg`,
    intendedUse: "Derived orbital marker for military and reconnaissance satellites.",
  },
];

export const WWV_ASSET_AUDIT = {
  sourceRoot: WWV_SOURCE_ROOT,
  copiedRoot: WWT_LOCAL_ASSET_ROOT,
  sourceMirrorRoot: getWwtAssetLocalUrl("source-public"),
  sourcePublicFileCount: WWV_SOURCE_PUBLIC_ASSETS.length,
  copiedSourcePublicFiles: WWV_SOURCE_PUBLIC_ASSETS.map((asset) => asset.path),
  satelliteSpecificAssetPresent: false,
  derivedSatelliteAssetRoot: ORBITAL_ICON_ROOT,
  satelliteAssetMessage:
    "The mirrored WorldWideView public asset set contains aircraft icons/model, geospatial datasets, sanitized camera location data, plugin fixtures, and logo artwork, but no satellite-specific bitmap or 3D satellite asset. Silver Wolf uses derived orbital hardware silhouettes for satellites.",
};

export const WWV_ORBITAL_ASSET_BY_CATEGORY: Record<string, string> = {
  spaceStations: `${ORBITAL_ICON_ROOT}/space-station.svg`,
  brightest: `${ORBITAL_ICON_ROOT}/observatory-satellite.svg`,
  weather: `${ORBITAL_ICON_ROOT}/weather-satellite.svg`,
  gps: `${ORBITAL_ICON_ROOT}/navigation-satellite.svg`,
  earthObs: `${ORBITAL_ICON_ROOT}/weather-satellite.svg`,
  starlink: `${ORBITAL_ICON_ROOT}/comms-satellite.svg`,
  military: `${ORBITAL_ICON_ROOT}/recon-satellite.svg`,
  other: `${ORBITAL_ICON_ROOT}/observatory-satellite.svg`,
};

export function getWwvAssetSummary(): string {
  return WWV_VISUAL_ASSETS.map((asset) => asset.label).join(", ");
}
