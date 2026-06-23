import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '../store/uiStore';
import { ecefToCelestial, celestialToEcef, raHoursToDegrees } from '../lib/coordinateTransforms';

const MIN_WWT_FOV_DEGREES = 0.25;
const MAX_WWT_FOV_DEGREES = 60;
const EARTH_RADIUS_METERS = 6_378_137;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cameraHeightToWwtFovDegrees(camera: Cesium.Camera): number {
  const cartographic = Cesium.Cartographic.fromCartesian(camera.positionWC);
  const height = Number.isFinite(cartographic.height) ? Math.max(0, cartographic.height) : EARTH_RADIUS_METERS;
  const horizonAngleRadians = 2 * Math.atan(EARTH_RADIUS_METERS / Math.max(EARTH_RADIUS_METERS, height));
  const fov = Cesium.Math.toDegrees(horizonAngleRadians);
  return clamp(fov, MIN_WWT_FOV_DEGREES, MAX_WWT_FOV_DEGREES);
}

/**
 * useCameraSync Hook
 * Handles bidirectional synchronization between Cesium (Earth) and WWT (Stars).
 * Implements a Mutex lock to prevent infinite feedback loops.
 */
export function useCameraSync(
  viewer: Cesium.Viewer | null,
  postToWWT: (msg: any) => void
) {
  const syncSource = useUIStore((s) => s.syncSource);
  const setSyncSource = useUIStore((s) => s.setSyncSource);
  const setTelescopeTelemetry = useUIStore((s) => s.setTelescopeTelemetry);
  const telescopeTelemetry = useUIStore((s) => s.telescopeTelemetry);

  const lastSyncTimeRef = useRef(0);
  const SYNC_THROTTLE_MS = 32; // ~30fps synchronization

  // 1. Sync from Cesium to WWT
  useEffect(() => {
    if (!viewer) return;

    const handleCesiumChange = () => {
      // If WWT is currently the master, ignore Cesium updates
      if (syncSource === 'wwt') return;

      const now = Date.now();
      if (now - lastSyncTimeRef.current < SYNC_THROTTLE_MS) return;

      // Lock the mutex to Cesium
      if (syncSource !== 'cesium') {
        setSyncSource('cesium');
      }

      const camera = viewer.camera;
      const dir = camera.direction;
      
      // Convert ECEF direction to Celestial RA/Dec
      const celestial = ecefToCelestial(
        { x: dir.x, y: dir.y, z: dir.z },
        new Date()
      );

      const roll = Cesium.Math.toDegrees(camera.roll);

      // Update global telemetry state
      setTelescopeTelemetry({ ...celestial, roll });

      // Push to WWT iframe
      postToWWT({
        event: 'center_on_coordinates',
        ra: raHoursToDegrees(celestial.ra),
        dec: celestial.dec,
        roll: roll,
        fov: cameraHeightToWwtFovDegrees(camera),
        instant: true,
      });

      lastSyncTimeRef.current = now;
    };

    const removeListener = viewer.camera.changed.addEventListener(handleCesiumChange);

    // Reset Mutex when Cesium camera stops moving
    const handleMoveEnd = () => {
      if (syncSource === 'cesium') {
        setTimeout(() => setSyncSource('none'), 100);
      }
    };

    viewer.camera.moveEnd.addEventListener(handleMoveEnd);

    return () => {
      removeListener();
      if (viewer && !viewer.isDestroyed()) {
        viewer.camera.moveEnd.removeEventListener(handleMoveEnd);
      }
    };
  }, [viewer, syncSource, setSyncSource, setTelescopeTelemetry, postToWWT]);

  // 2. Sync from WWT to Cesium
  // This side is triggered when telescopeTelemetry changes AND syncSource is 'wwt'
  useEffect(() => {
    if (!viewer || syncSource !== 'wwt' || !telescopeTelemetry) return;

    const now = Date.now();
    if (now - lastSyncTimeRef.current < SYNC_THROTTLE_MS) return;

    // Convert Celestial RA/Dec back to ECEF direction
    const dir = celestialToEcef(
      { ra: telescopeTelemetry.ra, dec: telescopeTelemetry.dec },
      new Date()
    );

    // Update Cesium camera direction
    // Note: We keep the current position and just change orientation
    // unless we want a full "Follow the Stars" mode where position also moves.
    // For background sync, changing orientation is usually what's expected.
    viewer.camera.setView({
      orientation: {
        direction: new Cesium.Cartesian3(dir.x, dir.y, dir.z),
        up: viewer.camera.up, // Keep current UP vector to prevent unwanted tilting
        roll: Cesium.Math.toRadians(telescopeTelemetry.roll),
      },
    });

    lastSyncTimeRef.current = now;
  }, [viewer, syncSource, telescopeTelemetry]);
}
