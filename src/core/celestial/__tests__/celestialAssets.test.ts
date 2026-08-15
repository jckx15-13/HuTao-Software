import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SURVEY,
  SURVEYS,
  getSurveyByLayerValue,
  paletteForLayer,
  resolveSurveyImagery
} from '../SurveyRegistry';
import {
  MEDIA_CATALOG,
  angularSeparationDegrees,
  getMediaById,
  mediaForConstellation,
  mediaNear,
  resolveMediaThumbnail
} from '../mediaCatalog';
import { ASSET_MANIFEST, assetsByPriority, summarizeAssetAvailability } from '../assetManifest';
import { boundaryContains, getConstellationBoundary } from '../constellationBoundaries';

const nothingMirrored = () => false;
const everythingMirrored = () => true;

describe('survey registry', () => {
  it('exposes every survey the telescope panel can select', () => {
    const layerValues = SURVEYS.map((s) => s.layerValue);
    // These are the exact values the existing BACKGROUND_LAYERS control writes.
    expect(layerValues).toContain('3D Solar System View');
    expect(layerValues).toContain('Digitized Sky Survey (Color)');
    expect(layerValues).toContain('Visible Imagery');
    expect(layerValues).toContain('Hubble Space Telescope Imagery');
    expect(layerValues).toContain('RASS: ROSAT All Sky Survey (X-ray)');
    expect(layerValues).toContain('Planck Dust & Gas');
    expect(layerValues).toContain('VLSS: VLA Low-frequency Sky Survey (Radio)');
  });

  it('gives every survey a licence and attribution', () => {
    for (const survey of SURVEYS) {
      expect(survey.license.length, `${survey.id} licence`).toBeGreaterThan(0);
      expect(survey.attribution.length, `${survey.id} attribution`).toBeGreaterThan(0);
      expect(['required', 'preferred', 'optional']).toContain(survey.offlinePriority);
    }
  });

  it('falls back to the default survey for unknown or missing layers', () => {
    expect(getSurveyByLayerValue('not-a-survey')).toBe(DEFAULT_SURVEY);
    expect(getSurveyByLayerValue(null)).toBe(DEFAULT_SURVEY);
    expect(getSurveyByLayerValue(undefined)).toBe(DEFAULT_SURVEY);
  });

  it('returns a usable palette for every known and unknown layer', () => {
    for (const survey of SURVEYS) {
      expect(paletteForLayer(survey.layerValue).star).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(paletteForLayer('nonsense').grid).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('reports a survey as unavailable rather than substituting another survey', () => {
    const rass = getSurveyByLayerValue('RASS: ROSAT All Sky Survey (X-ray)');
    const result = resolveSurveyImagery(rass, nothingMirrored);
    expect(result.state).toBe('unavailable');
    if (result.state === 'unavailable') {
      expect(result.reason).toContain('not mirrored locally');
    }
  });

  it('reports imagery as ready once it is mirrored', () => {
    const rass = getSurveyByLayerValue('RASS: ROSAT All Sky Survey (X-ray)');
    const result = resolveSurveyImagery(rass, everythingMirrored);
    expect(result).toEqual({ state: 'ready', source: '/astronomy/surveys/rass-allsky.jpg' });
  });

  it('treats a survey with no preview as unavailable, not broken', () => {
    const solarSystem = getSurveyByLayerValue('3D Solar System View');
    const result = resolveSurveyImagery(solarSystem, everythingMirrored);
    expect(result.state).toBe('unavailable');
    if (result.state === 'unavailable') {
      expect(result.reason).toContain('no all-sky preview');
    }
  });
});

describe('media catalog', () => {
  it('keeps every entry at a valid J2000 sky position', () => {
    for (const entry of MEDIA_CATALOG) {
      expect(entry.raHours, `${entry.id} RA`).toBeGreaterThanOrEqual(0);
      expect(entry.raHours, `${entry.id} RA`).toBeLessThan(24);
      expect(entry.decDegrees, `${entry.id} Dec`).toBeGreaterThanOrEqual(-90);
      expect(entry.decDegrees, `${entry.id} Dec`).toBeLessThanOrEqual(90);
    }
  });

  it('gives every entry attribution, licence and a source page', () => {
    for (const entry of MEDIA_CATALOG) {
      expect(entry.attribution.length, `${entry.id}`).toBeGreaterThan(0);
      expect(entry.license.length, `${entry.id}`).toBeGreaterThan(0);
      expect(entry.sourcePageUrl).toMatch(/^https:\/\//);
    }
  });

  it('uses unique ids', () => {
    expect(new Set(MEDIA_CATALOG.map((e) => e.id)).size).toBe(MEDIA_CATALOG.length);
  });

  it('places catalogued objects inside the constellation they claim', () => {
    // M42 is in Orion and M81 is in Ursa Major; this cross-checks the media
    // coordinates against the independently sourced boundary data.
    for (const entry of MEDIA_CATALOG.filter((e) => e.constellationId)) {
      const boundary = getConstellationBoundary(entry.constellationId!);
      expect(boundary, `${entry.id} references unknown constellation`).toBeDefined();
      expect(
        boundaryContains(boundary!, { raHours: entry.raHours, decDegrees: entry.decDegrees }),
        `${entry.name} is outside ${entry.constellationId}`
      ).toBe(true);
    }
  });

  it('looks entries up by id and by constellation', () => {
    expect(getMediaById('m42-orion-nebula')?.name).toBe('Orion Nebula');
    expect(getMediaById('does-not-exist')).toBeUndefined();
    expect(mediaForConstellation('orion').map((e) => e.id)).toContain('m42-orion-nebula');
    expect(mediaForConstellation('nonexistent')).toEqual([]);
  });

  it('always falls back to the procedural pin when nothing is mirrored', () => {
    for (const entry of MEDIA_CATALOG) {
      const resolution = resolveMediaThumbnail(entry, nothingMirrored);
      expect(resolution.state).toBe('procedural');
    }
  });
});

describe('angularSeparationDegrees', () => {
  it('is zero for a position against itself', () => {
    expect(angularSeparationDegrees({ raHours: 5.5, decDegrees: 10 }, { raHours: 5.5, decDegrees: 10 })).toBeCloseTo(
      0,
      6
    );
  });

  it('measures the pole-to-pole separation as 180 degrees', () => {
    expect(angularSeparationDegrees({ raHours: 0, decDegrees: 90 }, { raHours: 12, decDegrees: -90 })).toBeCloseTo(
      180,
      6
    );
  });

  it('measures a pole-to-equator separation as 90 degrees', () => {
    expect(angularSeparationDegrees({ raHours: 0, decDegrees: 90 }, { raHours: 6, decDegrees: 0 })).toBeCloseTo(90, 6);
  });

  it('finds nearby catalogue entries and excludes distant ones', () => {
    const nearM42 = mediaNear({ raHours: 5.5881, decDegrees: -5.3911 }, 1);
    expect(nearM42.map((e) => e.id)).toEqual(['m42-orion-nebula']);

    const wide = mediaNear({ raHours: 5.5881, decDegrees: -5.3911 }, 40);
    expect(wide.map((e) => e.id)).toContain('m1-crab-nebula');
    // Nearest-first ordering.
    expect(wide[0].id).toBe('m42-orion-nebula');
  });
});

describe('asset manifest', () => {
  it('gives every record a source, licence, attribution and offline priority', () => {
    for (const record of ASSET_MANIFEST) {
      expect(record.sourceUrl, `${record.id} sourceUrl`).toMatch(/^https:\/\//);
      expect(record.license.length, `${record.id} licence`).toBeGreaterThan(0);
      expect(record.attribution.length, `${record.id} attribution`).toBeGreaterThan(0);
      expect(['required', 'preferred', 'optional']).toContain(record.offlinePriority);
      expect(['tile', 'catalog', 'icon', 'model', 'media']).toContain(record.kind);
    }
  });

  it('uses unique record ids', () => {
    expect(new Set(ASSET_MANIFEST.map((r) => r.id)).size).toBe(ASSET_MANIFEST.length);
  });

  it('never claims a checksum or retrieval time for an unmirrored asset', () => {
    // A null checksum means "not verified" and must not be confused with
    // "verified empty".
    for (const record of ASSET_MANIFEST) {
      if (record.sha256 === null) {
        expect(record.retrievedAt).toBeNull();
      }
    }
  });

  it('includes the three local catalogues as required assets', () => {
    const required = assetsByPriority('required').map((r) => r.id);
    expect(required).toContain('catalog:constellation-boundaries');
    expect(required).toContain('catalog:media');
    expect(required).toContain('catalog:surveys');
  });

  it('reports everything missing when nothing is mirrored', () => {
    const summary = summarizeAssetAvailability(nothingMirrored);
    expect(summary.total).toBe(ASSET_MANIFEST.length);
    expect(summary.mirrored).toBe(0);
    expect(summary.missing).toBe(ASSET_MANIFEST.length);
    expect(summary.missingRequired.length).toBeGreaterThan(0);
  });

  it('counts an unmirrored media thumbnail as missing, not present', () => {
    // Those records carry an empty localPath; a naive check would treat them
    // as satisfied by any hasLocalAsset implementation that returns true.
    const summary = summarizeAssetAvailability(everythingMirrored);
    const emptyPathRecords = ASSET_MANIFEST.filter((r) => !r.localPath).length;
    expect(emptyPathRecords).toBeGreaterThan(0);
    expect(summary.missing).toBe(emptyPathRecords);
    expect(summary.mirrored).toBe(ASSET_MANIFEST.length - emptyPathRecords);
  });
});
