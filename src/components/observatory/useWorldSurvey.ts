import { watchCesiumViewer } from '@/lib/watchCesiumViewer';
import { astronomyFetch } from './astronomyApi';
import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';

type SurveyMesh = { directions: [number, number, number][]; uv: [number, number][]; indices: number[] };

export function useWorldSurvey(utc: string, enabled: boolean) {
  const [status, setStatus] = useState('');
  const displayStatus = !enabled ? 'Survey imagery hidden' : status || 'Loading online DSS overview…';
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let objectUrl: string | undefined;
    void Promise.all([
      astronomyFetch(`survey-mesh?${new URLSearchParams({ utc })}`, { signal: controller.signal }).then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<SurveyMesh>; }),
      astronomyFetch('survey-image', { signal: controller.signal }).then(async (r) => { if (!r.ok) throw new Error(); return r.blob(); }),
    ]).then(([mesh, blob]) => {
      if (disposed) return;
      objectUrl = URL.createObjectURL(blob);
      cleanup = watchCesiumViewer((viewer) => {
        const positions = new Float64Array(mesh.directions.flatMap((v) => v.map((n) => n * 2e16)));
        const attributes = new Cesium.GeometryAttributes();
        attributes.position = new Cesium.GeometryAttribute({ componentDatatype: Cesium.ComponentDatatype.DOUBLE, componentsPerAttribute: 3, values: positions });
        attributes.normal = new Cesium.GeometryAttribute({ componentDatatype: Cesium.ComponentDatatype.FLOAT, componentsPerAttribute: 3, values: new Float32Array(mesh.directions.flatMap((v) => v.map((n) => -n))) });
        attributes.st = new Cesium.GeometryAttribute({ componentDatatype: Cesium.ComponentDatatype.FLOAT, componentsPerAttribute: 2, values: new Float32Array(mesh.uv.flat()) });
        const geometry = new Cesium.Geometry({
          attributes,
          indices: new Uint16Array(mesh.indices), primitiveType: Cesium.PrimitiveType.TRIANGLES,
          boundingSphere: Cesium.BoundingSphere.fromVertices(positions),
        });
        const primitive = viewer.scene.primitives.add(new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({ geometry }), asynchronous: false,
          appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType('Image', { image: objectUrl }), flat: true, translucent: false,
            materialSupport: Cesium.MaterialAppearance.MaterialSupport.TEXTURED,
            renderState: { cull: { enabled: false }, depthTest: { enabled: true }, depthMask: false },
          }),
        })) as Cesium.Primitive;
        const remove = viewer.scene.preRender.addEventListener(() => {
          Cesium.Matrix4.fromTranslation(viewer.camera.positionWC, primitive.modelMatrix);
        });
        viewer.scene.requestRender();
        setStatus('DSS overview loaded · low resolution; detailed zoom tiles pending');
        return () => { remove(); if (!viewer.isDestroyed()) viewer.scene.primitives.remove(primitive); };
      });
    }).catch(() => { if (!disposed) setStatus('DSS overview unavailable · retry astronomy to reconnect'); });
    return () => { disposed = true; controller.abort(); cleanup?.(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [utc, enabled]);
  return displayStatus;
}
