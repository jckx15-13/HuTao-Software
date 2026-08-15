/**
 * IAU constellation boundary regions, as native data for the Cesium celestial
 * layer. Kept free of Cesium imports so the geometry can be unit tested.
 *
 * IAU boundaries are defined as arcs of constant right ascension and constant
 * declination on the B1875.0 equinox. That means an extent (RA min/max, Dec
 * min/max) is a real — if coarse — subset of the true boundary, and densifying
 * along the constant-Dec edges reproduces the correct curved shape on the sky.
 * See constellationBoundaries.json `metadata` for provenance and the exact
 * simplification in force.
 */
import boundaryData from '@/data/astronomy/constellationBoundaries.json';

export interface ConstellationBoundary {
  id: string;
  name: string;
  abbreviation: string;
  geometry: 'extent';
  raHoursMin: number;
  raHoursMax: number;
  decDegreesMin: number;
  decDegreesMax: number;
  /** True when the region crosses RA 0h, e.g. Cassiopeia (22.95h -> 3.42h). */
  wrapsRaZero: boolean;
}

export interface BoundaryMetadata {
  authority: string;
  authorityUrl: string;
  sourceEpoch: string;
  storedEpoch: string;
  coverage: string;
  simplified: boolean;
  simplificationNote: string;
  license: string;
  attribution: string;
  offlinePriority: string;
}

export interface SkyPoint {
  raHours: number;
  decDegrees: number;
}

export const BOUNDARY_METADATA = boundaryData.metadata as BoundaryMetadata;
export const CONSTELLATION_BOUNDARIES = boundaryData.boundaries as ConstellationBoundary[];

const BOUNDARIES_BY_ID = new Map(CONSTELLATION_BOUNDARIES.map((b) => [b.id, b]));

export function getConstellationBoundary(id: string): ConstellationBoundary | undefined {
  return BOUNDARIES_BY_ID.get(id);
}

/** Width of a region in hours, accounting for a wrap through RA 0h. */
export function boundaryRaSpanHours(boundary: ConstellationBoundary): number {
  const raw = boundary.raHoursMax - boundary.raHoursMin;
  return boundary.wrapsRaZero ? raw + 24 : raw;
}

/**
 * Builds a closed ring of sky positions tracing the boundary.
 *
 * The constant-Dec edges are densified because a line of constant declination
 * is a small circle on the sky, not a great circle — drawing it as two
 * endpoints would cut a visibly wrong chord across the region.
 */
export function boundaryRingRaDec(boundary: ConstellationBoundary, segmentsPerEdge = 24): SkyPoint[] {
  const spanHours = boundaryRaSpanHours(boundary);
  const steps = Math.max(2, Math.floor(segmentsPerEdge));
  const ring: SkyPoint[] = [];

  const raAt = (fraction: number): number => (boundary.raHoursMin + spanHours * fraction) % 24;

  // Southern edge, west -> east.
  for (let i = 0; i <= steps; i++) {
    ring.push({ raHours: raAt(i / steps), decDegrees: boundary.decDegreesMin });
  }
  // Northern edge, east -> west, closing the ring.
  for (let i = steps; i >= 0; i--) {
    ring.push({ raHours: raAt(i / steps), decDegrees: boundary.decDegreesMax });
  }
  // Explicitly close back onto the first vertex.
  ring.push({ raHours: ring[0].raHours, decDegrees: ring[0].decDegrees });

  return ring;
}

/** True when the given sky position falls inside the region. */
export function boundaryContains(boundary: ConstellationBoundary, point: SkyPoint): boolean {
  if (point.decDegrees < boundary.decDegreesMin || point.decDegrees > boundary.decDegreesMax) {
    return false;
  }
  const ra = ((point.raHours % 24) + 24) % 24;
  return boundary.wrapsRaZero
    ? ra >= boundary.raHoursMin || ra <= boundary.raHoursMax
    : ra >= boundary.raHoursMin && ra <= boundary.raHoursMax;
}

/**
 * Whether a constellation is the operator's currently selected region.
 *
 * This is the single source of truth shared by the projected SVG viewport and
 * the Cesium scene, so the two renderers can never disagree about which region
 * is highlighted.
 */
export function isActiveConstellationRegion(
  presetId: string,
  presetName: string,
  constellation: { id: string; name: string }
): boolean {
  const normalizedPresetId = String(presetId || '').toLowerCase();
  const normalizedPresetName = String(presetName || '').toLowerCase();
  const constellationId = constellation.id.replace(/_/g, '-').toLowerCase();
  const constellationFirstWord = constellation.name.toLowerCase().split(' ')[0];

  if (!constellationId || !constellationFirstWord) return false;

  return normalizedPresetId.includes(constellationId) || normalizedPresetName.includes(constellationFirstWord);
}
