import * as PhysicsPS from '../purescript/output/Physics/index.js';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Spherical Linear Interpolation (SLERP) between two 3D unit vectors.
 * Implemented in PureScript.
 */
export function slerp(v1: Vector3, v2: Vector3, t: number): Vector3 {
  return PhysicsPS.slerp(v1)(v2)(t);
}

/**
 * Converts latitude/longitude coordinates (in degrees) to a 3D unit vector.
 * Implemented in PureScript.
 */
export function latLngToVector(lat: number, lng: number): Vector3 {
  return PhysicsPS.latLngToVector(lat)(lng);
}

/**
 * Converts a 3D unit vector back to latitude/longitude coordinates (in degrees).
 * Implemented in PureScript.
 */
export function vectorToLatLng(v: Vector3): LatLng {
  return PhysicsPS.vectorToLatLng(v);
}

/**
 * Computes the geodetic latitude/longitude position for an orbiting body at a given step.
 * Implemented in PureScript.
 * @param inclination Orbit inclination in radians
 * @param u Step (mean anomaly/argument of latitude) in radians
 */
export function orbitLatLng(inclination: number, u: number): LatLng {
  return PhysicsPS.orbitLatLng(inclination)(u);
}

/**
 * Cubic Bezier easing curve.
 * Implemented in PureScript.
 * @param p1 Control point 1 coordinate (0 to 1)
 * @param p2 Control point 2 coordinate (0 to 1)
 * @param t Time variable (0 to 1)
 */
export function bezierEase(p1: number, p2: number, t: number): number {
  return PhysicsPS.bezierEase(p1)(p2)(t);
}
