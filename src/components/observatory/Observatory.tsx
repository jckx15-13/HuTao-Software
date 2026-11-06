import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Globe2, Map, Orbit, Pause, Play, Search, SlidersHorizontal, Sparkles, Telescope, X } from 'lucide-react';
import { useObservatory, type Layers, type ObservatoryMode, type SkyTarget } from '@/core/state/observatoryStore';
import { useAstronomy, useConstellationCatalog } from './useAstronomy';
import { ObserverInset } from './ObserverInset';
import './observatory.css';

const WWTCanvas = lazy(() => import('./WWTCanvas'));
const SpatialView = lazy(() => import('./SpatialView'));
const MODES: { id: ObservatoryMode; label: string; icon: typeof Globe2 }[] = [{ id: 'sky', label: 'Sky', icon: Globe2 }, { id: 'solar', label: '3D bodies', icon: Orbit }, { id: 'map', label: 'Observer map', icon: Map }, { id: 'asteroid', label: 'Asteroid', icon: Sparkles }];
const BODY_NAMES = ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const LAYERS: [keyof Layers, string][] = [['figures', 'Figures'], ['boundaries', 'Boundaries'], ['labels', 'Labels'], ['grid', 'Equatorial grid'], ['artwork', 'Constellation artwork']];
const APP_BASE_URL = import.meta.env.BASE_URL;

