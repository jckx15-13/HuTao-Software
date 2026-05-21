import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useUIStore } from '../../store/uiStore';

/** Maximum trail positions — lower = less Cesium primitive overhead. */
const MAX_TRAIL = 30;
/** Only rebuild polyline geometry every N telemetry updates. */
const TRAIL_UPDATE_INTERVAL = 3;

export function useIssTracker(viewer: Cesium.Viewer | null) {
  const issTelemetry = useUIStore((s) => s.issTelemetry);

  const issEntityRef = useRef<Cesium.Entity | null>(null);
  const issPathEntityRef = useRef<Cesium.Entity | null>(null);
  const positionsRef = useRef<Cesium.Cartesian3[]>([]);
  const updateCountRef = useRef(0);
  const lastLatRef = useRef<number | null>(null);
  const lastLngRef = useRef<number | null>(null);

  // Create ISS entity + trail on mount
  useEffect(() => {
    if (!viewer) return;

    issEntityRef.current = viewer.entities.add({
      id: 'iss',
      position: Cesium.Cartesian3.fromDegrees(0, 0, 420_000),
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString('#00FFFF'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: '🛰️ ISS (LIVE FEED AVAILABLE)',
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

    issPathEntityRef.current = viewer.entities.add({
      id: 'iss-path',
      polyline: {
        positions: [],
        width: 2,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.25,
          taperPower: 1.0,
          color: Cesium.Color.fromCssColorString('#00FFFF').withAlpha(0.5),
        }),
      },
    });

    viewer.scene.requestRender();

    return () => {
      if (issEntityRef.current) viewer.entities.remove(issEntityRef.current);
      if (issPathEntityRef.current) viewer.entities.remove(issPathEntityRef.current);
      issEntityRef.current = null;
      issPathEntityRef.current = null;
      positionsRef.current = [];
    };
  }, [viewer]);

  // Update position — skip redundant updates via ref comparison
  useEffect(() => {
    if (!viewer || !issTelemetry) return;

    const { latitude: lat, longitude: lng, altitude, simulated } = issTelemetry;

    // Skip if position hasn't meaningfully changed (< 0.001° ≈ 111m)
    if (
      lastLatRef.current !== null &&
      Math.abs(lat - lastLatRef.current) < 0.001 &&
      Math.abs(lng - (lastLngRef.current ?? 0)) < 0.001
    ) {
      return;
    }
    lastLatRef.current = lat;
    lastLngRef.current = lng;

    const position = Cesium.Cartesian3.fromDegrees(lng, lat, altitude * 1000);

    // Update entity position
    if (issEntityRef.current) {
      issEntityRef.current.position = new Cesium.ConstantPositionProperty(position) as any;
      issEntityRef.current.label!.text = (
        simulated ? '🛰️ ISS (SIMULATION ACTIVE)' : '🛰️ ISS (LIVE TELECAST)'
      ) as any;
    }

    // Throttled trail rebuild: only every TRAIL_UPDATE_INTERVAL updates
    updateCountRef.current += 1;
    const positions = positionsRef.current;
    positions.push(position);
    if (positions.length > MAX_TRAIL) positions.shift();

    if (updateCountRef.current % TRAIL_UPDATE_INTERVAL === 0 && issPathEntityRef.current?.polyline) {
      issPathEntityRef.current.polyline.positions = new Cesium.ConstantProperty([...positions]) as any;
    }

    viewer.scene.requestRender();
  }, [viewer, issTelemetry]);
}
