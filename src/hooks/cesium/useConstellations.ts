import { useEffect, useMemo, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { constellations } from '@/data/constellations';
import { getGreenwichMeanSiderealDegrees } from '@/lib/earthObserverProjection';
import { precessEquatorialJ2000ToDate } from '@/lib/coordinateTransforms';
import { TELESCOPE_PRESETS } from '@/data/telescopePresets';
import {
  boundaryRingRaDec,
  getConstellationBoundary,
  isActiveConstellationRegion
} from '@/core/celestial/constellationBoundaries';

/** Projects an RA/Dec sky position onto the Earth-fixed celestial sphere. */
function skyToCartesian(raHours: number, decDegrees: number, date: Date, radius: number): Cesium.Cartesian3 {
  const precessed = precessEquatorialJ2000ToDate({ ra: raHours, dec: decDegrees }, date);
  const earthFixedRaDegrees = precessed.ra * 15.0 - getGreenwichMeanSiderealDegrees(date);
  const raRad = (earthFixedRaDegrees * Math.PI) / 180.0;
  const decRad = (precessed.dec * Math.PI) / 180.0;
  return new Cesium.Cartesian3(
    radius * Math.cos(decRad) * Math.cos(raRad),
    radius * Math.cos(decRad) * Math.sin(raRad),
    radius * Math.sin(decRad)
  );
}

/** Boundary ring positions for a constellation, or null when it has no region data. */
function boundaryPositions(constellationId: string, date: Date, radius: number): Cesium.Cartesian3[] | null {
  const boundary = getConstellationBoundary(constellationId);
  if (!boundary) return null;
  return boundaryRingRaDec(boundary).map((point) => skyToCartesian(point.raHours, point.decDegrees, date, radius));
}

interface ConstellationRenderNodes {
  starIds: string[];
  lineIds: string[];
  starPositionProperties: Cesium.ConstantPositionProperty[];
  linePositionProperties: Cesium.ConstantProperty[];
  labelShowProperties: Cesium.ConstantProperty[];
  /** Stick-figure polylines, toggled by `showConstellationLines`. */
  lineEntities: Cesium.Entity[];
  /** Constellation name label, toggled by `showConstellationFigures`. */
  nameEntity: Cesium.Entity | null;
  nameProperty: Cesium.ConstantPositionProperty | null;
  /** IAU boundary ring, toggled by `showConstellationBoundaries`. */
  boundaryEntity: Cesium.Entity | null;
  /** Emphasised boundary for the selected region, toggled by `showConstellationSelection`. */
  selectionEntity: Cesium.Entity | null;
  boundaryProperties: Cesium.ConstantProperty[];
}

/** Mean of the constellation's star positions, used to anchor its name label. */
function centroidOf(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
  const sum = positions.reduce((acc, p) => Cesium.Cartesian3.add(acc, p, acc), new Cesium.Cartesian3(0, 0, 0));
  return Cesium.Cartesian3.divideByScalar(sum, Math.max(1, positions.length), sum);
}
const CELESTIAL_RADIUS_OFFSET = 100_000_000;
const CONSTELLATIONS_BY_ID = new Map(constellations.map((item) => [item.id, item]));

function getStarPositions(constellation: (typeof constellations)[number], date: Date, radius: number) {
  const gmstDegrees = getGreenwichMeanSiderealDegrees(date);
  return constellation.stars.map((star) => {
    const precessed = precessEquatorialJ2000ToDate({ ra: star.ra, dec: star.dec }, date);
    const earthFixedRaDegrees = precessed.ra * 15.0 - gmstDegrees;
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
  const spaceInteractionTarget = useUIStore((s) => s.spaceInteractionTarget);
  const overlaySettings = useUIStore((s) => s.celestialOverlaySettings);
  const telescopeTarget = useUIStore((s) => s.telescopeTarget);
  const hoveredEntityId = useStore((s) => s.hoveredEntity?.id ?? null);

  // Resolve the operator's current target the same way the telescope panel
  // does, so "selected region" means the same thing in both renderers.
  const activePreset = useMemo(
    () => TELESCOPE_PRESETS.find((preset) => preset.name === telescopeTarget?.name) ?? TELESCOPE_PRESETS[0],
    [telescopeTarget]
  );

  const constellationEntities = useRef<Map<string, ConstellationRenderNodes>>(new Map());

  // Constellations belong to both the orbital view and the native celestial
  // (telescope) view — they are one scene, so both modes render them.
  const celestialActive =
    interactionMode === 'orbital' || interactionMode === 'telescope' || spaceInteractionTarget === 'telescope';

  // Create constellation entities once per mode/preset change, then mutate their positions.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;

    const active = celestialActive;

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
          lineEntities: [],
          nameEntity: null,
          nameProperty: null,
          boundaryEntity: null,
          selectionEntity: null,
          boundaryProperties: []
        };
        const starPositions = getStarPositions(constellation, projectionDate, celestialRadius);

        constellation.stars.forEach((star, index) => {
          const position = starPositions[index];
          const magnitude = typeof star.magnitude === 'number' ? Math.max(0.1, Math.min(8, star.magnitude)) : 3;
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
              outlineWidth: 1.0
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
              show: labelShowProperty
            }
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
              material: Cesium.Color.fromCssColorString('rgba(0, 246, 255, 0.25)')
            }
          });
          nodeIds.linePositionProperties.push(positions);
          nodeIds.lineIds.push(lineEntity.id);
          nodeIds.lineEntities.push(lineEntity);
          entitiesToRemove.push(lineEntity);
        });

        // Constellation name label — the native equivalent of WWT's
        // "constellation figures" text layer.
        const namePosition = new Cesium.ConstantPositionProperty(centroidOf(starPositions));
        const nameEntity = viewer.entities.add({
          id: `star-name-${constellation.id}`,
          name: constellation.name,
          position: namePosition,
          label: {
            text: constellation.name,
            font: '9pt Outfit, sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.fromCssColorString('#dff7ff').withAlpha(0.72),
            outlineColor: Cesium.Color.fromCssColorString('#0a0b10'),
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        nodeIds.nameEntity = nameEntity;
        nodeIds.nameProperty = namePosition;
        entitiesToRemove.push(nameEntity);

        // IAU boundary region. Rendered as two entities — a base outline and an
        // emphasised one — so `showConstellationBoundaries` and
        // `showConstellationSelection` can be toggled independently without
        // mutating polyline materials on every change.
        const ringPositions = boundaryPositions(constellation.id, projectionDate, celestialRadius);
        if (ringPositions) {
          const basePositions = new Cesium.ConstantProperty(ringPositions);
          const boundaryEntity = viewer.entities.add({
            id: `constellation-boundary-${constellation.id}`,
            name: `${constellation.name} boundary`,
            show: false,
            polyline: {
              positions: basePositions,
              width: 1.0,
              material: Cesium.Color.fromCssColorString('#5df3ff').withAlpha(0.22)
            }
          });

          const selectionPositions = new Cesium.ConstantProperty(ringPositions);
          const selectionEntity = viewer.entities.add({
            id: `constellation-selection-${constellation.id}`,
            name: `${constellation.name} selected region`,
            show: false,
            polyline: {
              positions: selectionPositions,
              width: 2.5,
              material: Cesium.Color.fromCssColorString('#ffd166').withAlpha(0.85)
            }
          });

          nodeIds.boundaryEntity = boundaryEntity;
          nodeIds.selectionEntity = selectionEntity;
          nodeIds.boundaryProperties.push(basePositions, selectionPositions);
          entitiesToRemove.push(boundaryEntity, selectionEntity);
        }

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
        } catch (_) {
          /* ignore cleanup error */
        }
      };
    } catch (err) {
      console.warn('[useConstellations] Failed to create constellation entities:', err);
      return () => {};
    }
  }, [viewer, celestialActive]);

  // Update constellation motion in live mode without recreating the entity descriptors.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;
    if (!celestialActive) return;

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

        nodes.nameProperty?.setValue(centroidOf(starPositions));

        if (nodes.boundaryProperties.length) {
          const ring = boundaryPositions(constellationId, projectionDate, celestialRadius);
          if (ring) {
            nodes.boundaryProperties.forEach((property) => property.setValue(ring));
          }
        }
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
  }, [viewer, celestialActive]);

  // Toggle constellation star labels on hover state changes.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;
    if (!celestialActive) return;

    const isHovered = (id: string) => id === hoveredEntityId;
    constellationEntities.current.forEach((nodes) => {
      nodes.labelShowProperties.forEach((property, index) => {
        const entityId = nodes.starIds[index];
        if (!entityId) return;
        property.setValue(isHovered(entityId));
      });
    });

    viewer.scene.requestRender();
  }, [viewer, celestialActive, hoveredEntityId]);

  // Apply the operator's overlay configuration. These are the same toggles the
  // telescope data-configuration panel writes to, so the panel and the scene
  // can never disagree. Semantics match the projected SVG view exactly:
  // `showConstellationLines` drives the stick figures, `showConstellationFigures`
  // drives the constellation name labels.
  useEffect(() => {
    if (!viewer || (viewer as any).isDestroyed?.()) return;
    if (!celestialActive) return;

    constellationEntities.current.forEach((nodes, constellationId) => {
      nodes.lineEntities.forEach((entity) => {
        entity.show = overlaySettings.showConstellationLines;
      });
      if (nodes.nameEntity) {
        nodes.nameEntity.show = overlaySettings.showConstellationFigures;
      }

      const constellation = CONSTELLATIONS_BY_ID.get(constellationId);
      const selected =
        overlaySettings.showConstellationSelection &&
        !!constellation &&
        isActiveConstellationRegion(activePreset.id, activePreset.name, constellation);

      // The emphasised ring wins when a region is selected, so the two rings
      // never draw on top of each other.
      if (nodes.selectionEntity) {
        nodes.selectionEntity.show = selected;
      }
      if (nodes.boundaryEntity) {
        nodes.boundaryEntity.show = overlaySettings.showConstellationBoundaries && !selected;
      }
    });

    viewer.scene.requestRender();
  }, [
    viewer,
    celestialActive,
    activePreset,
    overlaySettings.showConstellationLines,
    overlaySettings.showConstellationFigures,
    overlaySettings.showConstellationBoundaries,
    overlaySettings.showConstellationSelection
  ]);
}
