/**
 * Fixture tests for the celestial math the native renderer depends on.
 * These are deterministic: every case pins an explicit date, so nothing here
 * depends on the wall clock.
 */
import { describe, expect, it } from 'vitest';
import { getGreenwichMeanSiderealDegrees, projectTelescopeTargetToEarth } from '../earthObserverProjection';
import {
  formatDec,
  formatRA,
  normalizeAngle,
  precessEquatorialJ2000ToDate,
  raHoursToDegrees
} from '../coordinateTransforms';

/** The J2000.0 epoch: 2000-01-01 12:00:00, i.e. JD 2451545.0. */
const J2000 = new Date('2000-01-01T12:00:00.000Z');

describe('getGreenwichMeanSiderealDegrees', () => {
  it('returns the J2000 constant at the epoch itself', () => {
    // GMST = 280.46061837 + 360.98564736629 * D, and D === 0 at the epoch.
    expect(getGreenwichMeanSiderealDegrees(J2000)).toBeCloseTo(280.46061837, 6);
  });

  it('advances by one sidereal rotation per solar day', () => {
    const oneDayLater = new Date(J2000.getTime() + 86_400_000);
    const delta = getGreenwichMeanSiderealDegrees(oneDayLater) - getGreenwichMeanSiderealDegrees(J2000);
    // A solar day is ~360.9856 degrees of sidereal rotation, not 360.
    expect(((delta % 360) + 360) % 360).toBeCloseTo(0.98564736629, 6);
  });

  it('always returns a normalized angle', () => {
    const samples = [
      new Date('1970-01-01T00:00:00.000Z'),
      new Date('2026-08-09T00:00:00.000Z'),
      new Date('2099-12-31T23:59:59.000Z')
    ];
    for (const date of samples) {
      const gmst = getGreenwichMeanSiderealDegrees(date);
      expect(gmst).toBeGreaterThanOrEqual(0);
      expect(gmst).toBeLessThan(360);
    }
  });
});

describe('projectTelescopeTargetToEarth', () => {
  const date = new Date('2026-08-09T00:00:00.000Z');

  it('maps declination straight onto the subpoint latitude', () => {
    expect(projectTelescopeTargetToEarth(6, 23.5, date).latitudeDegrees).toBeCloseTo(23.5, 9);
  });

  it('clamps declination to the poles instead of wrapping past them', () => {
    expect(projectTelescopeTargetToEarth(6, 120, date).latitudeDegrees).toBe(90);
    expect(projectTelescopeTargetToEarth(6, -120, date).latitudeDegrees).toBe(-90);
  });

  it('places the subpoint longitude at RA minus GMST', () => {
    const projection = projectTelescopeTargetToEarth(12, 0, date);
    const expected = raHoursToDegrees(12) - getGreenwichMeanSiderealDegrees(date);
    // Both describe the same angle; compare on the circle so a +/-360
    // representation difference does not fail the assertion.
    const difference = Math.abs((((projection.longitudeDegrees - expected) % 360) + 360) % 360);
    expect(Math.min(difference, 360 - difference)).toBeCloseTo(0, 6);
  });

  it('keeps the subpoint longitude inside a single revolution', () => {
    for (let raHours = 0; raHours < 24; raHours += 1) {
      const { longitudeDegrees } = projectTelescopeTargetToEarth(raHours, 0, date);
      expect(longitudeDegrees).toBeGreaterThanOrEqual(-180);
      expect(longitudeDegrees).toBeLessThanOrEqual(180);
    }
  });
});

describe('precessEquatorialJ2000ToDate', () => {
  it('is a no-op at the J2000 epoch', () => {
    const precessed = precessEquatorialJ2000ToDate({ ra: 5.5, dec: -5.4 }, J2000);
    expect(precessed.ra).toBeCloseTo(5.5, 6);
    expect(precessed.dec).toBeCloseTo(-5.4, 6);
  });

  it('keeps declination physically valid near the pole', () => {
    const precessed = precessEquatorialJ2000ToDate({ ra: 6, dec: 89.9 }, new Date('2050-01-01T00:00:00.000Z'));
    expect(precessed.dec).toBeLessThanOrEqual(90);
    expect(precessed.dec).toBeGreaterThanOrEqual(-90);
  });

  it('keeps right ascension inside a single revolution', () => {
    const precessed = precessEquatorialJ2000ToDate({ ra: 23.99, dec: 10 }, new Date('2100-01-01T12:00:00.000Z'));
    expect(precessed.ra).toBeGreaterThanOrEqual(0);
    expect(precessed.ra).toBeLessThan(24);
  });
});

describe('coordinate helpers', () => {
  it('normalizes angles onto a single revolution', () => {
    expect(normalizeAngle(370)).toBeCloseTo(normalizeAngle(10), 9);
    expect(normalizeAngle(-350)).toBeCloseTo(normalizeAngle(10), 9);
  });

  it('signs declination explicitly', () => {
    expect(formatDec(23.5).trim()).toMatch(/^\+/);
    expect(formatDec(-23.5).trim()).toMatch(/^-/);
  });

  it('formats right ascension as a string', () => {
    expect(typeof formatRA(13.42)).toBe('string');
    expect(formatRA(13.42).length).toBeGreaterThan(0);
  });

  it('converts RA hours to degrees on a 15x scale', () => {
    expect(raHoursToDegrees(0)).toBe(0);
    expect(raHoursToDegrees(6)).toBe(90);
    expect(raHoursToDegrees(12)).toBe(180);
    expect(raHoursToDegrees(18)).toBe(270);
  });

  it('wraps right ascension onto a single revolution', () => {
    // 24h and 0h are the same point on the sky, so the wrap is intended.
    expect(raHoursToDegrees(24)).toBe(0);
    expect(raHoursToDegrees(25)).toBe(15);
    expect(raHoursToDegrees(-1)).toBe(345);
  });
});
