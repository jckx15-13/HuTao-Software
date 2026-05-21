/**
 * Simulation Library
 * Pure functional calculations for orbital mechanics and physics tracking.
 */

// Core Constants
export const EARTH_RADIUS_M = 6378137; // WGS-84 Earth equatorial radius
export const EARTH_GRAVITY_MU = 3.986004418e14; // GM (m^3/s^2)
export const EARTH_ROTATION_SPEED_RAD_S = 7.2921159e-5; // Angular velocity of Earth
export const J2_PERTURBATION = 1.08263e-3; // J2 zonal harmonic constant

// Orbital parameters for the ISS (default elements)
export const ISS_INCLINATION_RAD = (51.64 * Math.PI) / 180; // 51.64 degrees
export const ISS_ALTITUDE_M = 420000; // ~420km average orbit altitude

/**
 * Calculates orbital velocity for a circular orbit at a given altitude.
 * Formula: v = sqrt(GM / r)
 */
export function calculateOrbitalSpeed(altitudeMeters: number): number {
  const r = EARTH_RADIUS_M + altitudeMeters;
  return Math.sqrt(EARTH_GRAVITY_MU / r);
}

/**
 * Calculates the orbital period in seconds for a circular orbit at a given altitude.
 * Formula: T = 2 * pi * sqrt(r^3 / GM)
 */
export function calculateOrbitalPeriod(altitudeMeters: number): number {
  const r = EARTH_RADIUS_M + altitudeMeters;
  return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / EARTH_GRAVITY_MU);
}

/**
 * Propagates circular orbit coordinates for a given elapsed time.
 * This is a pure function that integrates Keplerian motion and Earth rotation.
 * 
 * @param elapsedSeconds Seconds elapsed since epoch
 * @param altitudeMeters Height of the satellite above Earth's surface
 * @param inclinationRad Orbit inclination in radians
 * @param omega0 Ascending node longitude at epoch (radians)
 * @param argLat0 Argument of latitude (mean anomaly) at epoch (radians)
 */
export function propagateCircularOrbit(
  elapsedSeconds: number,
  altitudeMeters: number = ISS_ALTITUDE_M,
  inclinationRad: number = ISS_INCLINATION_RAD,
  omega0: number = 0.0,
  argLat0: number = 0.0
): { lat: number; lng: number } {
  const r = EARTH_RADIUS_M + altitudeMeters;
  
  // 1. Mean motion (angular frequency in radians per second)
  const n = Math.sqrt(EARTH_GRAVITY_MU / Math.pow(r, 3));
  
  // 2. Precession of the nodes due to Earth's oblateness (J2 effect)
  const j2PrecessionRate = 
    -1.5 * J2_PERTURBATION * Math.pow(EARTH_RADIUS_M / r, 2) * n * Math.cos(inclinationRad);
  
  // 3. Update argument of latitude (position along the orbital track)
  const argLat = argLat0 + n * elapsedSeconds;
  
  // 4. Update longitude of ascending node relative to a rotating Earth
  // Omega_ecf(t) = Omega0 + (J2_precession - Earth_rotation) * t
  const omegaEcf = omega0 + (j2PrecessionRate - EARTH_ROTATION_SPEED_RAD_S) * elapsedSeconds;
  
  // 5. Plane coordinates (satellite position in its own orbit plane)
  const xPlane = r * Math.cos(argLat);
  const yPlane = r * Math.sin(argLat);
  
  // 6. Rotate orbit plane by inclination around the X-axis
  const xInc = xPlane;
  const yInc = yPlane * Math.cos(inclinationRad);
  const zInc = yPlane * Math.sin(inclinationRad);
  
  // 7. Rotate around Z-axis by the earth-relative node longitude
  const xEcf = xInc * Math.cos(omegaEcf) - yInc * Math.sin(omegaEcf);
  const yEcf = xInc * Math.sin(omegaEcf) + yInc * Math.cos(omegaEcf);
  const zEcf = zInc;
  
  // 8. Convert ECF Cartesian coordinates to Geodetic Latitude and Longitude
  const rXy = Math.sqrt(xEcf * xEcf + yEcf * yEcf);
  const lngRad = Math.atan2(yEcf, xEcf);
  const latRad = Math.atan2(zEcf, rXy);
  
  // 9. Convert to degrees and normalize longitude to [-180, 180]
  let lngDeg = (lngRad * 180) / Math.PI;
  const latDeg = (latRad * 180) / Math.PI;
  
  // Normalize longitude
  while (lngDeg > 180) lngDeg -= 360;
  while (lngDeg < -180) lngDeg += 360;
  
  return {
    lat: latDeg,
    lng: lngDeg,
  };
}
