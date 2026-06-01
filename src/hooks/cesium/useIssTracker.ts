import { useEffect, useRef } from 'react';
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

export function useIssTracker(viewer: Cesium.Viewer | null) {
  const engine = OrbitEngine.getInstance();
  
  const issTelemetry = useUIStore((s) => s.issTelemetry);
  const activeSatelliteId = useUIStore((s) => s.activeSatelliteId);
  const satelliteCategories = useUIStore((s) => s.satelliteCategories);
  const satelliteSettings = useUIStore((s) => s.satelliteSettings);

  const startTimeRef = useRef(Date.now());
  const updateCountRef = useRef(0);
  const isProcessingBatch = useRef(false);

  // Refs for Cesium Entities
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const pathsRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const historyRef = useRef<Map<string, Cesium.Cartesian3[]>>(new Map());
  const frustumEntityRef = useRef<Cesium.Entity | null>(null);

  // Synchronize dynamic active categories and add/remove satellite entities
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const entities = entitiesRef.current;
    const paths = pathsRef.current;
    const history = historyRef.current;

    // A helper to create a satellite entity
    const addSatelliteEntity = (sat: SatelliteConfig | { id: string; name: string; altitudeM: number; color: string }) => {
      if (entities.has(sat.id)) return;

      const createIconDataUrl = (symbol: string, color: string, size = satelliteSettings?.iconSize ?? 32) => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return undefined;
          ctx.clearRect(0, 0, size, size);
          ctx.beginPath();
          ctx.fillStyle = color || '#ffffff';
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000000';
          const fontSize = Math.floor(size * 0.6);
          ctx.font = `${fontSize}px serif`;
          ctx.fillText(symbol, size / 2, size / 2 + 1);
          return canvas.toDataURL();
        } catch (e) {
          return undefined;
        }
      };

      const rawName = (sat as any).name || '';
      const symbol = String(rawName).split(' ')[0] || '🛰️';
      const iconUrl = createIconDataUrl(symbol, (sat as any).color || '#00FFF7');
      const occlude = satelliteSettings?.occludeByGlobe !== false;
      const cleanLabelText = sat.name
        .replace(/^[^\s\w]+\s*/g, '')
        .split(' (')[0]
        .trim();

      const entity = viewer.entities.add({
        id: sat.id,
        position: new Cesium.ConstantPositionProperty(Cesium.Cartesian3.ZERO) as any,
        billboard: iconUrl ? {
          image: iconUrl,
          width: satelliteSettings?.iconSize ?? 18,
          height: satelliteSettings?.iconSize ?? 18,
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
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

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

