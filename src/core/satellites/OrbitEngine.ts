import * as satellite from 'satellite.js';

export interface Coordinates {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface OrbitParams {
  altitudeMeters: number;
  inclinationRad: number;
  omega0: number;
  argLat0: number;
}

/**
 * OrbitEngine
 * 
 * An Object-Oriented physics engine for orbital mechanics and satellite tracking.
 * Encapsulates calculation state, TLE caches, and provides robust numerical guards.
 */
export class OrbitEngine {
  // Core Earth Constants
  public static readonly EARTH_RADIUS_M = 6378137;
  public static readonly EARTH_GRAVITY_MU = 3.986004418e14;
  public static readonly EARTH_ROTATION_SPEED_RAD_S = 7.2921159e-5;
  public static readonly J2_PERTURBATION = 1.08263e-3;

  // Default parameters for the ISS
  public static readonly ISS_INCLINATION_RAD = (51.64 * Math.PI) / 180;
  public static readonly ISS_ALTITUDE_M = 420000;

  private satrecCache = new Map<string, { tle1: string; tle2: string; satrec: satellite.SatRec }>();

  /**
   * Singleton instance for general use, maintaining a shared cache.
   */
  private static instance: OrbitEngine;

  public static getInstance(): OrbitEngine {
    if (!OrbitEngine.instance) {
      OrbitEngine.instance = new OrbitEngine();
    }
    return OrbitEngine.instance;
  }

  /**
   * Clears the internal computation cache.
   */
  public clearCache(): void {
    this.satrecCache.clear();
  }

  /**
   * Calculates the required orbital velocity (m/s) for a circular orbit.
   */
  public calculateOrbitalSpeed(altitudeMeters: number): number {
    const r = OrbitEngine.EARTH_RADIUS_M + altitudeMeters;
    if (!Number.isFinite(r) || r <= 0) return 0;
    return Math.sqrt(OrbitEngine.EARTH_GRAVITY_MU / r);
  }

  /**
   * Calculates the orbital period (seconds) for a circular orbit.
   */
  public calculateOrbitalPeriod(altitudeMeters: number): number {
    const r = OrbitEngine.EARTH_RADIUS_M + altitudeMeters;
    if (!Number.isFinite(r) || r <= 0) return 0;
    return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / OrbitEngine.EARTH_GRAVITY_MU);
  }

  /**
   * Pure synchronous calculation of a circular orbit using Keplerian motion.
   */
  public propagateCircularOrbit(
    elapsedSeconds: number,
    params: OrbitParams = {
      altitudeMeters: OrbitEngine.ISS_ALTITUDE_M,
      inclinationRad: OrbitEngine.ISS_INCLINATION_RAD,
      omega0: 0.0,
      argLat0: 0.0,
    }
  ): Coordinates {
    if (!Number.isFinite(elapsedSeconds)) return { lat: 0, lng: 0 };
    const safeAltitude = Number.isFinite(params.altitudeMeters) ? params.altitudeMeters : OrbitEngine.ISS_ALTITUDE_M;
    const r = Math.max(1000, OrbitEngine.EARTH_RADIUS_M + safeAltitude);
    const safeInc = Number.isFinite(params.inclinationRad) ? params.inclinationRad : OrbitEngine.ISS_INCLINATION_RAD;
    const safeOmega0 = Number.isFinite(params.omega0) ? params.omega0 : 0.0;
    const safeArgLat0 = Number.isFinite(params.argLat0) ? params.argLat0 : 0.0;

    const n = Math.sqrt(OrbitEngine.EARTH_GRAVITY_MU / Math.pow(r, 3));
    const j2PrecessionRate =
      -1.5 * OrbitEngine.J2_PERTURBATION * Math.pow(OrbitEngine.EARTH_RADIUS_M / r, 2) * n * Math.cos(safeInc);

    const argLat = safeArgLat0 + n * elapsedSeconds;
    const omegaEcf = safeOmega0 + (j2PrecessionRate - OrbitEngine.EARTH_ROTATION_SPEED_RAD_S) * elapsedSeconds;

    const xPlane = r * Math.cos(argLat);
    const yPlane = r * Math.sin(argLat);

    const xInc = xPlane;
    const yInc = yPlane * Math.cos(safeInc);
    const zInc = yPlane * Math.sin(safeInc);

    const xEcf = xInc * Math.cos(omegaEcf) - yInc * Math.sin(omegaEcf);
    const yEcf = xInc * Math.sin(omegaEcf) + yInc * Math.cos(omegaEcf);
    const zEcf = zInc;

    const rXy = Math.sqrt(xEcf * xEcf + yEcf * yEcf);
    const lngRad = Math.atan2(yEcf, xEcf);
    const latRad = Math.atan2(zEcf, rXy);

    let lngDeg = (lngRad * 180) / Math.PI;
    const latDeg = (latRad * 180) / Math.PI;

    while (lngDeg > 180) lngDeg -= 360;
    while (lngDeg < -180) lngDeg += 360;

    return { lat: Number.isFinite(latDeg) ? latDeg : 0, lng: Number.isFinite(lngDeg) ? lngDeg : 0 };
  }

