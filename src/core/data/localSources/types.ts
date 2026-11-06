import type { GeoEntity } from '@/core/plugins/PluginTypes';

/**
 * A single browser-reachable data source declared by a plugin's plugin.json
 * manifest under `public/plugins-local/<id>/plugin.json`.
 */
export interface LocalDataSourceDeclaration {
  /** Distinct name per source within a plugin (e.g. "default", "traffic"). */
  name: string;
  /** "geojson" = static FeatureCollection file; "route" = internal API route. */
  type: 'geojson' | 'route';
  /** Path relative to `public/`, or starting with "/" for route sources. */
  path: string;
}

export interface PluginDataSnapshot {
  pluginId: string;
  entities: GeoEntity[];
  timestamp: Date;
}
