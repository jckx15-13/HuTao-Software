/**
 * wwv.worker.ts
 * Offloads heavy orbital propagation and globe projection math from the main thread.
 * Used for the 2D Fallback WWV Globe.
 */

import { propagateSatelliteTleInto, propagateCircularOrbitInto } from '../lib/simulation';
import { LANDMASS_POINTS_3D, projectUnitVectorInto } from '../lib/globeProjection';

// Local cache for TLE data to avoid repeated lookups
const tleCache: Record<string, string[]> = {};

onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'propagate_satellites') {
    const { satellites, timestamp, rotation, tilt, radius, cx, cy } = payload;
    const results = satellites.map((sat: any) => {
      const orbitOut = new Float32Array(2); // [lat, lng]
      let success = false;
      
      if (sat.tle) {
        success = propagateSatelliteTleInto(orbitOut, 0, sat.tle, new Date(timestamp));
      }
      
      if (!success) {
        // Fallback to circular orbit if TLE is missing or fails
        propagateCircularOrbitInto(
          orbitOut, 
          0, 
          timestamp / 1000, 
          sat.altitudeM || 420000, 
          sat.inclinationRad || 0.9, 
          sat.omega0 || 0, 
          sat.argLat0 || 0
        );
      }

      const lat = orbitOut[0];
      const lng = orbitOut[1];
      
      // Projection math (inlined or imported)
      const phi = (lat * Math.PI) / 180;
      const lambda = (lng * Math.PI) / 180;
      const vx = Math.cos(phi) * Math.cos(lambda);
      const vy = Math.cos(phi) * Math.sin(lambda);
      const vz = Math.sin(phi);

      const sinRot = Math.sin(rotation);
      const cosRot = Math.cos(rotation);
      const sinTilt = Math.sin(tilt);
      const cosTilt = Math.cos(tilt);

      const pointOut = new Float32Array(3);
      projectUnitVectorInto(pointOut, 0, vx, vy, vz, sinRot, cosRot, sinTilt, cosTilt, radius, cx, cy);

      return {
        id: sat.id,
        x: pointOut[0],
        y: pointOut[1],
        z: pointOut[2],
        lat,
        lng,
        visible: pointOut[2] >= 0
      };
    });

    postMessage({ type: 'satellite_results', payload: results });
  }

  if (type === 'project_landmass') {
    const { rotation, tilt, radius, cx, cy } = payload;
    const sinRot = Math.sin(rotation);
    const cosRot = Math.cos(rotation);
    const sinTilt = Math.sin(tilt);
    const cosTilt = Math.cos(tilt);

    const pointsLen = LANDMASS_POINTS_3D.length;
    const results = new Float32Array(pointsLen); // [x, y, z, x, y, z, ...]

    for (let i = 0; i < pointsLen; i += 3) {
      projectUnitVectorInto(
        results,
        i,
        LANDMASS_POINTS_3D[i],
        LANDMASS_POINTS_3D[i + 1],
        LANDMASS_POINTS_3D[i + 2],
        sinRot,
        cosRot,
        sinTilt,
        cosTilt,
        radius,
        cx,
        cy
      );
    }

    postMessage({ type: 'landmass_results', payload: results }, [results.buffer] as any);
  }
};
