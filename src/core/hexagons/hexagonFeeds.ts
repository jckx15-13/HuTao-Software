import type { GeoEntity, CesiumEntityOptions } from "@/core/plugins/PluginTypes";

export interface HexGridCell {
  latIndex: number;
  lngIndex: number;
  count: number;
  entities: GeoEntity[];
}

/**
 * Groups a collection of spatial entities (lat/lng coordinates) into a hexagonal grid.
 * Useful for cluster/density visualization feeds using 3D hexagons.
 * 
 * @param entities Input spatial entities
 * @param cellSizeDegrees Dimensions of each hexagonal grid cell in degrees
 */
export function generateHexagonDensityFeed(
  entities: GeoEntity[],
  cellSizeDegrees: number = 20
): Array<{ entity: GeoEntity; options: CesiumEntityOptions }> {
  const cells = new Map<string, HexGridCell>();

  for (const entity of entities) {
    const latIndex = Math.floor(entity.latitude / cellSizeDegrees);
    const lngIndex = Math.floor(entity.longitude / cellSizeDegrees);
    const cellKey = `${latIndex}_${lngIndex}`;

    let cell = cells.get(cellKey);
    if (!cell) {
      cell = { latIndex, lngIndex, count: 0, entities: [] };
      cells.set(cellKey, cell);
    }
    cell.count += 1;
    cell.entities.push(entity);
  }

  return Array.from(cells.entries()).map(([key, cell]) => {
    const centerLat = (cell.latIndex + 0.5) * cellSizeDegrees;
    const centerLng = (cell.lngIndex + 0.5) * cellSizeDegrees;

    const densityEntity: GeoEntity = {
      id: `hexfeed-${key}`,
      pluginId: "spatial-hexfeed",
      latitude: centerLat,
      longitude: centerLng,
      altitude: 0,
      timestamp: new Date(),
      label: `Density Cell: ${cell.count} objects`,
      properties: {
        mag: Math.max(1, cell.count * 1.5), // Maps count to magnitude height
        place: `Hex Grid Cell (${centerLat.toFixed(1)}, ${centerLng.toFixed(1)})`,
        count: cell.count,
        rawEntity: cell.entities
      }
    };

    const options: CesiumEntityOptions = {
      type: "hexagon",
      color: cell.count > 5 ? "#ea4335" : cell.count > 2 ? "#fbbc05" : "#34a853", // Red, Yellow, Green based on density
      size: Math.max(8, cell.count * 4),
      labelText: `C:${cell.count}`,
      labelFont: "bold 8px monospace"
    };

    return { entity: densityEntity, options };
  });
}
