/**
 * Unified asset manifest for the native celestial layer.
 *
 * Every image, catalogue and dataset the layer can draw is described here with
 * its source, licence, local path, checksum and offline behaviour. The manifest
 * is derived from the individual data files rather than hand-maintained, so a
 * new survey or media entry cannot be shipped without provenance.
 *
 * `sha256` and `retrievedAt` stay null until a file is actually mirrored — a
 * null checksum means "not verified", never "verified empty".
 */
import { SURVEYS } from './SurveyRegistry';
import type { OfflinePriority } from './SurveyRegistry';
import { MEDIA_CATALOG } from './mediaCatalog';
import { BOUNDARY_METADATA } from './constellationBoundaries';

export type AssetKind = 'tile' | 'catalog' | 'icon' | 'model' | 'media';

export interface AssetRecord {
  id: string;
  kind: AssetKind;
  sourceUrl: string;
  localPath: string;
  sha256: string | null;
  /** ISO-8601 timestamp of the mirror, or null when never mirrored. */
  retrievedAt: string | null;
  license: string;
  attribution: string;
  offlinePriority: OfflinePriority;
}

function surveyRecords(): AssetRecord[] {
  return SURVEYS.filter((survey) => survey.allSkyPreview !== null).map((survey) => ({
    id: `survey:${survey.id}`,
    kind: 'tile' as const,
    sourceUrl: survey.allSkyPreview!.sourceUrl,
    localPath: survey.allSkyPreview!.localPath,
    sha256: survey.allSkyPreview!.sha256,
    retrievedAt: null,
    license: survey.license,
    attribution: survey.attribution,
    offlinePriority: survey.offlinePriority
  }));
}

function mediaRecords(): AssetRecord[] {
  return MEDIA_CATALOG.map((entry) => ({
    id: `media:${entry.id}`,
    kind: 'media' as const,
    sourceUrl: entry.sourcePageUrl,
    localPath: entry.thumbnail ?? '',
    sha256: null,
    retrievedAt: null,
    license: entry.license,
    attribution: entry.attribution,
    offlinePriority: entry.offlinePriority
  }));
}

function catalogRecords(): AssetRecord[] {
  return [
    {
      id: 'catalog:constellation-boundaries',
      kind: 'catalog',
      sourceUrl: BOUNDARY_METADATA.authorityUrl,
      localPath: 'src/data/astronomy/constellationBoundaries.json',
      sha256: null,
      retrievedAt: null,
      license: BOUNDARY_METADATA.license,
      attribution: BOUNDARY_METADATA.attribution,
      offlinePriority: BOUNDARY_METADATA.offlinePriority as OfflinePriority
    },
    {
      id: 'catalog:media',
      kind: 'catalog',
      sourceUrl: 'https://science.nasa.gov/',
      localPath: 'src/data/astronomy/mediaCatalog.json',
      sha256: null,
      retrievedAt: null,
      license: 'Coordinates are factual data and not copyrightable.',
      attribution: 'NASA/ESA/CSA object catalogues.',
      offlinePriority: 'required'
    },
    {
      id: 'catalog:surveys',
      kind: 'catalog',
      sourceUrl: 'https://docs.worldwidetelescope.org/data-guide/1/data-file-formats/',
      localPath: 'src/data/astronomy/surveys.json',
      sha256: null,
      retrievedAt: null,
      license: 'Registry metadata authored for SilverWolf; each survey records its own licence.',
      attribution: 'SilverWolf survey registry.',
      offlinePriority: 'required'
    }
  ];
}

export function buildAssetManifest(): AssetRecord[] {
  return [...catalogRecords(), ...surveyRecords(), ...mediaRecords()];
}

export const ASSET_MANIFEST: AssetRecord[] = buildAssetManifest();

export function assetsByPriority(priority: OfflinePriority): AssetRecord[] {
  return ASSET_MANIFEST.filter((record) => record.offlinePriority === priority);
}

export interface AssetAvailabilitySummary {
  total: number;
  mirrored: number;
  missing: number;
  /** Records marked `required` that are not present locally. */
  missingRequired: AssetRecord[];
}

/**
 * Reports what is actually on disk. This is what the telescope data
 * configuration surface shows an operator, so a missing required asset is
 * called out rather than being absorbed into a generic "degraded" state.
 */
export function summarizeAssetAvailability(hasLocalAsset: (localPath: string) => boolean): AssetAvailabilitySummary {
  // A record with no localPath (an un-mirrored media thumbnail) is by
  // definition not present.
  const present = (record: AssetRecord) => Boolean(record.localPath) && hasLocalAsset(record.localPath);

  const mirrored = ASSET_MANIFEST.filter(present);
  const missing = ASSET_MANIFEST.filter((record) => !present(record));

  return {
    total: ASSET_MANIFEST.length,
    mirrored: mirrored.length,
    missing: missing.length,
    missingRequired: missing.filter((record) => record.offlinePriority === 'required')
  };
}
