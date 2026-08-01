export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

function dotProduct(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function scaleVector(s: number, v: Vector3): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function addVectors(v1: Vector3, v2: Vector3): Vector3 {
  return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
}

/**
 * Spherical Linear Interpolation (SLERP) between two 3D unit vectors.
 */
export function slerp(v1: Vector3, v2: Vector3, t: number): Vector3 {
  const cosTheta = dotProduct(v1, v2);

  if (cosTheta > 0.9995) {
    // Vectors are nearly parallel; standard linear interpolation avoids
    // division by a near-zero sinTheta below.
    return addVectors(scaleVector(1 - t, v1), scaleVector(t, v2));
  }

  const clampedCos = Math.max(-1, Math.min(1, cosTheta));
  const theta = Math.acos(clampedCos);
  const sinTheta = Math.sin(theta);
  const w1 = Math.sin((1 - t) * theta) / sinTheta;
  const w2 = Math.sin(t * theta) / sinTheta;

  return addVectors(scaleVector(w1, v1), scaleVector(w2, v2));
}

/**
 * Converts latitude/longitude coordinates (in degrees) to a 3D unit vector.
 */
export function latLngToVector(lat: number, lng: number): Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const cosLat = Math.cos(latRad);

  return {
    x: cosLat * Math.cos(lngRad),
    y: cosLat * Math.sin(lngRad),
    z: Math.sin(latRad)
  };
}

/**
 * Converts a 3D unit vector back to latitude/longitude coordinates (in degrees).
 */
export function vectorToLatLng(v: Vector3): LatLng {
  const latRad = Math.asin(v.z);
  const lngRad = Math.atan2(v.y, v.x);

  return {
    lat: (latRad * 180) / Math.PI,
    lng: (lngRad * 180) / Math.PI
  };
}

/**
 * Computes the geodetic latitude/longitude position for an orbiting body at a given step.
 * @param inclination Orbit inclination in radians
 * @param u Step (mean anomaly/argument of latitude) in radians
 */
export function orbitLatLng(inclination: number, u: number): LatLng {
  const latRad = Math.asin(Math.sin(inclination) * Math.sin(u));
  const lngRad = Math.atan2(Math.cos(inclination) * Math.sin(u), Math.cos(u));

  return {
    lat: (latRad * 180) / Math.PI,
    lng: (lngRad * 180) / Math.PI
  };
}

/**
 * Cubic Bezier easing curve. P0 = 0, P3 = 1.
 * @param p1 Control point 1 coordinate (0 to 1)
 * @param p2 Control point 2 coordinate (0 to 1)
 * @param t Time variable (0 to 1)
 */
export function bezierEase(p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  const w1 = 3 * mt * mt * t * p1;
  const w2 = 3 * mt * t * t * p2;
  const w3 = t * t * t;
  return w1 + w2 + w3;
}
