import type { PluginDataSnapshot } from './types';

/** 60-minute TTL for static GeoJSON file sources. */
export const TTL_GEOJSON_MS = 60 * 60 * 1000;

/** 60-second TTL for internal route sources (/api/...). */
export const TTL_ROUTE_MS = 60 * 1000;

interface CacheEntry {
  snapshot: PluginDataSnapshot;
  expiresAt: number;
}

/** Module-level cache — persists for the lifetime of the browser session. */
const cache = new Map<string, CacheEntry>();

/**
 * Returns a cached snapshot if one exists and has not expired.
 * Otherwise calls `fetcher`, stores the result, and returns it.
 */
export async function getCached(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<PluginDataSnapshot>
): Promise<PluginDataSnapshot> {
  const entry = cache.get(key);
  if (entry !== undefined && entry.expiresAt > Date.now()) {
    return entry.snapshot;
  }

  const snapshot = await fetcher();
  cache.set(key, { snapshot, expiresAt: Date.now() + ttlMs });
  return snapshot;
}

/** Exposed for testing: clear all cache entries. */
export function _clearCache(): void {
  cache.clear();
}
