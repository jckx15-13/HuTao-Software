import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { constellations } from '@/data/constellations';
import { getGreenwichMeanSiderealDegrees } from '@/lib/earthObserverProjection';
import { precessEquatorialJ2000ToDate } from '@/lib/coordinateTransforms';

interface ConstellationRenderNodes {
  starIds: string[];
  lineIds: string[];
  starPositionProperties: Cesium.ConstantPositionProperty[];
  linePositionProperties: Cesium.ConstantProperty[];
  labelShowProperties: Cesium.ConstantProperty[];
}
const CELESTIAL_RADIUS_OFFSET = 100_000_000;
const CONSTELLATIONS_BY_ID = new Map(constellations.map((item) => [item.id, item]));

function getStarPositions(constellation: (typeof constellations)[number], date: Date, radius: number) {
  const gmstDegrees = getGreenwichMeanSiderealDegrees(date);
  return constellation.stars.map((star) => {
    const precessed = precessEquatorialJ2000ToDate({ ra: star.ra, dec: star.dec }, date);
    const earthFixedRaDegrees = (precessed.ra * 15.0) - gmstDegrees;
    const raRad = (earthFixedRaDegrees * Math.PI) / 180.0;
    const decRad = (precessed.dec * Math.PI) / 180.0;
    const x = radius * Math.cos(decRad) * Math.cos(raRad);
    const y = radius * Math.cos(decRad) * Math.sin(raRad);
    const z = radius * Math.sin(decRad);
    return new Cesium.Cartesian3(x, y, z);
  });
}

/**
 * A custom hook to render astronomical constellations around the Earth globe in Cesium.
 * Constellation nodes and line connections are projected onto a celestial sphere using J2000 precession.
 */
export function useConstellations(viewer: Cesium.Viewer | null) {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const hoveredEntityId = useStore((s) => s.hoveredEntity?.id ?? null);

  const constellationEntities = useRef<Map<string, ConstellationRenderNodes>>(new Map());

  // Create constellation entities once per mode/preset change, then mutate their positions.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;

    const active = interactionMode === 'orbital';

    if (!active) {
      constellationEntities.current.clear();
      return;
    }

    const celestialRadius = Cesium.Ellipsoid.WGS84.maximumRadius + CELESTIAL_RADIUS_OFFSET;
    const projectionDate = new Date();
        const constellationMap = constellationEntities.current;
    const entitiesToRemove: Cesium.Entity[] = [];

    try {
      for (const constellation of constellations) {
        const nodeIds: ConstellationRenderNodes = {
          starIds: [],
          lineIds: [],
          starPositionProperties: [],
          linePositionProperties: [],
          labelShowProperties: [],
        };
        const starPositions = getStarPositions(constellation, projectionDate, celestialRadius);

        constellation.stars.forEach((star, index) => {
          const position = starPositions[index];
          const magnitude = typeof star.magnitude === 'number'
            ? Math.max(0.1, Math.min(8, star.magnitude))
            : 3;
          const pointSize = Math.max(2, 6.5 - magnitude);
          const pointAlpha = Math.max(0.2, 1 - magnitude / 8);
          const positionProperty = new Cesium.ConstantPositionProperty(position);
          const labelShowProperty = new Cesium.ConstantProperty(false);
          const starEntity = viewer.entities.add({
            id: `star-${constellation.id}-${index}`,
            name: `${constellation.name} - ${star.name}`,
            position: positionProperty,
            point: {
              pixelSize: pointSize,
              color: Cesium.Color.fromCssColorString('#5df3ff').withAlpha(pointAlpha),
              outlineColor: Cesium.Color.fromCssColorString('#ffffff').withAlpha(Math.min(1, pointAlpha + 0.2)),
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
              show: labelShowProperty,
            },
          });
          nodeIds.starPositionProperties.push(positionProperty);
          nodeIds.labelShowProperties.push(labelShowProperty);
          nodeIds.starIds.push(starEntity.id);
          entitiesToRemove.push(starEntity);
        });

        constellation.connections.forEach(([startIdx, endIdx], lineIndex) => {
          const p1 = starPositions[startIdx];
          const p2 = starPositions[endIdx];
          const positions = new Cesium.ConstantProperty([p1, p2]);
          const lineEntity = viewer.entities.add({
            id: `star-line-${constellation.id}-${lineIndex}-${startIdx}-${endIdx}`,
            name: `${constellation.name} Connection`,
            polyline: {
              positions,
              width: 1.0,
              material: Cesium.Color.fromCssColorString('rgba(0, 246, 255, 0.25)'),
            },
          });
          nodeIds.linePositionProperties.push(positions);
          nodeIds.lineIds.push(lineEntity.id);
          entitiesToRemove.push(lineEntity);
        });

        constellationMap.set(constellation.id, nodeIds);
      }

      viewer.scene.requestRender();

      return () => {
        try {
          if (viewer && !(viewer as any).isDestroyed?.()) {
            entitiesToRemove.forEach((entity) => {
              viewer.entities.remove(entity);
            });
            constellationMap.clear();
            viewer.scene.requestRender();
          }
        } catch (_) { /* ignore cleanup error */ }
      };
    } catch (err) {
      console.warn('[useConstellations] Failed to create constellation entities:', err);
      return () => {};
    }
  }, [viewer, interactionMode]);

  // Update constellation motion in live mode without recreating the entity descriptors.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;
    if (interactionMode !== 'orbital') return;

    let active = true;
    let rafId: number | null = null;
    const ticked = { last: 0 };

    const updatePositions = (timestamp: number) => {
      if (!active || !viewer || (viewer as any).isDestroyed?.()) return;
      if (timestamp - ticked.last < 16) {
        rafId = window.requestAnimationFrame(updatePositions);
        return;
      }
      ticked.last = timestamp;

      const projectionDate = new Date();
      const celestialRadius = Cesium.Ellipsoid.WGS84.maximumRadius + CELESTIAL_RADIUS_OFFSET;

      constellationEntities.current.forEach((nodes, constellationId) => {
        const constellation = CONSTELLATIONS_BY_ID.get(constellationId);
        if (!constellation) return;

        const starPositions = getStarPositions(constellation, projectionDate, celestialRadius);

        for (let index = 0; index < nodes.starIds.length; index++) {
          const nextPosition = starPositions[index];
          const positionProperty = nodes.starPositionProperties[index];
          if (nextPosition && positionProperty) {
            positionProperty.setValue(nextPosition);
          }
        }

        constellation.connections.forEach((connection, lineIndex) => {
          const [startIdx, endIdx] = connection;
          const lineProperty = nodes.linePositionProperties[lineIndex];
          if (!lineProperty) return;
          const start = starPositions[startIdx];
          const end = starPositions[endIdx];
          if (start && end) {
            lineProperty.setValue([start, end]);
          }
        });
      });

      viewer.scene.requestRender();
      rafId = window.requestAnimationFrame(updatePositions);
    };

    rafId = window.requestAnimationFrame(updatePositions);

    return () => {
      active = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [viewer, interactionMode]);

  // Toggle constellation star labels on hover state changes.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;
    if (interactionMode !== 'orbital') return;

    const isHovered = (id: string) => id === hoveredEntityId;
    constellationEntities.current.forEach((nodes) => {
      nodes.labelShowProperties.forEach((property, index) => {
        const entityId = nodes.starIds[index];
        if (!entityId) return;
        property.setValue(isHovered(entityId));
      });
    });

    viewer.scene.requestRender();
  }, [viewer, interactionMode, hoveredEntityId]);
}
