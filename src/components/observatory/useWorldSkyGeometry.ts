import { watchCesiumViewer } from '@/lib/watchCesiumViewer';
import { astronomyFetch } from './astronomyApi';
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { getCesiumViewer } from '@/lib/cesiumViewerRegistry';

type Direction = [number, number, number];
type SkyGeometry = {
  stars: { id: string; magnitude: number; direction: Direction }[];
  figures: { id: string; directions: Direction[] }[];
  boundaries: { id: string; directions: Direction[] }[];
};
const SKY_RADIUS = 1e16;

/** Geometry comes from Python; Cesium only scales and draws the returned vectors. */
export function useWorldSkyGeometry(utc: string, figures: boolean, boundaries: boolean, attempt: number) {
  const [data, setData] = useState<SkyGeometry | null>(null);
  const [error, setError] = useState('');
  const primitives = useRef<{ figures: Cesium.PolylineCollection; boundaries: Cesium.PolylineCollection } | null>(null);
  const visibility = useRef({ figures, boundaries });

  useEffect(() => { visibility.current = { figures, boundaries }; }, [figures, boundaries]);

  useEffect(() => {
    const controller = new AbortController();
    astronomyFetch(`sky-geometry?${new URLSearchParams({ utc })}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error('WWT star/constellation geometry unavailable. Retry astronomy to reconnect.'); return response.json() as Promise<SkyGeometry>; })
      .then((data) => { if (!controller.signal.aborted) { setData(data); setError(''); } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Sky geometry unavailable'); });
    return () => controller.abort();
  }, [utc, attempt]);

  useEffect(() => {
    if (!data) return;
    return watchCesiumViewer((viewer) => {
      const stars = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection()) as Cesium.PointPrimitiveCollection;
      const lines = viewer.scene.primitives.add(new Cesium.PolylineCollection()) as Cesium.PolylineCollection;
      const borders = viewer.scene.primitives.add(new Cesium.PolylineCollection()) as Cesium.PolylineCollection;
      const point = (direction: Direction) => Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.fromArray(direction), SKY_RADIUS, new Cesium.Cartesian3());
      for (const star of data.stars) stars.add({
        id: star.id, position: point(star.direction),
        pixelSize: Math.max(1, 4.5 - star.magnitude * 0.5),
        color: Cesium.Color.WHITE.withAlpha(Math.max(0.25, Math.min(1, 1 - star.magnitude * 0.1))),
      });
      for (const path of data.figures) lines.add({
        positions: path.directions.map(point), width: 1.2,
        material: Cesium.Material.fromType('Color', { color: Cesium.Color.fromCssColorString('#7dd9c4').withAlpha(0.7) }),
      });
      for (const path of data.boundaries) borders.add({
        positions: path.directions.map(point), width: 1,
        material: Cesium.Material.fromType('Color', { color: Cesium.Color.fromCssColorString('#b6a0e8').withAlpha(0.45) }),
      });
      primitives.current = { figures: lines, boundaries: borders };
      lines.show = visibility.current.figures; borders.show = visibility.current.boundaries;
      const remove = viewer.scene.preRender.addEventListener(() => {
        for (const collection of [stars, lines, borders]) Cesium.Matrix4.fromTranslation(viewer.camera.positionWC, collection.modelMatrix);
      });
      viewer.scene.requestRender();
      return () => {
        remove(); primitives.current = null;
        if (!viewer.isDestroyed()) for (const collection of [stars, lines, borders]) viewer.scene.primitives.remove(collection);
      };
    });
  }, [data]);

  useEffect(() => {
    if (primitives.current) {
      primitives.current.figures.show = figures;
      primitives.current.boundaries.show = boundaries;
      getCesiumViewer()?.scene.requestRender();
    }
  }, [figures, boundaries]);
  return { error, ready: Boolean(data), starCount: data?.stars.length ?? 0 };
}
