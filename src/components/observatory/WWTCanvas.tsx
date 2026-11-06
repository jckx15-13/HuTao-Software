import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { ImageSetType, SolarSystemObjects } from '@wwtelescope/engine-types';
import type { ScriptInterface, WWTControl } from '@wwtelescope/engine';
import { useObservatory } from '@/core/state/observatoryStore';

type Engine = typeof import('@wwtelescope/engine');
export default function WWTCanvas({ onStatus }: { onStatus: (value: string) => void }) {
  const state = useObservatory();
  const engine = useRef<{ lib: Engine; control: WWTControl; api: ScriptInterface } | null>(null);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState('');
  const [view, setView] = useState({ ra: 83.6475, dec: 5.949, fov: 55 });
  const [surveys, setSurveys] = useState<string[]>([]);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let lastSample = 0;
    let removeReady: (() => void) | undefined;
    onStatus('Connecting to WWT');
    const timeout = window.setTimeout(() => { if (!disposed) { setFailure('WWT is taking longer than expected. Check your connection or retry.'); onStatus('WWT connection delayed'); } }, 30000);
    import('@wwtelescope/engine').then((lib) => {
      if (disposed) return;
      const builder = new lib.WWTControlBuilder('observatory-wwt');
      builder.initialView(5.949, 83.6475, 330);
      builder.startRenderLoop(false);
      const api = builder.create();
      const control = lib.WWTControl.singleton;
      engine.current = { lib, control, api };
      const onReady = () => {
        if (disposed) return;
        clearTimeout(timeout); setFailure(''); setReady(true); onStatus('WWT connected · online imagery');
        setSurveys(lib.WWTControl.getImageSets().filter((s) => s.get_dataSetType() === ImageSetType.sky).map((s) => s.get_name()).sort());
        api.settings.set_showConstellationSelection(false);
        api.settings.set_constellationFigureColor('#A3E4D7');
        api.settings.set_constellationBoundryColor('#8A5BC7');
        api.settings.set_solarSystemLighting(true);
        api.settings.set_solarSystemPlanets(true);
        api.settings.set_solarSystemStars(true);
        api.settings.set_solarSystemOrbits(true);
        lib.SpaceTimeController.set_syncToClock(false);
      };
      api.add_ready(onReady);
      removeReady = () => api.remove_ready(onReady);
      const render = (time: number) => {
        if (disposed) return;
        try {
          control.renderOneFrame();
          if (time - lastSample > 500) {
            setView({ ra: api.getRA() * 15, dec: api.getDec(), fov: control.renderContext.viewCamera.zoom / 6 });
            lastSample = time;
          }
          frame = requestAnimationFrame(render);
        } catch (error) {
          setFailure(`Renderer unavailable: ${error instanceof Error ? error.message : 'WebGL error'}`);
          onStatus('Renderer unavailable');
        }
      };
      frame = requestAnimationFrame(render);
    }).catch((e) => { if (!disposed) { clearTimeout(timeout); setFailure(e.message); onStatus('WWT unavailable'); } });
    return () => { disposed = true; clearTimeout(timeout); cancelAnimationFrame(frame); removeReady?.(); engine.current = null; document.getElementById('observatory-wwt')?.replaceChildren(); };
  }, [generation, onStatus]);

  useEffect(() => {
    if (!ready || !engine.current) return;
    const { api } = engine.current;
    api.settings.set_showConstellationFigures(state.layers.figures);
    api.settings.set_showConstellationBoundries(state.layers.boundaries);
    api.settings.set_showConstellationLabels(state.layers.labels);
    api.settings.set_showConstellationPictures(state.layers.artwork);
    api.settings.set_showGrid(state.layers.grid);
    api.settings.set_showEquatorialGridText(state.layers.grid);
  }, [ready, state.layers]);

  useEffect(() => {
    if (!ready || !engine.current) return;
    const { lib, api } = engine.current;
    lib.SpaceTimeController.set_now(new Date(state.utc));
    api.settings.set_locationLat(state.latitude);
    api.settings.set_locationLng(state.longitude);
    api.settings.set_locationAltitude(state.altitude_km * 1000);
  }, [ready, state.utc, state.latitude, state.longitude, state.altitude_km]);

  useEffect(() => {
    if (!ready || !engine.current) return;
    const { control, lib } = engine.current;
    if (state.mode === 'solar') {
      const place = new lib.Place();
      place.set_names([state.body]);
      place.set_type(ImageSetType.solarSystem);
      place.set_target(SolarSystemObjects[state.body as keyof typeof SolarSystemObjects] as SolarSystemObjects);
      place.set_zoomLevel(0.02);
      control.gotoTarget(place, false, true, true);
    } else if (state.mode === 'sky') {
      control.setBackgroundImageByName(state.survey);
      control.gotoRADecZoom(state.target.ra_deg / 15, state.target.dec_deg, 330, true);
    }
  }, [ready, state.mode, state.body, state.target, state.survey]);

  return <>
    <div id="observatory-wwt" className="obs-wwt" aria-label="Interactive WorldWide Telescope view" />
    {!ready || failure ? <div className="obs-loading" role="status"><p>{failure || 'Connecting to WorldWide Telescope…'}</p>{failure ? <button onClick={() => { setFailure(''); setReady(false); setGeneration((n) => n + 1); }}>Retry WWT</button> : <small>Loading online surveys and constellation geometry</small>}</div> : null}
    <div className="obs-canvas-caption"><strong>{state.mode === 'solar' ? state.body : state.target.name}</strong><span>{state.mode === 'solar' ? '3D body · drag to orbit · scroll to zoom' : 'Drag to explore · scroll to zoom'}</span></div>
    <div className="obs-canvas-bottom">
      <span className="obs-coordinates">RA {view.ra.toFixed(3)}° &nbsp; DEC {view.dec.toFixed(3)}°</span>
      <div className="obs-zoom"><button aria-label="Zoom out" disabled={!ready} onClick={() => engine.current?.control.zoom(1.5)}><Minus size={18}/></button><span>{state.mode === 'solar' ? '3D' : `${view.fov.toFixed(1)}°`}<small>{state.mode === 'solar' ? 'ORBIT' : 'FOV'}</small></span><button aria-label="Zoom in" disabled={!ready} onClick={() => engine.current?.control.zoom(1 / 1.5)}><Plus size={18}/></button><button aria-label="Recenter target" disabled={!ready} onClick={() => { if (state.mode === 'sky') engine.current?.control.gotoRADecZoom(state.target.ra_deg/15, state.target.dec_deg, 330, true); else state.set({ body: 'earth' }); }}><RotateCcw size={16}/></button></div>
    </div>
    <datalist id="wwt-survey-list">{surveys.map((name) => <option key={name} value={name}/>)}</datalist>
  </>;
}
