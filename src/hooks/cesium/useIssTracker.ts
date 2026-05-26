import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '@/store/uiStore';
import { propagateCircularOrbit } from '../../lib/simulation';

/** Maximum trail positions — lower = less Cesium primitive overhead. */
const MAX_TRAIL = 40;
/** Only rebuild polyline geometry every N telemetry updates. */
const TRAIL_UPDATE_INTERVAL = 2;

interface SatelliteConfig {
  id: string;
  name: string;
  altitudeM: number;
  inclinationRad: number;
  omega0: number;
  argLat0: number;
  color: string;
}

const ADDITIONAL_SATELLITES: SatelliteConfig[] = [
  {
    id: 'hubble',
    name: '🔭 HUBBLE SPACE TELESCOPE',
    altitudeM: 540_000,
    inclinationRad: (28.47 * Math.PI) / 180,
    omega0: 1.2,
    argLat0: 0.5,
    color: '#FF00FF',
  },
  {
    id: 'tiangong',
    name: '🇨🇳 TIANGONG SPACE STATION',
    altitudeM: 390_000,
    inclinationRad: (41.58 * Math.PI) / 180,
    omega0: 2.8,
    argLat0: 1.8,
    color: '#FF8800',
  },
  {
    id: 'envisat',
    name: '🛰️ ENVISAT MONITOR',
    altitudeM: 790_000,
    inclinationRad: (98.54 * Math.PI) / 180,
    omega0: -0.8,
    argLat0: 3.2,
    color: '#00FF88',
  },
];

export function useIssTracker(viewer: Cesium.Viewer | null) {
  const issTelemetry = useUIStore((s) => s.issTelemetry);
  const startTimeRef = useRef(Date.now());

  // Refs for tracking entities and positions
  const entitiesRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const pathsRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const historyRef = useRef<Map<string, Cesium.Cartesian3[]>>(new Map());
  const updateCountRef = useRef(0);

  // Initialize all satellites
  useEffect(() => {
    if (!viewer || ((viewer as any).isDestroyed && (viewer as any).isDestroyed())) return;

    const entities = entitiesRef.current;
    const paths = pathsRef.current;
    const history = historyRef.current;

    // 1. ISS setup
    const issEntity = viewer.entities.add({
      id: 'iss',
      position: Cesium.Cartesian3.fromDegrees(0, 0, 420_000),
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#00FFFF'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: '🛰️ ISS (LIVE TELECAST)',
        font: 'bold 8pt JetBrains Mono, monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 15),
        fillColor: Cesium.Color.fromCssColorString('#00FFFF'),
        outlineColor: Cesium.Color.BLACK,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(0, 0, 0, 0.8)'),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
      },
    });
    entities.set('iss', issEntity);

    const issPath = viewer.entities.add({
      id: 'iss-path',
      polyline: {
        positions: [],
        width: 2.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.25,
          color: Cesium.Color.fromCssColorString('#00FFFF').withAlpha(0.5),
        }),
      },
    });
    paths.set('iss', issPath);
    history.set('iss', []);

    // 2. Additional satellites setup
    for (const sat of ADDITIONAL_SATELLITES) {
      const entity = viewer.entities.add({
        id: sat.id,
        position: Cesium.Cartesian3.fromDegrees(0, 0, sat.altitudeM),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString(sat.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5,
        },
        label: {
          text: sat.name,
          font: 'bold 7pt JetBrains Mono, monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 12),
          fillColor: Cesium.Color.fromCssColorString(sat.color),
          outlineColor: Cesium.Color.BLACK,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(0, 0, 0, 0.8)'),
          backgroundPadding: new Cesium.Cartesian2(6, 3),
        },
      });
      entities.set(sat.id, entity);

      const path = viewer.entities.add({
        id: `${sat.id}-path`,
        polyline: {
          positions: [],
          width: 2.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.fromCssColorString(sat.color).withAlpha(0.4),
          }),
        },
      });
      paths.set(sat.id, path);
      history.set(sat.id, []);
    }

    viewer.scene.requestRender();

    return () => {
      try {
        if (viewer && !(viewer as any).isDestroyed()) {
          for (const ent of entities.values()) {
            viewer.entities.remove(ent);
          }
          for (const pth of paths.values()) {
            viewer.entities.remove(pth);
          }
        }
      } catch (err) {}
      entities.clear();
      paths.clear();
      history.clear();
    };
  }, [viewer]);

  // Update positions based on telemetry and propagation
  useEffect(() => {
    if (!viewer || !issTelemetry) return;

    const { latitude: lat, longitude: lng, altitude, simulated } = issTelemetry;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    // 1. Update ISS
    const issPos = Cesium.Cartesian3.fromDegrees(lng, lat, altitude * 1000);
    const issEntity = entitiesRef.current.get('iss');
    if (issEntity) {
      issEntity.position = new Cesium.ConstantPositionProperty(issPos) as any;
      issEntity.label!.text = (simulated ? '🛰️ ISS (SIMULATION)' : '🛰️ ISS (LIVE TELECAST)') as any;
    }

    const issHistory = historyRef.current.get('iss') || [];
    issHistory.push(issPos);
    if (issHistory.length > MAX_TRAIL) issHistory.shift();

    const issPath = pathsRef.current.get('iss');
    if (updateCountRef.current % TRAIL_UPDATE_INTERVAL === 0 && issPath?.polyline) {
      issPath.polyline.positions = new Cesium.ConstantProperty([...issHistory]) as any;
    }

    // 2. Update additional satellites
    for (const sat of ADDITIONAL_SATELLITES) {
      const coords = propagateCircularOrbit(elapsed, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
      const pos = Cesium.Cartesian3.fromDegrees(coords.lng, coords.lat, sat.altitudeM);

      const entity = entitiesRef.current.get(sat.id);
      if (entity) {
        entity.position = new Cesium.ConstantPositionProperty(pos) as any;
      }

      const history = historyRef.current.get(sat.id) || [];
      history.push(pos);
      if (history.length > MAX_TRAIL) history.shift();

      const path = pathsRef.current.get(sat.id);
      if (updateCountRef.current % TRAIL_UPDATE_INTERVAL === 0 && path?.polyline) {
        path.polyline.positions = new Cesium.ConstantProperty([...history]) as any;
      }
    }

    updateCountRef.current += 1;
    viewer.scene.requestRender();
  }, [viewer, issTelemetry]);
}
