import { watchCesiumViewer } from '@/lib/watchCesiumViewer';
import { astronomyFetch } from './astronomyApi';
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { getCesiumViewer } from '@/lib/cesiumViewerRegistry';
import { lookAround, orbitBody } from './worldCamera';

type Body = { id: string; name: string; radius_m: number; position_m: [number, number, number] };
const COLORS: Record<string, string> = { sun: '#fff0b0', mercury: '#aaa19a', venus: '#e6ce9b', moon: '#b2b4bc', mars: '#c97d5c', jupiter: '#d4b393', saturn: '#dfcb9c', uranus: '#9ed3db', neptune: '#5d83d8' };
const BENNU_URL = 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/b/Bennu_1_1.glb';

export function WorldBodyControls({ utc, expanded, attempt }: { utc: string; expanded: boolean; attempt: number }) {
  const [bodies, setBodies] = useState<Body[]>([]);
  const [selected, setSelected] = useState('sun');
  const [error, setError] = useState('');
  const [modelStatus, setModelStatus] = useState('');
  const [modelAttempt, setModelAttempt] = useState(0);
  const modelRef = useRef<Cesium.Model | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    astronomyFetch(`bodies?${new URLSearchParams({ utc })}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error('Solar-system positions unavailable. Retry astronomy.'); return response.json() as Promise<{ bodies: Body[] }>; })
      .then((data) => { if (!controller.signal.aborted) { setBodies(data.bodies); setError(''); } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Body data unavailable'); });
    return () => controller.abort();
  }, [utc, attempt]);

  useEffect(() => {
    if (!bodies.length) return;
    return watchCesiumViewer((viewer) => {
      let disposed = false;
      const source = new Cesium.CustomDataSource('wwt-python-solar-system');
      const sunVisible = viewer.scene.sun?.show;
      const moonVisible = viewer.scene.moon?.show;
      if (viewer.scene.sun) viewer.scene.sun.show = false;
      if (viewer.scene.moon) viewer.scene.moon.show = false;
      for (const body of bodies) {
        if (body.id === 'earth') continue; // The original world globe remains Earth.
        source.entities.add({
          id: `astronomy-${body.id}`, name: body.name,
          position: Cesium.Cartesian3.fromArray(body.position_m),
          ellipsoid: { radii: new Cesium.Cartesian3(body.radius_m, body.radius_m, body.radius_m), material: Cesium.Color.fromCssColorString(COLORS[body.id] ?? '#d0d0d0') },
          label: { text: body.name, font: '12px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new Cesium.Cartesian2(0, -18) },
        });
      }
      void viewer.dataSources.add(source).then(() => { if (disposed && !viewer.isDestroyed()) viewer.dataSources.remove(source, true); });
      viewer.scene.requestRender();
      return () => {
        disposed = true;
        if (viewer.isDestroyed()) return;
        viewer.dataSources.remove(source, true);
        if (viewer.scene.sun && sunVisible !== undefined) viewer.scene.sun.show = sunVisible;
        if (viewer.scene.moon && moonVisible !== undefined) viewer.scene.moon.show = moonVisible;
      };
    });
  }, [bodies]);

  useEffect(() => {
    if (!modelAttempt) return;
    const viewer = getCesiumViewer();
    if (!viewer) return;
    let disposed = false;
    let removeReady: (() => void) | undefined;
    let model: Cesium.Model | undefined;
    const position = Cesium.Cartesian3.add(viewer.camera.positionWC, Cesium.Cartesian3.multiplyByScalar(viewer.camera.directionWC, 5000, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    void Cesium.Model.fromGltfAsync({ url: BENNU_URL, modelMatrix: Cesium.Matrix4.fromTranslation(position), minimumPixelSize: 0 })
      .then((loaded) => {
        if (disposed || viewer.isDestroyed()) { loaded.destroy(); return; }
        model = loaded; modelRef.current = loaded;
        viewer.scene.primitives.add(loaded);
        const ready = () => {
          if (disposed) return;
          const sphere = loaded.boundingSphere;
          const scale = 245 / sphere.radius;
          const offset = Cesium.Cartesian3.subtract(sphere.center, position, new Cesium.Cartesian3());
          loaded.scale = scale;
          loaded.modelMatrix = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.subtract(position, Cesium.Cartesian3.multiplyByScalar(offset, scale, offset), new Cesium.Cartesian3()));
          orbitBody(position, 245);
          setModelStatus('NASA Bennu model · inspection placement, approximately 490 m across · orbit/spin not simulated');
        };
        removeReady = loaded.readyEvent.addEventListener(ready);
        if (loaded.ready) ready();
        viewer.scene.requestRender();
      })
      .catch(() => { if (!disposed) setModelStatus('NASA model unavailable. Check the connection and retry.'); });
    return () => {
      disposed = true; removeReady?.(); modelRef.current = null;
      if (model && !viewer.isDestroyed()) viewer.scene.primitives.remove(model);
    };
  }, [modelAttempt]);

  const selectedBody = bodies.find((body) => body.id === selected);
  const observe = () => {
    const viewer = getCesiumViewer();
    if (viewer && selectedBody) lookAround(Cesium.Cartesian3.subtract(Cesium.Cartesian3.fromArray(selectedBody.position_m), viewer.camera.positionWC, new Cesium.Cartesian3()));
  };
  if (!expanded) return error ? <p className="world-telescope-error" role="alert">{error}</p> : null;
  return <div className="world-telescope-catalog">
    <label>Solar-system body<select aria-label="World telescope body" value={selected} onChange={(event) => setSelected(event.target.value)}>{bodies.map((body) => <option key={body.id} value={body.id}>{body.name}</option>)}</select></label>
    <div className="world-body-actions"><button disabled={!selectedBody} onClick={observe}>Observe from here</button><button disabled={!selectedBody} onClick={() => { if (selectedBody) orbitBody(Cesium.Cartesian3.fromArray(selectedBody.position_m), selectedBody.radius_m); }}>Orbit body</button><button onClick={() => lookAround()}>Release orbit</button></div>
    <p>True mean radii · schematic colors, surface imagery pending. Positions are Earth-referenced apparent positions from Python; body spin is not simulated.</p>
    <button onClick={() => setModelAttempt((value) => value + 1)}>Inspect NASA Bennu model</button>
    {modelStatus ? <p role="status">{modelStatus}</p> : null}
    <p><a href="https://science.nasa.gov/resource/bennu-3d-model/" target="_blank" rel="noreferrer">Bennu model: NASA / VTAD</a>. Inspection placement is separate from a calculated asteroid orbit.</p>
    {error ? <p role="alert">{error}</p> : !bodies.length ? <p>Calculating body positions…</p> : null}
  </div>;
}
