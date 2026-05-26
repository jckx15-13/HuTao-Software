import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { constellations } from '@/data/constellations';

/**
 * A custom hook to render astronomical constellations around the Earth globe in Cesium.
 * Constellation nodes and line connections are projected onto a celestial sphere at 100,000 km altitude.
 */
export function useConstellations(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);

  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed && (viewer as any).isDestroyed()) return;

    // Draw constellations in both orbital and telescope modes
    const active = interactionMode === 'orbital' || interactionMode === 'telescope';
    const entities: Cesium.Entity[] = [];

    if (active) {
      // Radius of the celestial sphere (100,000 km from the center of the Earth)
      const celestialRadius = 106378137; // Earth radius (6,378,137m) + 100,000,000m

      constellations.forEach((constellation) => {
        // Pre-compute 3D Cartesian coordinates for all stars in the constellation
        const starPositions = constellation.stars.map((star) => {
          // Convert RA (decimal hours) to radians
          const raRad = (star.ra * 15.0 * Math.PI) / 180.0;
          // Convert Dec (decimal degrees) to radians
          const decRad = (star.dec * Math.PI) / 180.0;

          // Spherical to Cartesian coordinates (standard J2000 orientation)
          const x = celestialRadius * Math.cos(decRad) * Math.cos(raRad);
          const y = celestialRadius * Math.cos(decRad) * Math.sin(raRad);
          const z = celestialRadius * Math.sin(decRad);

          return new Cesium.Cartesian3(x, y, z);
        });

        // Add star point and label entities
        constellation.stars.forEach((star, index) => {
          const position = starPositions[index];
          const starEntity = viewer.entities.add({
            id: `star-${constellation.id}-${index}`,
            name: `${constellation.name} - ${star.name}`,
            position: position,
            point: {
              pixelSize: 5,
              color: Cesium.Color.fromCssColorString('#00f6ff'), // Neon cyan accent
              outlineColor: Cesium.Color.fromCssColorString('#ffffff'),
              outlineWidth: 1.0,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Avoid depth buffer clipping against background
            },
            label: {
              text: star.name,
              font: '7pt Outfit, sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.fromCssColorString('#0a0b10'),
              outlineWidth: 1.5,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });
          entities.push(starEntity);
        });

        // Add constellation connection polyline entities
        constellation.connections.forEach(([startIdx, endIdx]) => {
          const p1 = starPositions[startIdx];
          const p2 = starPositions[endIdx];

          const lineEntity = viewer.entities.add({
            name: `${constellation.name} Connection`,
            polyline: {
              positions: [p1, p2],
              width: 1.0,
              material: Cesium.Color.fromCssColorString('rgba(0, 246, 255, 0.25)'), // Translucent cyan line
            },
          });
          entities.push(lineEntity);
        });
      });

      viewer.scene.requestRender();
    }

    return () => {
      try {
        if (viewer && !(viewer as any).isDestroyed()) {
          entities.forEach((e) => {
            try {
              if (viewer.entities) {
                viewer.entities.remove(e);
              }
            } catch (_) {}
          });
          viewer.scene.requestRender();
        }
      } catch (_) {}
    };
  }, [viewer, interactionMode]);
}
