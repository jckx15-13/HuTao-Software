import { useEffect, useRef } from 'react';
import { currentSyncSource, setSyncSource } from './useWWTListener';
import { ecefToCelestial, raHoursToDegrees } from '@/lib/coordinateTransforms';
import type { Viewer } from 'cesium';

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
  cesiumViewer?: Viewer | null,
  postToWWT?: (message: Record<string, unknown>) => void,
  observationTime?: string,
) {
  const lastSyncTs = useRef<number>(0);

  useEffect(() => {
    if (!cesiumViewer || !postToWWT) return;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;

    const removeListener = cesiumViewer.camera?.changed?.addEventListener(() => {
      const now = Date.now();
      if (now - lastSyncTs.current < 50) return; // 50ms throttle
      lastSyncTs.current = now;

      if (currentSyncSource === 'wwt') {
        // Skip if WWT currently holds lock
        return;
      }

      const camera = cesiumViewer.camera;
      if (!camera) return;

      const cartographic = camera.positionCartographic;
      if (!cartographic) return;

      const direction = camera.directionWC;
      const date = observationTime ? new Date(observationTime) : new Date();
      if (!direction || !Number.isFinite(date.getTime())) return;
      const coordinates = ecefToCelestial(direction, date);
      const fovy = 'fovy' in camera.frustum ? camera.frustum.fovy : undefined;
      const fov = typeof fovy === 'number' ? fovy * 180 / Math.PI : calculateHorizonFOV(cartographic.height);
      setSyncSource('cesium');
      postToWWT({
        event: 'center_on_coordinates',
        ra: raHoursToDegrees(coordinates.ra),
        dec: coordinates.dec,
        fov,
        instant: true,
      });

      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        if (currentSyncSource === 'cesium') {
          setSyncSource('none');
        }
      }, 150);
    });

    return () => {
      clearTimeout(releaseTimer);
      if (currentSyncSource === 'cesium') setSyncSource('none');
      if (removeListener && typeof removeListener === 'function') {
        removeListener();
      }
    };
  }, [cesiumViewer, postToWWT, observationTime]);
}
