import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { locations } from '../../data/locations';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '../../core/state/store';
import { slerp, latLngToVector, bezierEase } from '../../lib/physics';

/**
 * Landmarks hook — Optimized with:
 * - Batch entity creation (all markers in one operation)
 * - Single ScreenSpaceEventHandler (reused, not recreated)
 * - Flight animation uses preUpdate listener with auto-cleanup
 */
export function useLandmarks(viewer: Cesium.Viewer | null) {
  const activeLocation = useUIStore((s) => s.activeLocation);
  const setActiveLocation = useUIStore((s) => s.setActiveLocation);
  const setIssFeedOpen = useUIStore((s) => s.setIssFeedOpen);
  const flightListenerRef = useRef<(() => void) | null>(null);

  // Mount all markers in a single batch
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed && (viewer as any).isDestroyed()) return;

    // Batch-create all location entities at once
    const entities = locations.map((loc) =>
      viewer.entities.add({
        id: loc.id,
        position: Cesium.Cartesian3.fromDegrees(loc.lng, loc.lat),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString('#D4AF37'), // Orbital gold accent matching default HSR theme
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5,
        },
        label: {
          text: loc.name,
          font: '8pt Outfit, monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#0a0b10'),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(13, 16, 27, 0.8)'), // Translucent dark panels
          backgroundPadding: new Cesium.Cartesian2(6, 3),
        },
      }),
    );

    // Single requestRender after all entities added (not per-entity)
    viewer.scene.requestRender();

    // Single click handler for all entities
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (!Cesium.defined(picked) || !picked.id) return;

      const entityId = picked.id.id;
      if (entityId === 'iss') {
        setIssFeedOpen(true);
      } else {
        const found = locations.find((l) => l.id === entityId);
        if (found) {
          setActiveLocation(found);
          useStore.getState().setSelectedEntity(null); // Clear plugin selection
        }
      }
      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      try {
        if (viewer && !(viewer as any).isDestroyed()) {
          entities.forEach((e) => {
            try {
              if (viewer.entities) viewer.entities.remove(e);
            } catch (e) {}
          });
          if (handler && typeof handler.destroy === 'function') handler.destroy();
        }
      } catch (cleanupErr) {
        // swallow cleanup errors
      }
    };
  }, [viewer, setActiveLocation, setIssFeedOpen]);

  // Camera flight to selected location using PureScript Math
  useEffect(() => {
    if (!viewer || !activeLocation) return;

    // Clean up previous flight render listener if still active
    if (flightListenerRef.current) {
      flightListenerRef.current();
      flightListenerRef.current = null;
    }

    const duration = 2.2; // seconds
    const startTime = Date.now();

    // Start position details
    const cameraPos = viewer.camera.position.clone();
    const startR = Cesium.Cartesian3.magnitude(cameraPos);
    const startV = {
      x: cameraPos.x / startR,
      y: cameraPos.y / startR,
      z: cameraPos.z / startR,
    };
    
    const earthRadius = 6378137;
    const startHeight = Math.max(100000, startR - earthRadius);
    const targetHeight = 1800000; // 1800km target height

    // Target position details
    const targetV = latLngToVector(activeLocation.lat, activeLocation.lng);

    // Frame update listener using the scene preUpdate event
    const removeListener = viewer.scene.preUpdate.addEventListener(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(1.0, elapsed / duration);
      
      // Use PureScript bezierEase for easing curves (ease-in-out: p1=0.25, p2=0.75)
      const easedT = bezierEase(0.25, 0.75, progress);
      
      // Use PureScript slerp for vector interpolation
      const currentV = slerp(startV, targetV, easedT);
      
      // Interpolate height
      const currentHeight = startHeight + (targetHeight - startHeight) * easedT;
      const r = earthRadius + currentHeight;
      
      // Compute new cartesian position
      const newPos = new Cesium.Cartesian3(currentV.x * r, currentV.y * r, currentV.z * r);
      
      // Compute nadir orientation (looking straight down)
      const direction = Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.negate(newPos, new Cesium.Cartesian3()),
        new Cesium.Cartesian3()
      );
      
      // Use UNIT_Z as up, but adjust if close to poles to avoid gimbal lock
      const up = Math.abs(currentV.z) > 0.99 
        ? Cesium.Cartesian3.normalize(new Cesium.Cartesian3(currentV.x, -currentV.y, 0), new Cesium.Cartesian3())
        : Cesium.Cartesian3.UNIT_Z;

      viewer.camera.setView({
        destination: newPos,
        orientation: {
          direction,
          up,
        },
      });

      viewer.scene.requestRender();

      if (progress >= 1.0) {
        if (flightListenerRef.current === removeListener) {
          removeListener();
          flightListenerRef.current = null;
        }
      }
    });

    flightListenerRef.current = removeListener;

    return () => {
      if (flightListenerRef.current === removeListener) {
        removeListener();
        flightListenerRef.current = null;
      }
    };
  }, [viewer, activeLocation]);
}

