import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

/**
 * Auto-rotation hook — WWV pattern: use scene preUpdate listener (clock-synced)
 * instead of setInterval. Stops rotation immediately when user interacts.
 */
export function useAutoRotation(viewer: Cesium.Viewer | null, interactive: boolean) {
  const userInteractingRef = useRef(false);

  // Toggle camera interaction controls
  useEffect(() => {
    if (!viewer) return;
    const sscc = viewer.scene.screenSpaceCameraController;
    sscc.enableRotate = interactive;
    sscc.enableTranslate = interactive;
    sscc.enableZoom = interactive;
    sscc.enableTilt = interactive;
    sscc.enableLook = interactive;
  }, [viewer, interactive]);

  // Auto-rotation via preUpdate listener (frame-synced, no setInterval drift)
  useEffect(() => {
    if (interactive || !viewer) return;

    let lastTime = Date.now();

    // Pause rotation when user moves the camera (even in non-interactive mode
    // the user might trigger zoom from scroll in some edge cases)
    const onMoveStart = () => { userInteractingRef.current = true; };
    const onMoveEnd = () => { userInteractingRef.current = false; };
    viewer.camera.moveStart.addEventListener(onMoveStart);
    viewer.camera.moveEnd.addEventListener(onMoveEnd);

    const removeListener = viewer.scene.preUpdate.addEventListener(() => {
      if (userInteractingRef.current) return;

      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Gentle rotation: 0.005 rad/s around Z-axis
      viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.005 * dt);
      viewer.scene.requestRender();
    });

    return () => {
      removeListener();
      viewer.camera.moveStart.removeEventListener(onMoveStart);
      viewer.camera.moveEnd.removeEventListener(onMoveEnd);
    };
  }, [viewer, interactive]);
}
