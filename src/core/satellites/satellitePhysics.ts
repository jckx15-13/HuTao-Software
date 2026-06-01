import { OrbitEngine } from './OrbitEngine';

/**
 * Satellite Physics & Orbit Mechanics Simulation
 * Backward-compatible proxy to the OrbitEngine.
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
