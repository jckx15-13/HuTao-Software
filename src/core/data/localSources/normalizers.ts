import type { GeoEntity } from '@/core/plugins/PluginTypes';

const DEFAULT_LOCAL_SOURCE_ALT = 8;

interface GeoJsonFeature {
  geometry?: { coordinates?: number[] };
  properties?: Record<string, unknown>;
}

interface GeoJsonFeatureCollection {
  features?: unknown[];
}

/**
 * Converts a GeoJSON FeatureCollection (parsed from a fetched local asset)
 * into a GeoEntity[]. Returns [] for malformed or empty input — never throws.
 *
 * GeoJSON coordinate order is [longitude, latitude] — swapping these is the
 * primary footgun when porting this logic.
 */
export function normalizeGeoJson(input: unknown, prefix: string, pluginId: string): GeoEntity[] {
  if (typeof input !== 'object' || input === null) return [];

  const collection = input as GeoJsonFeatureCollection;
  if (!Array.isArray(collection.features)) return [];

  const entities: GeoEntity[] = [];

  for (let index = 0; index < collection.features.length; index++) {
    const feature = collection.features[index] as GeoJsonFeature;
    if (typeof feature !== 'object' || feature === null) continue;

    const [lon = 0, lat = 0] = feature.geometry?.coordinates ?? [];
    const props: Record<string, unknown> = feature.properties ?? {};

    const label =
      (props.name as string | undefined) ||
      (props.city as string | undefined) ||
      (props.country as string | undefined) ||
      'Unknown';

    entities.push({
      id: `${pluginId}-${prefix}-${index}`,
      pluginId,
      latitude: lat,
      longitude: lon,
      altitude: DEFAULT_LOCAL_SOURCE_ALT,
      timestamp: new Date(),
      label,
      properties: { ...props }
    });
  }

  return entities;
}
