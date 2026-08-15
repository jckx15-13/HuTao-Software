import { describe, expect, it } from 'vitest';
import { constellations } from '@/data/constellations';
import {
  BOUNDARY_METADATA,
  CONSTELLATION_BOUNDARIES,
  boundaryContains,
  boundaryRaSpanHours,
  boundaryRingRaDec,
  getConstellationBoundary,
  isActiveConstellationRegion
} from '../constellationBoundaries';

describe('boundary dataset integrity', () => {
  it('covers every constellation that the scene renders', () => {
    for (const constellation of constellations) {
      expect(getConstellationBoundary(constellation.id), `missing boundary for ${constellation.id}`).toBeDefined();
    }
  });

  it('keeps every region inside valid sky coordinates', () => {
    for (const boundary of CONSTELLATION_BOUNDARIES) {
      expect(boundary.raHoursMin).toBeGreaterThanOrEqual(0);
      expect(boundary.raHoursMin).toBeLessThan(24);
      expect(boundary.raHoursMax).toBeGreaterThanOrEqual(0);
      expect(boundary.raHoursMax).toBeLessThan(24);
      expect(boundary.decDegreesMin).toBeGreaterThanOrEqual(-90);
      expect(boundary.decDegreesMax).toBeLessThanOrEqual(90);
      expect(boundary.decDegreesMin).toBeLessThan(boundary.decDegreesMax);
    }
  });

  it('flags a region as wrapping only when its RA actually decreases', () => {
    for (const boundary of CONSTELLATION_BOUNDARIES) {
      const decreases = boundary.raHoursMax < boundary.raHoursMin;
      expect(boundary.wrapsRaZero).toBe(decreases);
    }
  });

  it('declares its provenance and the simplification in force', () => {
    // Provenance is a hard requirement for shipped astronomy data: an operator
    // must be able to see where a boundary came from and how exact it is.
    expect(BOUNDARY_METADATA.sourceEpoch).toBe('B1875');
    expect(BOUNDARY_METADATA.storedEpoch).toBe('J2000');
    expect(BOUNDARY_METADATA.authorityUrl).toMatch(/^https:\/\//);
    expect(BOUNDARY_METADATA.simplified).toBe(true);
    expect(BOUNDARY_METADATA.simplificationNote.length).toBeGreaterThan(0);
    expect(BOUNDARY_METADATA.license.length).toBeGreaterThan(0);
  });
});

describe('boundaryRaSpanHours', () => {
  it('measures a normal region directly', () => {
    const orion = getConstellationBoundary('orion')!;
    expect(boundaryRaSpanHours(orion)).toBeCloseTo(6.4167 - 4.7167, 4);
  });

  it('measures a wrapping region across RA 0h', () => {
    // Cassiopeia runs 22.95h -> 3.42h, i.e. 4.47h wide, not -19.53h.
    const cassiopeia = getConstellationBoundary('cassiopeia')!;
    expect(boundaryRaSpanHours(cassiopeia)).toBeCloseTo(4.47, 4);
    expect(boundaryRaSpanHours(cassiopeia)).toBeGreaterThan(0);
  });
});

describe('boundaryRingRaDec', () => {
  const orion = () => getConstellationBoundary('orion')!;

  it('returns a closed ring', () => {
    const ring = boundaryRingRaDec(orion());
    expect(ring.length).toBeGreaterThan(4);
    expect(ring[0].raHours).toBeCloseTo(ring[ring.length - 1].raHours, 9);
    expect(ring[0].decDegrees).toBeCloseTo(ring[ring.length - 1].decDegrees, 9);
  });

  it('densifies the constant-declination edges rather than cutting a chord', () => {
    // A line of constant Dec is a small circle, so intermediate vertices are
    // required for the drawn region to match the real boundary.
    const ring = boundaryRingRaDec(orion(), 24);
    const southernEdge = ring.filter((p) => p.decDegrees === orion().decDegreesMin);
    expect(southernEdge.length).toBeGreaterThanOrEqual(25);
  });

  it('touches both declination limits and no others', () => {
    const boundary = orion();
    const decs = new Set(boundaryRingRaDec(boundary).map((p) => p.decDegrees));
    expect([...decs].sort((a, b) => a - b)).toEqual([boundary.decDegreesMin, boundary.decDegreesMax]);
  });

  it('keeps every vertex on a valid right ascension', () => {
    for (const boundary of CONSTELLATION_BOUNDARIES) {
      for (const point of boundaryRingRaDec(boundary)) {
        expect(point.raHours).toBeGreaterThanOrEqual(0);
        expect(point.raHours).toBeLessThan(24);
      }
    }
  });

  it('walks a wrapping region through RA 0h', () => {
    const ring = boundaryRingRaDec(getConstellationBoundary('cassiopeia')!, 24);
    // The ring must contain vertices on both sides of the 0h meridian.
    expect(ring.some((p) => p.raHours > 22.9)).toBe(true);
    expect(ring.some((p) => p.raHours < 3.5)).toBe(true);
  });
});

describe('boundaryContains', () => {
  it('accepts a position inside a normal region', () => {
    // Betelgeuse: RA 5.919h, Dec +7.407deg — inside Orion.
    expect(boundaryContains(getConstellationBoundary('orion')!, { raHours: 5.919, decDegrees: 7.407 })).toBe(true);
  });

  it('rejects a position outside the declination range', () => {
    expect(boundaryContains(getConstellationBoundary('orion')!, { raHours: 5.919, decDegrees: 60 })).toBe(false);
  });

  it('rejects a position outside the right ascension range', () => {
    expect(boundaryContains(getConstellationBoundary('orion')!, { raHours: 12, decDegrees: 7.4 })).toBe(false);
  });

  it('handles a wrapping region on both sides of 0h', () => {
    const cassiopeia = getConstellationBoundary('cassiopeia')!;
    expect(boundaryContains(cassiopeia, { raHours: 23.5, decDegrees: 60 })).toBe(true);
    expect(boundaryContains(cassiopeia, { raHours: 1.0, decDegrees: 60 })).toBe(true);
    // 12h is on the far side of the sky from Cassiopeia.
    expect(boundaryContains(cassiopeia, { raHours: 12, decDegrees: 60 })).toBe(false);
  });

  it('normalizes out-of-range right ascension before testing', () => {
    const orion = getConstellationBoundary('orion')!;
    expect(boundaryContains(orion, { raHours: 5.919 + 24, decDegrees: 7.407 })).toBe(true);
    expect(boundaryContains(orion, { raHours: 5.919 - 24, decDegrees: 7.407 })).toBe(true);
  });
});

describe('isActiveConstellationRegion', () => {
  const orion = { id: 'orion', name: 'Orion' };
  const ursaMajor = { id: 'ursa_major', name: 'Ursa Major' };

  it('matches on preset id', () => {
    expect(isActiveConstellationRegion('orion-nebula', 'M42', orion)).toBe(true);
  });

  it('matches on preset name', () => {
    expect(isActiveConstellationRegion('m42', 'Orion Nebula', orion)).toBe(true);
  });

  it('matches an underscore id against its hyphenated preset form', () => {
    expect(isActiveConstellationRegion('ursa-major-bode', 'M81', ursaMajor)).toBe(true);
  });

  it('does not match an unrelated preset', () => {
    expect(isActiveConstellationRegion('crab-nebula', 'Crab Nebula', orion)).toBe(false);
  });

  it('is safe with empty input', () => {
    expect(isActiveConstellationRegion('', '', orion)).toBe(false);
  });
});
