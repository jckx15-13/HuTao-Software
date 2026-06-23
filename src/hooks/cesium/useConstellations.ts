import { useEffect } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { constellations } from '@/data/constellations';
import { getGreenwichMeanSiderealDegrees } from '@/lib/earthObserverProjection';
import { precessEquatorialJ2000ToDate } from '@/lib/coordinateTransforms';

/**
 * A custom hook to render astronomical constellations around the Earth globe in Cesium.
 * Constellation nodes and line connections are projected onto a celestial sphere at 100,000 km altitude.
 */
export function useConstellations(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const hoveredEntityId = useStore((s) => s.hoveredEntity?.id ?? null);
  const currentTime = useStore((s) => s.currentTime);

  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;

    const active = interactionMode === 'orbital';
    const entities: Cesium.Entity[] = [];

    if (active) {
      const celestialRadius = 106378137; // Earth radius (6,378,137m) + 100,000,000m
      const projectionDate = currentTime instanceof Date ? currentTime : new Date((currentTime as any) ?? Date.now());
      const gmstDegrees = getGreenwichMeanSiderealDegrees(Number.isNaN(projectionDate.getTime()) ? new Date() : projectionDate);

      constellations.forEach((constellation) => {
        const starPositions = constellation.stars.map((star) => {
          const precessed = precessEquatorialJ2000ToDate({ ra: star.ra, dec: star.dec }, projectionDate);
          const earthFixedRaDegrees = (precessed.ra * 15.0) - gmstDegrees;
          const raRad = (earthFixedRaDegrees * Math.PI) / 180.0;
          const decRad = (precessed.dec * Math.PI) / 180.0;
          const x = celestialRadius * Math.cos(decRad) * Math.cos(raRad);
          const y = celestialRadius * Math.cos(decRad) * Math.sin(raRad);
          const z = celestialRadius * Math.sin(decRad);
          return new Cesium.Cartesian3(x, y, z);
        });

        constellation.stars.forEach((star, index) => {
          const position = starPositions[index];
          const starEntity = viewer.entities.add({
            id: `star-${constellation.id}-${index}`,
            name: `${constellation.name} - ${star.name}`,
            position,
            point: {
              pixelSize: 5,
              color: Cesium.Color.fromCssColorString('#5df3ff'),
              outlineColor: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.8),
              outlineWidth: 1.0,
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
              show: false,
            },
          });
          entities.push(starEntity);
        });

        constellation.connections.forEach(([startIdx, endIdx]) => {
          const p1 = starPositions[startIdx];
          const p2 = starPositions[endIdx];
          const lineEntity = viewer.entities.add({
            name: `${constellation.name} Connection`,
            polyline: {
              positions: [p1, p2],
              width: 1.0,
              material: Cesium.Color.fromCssColorString('rgba(0, 246, 255, 0.25)'),
            },
          });
          entities.push(lineEntity);
        });
      });

      viewer.scene.requestRender();
    }

    return () => {
      try {
        if (viewer && !(viewer as any).isDestroyed?.()) {
          entities.forEach((entity) => {
            if (viewer.entities) {
              viewer.entities.remove(entity);
            }
          });
          viewer.scene.requestRender();
        }
      } catch (_) {}
    };
  }, [viewer, interactionMode, currentTime]);

  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;
    if (interactionMode !== 'orbital') return;

    viewer.entities.values.forEach((entity) => {
      if (entity.id && typeof entity.id === 'string' && entity.id.startsWith('star-') && entity.label) {
        entity.label.show = new Cesium.ConstantProperty(entity.id === hoveredEntityId);
      }
    });
    viewer.scene.requestRender();
  }, [viewer, interactionMode, hoveredEntityId]);
}
