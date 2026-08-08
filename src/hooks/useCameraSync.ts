import { useEffect, useRef } from 'react';
import { currentSyncSource, setSyncSource } from './useWWTListener';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Exact spherical horizon FOV derivation formula:
 * FOV = 2 * arcsin(R_E / (R_E + H))
 */
export function calculateHorizonFOV(altitudeMeters: number): number {
  if (altitudeMeters <= 0) return 60;
  const ratio = EARTH_RADIUS_METERS / (EARTH_RADIUS_METERS + altitudeMeters);
  const clampedRatio = Math.min(1, Math.max(0, ratio));
  const fovRad = 2 * Math.asin(clampedRatio);
  return (fovRad * 180) / Math.PI;
}

/**
 * Synchronizes camera parameters between Cesium 3D Globe and WWT All-Sky View.
 */
export function useCameraSync(
  cesiumViewer?: any,
  postToWWT?: (cmd: string, args: Record<string, unknown>) => void,
) {
  const lastSyncTs = useRef<number>(0);

  useEffect(() => {
    if (!cesiumViewer || !postToWWT) return;

    const removeListener = cesiumViewer.camera?.changed?.addEventListener(() => {
      const now = Date.now();
      if (now - lastSyncTs.current < 50) return; // 50ms throttle
      lastSyncTs.current = now;

      if (currentSyncSource === 'wwt') {
        // Skip if WWT currently holds lock
        return;
      }

      setSyncSource('cesium');

      const camera = cesiumViewer.camera;
      if (!camera) return;

      const cartographic = camera.positionCartographic;
      if (!cartographic) return;

      const alt = cartographic.height;
      const fov = calculateHorizonFOV(alt);

      // Convert lat/lon to RA/Dec
      const latDeg = (cartographic.latitude * 180) / Math.PI;
      const lonDeg = (cartographic.longitude * 180) / Math.PI;
      
      const ra = (lonDeg + 360) % 360;
      const dec = latDeg;

      postToWWT('set_view', {
        ra,
        dec,
        fov,
        instant: true,
      });

      setTimeout(() => {
        if (currentSyncSource === 'cesium') {
          setSyncSource('none');
        }
      }, 150);
    });

    return () => {
      if (removeListener && typeof removeListener === 'function') {
        removeListener();
      }
    };
  }, [cesiumViewer, postToWWT]);
}
