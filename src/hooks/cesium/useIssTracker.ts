import { useEffect, useRef, useMemo } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { propagateCircularOrbit, propagateSatelliteTle } from '../../lib/simulation';
import { SATELLITES, SatelliteConfig } from '../../data/satellites';

/** Only rebuild polyline geometry every N frames. */
const TRAIL_UPDATE_INTERVAL = 3;

// Shared scratch objects to avoid per-frame allocations in 60fps loops
const scratchPos = new Cesium.Cartesian3();
const scratchPos2 = new Cesium.Cartesian3();
const scratchMatrix3 = new Cesium.Matrix3();
const scratchMatrix4 = new Cesium.Matrix4();
const scratchQuaternion = new Cesium.Quaternion();
const scratchJulianDate = new Cesium.JulianDate();

export function useIssTracker(viewer: Cesium.Viewer | null) {
  const issTelemetry = useUIStore((s) => s.issTelemetry);
  const activeSatelliteId = useUIStore((s) => s.activeSatelliteId);
  const satelliteCategories = useUIStore((s) => s.satelliteCategories);
  const satelliteSettings = useUIStore((s) => s.satelliteSettings);

  const startTimeRef = useRef(Date.now());
  const updateCountRef = useRef(0);

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

    // A helper to create a satellite entity (uses an on-the-fly emoji icon billboard)
    const addSatelliteEntity = (sat: SatelliteConfig | { id: string; name: string; altitudeM: number; color: string }) => {
      if (entities.has(sat.id)) return;

      // utility: create a small canvas-based icon from the emoji in the name
      const createIconDataUrl = (symbol: string, color: string, size = satelliteSettings?.iconSize ?? 32) => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return undefined;
          // background circle
          ctx.clearRect(0, 0, size, size);
          ctx.beginPath();
          ctx.fillStyle = color || '#ffffff';
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
          // emoji/text
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

      // extract a leading emoji/symbol if present
      const rawName = (sat as any).name || '';
      const symbol = String(rawName).split(' ')[0] || '🛰️';
      const iconUrl = createIconDataUrl(symbol, (sat as any).color || '#00FFF7');

      const occlude = satelliteSettings?.occludeByGlobe !== false;

      const entity = viewer.entities.add({
        id: sat.id,
        // Initial position will be updated by the physics loop
        position: new Cesium.ConstantPositionProperty(Cesium.Cartesian3.ZERO) as any,
        billboard: iconUrl
          ? {
              image: iconUrl,
              width: satelliteSettings?.iconSize ?? 32,
              height: satelliteSettings?.iconSize ?? 32,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              heightReference: Cesium.HeightReference.NONE,
              ...(occlude ? {} : { disableDepthTestDistance: Number.POSITIVE_INFINITY }),
            }
          : undefined,
        label: {
          text: sat.name,
          font: 'bold 7.5pt JetBrains Mono, monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          fillColor: Cesium.Color.fromCssColorString(sat.color),
          outlineColor: Cesium.Color.BLACK,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(10, 11, 16, 0.85)'),
          backgroundPadding: new Cesium.Cartesian2(8, 4),
          ...(occlude ? {} : { disableDepthTestDistance: Number.POSITIVE_INFINITY }),
        },
      });

      entities.set(sat.id, entity);
      history.set(sat.id, []);
    };

    // A helper to remove a satellite entity
    const removeSatelliteEntity = (id: string) => {
      const ent = entities.get(id);
      if (ent) {
        viewer.entities.remove(ent);
        entities.delete(id);
      }
      const path = paths.get(id);
      if (path) {
        viewer.entities.remove(path);
        paths.delete(id);
      }
      history.delete(id);
    };

    // 1. Process ISS (falls under 'spaceStations' category)
    const isIssVisible = satelliteCategories['spaceStations'] !== false;
    if (isIssVisible) {
      addSatelliteEntity({
        id: 'iss',
        name: '🛰️ ISS (LIVE TELECAST)',
        altitudeM: 420_000,
        color: '#00FFF7',
      });
    } else {
      removeSatelliteEntity('iss');
    }

    // 2. Process all other satellites in SATELLITES catalog
    for (const sat of SATELLITES) {
      const isVisible = satelliteCategories[sat.category] !== false;
      if (isVisible) {
        addSatelliteEntity(sat);
      } else {
        removeSatelliteEntity(sat.id);
      }
    }

    // 3. Sync Trails (polylines) based on configuration settings
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
          // Adjust width/glow dynamically for selected vs unselected trails
          const path = paths.get(id);
          if (path?.polyline) {
            // Update constant property value instead of creating new ones
            const widthProp = path.polyline.width as Cesium.ConstantProperty;
            if (widthProp && typeof widthProp.setValue === 'function') {
                widthProp.setValue(isSelected ? 2.5 : 1.5);
            } else {
                path.polyline.width = new Cesium.ConstantProperty(isSelected ? 2.5 : 1.5) as any;
            }
          }
        }
      } else {
        // Remove trail if not needed anymore
        const path = paths.get(id);
        if (path) {
          viewer.entities.remove(path);
          paths.delete(id);
        }
      }
    }

    viewer.scene.requestRender();
  }, [viewer, satelliteCategories, satelliteSettings, activeSatelliteId]);

  // Synchronize satellite sensor cone (frustum) for active satellite
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Cleanup previous frustum
    if (frustumEntityRef.current) {
      viewer.entities.remove(frustumEntityRef.current);
      frustumEntityRef.current = null;
    }

    const entities = entitiesRef.current;
    if (!activeSatelliteId || !entities.has(activeSatelliteId)) {
      viewer.scene.requestRender();
      return;
    }

    const config = SATELLITES.find((s) => s.id === activeSatelliteId) || {
      id: 'iss',
      altitudeM: 420_000,
      color: '#00FFF7',
    };

    // tan(FOV/2) = radius / altitude  =>  radius = tan(30deg) * altitude
    const fovAngle = 60; // 60 degrees field of view cone
    const alt = activeSatelliteId === 'iss' ? (issTelemetry?.altitude * 1000 || 420_000) : config.altitudeM;
    const bottomRadius = Math.tan(Cesium.Math.toRadians(fovAngle / 2)) * alt;

    const frustumEntity = viewer.entities.add({
      id: `satellite-frustum-${activeSatelliteId}`,
      position: new Cesium.CallbackPositionProperty((time, result) => {
        const ent = entities.get(activeSatelliteId);
        if (!ent) return Cesium.Cartesian3.ZERO;
        const basePos = ent.position ? ent.position.getValue(time, scratchPos) as Cesium.Cartesian3 : null;
        if (!basePos) return Cesium.Cartesian3.ZERO;

        // Shift halfway down towards Earth center so cylinder fits between satellite and surface
        const mag = Cesium.Cartesian3.magnitude(basePos);
        if (mag === 0) return basePos;
        const scale = (mag - alt / 2) / mag;
        return Cesium.Cartesian3.multiplyByScalar(basePos, scale, result || new Cesium.Cartesian3());
      }, false),
      orientation: new Cesium.CallbackProperty((time, result) => {
        const ent = entities.get(activeSatelliteId);
        if (!ent) return Cesium.Quaternion.IDENTITY;
        const basePos = ent.position ? ent.position.getValue(time, scratchPos) as Cesium.Cartesian3 : null;
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
        slices: 32,
      },
    });

    frustumEntityRef.current = frustumEntity;
    viewer.scene.requestRender();

    return () => {
      if (frustumEntityRef.current && viewer && !viewer.isDestroyed()) {
        viewer.entities.remove(frustumEntityRef.current);
        frustumEntityRef.current = null;
      }
    };
  }, [viewer, activeSatelliteId, issTelemetry]);

  // Clean up all entities on unmount
  useEffect(() => {
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        const entities = entitiesRef.current;
        const paths = pathsRef.current;

        for (const ent of entities.values()) {
          viewer.entities.remove(ent);
        }
        for (const path of paths.values()) {
          viewer.entities.remove(path);
        }

        if (frustumEntityRef.current) {
          viewer.entities.remove(frustumEntityRef.current);
          frustumEntityRef.current = null;
        }

        entities.clear();
        paths.clear();
        historyRef.current.clear();
        viewer.scene.requestRender();
      }
    };
  }, [viewer]);

  // 60fps smooth preUpdate simulation loop for all active satellites
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    const updateSatellitePhysics = () => {
      if (!viewer || viewer.isDestroyed()) return;

      const entities = entitiesRef.current;
      const paths = pathsRef.current;
      const history = historyRef.current;
      const satelliteData = useUIStore.getState().satelliteData;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const now = new Date();

      // 1. Update ISS simulated physics if no telemetry, or telemetry is active
      if (entities.has('iss')) {
        let issPos;
        const issData = satelliteData['iss'];

        if (issTelemetry) {
          const { latitude: lat, longitude: lng, altitude } = issTelemetry;
          issPos = Cesium.Cartesian3.fromDegrees(lng, lat, altitude * 1000, Cesium.Ellipsoid.WGS84, scratchPos);
        } else if (issData?.tle) {
          // Use high-fidelity TLE propagation if available
          const coords = propagateSatelliteTle(issData.tle, now);
          if (coords) {
            issPos = Cesium.Cartesian3.fromDegrees(coords.lng, coords.lat, coords.altitude, Cesium.Ellipsoid.WGS84, scratchPos);
          } else {
            const coordsFallback = propagateCircularOrbit(elapsed, 420_000, (51.64 * Math.PI) / 180, 0.0, 0.0);
            issPos = Cesium.Cartesian3.fromDegrees(coordsFallback.lng, coordsFallback.lat, 420_000, Cesium.Ellipsoid.WGS84, scratchPos);
          }
        } else {
          // Fallback to circular orbit propagation for ISS if telemetry and TLE are offline
          const coords = propagateCircularOrbit(elapsed, 420_000, (51.64 * Math.PI) / 180, 0.0, 0.0);
          issPos = Cesium.Cartesian3.fromDegrees(coords.lng, coords.lat, 420_000, Cesium.Ellipsoid.WGS84, scratchPos);
        }

        const issEntity = entities.get('iss');
        if (issEntity && issEntity.position) {
          (issEntity.position as Cesium.ConstantPositionProperty).setValue(issPos);
        }

        const issHistory = history.get('iss') || [];
        // Important: clone the position since scratchPos will be overwritten
        issHistory.push(Cesium.Cartesian3.clone(issPos));
        const maxTrail = useUIStore.getState().satelliteSettings?.trailLength ?? 40;
        if (issHistory.length > maxTrail) issHistory.shift();

        const issPath = paths.get('iss');
        if (updateCountRef.current % TRAIL_UPDATE_INTERVAL === 0 && issPath?.polyline) {
          const positionsProp = issPath.polyline.positions as Cesium.ConstantProperty;
          if (positionsProp && typeof positionsProp.setValue === 'function') {
            positionsProp.setValue(issHistory);
          }
        }
      }

      // 2. Update propagated satellites positions
      for (const sat of SATELLITES) {
        if (!entities.has(sat.id)) continue;

        const satData = satelliteData[sat.id];
        let pos;

        if (satData?.tle) {
          // Use high-fidelity TLE propagation
          const coords = propagateSatelliteTle(satData.tle, now);
          if (coords) {
            pos = Cesium.Cartesian3.fromDegrees(coords.lng, coords.lat, coords.altitude, Cesium.Ellipsoid.WGS84, scratchPos2);
          } else {
            const coordsFallback = propagateCircularOrbit(elapsed, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
            pos = Cesium.Cartesian3.fromDegrees(coordsFallback.lng, coordsFallback.lat, sat.altitudeM, Cesium.Ellipsoid.WGS84, scratchPos2);
          }
        } else {
          const coords = propagateCircularOrbit(elapsed, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
          pos = Cesium.Cartesian3.fromDegrees(coords.lng, coords.lat, sat.altitudeM, Cesium.Ellipsoid.WGS84, scratchPos2);
        }

        const entity = entities.get(sat.id);
        if (entity && entity.position) {
          (entity.position as Cesium.ConstantPositionProperty).setValue(pos);
        }

        const satHistory = history.get(sat.id) || [];
        satHistory.push(Cesium.Cartesian3.clone(pos));
        const maxTrail = useUIStore.getState().satelliteSettings?.trailLength ?? 40;
        if (satHistory.length > maxTrail) satHistory.shift();

        const path = paths.get(sat.id);
        if (updateCountRef.current % TRAIL_UPDATE_INTERVAL === 0 && path?.polyline) {
            const positionsProp = path.polyline.positions as Cesium.ConstantProperty;
            if (positionsProp && typeof positionsProp.setValue === 'function') {
              positionsProp.setValue(satHistory);
            }
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