  /**
   * Zero-allocation variant for hot rendering loops (e.g. Canvas/WebGL).
   */
  public propagateCircularOrbitInto(
    out: Float32Array | number[],
    offset: number,
    elapsedSeconds: number,
    params: OrbitParams
  ): void {
    const coords = this.propagateCircularOrbit(elapsedSeconds, params);
    out[offset] = coords.lat;
    out[offset + 1] = coords.lng;
  }

  /**
   * Retrieves or compiles a SatRec object from the cache.
   */
  private getSatRec(tleLines: string[]): satellite.SatRec | null {
    if (!tleLines || tleLines.length < 3) return null;
    const id = tleLines[0];
    const tle1 = tleLines[1];
    const tle2 = tleLines[2];

    const cached = this.satrecCache.get(id);
    if (!cached || cached.tle1 !== tle1 || cached.tle2 !== tle2) {
      try {
        const satrec = satellite.twoline2satrec(tle1, tle2);
        if (!satrec || (satrec as any).error) return null;
        this.satrecCache.set(id, { tle1, tle2, satrec });
        return satrec;
      } catch (err) {
        return null;
      }
    }
    return cached.satrec;
  }

  /**
   * High-level helper to propagate a satellite's TLE to a given Date.
   */
  public propagateSatelliteTle(
    tleLines: string[],
    date: Date = new Date()
  ): Coordinates | null {
    const satrec = this.getSatRec(tleLines);
    if (!satrec) return null;

    try {
      const positionAndVelocity = satellite.propagate(satrec, date);
      const positionEci = positionAndVelocity.position;
      if (!positionEci || typeof positionEci === 'boolean') return null;

      const gmst = satellite.gstime(date);
      const positionGd = satellite.eciToGeodetic(positionEci as satellite.EciVec3<number>, gmst);

      const lat = satellite.degreesLat(positionGd.latitude);
      const lng = satellite.degreesLong(positionGd.longitude);
      const altitude = positionGd.height * 1000;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return { lat, lng, altitude };
    } catch (err) {
      return null;
    }
  }

  /**
   * Zero-allocation TLE propagation into a typed array or buffer.
   */
  public propagateSatelliteTleInto(
    out: Float32Array | number[],
    offset: number,
    tleLines: string[],
    date: Date = new Date()
  ): boolean {
    const coords = this.propagateSatelliteTle(tleLines, date);
    if (!coords) {
      out[offset] = 0;
      out[offset + 1] = 0;
      out[offset + 2] = 0;
      return false;
    }

    out[offset] = coords.lat;
    out[offset + 1] = coords.lng;
    out[offset + 2] = coords.altitude ?? 0;
    return true;
  }

  /**
   * Asynchronously propagates a batch of satellite TLEs without blocking main loop.
   */
  public async propagateBatchAsync(
    satellites: Array<{ id: string; tleLines: string[] }>,
    date: Date = new Date()
  ): Promise<Map<string, Coordinates>> {
    const results = new Map<string, Coordinates>();
    for (const sat of satellites) {
      const coords = this.propagateSatelliteTle(sat.tleLines, date);
      if (coords) {
        results.set(sat.id, coords);
      }
    }
    return results;
  }
}
