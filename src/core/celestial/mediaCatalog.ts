/**
 * RA/Dec media catalogue for the native celestial layer's media pins.
 *
 * Positions and attribution are local and always available. Thumbnails are
 * optional: an entry with no mirrored thumbnail renders SilverWolf's
 * procedural pin, so the catalogue degrades cleanly offline instead of
 * emitting a request that will fail.
 *
 * Cesium-free by design so it can be unit tested directly.
 */
import mediaData from '@/data/astronomy/mediaCatalog.json';
import type { OfflinePriority } from './SurveyRegistry';
import type { SkyPoint } from './constellationBoundaries';

export interface MediaEntry {
  id: string;
  name: string;
  catalogId: string;
  /** J2000 right ascension in decimal hours (0-24). */
  raHours: number;
  /** J2000 declination in decimal degrees (-90..+90). */
  decDegrees: number;
  type: string;
  constellationId: string | null;
  thumbnail: string | null;
  sourcePageUrl: string;
  attribution: string;
  license: string;
  offlinePriority: OfflinePriority;
}

export const MEDIA_METADATA = mediaData.metadata;
export const MEDIA_CATALOG = mediaData.media as MediaEntry[];

const MEDIA_BY_ID = new Map(MEDIA_CATALOG.map((entry) => [entry.id, entry]));

export function getMediaById(id: string): MediaEntry | undefined {
  return MEDIA_BY_ID.get(id);
}

export function mediaForConstellation(constellationId: string): MediaEntry[] {
  return MEDIA_CATALOG.filter((entry) => entry.constellationId === constellationId);
}

/**
 * Great-circle separation between two sky positions, in degrees.
 *
 * Uses the haversine form rather than `acos` of the dot product. For nearly
 * coincident positions the dot product approaches 1, where `acos` loses about
 * half its significant digits and reports a spurious separation of order
 * milliarcseconds for a point against itself. Haversine stays accurate at
 * small angles and is still exact at 180 degrees.
 */
export function angularSeparationDegrees(a: SkyPoint, b: SkyPoint): number {
  const toRad = Math.PI / 180;
  const ra1 = a.raHours * 15 * toRad;
  const ra2 = b.raHours * 15 * toRad;
  const dec1 = a.decDegrees * toRad;
  const dec2 = b.decDegrees * toRad;

  const sinHalfDec = Math.sin((dec2 - dec1) / 2);
  const sinHalfRa = Math.sin((ra2 - ra1) / 2);
  const h = sinHalfDec * sinHalfDec + Math.cos(dec1) * Math.cos(dec2) * sinHalfRa * sinHalfRa;

  // Clamp before asin: accumulated float error can push this just past 1.
  return (2 * Math.asin(Math.min(1, Math.sqrt(Math.max(0, h))))) / toRad;
}

/** Catalogue entries within `radiusDegrees` of a position, nearest first. */
export function mediaNear(point: SkyPoint, radiusDegrees: number): MediaEntry[] {
  return MEDIA_CATALOG.map((entry) => ({
    entry,
    separation: angularSeparationDegrees(point, entry)
  }))
    .filter((candidate) => candidate.separation <= radiusDegrees)
    .sort((a, b) => a.separation - b.separation)
    .map((candidate) => candidate.entry);
}

export type ThumbnailResolution = { state: 'mirrored'; source: string } | { state: 'procedural'; reason: string };

/**
 * Decides what a pin should display. Never returns a remote URL: if an image
 * has not been mirrored locally, the caller draws the procedural pin.
 */
export function resolveMediaThumbnail(
  entry: MediaEntry,
  hasLocalAsset: (localPath: string) => boolean
): ThumbnailResolution {
  if (!entry.thumbnail) {
    return { state: 'procedural', reason: `${entry.name} has no mirrored thumbnail.` };
  }
  if (!hasLocalAsset(entry.thumbnail)) {
    return {
      state: 'procedural',
      reason: `${entry.name} thumbnail missing from local mirror (${entry.thumbnail}).`
    };
  }
  return { state: 'mirrored', source: entry.thumbnail };
}