export default function Observatory() {
  const state = useObservatory();
  const { catalog, error: catalogError, retry } = useConstellationCatalog();
  const { scene, error, pending } = useAstronomy();
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState<'explore' | 'settings' | null>(null);
  const [wwtStatus, setWWTStatus] = useState('Connecting to WWT');
  const [online, setOnline] = useState(navigator.onLine);
  const [surveyDraft, setSurveyDraft] = useState(state.survey);
  const [observerDraft, setObserverDraft] = useState({ latitude: String(state.latitude), longitude: String(state.longitude), altitude_km: String(state.altitude_km) });
  const visible = useMemo(() => catalog.filter((c) => `${c.name} ${c.id}`.toLowerCase().includes(query.toLowerCase())), [catalog, query]);
  const selected = catalog.find((c) => c.regions.some((r) => r.id === state.target.id));
  const choose = (target: SkyTarget | undefined) => { if (target) state.set({ target, mode: 'sky' }); setDrawer(null); };

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (!state.playing) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now(); const current = useObservatory.getState();
      const next = new Date(new Date(current.utc).getTime() + (now-last)*current.speed);
      last = now;
      if (next.getUTCFullYear() > 2050 || next.getUTCFullYear() < 2000) current.set({ playing: false });
      else current.set({ utc: next.toISOString() });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.playing]);

  return <main className="observatory">
    <header className="obs-header"><div className="obs-brand"><Telescope size={28}/><div><h1>Silver Wolf VI</h1><span>Observatory</span></div></div><a className="obs-back" href={APP_BASE_URL}><ArrowLeft size={16}/> <span>Back to workspace</span></a><span className={`obs-connection ${online ? '' : 'obs-warning'}`} role="status"><i/>{online ? wwtStatus : 'Offline · online imagery unavailable'}</span></header>
    <div className="obs-mobile-tools"><button onClick={() => setDrawer(drawer === 'explore' ? null : 'explore')}><Search size={16}/> Explore</button><button onClick={() => setDrawer(drawer === 'settings' ? null : 'settings')}><SlidersHorizontal size={16}/> Viewing controls</button></div>
    <div className="obs-workspace">
      <aside className={`obs-explorer ${drawer === 'explore' ? 'is-open' : ''}`} aria-label="Constellation explorer">
        <div className="obs-panel-title"><h2>Explore</h2><button className="obs-close" aria-label="Close explorer" onClick={() => setDrawer(null)}><X size={18}/></button></div>
        <label className="obs-search"><Search size={16}/><input aria-label="Find a constellation" placeholder="Find a constellation" value={query} onChange={(e) => setQuery(e.target.value)}/></label>
        <div className="obs-count">{query ? `${visible.length} results` : `All ${catalog.length || '88'} constellations`}</div>
        <div className="obs-catalog">
          {catalogError ? <div className="obs-error" role="alert">{catalogError}<button onClick={retry}>Retry catalog</button></div> : !catalog.length ? <p>Loading WWT catalog…</p> : null}
          {visible.map((c) => <div key={c.id}><button className={`obs-catalog-row ${selected?.id === c.id ? 'selected' : ''}`} aria-pressed={selected?.id === c.id} onClick={() => choose(c.regions[0])}><span>{c.name}</span><ChevronRight size={14}/></button>{c.id === 'SER' && selected?.id === 'SER' ? <div className="obs-regions">{c.regions.map((r) => <button key={r.id} onClick={() => choose(r)} aria-pressed={state.target.id === r.id}>{r.name.replace('Serpens ', '')}</button>)}</div> : null}</div>)}
          {catalog.length > 0 && !visible.length ? <p className="obs-muted">No matching constellation.</p> : null}
        </div>
        <p className="obs-catalog-credit">88 constellations · 89 sky regions<br/>Positions and overlays from WWT</p>
      </aside>

      <section className="obs-view" aria-label="Observatory viewport">
        <nav className="obs-modes" aria-label="Viewing mode">{MODES.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={state.mode === id} onClick={() => state.set({ mode: id })}><Icon size={16}/><span>{label}</span></button>)}</nav>
        <div className={`obs-render-layer ${state.mode === 'map' || state.mode === 'asteroid' ? 'obs-hidden' : ''}`}><Suspense fallback={<div className="obs-loading">Loading telescope engine…</div>}><WWTCanvas onStatus={setWWTStatus}/></Suspense></div>
        {state.mode === 'map' || state.mode === 'asteroid' ? <Suspense fallback={<div className="obs-loading">Loading 3D view…</div>}><SpatialView scene={error ? null : scene} asteroid={state.mode === 'asteroid'}/></Suspense> : null}
        {!online ? <div className="obs-network-banner" role="alert">Reconnect to load surveys and models. Previously displayed tiles may remain visible.</div> : null}
      </section>

      <aside className={`obs-inspector ${drawer === 'settings' ? 'is-open' : ''}`} aria-label="Viewing controls">
        <section><div className="obs-panel-title"><h2>{state.mode === 'sky' ? 'Viewing layers' : 'Viewing controls'}</h2><button className="obs-close" aria-label="Close viewing controls" onClick={() => setDrawer(null)}><X size={18}/></button></div>
          {state.mode === 'sky' ? LAYERS.map(([key, title]) => <label className="obs-check" key={key}><input type="checkbox" checked={state.layers[key]} onChange={(e) => state.set({ layers: { ...state.layers, [key]: e.target.checked } })}/>{title}</label>) : state.mode === 'solar' ? <><label className="obs-field">Celestial body<select value={state.body} onChange={(e) => state.set({ body: e.target.value })}>{BODY_NAMES.map((body) => <option key={body} value={body}>{body.charAt(0).toUpperCase()+body.slice(1)}</option>)}</select></label><p className="obs-muted">WWT renders the Sun, planets, and Moon as 3D spheres. Drag to orbit the selected body.</p></> : state.mode === 'asteroid' ? <p className="obs-muted">Bennu uses NASA’s irregular 3D shape model. Lighting is for inspection; this view does not simulate its orbit or current rotation.</p> : <p className="obs-muted">The mint marker is your Earth observer. The inspection camera can orbit the diagram independently. Planet centers come from Python calculations.</p>}
        </section>
        {state.mode === 'sky' ? <section><h2>Survey</h2><form onSubmit={(e) => { e.preventDefault(); state.set({ survey: surveyDraft }); }}><label className="obs-field"><span className="sr-only">Sky survey name</span><input list="wwt-survey-list" value={surveyDraft} onChange={(e) => setSurveyDraft(e.target.value)}/></label><button className="obs-apply" type="submit">Apply survey</button></form><p className="obs-muted">Online astronomical imagery. Observation dates vary by survey.</p></section> : null}
        <section><h2>Observer location</h2><form onSubmit={(e) => { e.preventDefault(); state.set({ latitude: Number(observerDraft.latitude), longitude: Number(observerDraft.longitude), altitude_km: Number(observerDraft.altitude_km) }); }}>
          <label className="obs-observer-field">Latitude<input aria-label="Observer latitude" type="number" step="any" required min="-90" max="90" value={observerDraft.latitude} onChange={(e) => setObserverDraft({ ...observerDraft, latitude: e.target.value })}/><span>° N</span></label>
          <label className="obs-observer-field">Longitude<input aria-label="Observer longitude" type="number" step="any" required min="-180" max="180" value={observerDraft.longitude} onChange={(e) => setObserverDraft({ ...observerDraft, longitude: e.target.value })}/><span>° E</span></label>
          <label className="obs-observer-field">Altitude<input aria-label="Observer altitude in kilometers" type="number" step="any" required min="0" max="1000000" value={observerDraft.altitude_km} onChange={(e) => setObserverDraft({ ...observerDraft, altitude_km: e.target.value })}/><span>km</span></label>
          <button type="submit" className="obs-apply">Apply observer</button>
        </form></section>
        <section><h2>Camera position</h2><ObserverInset scene={error ? null : scene}/>{error ? <p className="obs-error" role="alert">{error}</p> : <><dl className="obs-readout"><div><dt>Target</dt><dd>{state.target.name}</dd></div><div><dt>Altitude</dt><dd>{scene?.target.altitude_deg.toFixed(2) ?? '—'}°</dd></div><div><dt>Azimuth</dt><dd>{scene?.target.azimuth_deg.toFixed(2) ?? '—'}°</dd></div></dl><p className="obs-muted" role="status">{pending ? 'Updating Python calculations…' : 'Python calculations ready'} · unrefracted sky direction. Sky surveys remain an Earth-referenced celestial sphere.</p></>}</section>
      </aside>
    </div>
    <footer className="obs-timeline"><label>Observation time (UTC)<input aria-label="Observation time UTC" type="datetime-local" min="2000-01-01T00:00" max="2050-12-31T23:59" value={state.utc.slice(0,16)} onChange={(e) => { if (e.target.value && e.target.validity.valid) state.set({ utc: new Date(`${e.target.value}:00Z`).toISOString(), playing: false }); }}/></label><div className="obs-playback"><button className={state.playing ? '' : 'obs-primary'} aria-label={state.playing ? 'Pause time' : 'Play time'} onClick={() => state.set({ playing: !state.playing })}>{state.playing ? <Pause size={17}/> : <Play size={17}/>}</button><button onClick={() => state.set({ utc: new Date().toISOString(), playing: false })}>Now</button><label>Speed<select aria-label="Playback speed" value={state.speed} onChange={(e) => state.set({ speed: Number(e.target.value) })}><option value="1">1×</option><option value="60">1 min / sec</option><option value="3600">1 hour / sec</option><option value="86400">1 day / sec</option></select></label></div><div className="obs-time-readout"><time>{new Date(state.utc).toUTCString()}</time><span>{state.playing ? 'Time advancing' : 'Time paused'} · online prototype</span></div></footer>
  </main>;
}
