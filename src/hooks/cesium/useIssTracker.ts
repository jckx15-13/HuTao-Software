import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { OrbitEngine, Coordinates } from '../../core/satellites/OrbitEngine';
import { SATELLITES, SatelliteConfig } from '../../data/satellites';

/** Only rebuild polyline geometry every N frames. */
const TRAIL_UPDATE_INTERVAL = 3;

// Shared scratch objects to avoid per-frame allocations in 60fps loops
const scratchPos = new Cesium.Cartesian3();
const scratchMatrix3 = new Cesium.Matrix3();
const scratchMatrix4 = new Cesium.Matrix4();
const scratchJulianDate = new Cesium.JulianDate();

const createIconDataUrl = (color: string, isIss = false, size = 32, isActive = false) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.clearRect(0, 0, size, size);

    const c = size / 2;

    if (!isActive) {
      // Minimalist tiny dot icon
      ctx.beginPath();
      ctx.arc(c, c, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Subtle semi-transparent halo
      ctx.beginPath();
      ctx.arc(c, c, 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      return canvas.toDataURL();
    }

    // Active crosshair/telemetry ring
    const r = isIss ? size / 2.8 : size / 3.8;

    // Draw outer ring
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = isIss ? 1.8 : 1.2;
    ctx.stroke();

    if (isIss) {
      // Draw secondary inner ring for ISS
      ctx.beginPath();
      ctx.arc(c, c, r - 3, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Draw central dot
    ctx.beginPath();
    ctx.arc(c, c, isIss ? 3.5 : 2.0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw subtle crosshair ticks (minimalist telemetry design)
    const tickLen = 2.5;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    // Top tick
    ctx.moveTo(c, c - r - tickLen); ctx.lineTo(c, c - r + tickLen);
    // Bottom tick
    ctx.moveTo(c, c + r - tickLen); ctx.lineTo(c, c + r + tickLen);
    // Left tick
    ctx.moveTo(c - r - tickLen, c); ctx.lineTo(c - r + tickLen, c);
    // Right tick
    ctx.moveTo(c + r - tickLen, c); ctx.lineTo(c + r + tickLen, c);
    ctx.stroke();

    return canvas.toDataURL();
  } catch (e) {
    return undefined;
  }
};

export function useIssTracker(viewer: Cesium.Viewer | null) {
  const engine = OrbitEngine.getInstance();

  const issTelemetry = useUIStore((s) => s.issTelemetry);
  const activeSatelliteId = useUIStore((s) => s.activeSatelliteId);
  const satelliteCategories = useUIStore((s) => s.satelliteCategories);
  const satelliteSettings = useUIStore((s) => s.satelliteSettings);

  const [startTime] = useState(() => Date.now());
  const updateCountRef = useRef(0);
  const isProcessingBatch = useRef(false);

  // Refs for Cesium Entities
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const pathsRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const historyRef = useRef<Map<string, Cesium.Cartesian3[]>>(new Map());
  const frustumEntityRef = useRef<Cesium.Entity | null>(null);

  const hoveredSatelliteIdRef = useRef<string | null>(null);

  const updateEntityVisuals = (id: string, isSelected: boolean, isHovered: boolean) => {
    const ent = entitiesRef.current.get(id);
    if (!ent) return;

    const isIss = id === 'iss';
    const satConfig = SATELLITES.find(s => s.id === id) || { color: '#00FFF7' };
    const color = (satConfig as any).color || '#00FFF7';
    const isActive = isSelected || isHovered;

    const targetSize = isActive ? 20 : 10;
    const iconUrl = createIconDataUrl(color, isIss, 32, isActive);

    if (ent.billboard) {
      if (iconUrl) {
        if (ent.billboard.image && typeof (ent.billboard.image as any).setValue === 'function') {
          (ent.billboard.image as any).setValue(iconUrl);
        } else {
          ent.billboard.image = iconUrl as any;
        }
      }

      if (ent.billboard.width && typeof (ent.billboard.width as any).setValue === 'function') {
        (ent.billboard.width as any).setValue(targetSize);
      } else {
        ent.billboard.width = targetSize as any;
      }

      if (ent.billboard.height && typeof (ent.billboard.height as any).setValue === 'function') {
        (ent.billboard.height as any).setValue(targetSize);
      } else {
        ent.billboard.height = targetSize as any;
      }
    }

    if (ent.label) {
      if (ent.label.show && typeof (ent.label.show as any).setValue === 'function') {
        (ent.label.show as any).setValue(isActive);
      } else {
        ent.label.show = isActive as any;
      }
    }
  };

  // Mouse hover event handler for minimalist satellite entity visual updates
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement: any) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);

      let foundSatId: string | null = null;
      if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
        const ent = pickedObject.id;
        if (entitiesRef.current.has(ent.id)) {
          foundSatId = ent.id;
        }
      }

      const prevHovered = hoveredSatelliteIdRef.current;
      if (foundSatId !== prevHovered) {
        hoveredSatelliteIdRef.current = foundSatId;

        // Update previous hovered entity visual state
        if (prevHovered && prevHovered !== activeSatelliteId) {
          updateEntityVisuals(prevHovered, false, false);
        }
        // Update new hovered entity visual state
        if (foundSatId) {
          const isSelected = activeSatelliteId === foundSatId;
          updateEntityVisuals(foundSatId, isSelected, true);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      if (!handler.isDestroyed()) {
        handler.destroy();
      }
    };
  }, [viewer, activeSatelliteId]);

  // Synchronize dynamic active categories and add/remove satellite entities
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const entities = entitiesRef.current;
    const paths = pathsRef.current;
    const history = historyRef.current;

    // A helper to create a satellite entity
    const addSatelliteEntity = (sat: SatelliteConfig | { id: string; name: string; altitudeM: number; color: string }) => {
      if (entities.has(sat.id)) return;

      const isSelected = activeSatelliteId === sat.id;
      const isHovered = hoveredSatelliteIdRef.current === sat.id;
      const isActive = isSelected || isHovered;

      const iconUrl = createIconDataUrl((sat as any).color || '#00FFF7', sat.id === 'iss', 32, isActive);
      const occlude = satelliteSettings?.occludeByGlobe !== false;
      const cleanLabelText = sat.name
        .replace(/^[^\s\w]+\s*/g, '')
        .split(' (')[0]
        .trim();

      const targetSize = isActive ? 20 : 10;

      const entity = viewer.entities.add({
        id: sat.id,
        position: new Cesium.ConstantPositionProperty(Cesium.Cartesian3.ZERO) as any,
        billboard: iconUrl ? {
          image: iconUrl,
          width: targetSize,
          height: targetSize,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: occlude ? 0 : Number.POSITIVE_INFINITY,
        } : undefined,
        label: {
          text: cleanLabelText,
          font: 'bold 7.5pt JetBrains Mono, monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          fillColor: Cesium.Color.fromCssColorString(sat.color),
          outlineColor: Cesium.Color.BLACK,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 11, 16, 0.85)'),
          disableDepthTestDistance: occlude ? 0 : Number.POSITIVE_INFINITY,
          show: isActive,
        },
      });

      entities.set(sat.id, entity);
      history.set(sat.id, []);
    };

    const removeSatelliteEntity = (id: string) => {
      const ent = entities.get(id);
      if (ent) viewer.entities.remove(ent);
      entities.delete(id);
      const path = paths.get(id);
      if (path) viewer.entities.remove(path);
      paths.delete(id);
      history.delete(id);
    };

    if (satelliteCategories['spaceStations'] !== false) {
      addSatelliteEntity({ id: 'iss', name: '🛰️ ISS (LIVE TELECAST)', altitudeM: 420_000, color: '#00FFF7' });
    } else {
      removeSatelliteEntity('iss');
    }

    for (const sat of SATELLITES) {
      if (satelliteCategories[sat.category] !== false) addSatelliteEntity(sat);
      else removeSatelliteEntity(sat.id);
    }

    const showTrails = satelliteSettings?.showTrails !== false;
    const showAllTrails = satelliteSettings?.showAllTrails === true;

    for (const [id, ent] of entities.entries()) {
      const isSelected = activeSatelliteId === id;
      const shouldHaveTrail = showAllTrails || (isSelected && showTrails);

      // Re-evaluate appearance on activeSatelliteId change
      updateEntityVisuals(id, isSelected, hoveredSatelliteIdRef.current === id);

      if (shouldHaveTrail) {
        if (!paths.has(id)) {
          const satConfig = SATELLITES.find((s) => s.id === id) || { color: '#00FFF7' };
          const colorHex = id === 'iss' ? '#00FFF7' : satConfig.color;
          const path = viewer.entities.add({
            id: `${id}-path`,
            polyline: {
              positions: new Cesium.ConstantProperty([]),
              width: isSelected ? 2.5 : 1.5,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: isSelected ? 0.25 : 0.15,
                color: Cesium.Color.fromCssColorString(colorHex).withAlpha(isSelected ? 0.5 : 0.25),
              }),
            },
          });
          paths.set(id, path);
        } else {
          const path = paths.get(id);
          if (path?.polyline) {
            (path.polyline.width as Cesium.ConstantProperty).setValue(isSelected ? 2.5 : 1.5);
          }
        }
      } else {
        const path = paths.get(id);
        if (path) {
          viewer.entities.remove(path);
          paths.delete(id);
        }
      }
    }
    viewer.scene.requestRender();
  }, [viewer, satelliteCategories, satelliteSettings, activeSatelliteId]);

  // Sensor cone logic
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    if (frustumEntityRef.current) {
      viewer.entities.remove(frustumEntityRef.current);
      frustumEntityRef.current = null;
    }
    const entities = entitiesRef.current;
    if (!activeSatelliteId || !entities.has(activeSatelliteId)) return;

    const config = SATELLITES.find((s) => s.id === activeSatelliteId) || { altitudeM: 420_000, color: '#00FFF7' };
    const alt = activeSatelliteId === 'iss' ? (issTelemetry?.altitude * 1000 || 420_000) : config.altitudeM;
    const bottomRadius = Math.tan(Cesium.Math.toRadians(60 / 2)) * alt;

    const frustumEntity = viewer.entities.add({
      id: `satellite-frustum-${activeSatelliteId}`,
      position: new Cesium.CallbackPositionProperty((time, result) => {
        const ent = entities.get(activeSatelliteId);
        if (!ent) return Cesium.Cartesian3.ZERO;
        const basePos = ent.position?.getValue(time, scratchPos) as Cesium.Cartesian3;
        if (!basePos) return Cesium.Cartesian3.ZERO;
        const mag = Cesium.Cartesian3.magnitude(basePos);
        return Cesium.Cartesian3.multiplyByScalar(basePos, (mag - alt / 2) / mag, result || new Cesium.Cartesian3());
      }, false),
      orientation: new Cesium.CallbackProperty((time, result) => {
        const ent = entities.get(activeSatelliteId);
        if (!ent) return Cesium.Quaternion.IDENTITY;
        const basePos = ent.position?.getValue(time, scratchPos) as Cesium.Cartesian3;
        if (!basePos) return Cesium.Quaternion.IDENTITY;
        const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(basePos, Cesium.Ellipsoid.WGS84, scratchMatrix4);
        const rotationMatrix = Cesium.Matrix4.getMatrix3(enuMatrix, scratchMatrix3);
        return Cesium.Quaternion.fromRotationMatrix(rotationMatrix, result || new Cesium.Quaternion());
      }, false),
      cylinder: {
        length: alt,
        topRadius: 0.0,
        bottomRadius: bottomRadius,
        material: Cesium.Color.fromCssColorString(config.color).withAlpha(0.15),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(config.color).withAlpha(0.4),
      },
    });
    frustumEntityRef.current = frustumEntity;
    viewer.scene.requestRender();
  }, [viewer, activeSatelliteId, issTelemetry]);

  // Physics simulation loop with async batch propagation
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const updateSatellitePhysics = async () => {
      if (!viewer || viewer.isDestroyed() || isProcessingBatch.current) return;

      const entities = entitiesRef.current;
      const paths = pathsRef.current;
      const history = historyRef.current;
      const satelliteData = useUIStore.getState().satelliteData;
      const now = new Date();
      const elapsed = (Date.now() - startTime) / 1000;

      // Prepare batch for async engine
      const batch: Array<{ id: string; tleLines: string[] }> = [];
      const manualSats: string[] = [];

      for (const id of entities.keys()) {
        if (id === 'iss' && issTelemetry) continue; // Skip ISS if telemetry is live
        if (satelliteData[id]?.tle) {
          batch.push({ id, tleLines: satelliteData[id].tle });
        } else {
          manualSats.push(id);
        }
      }

      isProcessingBatch.current = true;
      const batchResults = await engine.propagateBatchAsync(batch, now);
      isProcessingBatch.current = false;

      // Update positions
      for (const id of entities.keys()) {
        let coords: Coordinates | null = null;

        if (id === 'iss' && issTelemetry) {
          coords = { lat: issTelemetry.latitude, lng: issTelemetry.longitude, altitude: issTelemetry.altitude * 1000 };
        } else if (batchResults.has(id)) {
          coords = batchResults.get(id) || null;
        }

        // Fallback for manual or failed batch
        if (!coords) {
          const sat = SATELLITES.find(s => s.id === id) || { altitudeM: 420_000, inclinationRad: (51.64 * Math.PI) / 180, omega0: 0, argLat0: 0 };
          coords = {
            ...engine.propagateCircularOrbit(elapsed, {
              altitudeMeters: sat.altitudeM,
              inclinationRad: sat.inclinationRad,
              omega0: sat.omega0,
              argLat0: sat.argLat0
            }),
            altitude: sat.altitudeM
          };
        }

        const pos = Cesium.Cartesian3.fromDegrees(coords.lng, coords.lat, coords.altitude ?? 0, Cesium.Ellipsoid.WGS84, scratchPos);
        const entity = entities.get(id);
        if (entity?.position) {
          (entity.position as Cesium.ConstantPositionProperty).setValue(pos);
        }

        const satHistory = history.get(id) || [];
        satHistory.push(Cesium.Cartesian3.clone(pos));
        const maxTrail = useUIStore.getState().satelliteSettings?.trailLength ?? 40;
        if (satHistory.length > maxTrail) satHistory.shift();

        const path = paths.get(id);
        if (updateCountRef.current % TRAIL_UPDATE_INTERVAL === 0 && path?.polyline) {
          (path.polyline.positions as Cesium.ConstantProperty).setValue([...satHistory]);
        }
      }

      updateCountRef.current += 1;
    };

    viewer.scene.preUpdate.addEventListener(updateSatellitePhysics);
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.preUpdate.removeEventListener(updateSatellitePhysics);
      }
    };
  }, [viewer, issTelemetry]);
}

