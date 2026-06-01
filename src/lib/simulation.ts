import { OrbitEngine, OrbitParams } from '../core/satellites/OrbitEngine';

/**
 * Simulation Library
 * Backward-compatible proxy module for orbital mechanics.
 * Delegated to the new OOP-based OrbitEngine instance.
 */

const engine = OrbitEngine.getInstance();

export const EARTH_RADIUS_M = OrbitEngine.EARTH_RADIUS_M;
export const EARTH_GRAVITY_MU = OrbitEngine.EARTH_GRAVITY_MU;
export const EARTH_ROTATION_SPEED_RAD_S = OrbitEngine.EARTH_ROTATION_SPEED_RAD_S;
export const J2_PERTURBATION = OrbitEngine.J2_PERTURBATION;

export const ISS_INCLINATION_RAD = OrbitEngine.ISS_INCLINATION_RAD;
export const ISS_ALTITUDE_M = OrbitEngine.ISS_ALTITUDE_M;

export function calculateOrbitalSpeed(altitudeMeters: number): number {
  return engine.calculateOrbitalSpeed(altitudeMeters);
}

export function calculateOrbitalPeriod(altitudeMeters: number): number {
  return engine.calculateOrbitalPeriod(altitudeMeters);
}

export function propagateCircularOrbit(
  elapsedSeconds: number,
  altitudeMeters: number = ISS_ALTITUDE_M,
  inclinationRad: number = ISS_INCLINATION_RAD,
  omega0: number = 0.0,
  argLat0: number = 0.0
): { lat: number; lng: number } {
  return engine.propagateCircularOrbit(elapsedSeconds, {
    altitudeMeters,
    inclinationRad,
    omega0,
    argLat0
  });
}

export function propagateCircularOrbitInto(
  out: Float32Array | number[],
  offset: number,
  elapsedSeconds: number,
  altitudeMeters: number = ISS_ALTITUDE_M,
  inclinationRad: number = ISS_INCLINATION_RAD,
  omega0: number = 0.0,
  argLat0: number = 0.0
): void {
  engine.propagateCircularOrbitInto(out, offset, elapsedSeconds, {
    altitudeMeters,
    inclinationRad,
    omega0,
    argLat0
  });
}

export function propagateSatelliteTle(
  tleLines: string[],
  date: Date = new Date()
): { lat: number; lng: number; altitude: number } | null {
  const result = engine.propagateSatelliteTle(tleLines, date);
  if (!result) return null;
  return { lat: result.lat, lng: result.lng, altitude: result.altitude ?? 0 };
}

export function propagateSatelliteTleInto(
  out: Float32Array | number[],
  offset: number,
  tleLines: string[],
  date: Date = new Date()
): boolean {
  return engine.propagateSatelliteTleInto(out, offset, tleLines, date);
}

// Support for async batch processing
export async function propagateBatchAsync(
  satellites: Array<{ id: string; tleLines: string[] }>,
  date: Date = new Date()
) {
  return engine.propagateBatchAsync(satellites, date);
}
