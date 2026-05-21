import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { locations } from '../../data/locations';
import { useUIStore } from '../../store/uiStore';

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
    if (!viewer) return;

    // Batch-create all location entities at once
    const entities = locations.map((loc) =>
      viewer.entities.add({
        id: loc.id,
        position: Cesium.Cartesian3.fromDegrees(loc.lng, loc.lat),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString('#8A5BC7'),
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
          backgroundColor: Cesium.Color.fromCssColorString('rgba(15, 17, 26, 0.75)'),
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
        if (found) setActiveLocation(found);
      }
      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      entities.forEach((e) => viewer.entities.remove(e));
      handler.destroy();
    };
  }, [viewer, setActiveLocation, setIssFeedOpen]);

  // Camera flight to selected location
  useEffect(() => {
    if (!viewer || !activeLocation) return;

    // Clean up previous flight render listener if still active
    if (flightListenerRef.current) {
      flightListenerRef.current();
      flightListenerRef.current = null;
    }

    // Enable continuous rendering during flight animation
    const removeListener = viewer.scene.preUpdate.addEventListener(() => {
      viewer.scene.requestRender();
    });
    flightListenerRef.current = removeListener;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(activeLocation.lng, activeLocation.lat, 1_800_000),
      duration: 2.0,
      complete: () => {
        // Stop continuous rendering after flight completes
        if (flightListenerRef.current === removeListener) {
          removeListener();
          flightListenerRef.current = null;
        }
        viewer.scene.requestRender();
      },
    });

    return () => {
      if (flightListenerRef.current === removeListener) {
        removeListener();
        flightListenerRef.current = null;
      }
    };
  }, [viewer, activeLocation]);
}
