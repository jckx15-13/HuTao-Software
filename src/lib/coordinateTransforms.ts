/**
 * @file coordinateTransforms.ts
 * @description High-precision coordinate transformation library for celestial synchronization.
 * Handles the mapping between Cesium's Earth-Fixed (ECEF) system and WWT's Celestial (ICRS) system.
 */

const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
const MS_PER_DAY = 86400000;

export interface CelestialCoords {
  ra: number;    // Right Ascension in decimal hours (0 to 24)
  dec: number;   // Declination in decimal degrees (-90 to 90)
  roll: number;  // Roll in decimal degrees
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export function raHoursToDegrees(hours: number): number {
  return (((hours % 24) + 24) % 24) * 15;
}

export function raDegreesToHours(degrees: number): number {
  return (((degrees % 360) + 360) % 360) / 15;
}

/**
 * Calculates the Earth Rotation Angle (ERA) for a given date.
 * Based on IAU 2000 model.
 * @param date The Date object (UTC)
 * @returns ERA in radians
 */
export function getEarthRotationAngle(date: Date): number {
  const daysSinceJ2000 = (date.getTime() - J2000) / MS_PER_DAY;
  // ERA = 2π * (0.7790572732640 + 1.00273781191135448 * T)
  // where T is days since J2000.0
  const f = 0.7790572732640 + 1.00273781191135448 * daysSinceJ2000;
  let era = (2 * Math.PI * (f % 1));
  if (era < 0) era += 2 * Math.PI;
  return era;
}

/**
 * Converts a direction vector in Earth-Centered Fixed (ECEF) coordinates
 * to Celestial coordinates (RA/Dec) for a specific time.
 * @param direction Unit vector in ECEF pointing towards the target
 * @param date The UTC date/time of observation
 * @returns CelestialCoords object
 */
export function ecefToCelestial(direction: Vector3, date: Date): Omit<CelestialCoords, 'roll'> {
  const era = getEarthRotationAngle(date);
  
  // 1. Calculate latitude/longitude in ECEF (Spherical coordinates)
  // ECEF Z is north pole, X is Greenwich meridian, Y is 90E
  const lat = Math.asin(Math.max(-1, Math.min(1, direction.z)));
  const lng = Math.atan2(direction.y, direction.x);
  
  // 2. Convert to ECI (Inertial)
  // RA = Lng + ERA
  let raRad = lng + era;
  
  // 3. Normalize RA to [0, 2π]
  raRad = raRad % (2 * Math.PI);
  if (raRad < 0) raRad += 2 * Math.PI;
  
  // 4. Convert to units used by WWT
  const ra = (raRad * 12) / Math.PI;
  const dec = (lat * 180) / Math.PI;
  
  return { ra, dec };
}

/**
 * Converts Celestial coordinates (RA/Dec) to a direction unit vector
 * in Earth-Centered Fixed (ECEF) coordinates for a specific time.
 * @param coords CelestialCoords (RA in hours, Dec in degrees)
 * @param date The UTC date/time of observation
 * @returns Unit vector in ECEF
 */
export function celestialToEcef(coords: Omit<CelestialCoords, 'roll'>, date: Date): Vector3 {
  const era = getEarthRotationAngle(date);
  
  const raRad = (coords.ra * Math.PI) / 12;
  const decRad = (coords.dec * Math.PI) / 180;
  
  // 1. Convert to ECI (Inertial)
  const xECI = Math.cos(decRad) * Math.cos(raRad);
  const yECI = Math.cos(decRad) * Math.sin(raRad);
  const zECI = Math.sin(decRad);
  
  // 2. Convert to ECEF
  // Lng = RA - ERA
  const cosEra = Math.cos(era);
  const sinEra = Math.sin(era);
  
  // Rotation matrix around Z by -ERA
  // [ cos -sin 0 ]
  // [ sin  cos 0 ]
  // [ 0    0   1 ]
  // wait, rotation from ECI to ECEF is by -ERA
  const x = xECI * cosEra + yECI * sinEra;
  const y = yECI * cosEra - xECI * sinEra;
  const z = zECI;
  
  return { x, y, z };
}

/**
 * Normalizes a heading angle to [0, 360].
 */
export function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

/**
 * Converts decimal hours to HH:MM:SS string.
 */
export function formatRA(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h - m / 60) * 3600).toFixed(2);
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.padStart(5, '0')}s`;
}

/**
 * Converts decimal degrees to DD° MM' SS" string.
 */
export function formatDec(degrees: number): string {
  const sign = degrees < 0 ? '-' : '+';
  const absDeg = Math.abs(degrees);
  const d = Math.floor(absDeg);
  const m = Math.floor((absDeg - d) * 60);
  const s = ((absDeg - d - m / 60) * 3600).toFixed(2);
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.padStart(5, '0')}"`;
}
