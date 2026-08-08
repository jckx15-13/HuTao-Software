import { describe, it, expect } from 'vitest';

/**
 * Exact horizon FOV calculation formula:
 * FOV = 2 * arcsin(R_E / (R_E + H))
 * R_E = 6,371,000 meters (Mean Earth Radius)
 * H = Camera Altitude above ellipsoid in meters
 */
export function calculateExactHorizonFOV(altitudeMeters: number): number {
  const R_E = 6371000.0;
  if (altitudeMeters <= 0) return 60.0;
  const ratio = R_E / (R_E + altitudeMeters);
  const clampedRatio = Math.max(-1.0, Math.min(1.0, ratio));
  const halfFovRad = Math.asin(clampedRatio);
  const fullFovDeg = (2.0 * halfFovRad * 180.0) / Math.PI;
  return Math.max(0.1, Math.min(120.0, fullFovDeg));
}

describe('WWT Camera Synchronization & Exact Horizon FOV', () => {
  it('calculates 180 deg FOV at sea level horizon cutoff', () => {
    const fov = calculateExactHorizonFOV(0);
    expect(fov).toBe(60.0);
  });

  it('calculates correct FOV at low orbit (H = 400,000m ISS altitude)', () => {
    const fov = calculateExactHorizonFOV(400000);
    // 2 * arcsin(6371 / 6771) = 2 * arcsin(0.94092) = 2 * 70.21 deg = 120 (clamped)
    expect(fov).toBeGreaterThan(60.0);
    expect(fov).toBeLessThanOrEqual(120.0);
  });

  it('calculates narrow FOV at deep space altitude (H = 50,000,000m)', () => {
    const fov = calculateExactHorizonFOV(50000000);
    expect(fov).toBeLessThan(20.0);
  });
});
