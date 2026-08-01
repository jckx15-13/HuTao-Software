const WWT_REPO_OWNER = import.meta.env.VITE_WWT_REPO_OWNER ?? 'silvertakana';
const WWT_REPO_NAME = import.meta.env.VITE_WWT_REPO_NAME ?? 'worldwideview';
const WWT_REPO_BRANCH = import.meta.env.VITE_WWT_REPO_BRANCH ?? 'main';
const WWT_REPO_BASE =
  import.meta.env.VITE_WWT_REPO_BASE_URL ??
  `https://raw.githubusercontent.com/${WWT_REPO_OWNER}/${WWT_REPO_NAME}/${WWT_REPO_BRANCH}`;
const clampTimeoutMs = (value: number) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 20_000);

export const WWT_PUBLIC_ASSET_ROOT = `${WWT_REPO_BASE}/public`;
export const WWT_LOCAL_ASSET_ROOT =
  import.meta.env.VITE_WWT_LOCAL_ASSET_ROOT ?? `${import.meta.env.BASE_URL}wwv-assets`;
export const WWT_SOURCE_REPO_ROOT = `${WWT_REPO_NAME}/public`;

type WwtAssetPaths = {
  remote: string;
  local: string;
  source: string;
};

const normalizeAssetPath = (assetPath: string): string => assetPath.replace(/^\/+/, '').replace(/^public\//, '');

export function resolveWwtAssetPath(assetPath: string): WwtAssetPaths {
  const normalizedPath = normalizeAssetPath(assetPath);
  return {
    remote: `${WWT_PUBLIC_ASSET_ROOT}/${normalizedPath}`,
    local: `${WWT_LOCAL_ASSET_ROOT}/${normalizedPath}`,
    source: `${WWT_SOURCE_REPO_ROOT}/${normalizedPath}`
  };
}

export function getWwtAssetRemoteUrl(assetPath: string): string {
  return resolveWwtAssetPath(assetPath).remote;
}

export function getWwtAssetLocalUrl(assetPath: string): string {
  return resolveWwtAssetPath(assetPath).local;
}

export function getWwtAssetLocalCandidateUrls(assetPath: string): string[] {
  const normalizedPath = normalizeAssetPath(assetPath);
  const { local } = resolveWwtAssetPath(normalizedPath);
  return Array.from(
    new Set([
      local,
      `${WWT_LOCAL_ASSET_ROOT}/source-public/${normalizedPath}`,
      `${WWT_LOCAL_ASSET_ROOT}/data/${normalizedPath}`
    ])
  );
}

export function getWwtAssetSourcePath(assetPath: string): string {
  return resolveWwtAssetPath(assetPath).source.replace(/\/+$/, '');
}

export type WwtJsonFetchOptions = {
  fallbackToLocal?: boolean;
  init?: RequestInit;
  preferLocal?: boolean;
  timeoutMs?: number;
};

const createFetchRequest = (options: WwtJsonFetchOptions): RequestInit => ({
  cache: 'default',
  ...options.init
});

export async function fetchWwtJson<T>(assetPath: string, options: WwtJsonFetchOptions = {}): Promise<T> {
  const { fallbackToLocal = true, preferLocal = true, timeoutMs = 20_000 } = options;
  const effectiveTimeoutMs = clampTimeoutMs(timeoutMs);
  const { remote } = resolveWwtAssetPath(assetPath);
  const normalizedPath = normalizeAssetPath(assetPath);
  const localCandidates = getWwtAssetLocalCandidateUrls(normalizedPath);
  const fetchCandidates = Array.from(
    new Set(preferLocal ? [...localCandidates, remote] : [remote, ...(fallbackToLocal ? localCandidates : [])])
  );

  const withTimeout = async (url: string): Promise<Response> => {
    const timeoutSignal = AbortSignal.timeout ? AbortSignal.timeout(effectiveTimeoutMs) : null;

    if (timeoutSignal) {
      return fetch(url, {
        ...createFetchRequest(options),
        signal: timeoutSignal
      });
    }

    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), effectiveTimeoutMs);
    try {
      const response = await fetch(url, {
        ...createFetchRequest(options),
        signal: controller.signal
      });
      return response;
    } finally {
      globalThis.clearTimeout(timer);
    }
  };

  let lastError: unknown = null;
  for (const candidateUrl of fetchCandidates) {
    try {
      const response = await withTimeout(candidateUrl);
      if (!response.ok) {
        throw new Error(
          `WWT asset request failed for ${candidateUrl} with status ${response.status} (${response.statusText})`
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`WWT asset requests failed for ${fetchCandidates.join(', ')}; last error: ${String(lastError)}`);
}

export const WWT_ASSET_PATHS = {
  camerasDataset: 'cameras_geojson.json',
  militaryBasesDataset: 'military_bases.geojson',
  bordersDataset: 'borders.geojson',
  satellitesCatalog: 'satellites.json',
  planeIcon: 'plane-icon.svg',
  militaryPlaneIcon: 'military-plane-icon.svg',
  airplaneModel: 'airplane/scene.gltf',
  airplaneArchive: 'airplane.zip',
  aircraftLicense: 'airplane/license.txt',
  aircraftBin: 'airplane/scene.bin',
  worldWideLogo: 'logo/logo-full.png',
  worldWideIcon: 'logo/logo-icon.svg',
  worldWideIconAlt: 'logo/logo-icon.png',
  publicCamerasList: 'public-cameras.json',
  aircraftSamplesDataset: 'aircraft-samples.geojson'
} as const;
