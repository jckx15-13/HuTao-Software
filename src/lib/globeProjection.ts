/**
 * @file globeProjection.ts
 * @description High-performance module for orthographic 3D globe projections.
 * Precomputes spherical to Cartesian coordinates in Float32Arrays to avoid
 * high-frequency trigonometric calculations (sin, cos) in 60 FPS animation loops.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectResult {
  x: number;
  y: number;
  visible: boolean;
  z: number;
}

// Pre-defined set of (lat, lng) coordinates representing simplified global landmasses
export const LANDMASS_POINTS: [number, number][] = [
  // North America
  [45, -100], [55, -120], [60, -110], [50, -90], [35, -100], [30, -110], [40, -120],
  [45, -80], [35, -85], [30, -90], [25, -80], [20, -100], [65, -150], [60, -140],
  [55, -60], [50, -65], [70, -100], [75, -80],
  // Greenland
  [75, -40], [70, -40], [80, -30], [65, -50],
  // South America
  [-5, -60], [-15, -60], [-25, -60], [-35, -65], [-45, -70], [-50, -70],
  [-10, -50], [-20, -50], [-5, -70], [5, -70], [5, -60],
  // Africa
  [25, 15], [25, 25], [20, 10], [15, 15], [15, 30], [5, 20], [5, 30],
  [-5, 20], [-15, 25], [-25, 25], [-30, 20], [10, 40], [5, 45], [0, 40],
  [30, 5], [30, 30], [20, -10], [15, -15],
  // Madagascar
  [-20, 47],
  // Europe
  [45, 15], [50, 10], [50, 20], [55, 15], [60, 20], [60, 10], [65, 15],
  [40, -5], [40, 15], [38, 25], [38, 30], [60, -10],
  // Asia
  [55, 40], [60, 50], [65, 60], [70, 70], [60, 80], [55, 90], [65, 100],
  [60, 120], [65, 130], [60, 140], [55, 150], [50, 160], [50, 140],
  [45, 80], [45, 100], [40, 90], [40, 110], [35, 105], [30, 110],
  [35, 120], [35, 135], [40, 135], [35, 75], [30, 75], [25, 80],
  [20, 80], [22, 90], [15, 100], [15, 105], [10, 105], [5, 100],
  [15, 120], [10, 120], [5, 115], [0, 115], [-5, 120],
  [15, 45], [20, 45], [25, 45], [20, 55], [15, 55],
  // Australia
  [-25, 135], [-30, 140], [-20, 130], [-25, 145], [-30, 115], [-20, 115],
  // New Zealand
  [-40, 175], [-45, 170],
];

/**
 * Converts latitude and longitude degrees into a 3D unit vector.
 */
export function latLngToVector(lat: number, lng: number): Vector3D {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.cos(lambda),
    y: Math.cos(phi) * Math.sin(lambda),
    z: Math.sin(phi),
  };
}

// Precomputes the 3D unit vectors for all continent landmarks
export const LANDMASS_POINTS_3D = new Float32Array(LANDMASS_POINTS.length * 3);
for (let i = 0; i < LANDMASS_POINTS.length; i++) {
  const [lat, lng] = LANDMASS_POINTS[i];
  const v = latLngToVector(lat, lng);
  LANDMASS_POINTS_3D[i * 3] = v.x;
  LANDMASS_POINTS_3D[i * 3 + 1] = v.y;
  LANDMASS_POINTS_3D[i * 3 + 2] = v.z;
}

// Precomputes Meridians: longitudinal grid lines
// -180 to 180 by step of 30 degrees. Latitude step of 5 degrees (-90 to 90 = 37 points)
export const MERIDIANS_3D: Float32Array[] = [];
for (let lng = -180; lng < 180; lng += 30) {
  const points = new Float32Array(37 * 3);
  let idx = 0;
  for (let lat = -90; lat <= 90; lat += 5) {
    const v = latLngToVector(lat, lng);
    points[idx++] = v.x;
    points[idx++] = v.y;
    points[idx++] = v.z;
  }
  MERIDIANS_3D.push(points);
}

// Precomputes Parallels: latitudinal grid lines
// -60 to 60 by step of 30 degrees. Longitude step of 5 degrees (-180 to 180 = 73 points)
export const PARALLELS_3D: Float32Array[] = [];
for (let lat = -60; lat <= 60; lat += 30) {
  const points = new Float32Array(73 * 3);
  let idx = 0;
  for (let lng = -180; lng <= 180; lng += 5) {
    const v = latLngToVector(lat, lng);
    points[idx++] = v.x;
    points[idx++] = v.y;
    points[idx++] = v.z;
  }
  PARALLELS_3D.push(points);
}

/**
 * Projects a precomputed 3D unit vector onto 2D screen space.
 * Avoids any trigonometric evaluations by consuming cached sin/cos of rotation and tilt.
 * 
 * Rotation is around Z-axis (earth rotation), tilt is around X-axis (axial tilt).
 */
export function projectUnitVector(
  vx: number,
  vy: number,
  vz: number,
  sinRot: number,
  cosRot: number,
  sinTilt: number,
  cosTilt: number,
  radius: number,
  cx: number,
  cy: number
): ProjectResult {
  // Rotate around Y/Z axis based on earth's rotation angle lambda0
  // In our coordinates, x3d is rotated using longitudes
  const x3d = vx * cosRot - vy * sinRot;
  const y3d = vz; // original z is y3d in target space
  const z3d = vy * cosRot + vx * sinRot;

  // Rotate around X-axis by elevation tilt angle (theta)
  const x = x3d;
  const y = y3d * cosTilt - z3d * sinTilt;
  const z = y3d * sinTilt + z3d * cosTilt;

  return {
    x: cx + x * radius,
    y: cy - y * radius, // Invert Y for canvas coordinate system
    visible: z >= 0,
    z,
  };
}

/**
 * Fallback projection utility that converts raw lat/lng on-the-fly.
 * Useful for dynamic targets like satellites, landmarks, or the cursor.
 */
export function projectLatLng(
  lat: number,
  lng: number,
  rotationRad: number,
  tiltRad: number,
  radius: number,
  cx: number,
  cy: number
): ProjectResult {
  const v = latLngToVector(lat, lng);
  const sinRot = Math.sin(rotationRad);
  const cosRot = Math.cos(rotationRad);
  const sinTilt = Math.sin(tiltRad);
  const cosTilt = Math.cos(tiltRad);

  return projectUnitVector(v.x, v.y, v.z, sinRot, cosRot, sinTilt, cosTilt, radius, cx, cy);
}

/**
 * Spherical linear interpolation (SLERP) between two 3D vectors.
 */
export function slerp(v1: Vector3D, v2: Vector3D, t: number): Vector3D {
  let dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  dot = Math.max(-1, Math.min(1, dot));
  const theta = Math.acos(dot);
  if (Math.abs(theta) < 0.001) {
    return {
      x: v1.x + t * (v2.x - v1.x),
      y: v1.y + t * (v2.y - v1.y),
      z: v1.z + t * (v2.z - v1.z),
    };
  }
  const sinTheta = Math.sin(theta);
  const w1 = Math.sin((1 - t) * theta) / sinTheta;
  const w2 = Math.sin(t * theta) / sinTheta;
  return {
    x: w1 * v1.x + w2 * v2.x,
    y: w1 * v1.y + w2 * v2.y,
    z: w1 * v1.z + w2 * v2.z,
  };
}
