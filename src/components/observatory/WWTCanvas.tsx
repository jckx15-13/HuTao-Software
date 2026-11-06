import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { ImageSetType, SolarSystemObjects } from '@wwtelescope/engine-types';
import { useObservatory } from '@/core/state/observatoryStore';
import { attachWwtEngine, type WwtEngineSession } from '@/lib/wwt/engineSession';
import { WWTCollections } from './WWTCollections';

export default function WWTCanvas({ onStatus }: { onStatus: (value: string) => void }) {
  const state = useObservatory();
  const engine = useRef<WwtEngineSession | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [activeSession, setActiveSession] = useState<WwtEngineSession | null>(null);
  const [failure, setFailure] = useState('');
  const [surveyError, setSurveyError] = useState('');
  const [view, setView] = useState({ ra: 83.6475, dec: 5.949, fov: 55 });
  const [surveys, setSurveys] = useState<string[]>([]);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let lastSample = 0;
    let removeReady: (() => void) | undefined;
    let canvas: HTMLCanvasElement | undefined;
    const element = host.current;
    if (!element) return;
    onStatus('Connecting to WWT');
    const timeout = window.setTimeout(() => { if (!disposed) { setFailure('WWT is taking longer than expected. Check your connection or retry.'); onStatus('WWT connection delayed'); } }, 30000);
    attachWwtEngine(element).then((session) => {
      if (disposed) return;
      const { lib, api, control } = session;
      canvas = session.canvas;
      engine.current = session;
      const onReady = () => {
        if (disposed) return;
        clearTimeout(timeout); setFailure(''); setActiveSession(session); setReady(true); onStatus('WWT engine ready · online surveys');
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
      if (session.ready) onReady();
      const render = (time: number) => {
        if (disposed) return;
        try {
          if (!document.hidden) control.renderOneFrame();
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
    return () => { disposed = true; clearTimeout(timeout); cancelAnimationFrame(frame); removeReady?.(); engine.current = null; if (canvas?.parentElement === element) canvas.remove(); };
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
      const background = lib.WWTControl.getImageSets().find((s) => s.get_dataSetType() === ImageSetType.sky && s.get_name() === useObservatory.getState().survey);
      // The engine silently ignores unknown names. Keep the selected survey
      // explicit rather than showing another image under the requested label.
      control.renderContext.set_backgroundImageset(background ?? null);
      control.gotoRADecZoom(state.target.ra_deg / 15, state.target.dec_deg, 330, true);
    }
  }, [ready, state.mode, state.body, state.target.ra_deg, state.target.dec_deg]);

  useEffect(() => {
    if (!ready || !engine.current || state.mode !== 'sky') return;
    const { control, lib } = engine.current;
    const background = lib.WWTControl.getImageSets().find((s) => s.get_dataSetType() === ImageSetType.sky && s.get_name() === state.survey);
    control.renderContext.set_backgroundImageset(background ?? null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- report the synchronous engine lookup result.
    setSurveyError(background ? '' : `Survey "${state.survey}" is not in the loaded WWT catalogue. Choose a listed survey or load its WTML collection.`);
  }, [ready, state.mode, state.survey, surveys]);

  return <>
    <div ref={host} id="observatory-wwt" className="obs-wwt" aria-label="Interactive WorldWide Telescope view" />
    {!ready || failure ? <div className="obs-loading" role="status"><p>{failure || 'Connecting to WorldWide Telescope…'}</p>{failure ? <button onClick={() => { setFailure(''); setReady(false); setGeneration((n) => n + 1); }}>Retry WWT</button> : <small>Loading online surveys and constellation geometry</small>}</div> : null}
    {surveyError && state.mode === 'sky' ? <p className="obs-survey-error" role="alert">{surveyError}</p> : null}
    <WWTCollections session={ready ? activeSession : null} onLoaded={() => {
      const current = engine.current;
      if (current) setSurveys(current.lib.WWTControl.getImageSets().filter((s) => s.get_dataSetType() === ImageSetType.sky).map((s) => s.get_name()).sort());
    }} />
    <div className="obs-canvas-caption"><strong>{state.mode === 'solar' ? state.body : state.target.name}</strong><span>{state.mode === 'solar' ? '3D body · drag to orbit · scroll to zoom' : 'Drag to explore · scroll to zoom'}</span></div>
    <div className="obs-canvas-bottom">
      <span className="obs-coordinates">RA {view.ra.toFixed(3)}° &nbsp; DEC {view.dec.toFixed(3)}°</span>
      <div className="obs-zoom"><button aria-label="Zoom out" disabled={!ready} onClick={() => engine.current?.control.zoom(1.5)}><Minus size={18}/></button><span>{state.mode === 'solar' ? '3D' : `${view.fov.toFixed(1)}°`}<small>{state.mode === 'solar' ? 'ORBIT' : 'FOV'}</small></span><button aria-label="Zoom in" disabled={!ready} onClick={() => engine.current?.control.zoom(1 / 1.5)}><Plus size={18}/></button><button aria-label="Recenter target" disabled={!ready} onClick={() => { const current = engine.current; if (!current) return; if (state.mode === 'sky') current.control.gotoRADecZoom(state.target.ra_deg/15, state.target.dec_deg, 330, true); else { const place = new current.lib.Place(); place.set_names([state.body]); place.set_type(ImageSetType.solarSystem); place.set_target(SolarSystemObjects[state.body as keyof typeof SolarSystemObjects] as SolarSystemObjects); place.set_zoomLevel(0.02); current.control.gotoTarget(place, false, true, true); } }}><RotateCcw size={16}/></button></div>
    </div>
    <datalist id="wwt-survey-list">{surveys.map((name) => <option key={name} value={name}/>)}</datalist>
  </>;
}
