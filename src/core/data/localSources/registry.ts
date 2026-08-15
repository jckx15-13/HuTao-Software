/**
 * LocalDataSource registry — discovers plugins with localData declarations
 * and resolves them to PluginDataSnapshot.
 *
 * Ported from worldwideview's Next.js `node:fs` server-side registry. This
 * app is a Vite/browser SPA with no Node server at runtime, so discovery and
 * reads are adapted to browser-native mechanisms:
 *   - Directory listing -> `import.meta.glob` (build-time static discovery
 *     of every `public/plugins-local/<id>/plugin.json`, no runtime readdir).
 *   - File reads -> `fetch()` against the Vite static server.
 *
 * Security: paths from manifests are constrained to same-origin `/plugins-local/`
 * or `/` relative paths; any path containing ".." is rejected before the fetch.
 */

import type { LocalDataSourceDeclaration, PluginDataSnapshot } from './types';
import { normalizeGeoJson } from './normalizers';
import { getCached, TTL_GEOJSON_MS, TTL_ROUTE_MS } from './cache';

const PLUGIN_ID_RE = /^[a-zA-Z0-9_-]+$/;

function validatePluginId(id: string): boolean {
  return PLUGIN_ID_RE.test(id);
}

interface RegistryEntry {
  pluginId: string;
  sources: LocalDataSourceDeclaration[];
}

// Only allow known source types — drop anything else at registry scan time.
const ALLOWED_SOURCE_TYPES = new Set(['geojson', 'route']);

// Vite-native static discovery: every public/plugins-local/<id>/plugin.json,
// resolved eagerly as raw text so we can JSON.parse it ourselves (manifests
// are untrusted input, same validation path as the fetch-based reader).
const manifestModules = import.meta.glob('/public/plugins-local/*/plugin.json', {
  query: '?raw',
  import: 'default',
  eager: false
});

// Memoized map: built once per session from the manifest glob.
let registryPromise: Promise<Map<string, RegistryEntry>> | null = null;

/**
 * Reads all generated plugin.json manifests declared under
 * public/plugins-local/<id>/ and returns a Map of { id -> RegistryEntry }
 * for those that declare localData.
 */
function getRegistry(): Promise<Map<string, RegistryEntry>> {
  if (registryPromise !== null) return registryPromise;

  registryPromise = (async () => {
    const map = new Map<string, RegistryEntry>();

    for (const loader of Object.values(manifestModules)) {
      let raw: unknown;
      try {
        raw = await loader();
      } catch {
        continue;
      }

      let manifest: Record<string, unknown>;
      try {
        manifest = JSON.parse(raw as string) as Record<string, unknown>;
      } catch {
        continue;
      }

      const id = manifest.id as string | undefined;
      if (typeof id !== 'string' || !validatePluginId(id)) continue;

      const localData = manifest.localData;
      if (!Array.isArray(localData) || localData.length === 0) continue;

      const sources = (localData as unknown[]).filter((s): s is LocalDataSourceDeclaration => {
        if (typeof s !== 'object' || s === null) return false;
        const src = s as Record<string, unknown>;
        return (
          typeof src.name === 'string' &&
          typeof src.type === 'string' &&
          ALLOWED_SOURCE_TYPES.has(src.type) &&
          typeof src.path === 'string'
        );
      });

      if (sources.length === 0) continue;

      map.set(id, { pluginId: id, sources });
    }

    return map;
  })();

  return registryPromise;
}

// ---------------------------------------------------------------------------
// Path guard (path traversal)
// ---------------------------------------------------------------------------

function isSafeRelativePath(p: string): boolean {
  return !p.includes('..');
}

// ---------------------------------------------------------------------------
// Source resolver helpers
// ---------------------------------------------------------------------------

/** Fetch a geojson source from public/ via the Vite static server. */
async function fetchGeojsonSource(sourcePath: string, pluginId: string, prefix: string): Promise<PluginDataSnapshot> {
  if (!isSafeRelativePath(sourcePath)) {
    throw new Error(`[localSources] Rejected unsafe path: ${sourcePath}`);
  }

  const relativePart = sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`;

  const res = await fetch(relativePart, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    return { pluginId, entities: [], timestamp: new Date() };
  }

  const parsed: unknown = await res.json();
  const entities = normalizeGeoJson(parsed, prefix, pluginId);

  return { pluginId, entities, timestamp: new Date() };
}

/** Fetch a route source via the app's own same-origin API. */
async function fetchRouteSource(sourcePath: string, pluginId: string, prefix: string): Promise<PluginDataSnapshot> {
  if (!isSafeRelativePath(sourcePath)) {
    throw new Error(`[localSources] Rejected unsafe path: ${sourcePath}`);
  }

  // SSRF guard: only relative paths (starting with "/") are allowed. An
  // absolute URL (containing "://") could reach an external host.
  if (!sourcePath.startsWith('/') || sourcePath.includes('://')) {
    throw new Error(`[localSources] Rejected non-relative route path: ${sourcePath}`);
  }

  const url = new URL(sourcePath, window.location.origin).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    return { pluginId, entities: [], timestamp: new Date() };
  }

  const parsed: unknown = await res.json();
  const entities = normalizeGeoJson(parsed, prefix, pluginId);

  return { pluginId, entities, timestamp: new Date() };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Returns true if the given plugin id has a localData declaration. */
export async function hasLocalSource(id: string): Promise<boolean> {
  const registry = await getRegistry();
  return registry.has(id);
}

/** Returns the Set of all plugin ids that have localData declarations. */
export async function getLocalSourceIds(): Promise<Set<string>> {
  const registry = await getRegistry();
  return new Set(registry.keys());
}

/**
 * Resolves ALL declared local sources for a plugin, merges entities from each,
 * and returns a single aggregated PluginDataSnapshot.
 *
 * Cache keys are scoped per source ("camera:default", "camera:traffic") so
 * each source has its own TTL, then combined at read time.
 */
export async function resolveLocalSnapshot(id: string): Promise<PluginDataSnapshot> {
  const registry = await getRegistry();
  const entry = registry.get(id);

  if (entry === undefined) {
    throw new Error(`[localSources] No local source registered for plugin: ${id}`);
  }

  const allEntities = await Promise.all(
    entry.sources.map((source) => {
      const cacheKey = `${id}:${source.name}`;
      const ttl = source.type === 'geojson' ? TTL_GEOJSON_MS : TTL_ROUTE_MS;

      return getCached(cacheKey, ttl, () => {
        if (source.type === 'geojson') {
          return fetchGeojsonSource(source.path, id, source.name);
        }
        return fetchRouteSource(source.path, id, source.name);
      });
    })
  );

  const mergedEntities = allEntities.flatMap((snap) => snap.entities);

  return {
    pluginId: id,
    entities: mergedEntities,
    timestamp: new Date()
  };
}

/** Exposed for testing: reset the memoized registry (allows re-scan in tests). */
export function _resetRegistry(): void {
  registryPromise = null;
}
