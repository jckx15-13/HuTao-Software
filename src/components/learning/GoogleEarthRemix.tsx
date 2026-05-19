import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ChevronDown,
  Compass,
  FolderKanban,
  Layers,
  Map,
  Minus,
  Navigation,
  Pin,
  Plus,
  Ruler,
  Search,
  Settings,
  UserCircle,
  Waypoints,
} from 'lucide-react';
import { locations, type LocationData } from '../../data/locations';
import { tours } from '../../data/tours';
import './GoogleEarthRemix.css';

const menuItems = ['File', 'Edit', 'View', 'Add', 'Tools', 'Help'];
const mapLabels = ['India', 'China', 'Thailand', 'Vietnam', 'Malaysia', 'Indonesia', 'Japan', 'Australia'];

export default function GoogleEarthRemix() {
  const [query, setQuery] = useState('');
  const [activeLocation, setActiveLocation] = useState<LocationData>(locations[0]);
  const [zoom, setZoom] = useState(42);
  const [layersOpen, setLayersOpen] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const filteredLocations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return locations.slice(0, 5);
    return locations.filter((location) =>
      `${location.name} ${location.country} ${location.category}`.toLowerCase().includes(term),
    );
  }, [query]);

  const activeTour = tours[tourIndex % tours.length];
  const rotate = activeLocation ? activeLocation.lng * -0.24 : 0;
  const tilt = activeLocation ? activeLocation.lat * 0.18 : 0;

  return (
    <section className="earth-remix" aria-label="Earth explorer">
      <header className="earth-menu">
        <div className="earth-logo" aria-hidden="true" />
        {menuItems.map((item) => (
          <button key={item} type="button">{item}</button>
        ))}
      </header>

      <div className="earth-toolbar">
        <div className="earth-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Earth Explorer"
            aria-label="Search Earth Explorer"
          />
        </div>

        <ToolbarIcon label="Voyager"><Compass size={20} /></ToolbarIcon>
        <ToolbarIcon label="Places"><Pin size={20} /></ToolbarIcon>
        <ToolbarIcon label="Projects"><Waypoints size={20} /></ToolbarIcon>
        <ToolbarIcon label="Map style"><Layers size={20} /></ToolbarIcon>
        <ToolbarIcon label="Measure"><Ruler size={20} /></ToolbarIcon>
        <ToolbarIcon label="Tours"><FolderKanban size={20} /></ToolbarIcon>

        <div className="earth-toolbar-spacer" />
        <button type="button" className="earth-collapse" aria-label="Collapse toolbar">
          <ChevronDown size={18} />
        </button>
        <ToolbarIcon label="Settings"><Settings size={20} /></ToolbarIcon>
        <ToolbarIcon label="Profile"><UserCircle size={24} /></ToolbarIcon>
      </div>

      <div className="earth-stage">
        <div className="earth-starfield" aria-hidden="true" />
        <div
          className="earth-globe"
          style={{
            '--earth-zoom': `${zoom}%`,
            '--earth-scale': zoom / 42,
            '--earth-rotate': `${rotate}deg`,
            '--earth-tilt': `${tilt}deg`,
          } as CSSProperties}
          aria-hidden="true"
        >
          <div className="earth-sphere">
            <div className="earth-clouds" />
            <div className="earth-terminator" />
            {locations.slice(0, 10).map((location) => (
              <button
                key={location.id}
                type="button"
                className={`earth-marker ${location.id === activeLocation.id ? 'active' : ''}`}
                style={markerStyle(location)}
                onClick={() => setActiveLocation(location)}
                aria-label={`Open ${location.name}`}
              />
            ))}
            {mapLabels.map((label, index) => (
              <span key={label} className="earth-label" style={labelStyle(index)}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <aside className="earth-results" aria-label="Search results">
          <div className="earth-panel-title">Explore</div>
          <div className="earth-result-list">
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                className={location.id === activeLocation.id ? 'selected' : ''}
                onClick={() => setActiveLocation(location)}
              >
                <span>{location.name}</span>
                <small>{location.country} · {location.category}</small>
              </button>
            ))}
          </div>
        </aside>

        <aside className="earth-place" aria-label="Selected place">
          <img src={activeLocation.image} alt="" loading="lazy" />
          <div>
            <div className="earth-panel-title">{activeLocation.name}</div>
            <p>{activeLocation.description}</p>
            <div className="earth-facts">
              <span>{activeLocation.country}</span>
              <span>{activeLocation.elevation}</span>
              <span>{activeLocation.category}</span>
            </div>
          </div>
        </aside>

        <aside className={`earth-layers ${layersOpen ? 'open' : ''}`}>
          <button type="button" onClick={() => setLayersOpen((open) => !open)}>
            <Layers size={16} />
            Layers
          </button>
          {layersOpen && (
            <div>
              <label><input type="checkbox" defaultChecked /> Borders and labels</label>
              <label><input type="checkbox" defaultChecked /> Photoreal terrain</label>
              <label><input type="checkbox" /> Roads</label>
            </div>
          )}
        </aside>

        <aside className="earth-tour">
          <span>Voyager</span>
          <strong>{activeTour.title}</strong>
          <button type="button" onClick={() => setTourIndex((index) => index + 1)}>
            Next tour
          </button>
        </aside>

        <div className="earth-minimap">
          <Map size={18} />
        </div>

        <div className="earth-controls" aria-label="Map controls">
          <button type="button" aria-label="Street View"><UserCircle size={22} /></button>
          <button type="button" aria-label="Recenter"><Navigation size={22} /></button>
          <button type="button" aria-label="Compass"><Compass size={22} /></button>
          <div className="earth-zoom">
            <button type="button" onClick={() => setZoom((value) => Math.max(24, value - 8))} aria-label="Zoom out">
              <Minus size={20} />
            </button>
            <button type="button" onClick={() => setZoom((value) => Math.min(72, value + 8))} aria-label="Zoom in">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <footer className="earth-status">
          <span>Google-style educational remix</span>
          <span>{zoom < 36 ? '10,000 km' : '1,000 km'}</span>
          <span>Camera: {Math.round((78 - zoom) * 920)} km</span>
          <span>{activeLocation.lat.toFixed(4)}° {activeLocation.lng.toFixed(4)}°</span>
        </footer>
      </div>
    </section>
  );
}

function ToolbarIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button type="button" className="earth-tool" aria-label={label} title={label}>
      {children}
    </button>
  );
}

function markerStyle(location: LocationData) {
  return {
    left: `${Math.max(8, Math.min(92, ((location.lng + 180) / 360) * 100))}%`,
    top: `${Math.max(10, Math.min(88, ((90 - location.lat) / 180) * 100))}%`,
  };
}

function labelStyle(index: number) {
  const points = [
    [37, 43], [55, 29], [61, 52], [66, 50], [58, 70], [69, 75], [79, 31], [74, 91],
  ];
  const [left, top] = points[index] || [50, 50];
  return { left: `${left}%`, top: `${top}%` };
}
