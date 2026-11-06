import { watchCesiumViewer } from '@/lib/watchCesiumViewer';
import { astronomyFetch } from './astronomyApi';
import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import { getCesiumViewer } from '@/lib/cesiumViewerRegistry';
import { useObservatory, type SkyTarget } from '@/core/state/observatoryStore';
import { useConstellationCatalog } from './useAstronomy';
import { useWorldSkyGeometry } from './useWorldSkyGeometry';
import { lookAround as face } from './worldCamera';
import { WorldBodyControls } from './WorldBodyControls';
import { useWorldSurvey } from './useWorldSurvey';
import './worldTelescope.css';

type SkyRegion = SkyTarget & { direction: [number, number, number] };


/** Astronomy controls and labels over the existing Cesium world, without another canvas. */
export default function WorldTelescopeOverlay() {
  const utc = useObservatory((s) => s.utc);
  const target = useObservatory((s) => s.target);
  const navigation = useObservatory((s) => s.navigation);
  const set = useObservatory((s) => s.set);
  const { catalog, error: catalogError, retry } = useConstellationCatalog();
  const [query, setQuery] = useState('');
  const [regions, setRegions] = useState<SkyRegion[]>([]);
  const [error, setError] = useState('');
  const [labels, setLabels] = useState(true);
  const [selected, setSelected] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [bodiesExpanded, setBodiesExpanded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [fov, setFov] = useState(60);
  const [figures, setFigures] = useState(true);
  const [boundaries, setBoundaries] = useState(false);
  const geometry = useWorldSkyGeometry(utc, figures, boundaries, attempt);
  const [survey, setSurvey] = useState(true);
  const surveyStatus = useWorldSurvey(utc, survey);

  useEffect(() => {
    const controller = new AbortController();
    astronomyFetch(`sky?${new URLSearchParams({ utc })}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error('Python sky calculations unavailable. Start the astronomy service and retry.'); return response.json() as Promise<{ regions: SkyRegion[] }>; })
      .then((data) => { if (!controller.signal.aborted) { setRegions(data.regions); setError(''); } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Sky calculation failed'); });
    return () => controller.abort();
  }, [utc, attempt]);

  useEffect(() => {
    return watchCesiumViewer((viewer) => {
      const collection = viewer.scene.primitives.add(new Cesium.LabelCollection()) as Cesium.LabelCollection;
      for (const region of regions) collection.add({
        id: `wwt-region-${region.id}`, text: region.name,
        position: Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.fromArray(region.direction), 1e16, new Cesium.Cartesian3()),
        font: '12px sans-serif', fillColor: Cesium.Color.fromCssColorString('#a9f5e0'),
        outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      });
      collection.show = labels;
      const remove = viewer.scene.preRender.addEventListener(() => {
        Cesium.Matrix4.fromTranslation(viewer.camera.positionWC, collection.modelMatrix);
      });
      const updateFov = () => {
        if (!viewer.isDestroyed() && viewer.camera.frustum instanceof Cesium.PerspectiveFrustum) setFov(Cesium.Math.toDegrees(viewer.camera.frustum.fov ?? Math.PI / 3));
      };
      const timer = window.setInterval(updateFov, 300);
      updateFov();
      viewer.scene.requestRender();
      return () => { clearInterval(timer); remove(); if (!viewer.isDestroyed()) viewer.scene.primitives.remove(collection); };
    });
  }, [regions, labels]);

  const choose = (regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    if (!region) return;
    face(Cesium.Cartesian3.fromArray(region.direction));
    setSelected(region.name);
    set({ target: region });
  };
  const visible = catalog.filter((c) => `${c.id} ${c.name}`.toLowerCase().includes(query.toLowerCase()));

  return <section className="world-telescope" aria-label="World telescope controls">
    <div className="world-telescope-toolbar">
      <strong>Telescope · {navigation === 'look' ? 'Look around' : 'Body orbit'}</strong>
      <a className="world-telescope-explorer" href={`${import.meta.env.BASE_URL}?view=observatory&target=${encodeURIComponent(target.id)}&utc=${encodeURIComponent(utc)}`}>Open WWT explorer</a>
      <button onClick={() => { const viewer = getCesiumViewer(); if (viewer) face(Cesium.Cartesian3.negate(viewer.camera.directionWC, new Cesium.Cartesian3())); setSelected(''); }}>Look behind</button>
      <button onClick={() => { const viewer = getCesiumViewer(); if (viewer) face(Cesium.Cartesian3.negate(viewer.camera.positionWC, new Cesium.Cartesian3())); setSelected(''); }}>Face Earth</button>
      <button aria-expanded={expanded} onClick={() => { setExpanded(!expanded); setBodiesExpanded(false); }}>Constellations ({catalog.length || '…'})</button>
      <button aria-expanded={bodiesExpanded} onClick={() => { setBodiesExpanded(!bodiesExpanded); setExpanded(false); }}>Bodies & asteroid</button>
      <span>FOV {fov.toFixed(1)}°</span>
    </div>
    <p className="world-telescope-hint">{navigation === 'look' ? 'Drag to look in any direction · scroll to change field of view' : 'Drag to orbit the selected body · scroll to change distance'} · select Space to restore your Earth view</p>
    <WorldBodyControls utc={utc} expanded={bodiesExpanded} attempt={attempt} />
    {expanded ? <div className="world-telescope-catalog">
      <label>Find a constellation<input aria-label="Find a constellation in the world view" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or abbreviation" /></label>
      <label className="world-telescope-check"><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />Show constellation names around the sky</label>
      <label className="world-telescope-check"><input type="checkbox" checked={figures} onChange={(e) => setFigures(e.target.checked)} />Constellation line figures</label>
      <label className="world-telescope-check"><input type="checkbox" checked={boundaries} onChange={(e) => setBoundaries(e.target.checked)} />Constellation boundaries</label>
      <label className="world-telescope-check"><input type="checkbox" checked={survey} onChange={(e) => setSurvey(e.target.checked)} />DSS all-sky overview</label>
      <p role="status">{surveyStatus}. Imagery: Digitized Sky Survey / STScI / AURA, served by WWT.</p>
      <label>Observation time (UTC)<input aria-label="World telescope observation time" type="datetime-local" min="2000-01-01T00:00" max="2050-12-31T23:59" value={utc.slice(0,16)} onChange={(e) => { if (e.target.value && e.target.validity.valid) set({ utc: new Date(`${e.target.value}:00Z`).toISOString() }); }} /></label>
      <div className="world-telescope-results">{visible.map((c) => <div key={c.id}>{c.regions.map((r) => <button key={r.id} disabled={!regions.length} aria-pressed={selected === r.name} onClick={() => choose(r.id)}>{r.name}</button>)}</div>)}{catalog.length > 0 && !visible.length ? <p>No matching constellation.</p> : null}</div>
      <p>WWT catalog · 88 constellations / 89 regions · directions calculated by Python</p>
    </div> : null}
    {error || catalogError || geometry.error ? <div className="world-telescope-error" role="alert">{error || catalogError || geometry.error}<button onClick={() => { setAttempt((n) => n + 1); retry(); }}>Retry astronomy</button></div> : <p className="world-telescope-status" role="status">{regions.length ? `${selected ? `${selected} · ` : ''}${geometry.ready ? `${geometry.starCount} catalog stars` : 'Loading catalog stars and figures…'} · ${new Date(utc).toUTCString()}` : 'Loading online constellation data…'}</p>}
  </section>;
}
