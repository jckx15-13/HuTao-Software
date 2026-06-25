import { fetchWwtJson, WWT_ASSET_PATHS } from "@/lib/wwt/repositoryData";
import type { SatelliteConfig } from "@/core/satellites/satelliteData";

type SatelliteCatalogPayload = {
  satellites?: unknown;
};

const DATASET_PATH = WWT_ASSET_PATHS.satellitesCatalog;
const ALLOWED_CATEGORIES = new Set([
  "spaceStations",
  "brightest",
  "weather",
  "gps",
  "earthObs",
  "starlink",
  "military",
  "other",
]);

function parseCategory(value: unknown): SatelliteConfig["category"] {
  if (ALLOWED_CATEGORIES.has(String(value))) {
    return String(value) as SatelliteConfig["category"];
  }
  return "other";
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function parseString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function toCatalogSatellites(payload: unknown): SatelliteConfig[] {
  const record = typeof payload === "object" && payload !== null ? payload : null;
  const list = Array.isArray((record as SatelliteCatalogPayload | null)?.satellites)
    ? ((record as SatelliteCatalogPayload).satellites as unknown[])
    : Array.isArray(record)
      ? (record as unknown[])
      : [];

  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }

  return list
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Record<string, unknown>;
      const id = parseString(item.id, parseString(item.name, "satellite"));
      const name = parseString(item.name, "Unnamed satellite");
      const noradId = parseString(item.noradId);
      const altitudeM = parseNumber(item.altitudeM, 0);
      const inclinationRad = parseNumber(item.inclinationRad, 0);
      const omega0 = parseNumber(item.omega0, 0);
      const argLat0 = parseNumber(item.argLat0, 0);
      const category = parseCategory(item.category);
      const color = parseString(item.color, "#94A3B8");
      const description = parseString(item.description, `Catalog orbit fallback for ${name}`);

      return [{
        id,
        name,
        noradId: noradId || undefined,
        category,
        altitudeM,
        inclinationRad,
        omega0,
        argLat0,
        color,
        description,
      }];
    })
    .filter((sat) => sat.name.length > 0);
}

let catalogCache: SatelliteConfig[] | null = null;
let catalogLoad: Promise<SatelliteConfig[]> | null = null;

async function resolveCatalog(
  onError?: (error: Error) => void,
): Promise<SatelliteConfig[]> {
  try {
    const payload = await fetchWwtJson<SatelliteCatalogPayload | SatelliteConfig[]>(DATASET_PATH, {
      init: { cache: "force-cache" },
    });
    const parsed = toCatalogSatellites(payload);
    return parsed;
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

export function clearSatelliteCatalogCache(): void {
  catalogCache = null;
  catalogLoad = null;
}

export async function getSatelliteCatalog(onError?: (error: Error) => void): Promise<SatelliteConfig[]> {
  if (catalogCache) return catalogCache;

  if (!catalogLoad) {
    catalogLoad = resolveCatalog(onError);
  }

  const catalog = await catalogLoad;
  catalogCache = catalog;
  catalogLoad = null;
  return catalog;
}
