import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Compass, Eye, RefreshCw, X, ChevronLeft, ChevronRight,
  Search, Grid, Star, Camera, Tag, Layers, MapPin
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS as presets, resolveTelescopePresetCoordinates } from '@/data/telescopePresets';
import { constellations } from '@/data/constellations';
import { precessEquatorialJ2000ToDate } from '@/lib/coordinateTransforms';
import {
  projectTelescopeTargetToEarth,
  projectTelescopeTargetToObserverView,
} from '@/lib/earthObserverProjection';

const BACKGROUND_LAYERS = [
  { id: 'solar-system', name: '3D Solar System (Earth-centered)', value: '3D Solar System View', desc: 'Earth-centered celestial reference frame.' },
  { id: 'dss', name: 'Digitized Sky Survey (Color)', value: 'Digitized Sky Survey (Color)', desc: 'Visible light survey mapping the sky.' },
  { id: 'visible', name: 'Visible Spectrum Composite', value: 'Visible Imagery', desc: 'Optical visible spectrum celestial map.' },
  { id: 'hubble', name: 'Hubble Space Telescope', value: 'Hubble Space Telescope Imagery', desc: 'High-resolution deep space observations.' },
  { id: 'chandra', name: 'Chandra X-Ray Survey', value: 'RASS: ROSAT All Sky Survey (X-ray)', desc: 'High-energy X-ray universe scan.' },
  { id: 'planck', name: 'Planck Dust & Gas', value: 'Planck Dust & Gas', desc: 'Interstellar dust and CMB microwave spectrum.' },
  { id: 'radio', name: 'Radio (VLSS)', value: 'VLSS: VLA Low-frequency Sky Survey (Radio)', desc: 'Low-frequency radio sky map.' }
];

const PHOTO_COLLECTIONS = [
  { id: 'hubble', name: 'Hubble Heritage Collection', desc: 'Panoramic collections of star fields, nebulae, and deep sky galaxies.' },
  { id: 'spitzer', name: 'Spitzer Infrared Survey', desc: 'Infrared penetrations of stellar nurseries.' },
  { id: 'chandra', name: 'Chandra X-Ray High-Energy Map', desc: 'Hot gas remnants of supernovas and pulsar wind nebulae.' },
  { id: 'jwst', name: 'James Webb Deep Field Manifests', desc: 'Infrared cosmic cliffs and early universe galaxies.' }
];

const MEDIA_LOCATION_DOTS = [
  {
    id: 'media-m31',
    title: 'Hubble M31 Core Panorama',
    raHours: 0.712,
    decDegrees: 41.27,
    constellation: 'Andromeda',
    color: '#FF00AA',
    spectrum: 'Visible / UV',
    desc: 'High-resolution stellar population census of the Andromeda nucleus.'
  },
  {
    id: 'media-m42',
    title: 'Hubble Orion Nebula Mosaic',
    raHours: 5.58,
    decDegrees: -5.38,
    constellation: 'Orion',
    color: '#FF5500',
    spectrum: 'Visible / IR',
    desc: 'Deep optical survey mapping protoplanetary discs (proplyds).'
  },
  {
    id: 'media-m16',
    title: 'JWST Pillars of Creation',
    raHours: 18.314,
    decDegrees: -13.82,
    constellation: 'Serpens',
    color: '#00FFCC',
    spectrum: 'Near-Infrared',
    desc: 'NIRCam view penetrating interstellar dust columns.'
  },
  {
    id: 'media-m1',
    title: 'Chandra Crab Supernova Remnant',
    raHours: 5.575,
    decDegrees: 22.01,
    constellation: 'Taurus',
    color: '#FFAA00',
    spectrum: 'X-Ray (0.5-8 keV)',
    desc: 'Pulsar wind nebula ring and high-energy particle acceleration.'
  },
  {
    id: 'media-m57',
    title: 'Hubble Ring Nebula (M57)',
    raHours: 18.885,
    decDegrees: 33.03,
    constellation: 'Lyra',
    color: '#E5C158',
    spectrum: 'Visible / OIII',
    desc: 'Expanding shell of ionized gas surrounding a dying white dwarf.'
  },
  {
    id: 'media-m104',
    title: 'Spitzer Sombrero Dust Ring',
    raHours: 12.667,
    decDegrees: -11.62,
    constellation: 'Virgo',
    color: '#A370F7',
    spectrum: 'Infrared 8.0 μm',
    desc: 'Infrared emission from dust ring surrounding the galaxy bulge.'
  },
];

const STAR_FIELD_BACKGROUND = Array.from({ length: 120 }, (_, index) => ({
  id: `native-star-${index}`,
  x: ((index * 41) % 1000) / 10,
  y: ((index * 79) % 1000) / 10,
  radius: index % 13 === 0 ? 0.35 : index % 7 === 0 ? 0.22 : 0.12,
  opacity: 0.25 + ((index * 23) % 65) / 100,
}));

type ProjectedConstellationStar = {
  name: string;
  x: number;
  y: number;
  magnitude: number;
  visibleHemisphere: boolean;
};

type ProjectedConstellationOverlay = {
  id: string;
  name: string;
  stars: ProjectedConstellationStar[];
  connections: [number, number][];
  labelX: number;
  labelY: number;
  visibleStarCount: number;
  isActiveRegion: boolean;
};

const clampPx = (value: number, min: number, max: number): number => {
  const normalized = Math.round(value);
  if (!Number.isFinite(normalized)) return min;
  return Math.min(Math.max(normalized, min), max);
};

export default function WorldWideTelescopeView({
  bgOnly = false,
  controlsOnly = false,
}: {
  bgOnly?: boolean;
  controlsOnly?: boolean;
} = {}) {
  const storeTarget = useUIStore((s) => s.telescopeTarget);
  const spaceInteractionTarget = useUIStore((s) => s.spaceInteractionTarget);
  
  const telescopeTarget = useMemo(() => {
    try {
      let tgt: any = storeTarget;
      if (typeof tgt === 'string') {
        try { tgt = JSON.parse(tgt); } catch (e) {}
      }
      if (!tgt || typeof tgt !== 'object' || !tgt.name) return presets[0];
      return tgt;
    } catch (e) {
      return presets[0];
    }
  }, [storeTarget]);

  const setTelescopeTarget = useUIStore((s) => s.setTelescopeTarget);
  const wwtBackgroundLayer = useUIStore((s) => s.wwtBackgroundLayer);
  const setWwtBackgroundLayer = useUIStore((s) => s.setWwtBackgroundLayer);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);

  const activePreset = useMemo(() => {
    if (!telescopeTarget || !telescopeTarget.name) return presets[0];
    return presets.find(p => p.name === telescopeTarget.name) || presets[0];
  }, [telescopeTarget]);

  const currentTime = useStore((s) => s.currentTime);

  const [defaultTime] = useState(() => Date.now());
  const safeCurrentTime = useMemo(() => (currentTime instanceof Date && !isNaN(currentTime.getTime()) ? currentTime : null), [currentTime]);
  const coordinateDate = useMemo(() => safeCurrentTime || new Date(defaultTime), [defaultTime, safeCurrentTime]);
  const activePresetCoordinates = useMemo(
    () => resolveTelescopePresetCoordinates(activePreset, coordinateDate),
    [activePreset, coordinateDate],
  );

  const earthReferenceFrame = useMemo(() => {
    const projection = projectTelescopeTargetToEarth(
      activePresetCoordinates.raHours,
      activePresetCoordinates.decDegrees,
      coordinateDate
    );

    return {
      ...projection,
      longitude: projection.longitudeLabel,
      latitude: projection.latitudeLabel,
    };
  }, [activePresetCoordinates, coordinateDate]);

  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  // SilverWolf Native Celestial Overlays (Default enabled)
  const [showConstellationFigures, setShowConstellationFigures] = useState(true);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [showConstellationNames, setShowConstellationNames] = useState(true);
  const [showConstellationBoundries, setShowConstellationBoundries] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showMediaDots, setShowMediaDots] = useState(true);
  const [hoveredMediaDot, setHoveredMediaDot] = useState<typeof MEDIA_LOCATION_DOTS[0] | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeControlTab, setActiveControlTab] = useState<'navigator' | 'overlays' | 'imagery' | 'photos'>('navigator');
  const [searchQuery, setSearchQuery] = useState('');

  const leftPanelInset = leftPanelOpen ? 280 : 20;
  const rightPanelInset = rightPanelOpen ? 280 : 20;
  const drawerWidth = clampPx(Math.round(viewportSize.width * 0.28), 260, 360);

  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const query = searchQuery.toLowerCase();
    return presets.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.ra.toLowerCase().includes(query) ||
      p.dec.toLowerCase().includes(query) ||
      (p.constellation && p.constellation.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const projectedPresetTargets = useMemo(() => {
    return presets.map((preset) => {
      const coordinates = resolveTelescopePresetCoordinates(preset, coordinateDate);
      const observerProjection = projectTelescopeTargetToObserverView(
        activePresetCoordinates.raHours,
        activePresetCoordinates.decDegrees,
        coordinates.raHours,
        coordinates.decDegrees,
        coordinateDate
      );
      return {
        id: preset.id,
        name: preset.name,
        color: preset.color || '#00fff7',
        x: observerProjection.x,
        y: observerProjection.y,
        angularSeparationDegrees: observerProjection.angularSeparationDegrees,
        altitudeAngleDegrees: observerProjection.altitudeAngleDegrees,
        visibleHemisphere: observerProjection.visibleHemisphere,
        isActive: preset.name === activePreset.name,
        preset,
      };
    });
  }, [activePreset.name, activePresetCoordinates, coordinateDate]);

  const projectedMediaDots = useMemo(() => {
    return MEDIA_LOCATION_DOTS.map((media) => {
      const observerProjection = projectTelescopeTargetToObserverView(
        activePresetCoordinates.raHours,
        activePresetCoordinates.decDegrees,
        media.raHours,
        media.decDegrees,
        coordinateDate
      );
      return {
        ...media,
        x: observerProjection.x,
        y: observerProjection.y,
        visibleHemisphere: observerProjection.visibleHemisphere,
      };
    });
  }, [activePresetCoordinates, coordinateDate]);

  const projectedConstellationOverlays = useMemo<ProjectedConstellationOverlay[]>(() => {
    const activePresetId = String(activePreset.id || '').toLowerCase();
    const activePresetName = String(activePreset.name || '').toLowerCase();

    return constellations.map((constellation) => {
      const stars = constellation.stars.map((star) => {
        const precessed = precessEquatorialJ2000ToDate({ ra: star.ra, dec: star.dec }, coordinateDate);
        const projection = projectTelescopeTargetToObserverView(
          activePresetCoordinates.raHours,
          activePresetCoordinates.decDegrees,
          precessed.ra,
          precessed.dec,
          coordinateDate
        );

        return {
          name: star.name,
          x: projection.x,
          y: projection.y,
          magnitude: star.magnitude ?? 3,
          visibleHemisphere: projection.visibleHemisphere,
        };
      });

      const visibleStars = stars.filter((star) => star.visibleHemisphere);
      const labelStars = visibleStars.length ? visibleStars : stars;
      const labelX = labelStars.reduce((sum, star) => sum + star.x, 0) / Math.max(1, labelStars.length);
      const labelY = labelStars.reduce((sum, star) => sum + star.y, 0) / Math.max(1, labelStars.length);
      const normalizedConstellationId = constellation.id.replace(/_/g, '-').toLowerCase();
      const normalizedConstellationName = constellation.name.toLowerCase();

      return {
        id: constellation.id,
        name: constellation.name,
        stars,
        connections: constellation.connections,
        labelX: Math.max(12, Math.min(88, labelX)),
        labelY: Math.max(12, Math.min(88, labelY)),
        visibleStarCount: visibleStars.length,
        isActiveRegion:
          activePresetId.includes(normalizedConstellationId) ||
          activePresetName.includes(normalizedConstellationName.split(' ')[0]),
      };
    });
  }, [activePreset, activePresetCoordinates, coordinateDate]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 text-slate-200 font-mono select-none">
      {/* 100% SilverWolf Native WebGL / Canvas Viewport */}
      <div className="absolute inset-0 overflow-hidden bg-[#070b14]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="silverwolfCelestialBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b162c" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#060e1d" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#030712" stopOpacity="1" />
            </radialGradient>
            <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep Space Background */}
          <rect width="100" height="100" fill="url(#silverwolfCelestialBg)" />

          {/* Background Starfield */}
          {STAR_FIELD_BACKGROUND.map((star) => (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              r={star.radius}
              fill="#e2f8ff"
              opacity={star.opacity}
            />
          ))}

          {/* Equatorial J2000 Grid */}
          {showGrid && (
            <g aria-label="SilverWolf Equatorial J2000 Grid">
              <circle cx="50" cy="50" r="32" fill="none" stroke="#06b6d4" strokeOpacity="0.15" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#06b6d4" strokeOpacity="0.1" strokeWidth="0.4" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="#06b6d4" strokeOpacity="0.12" strokeWidth="0.3" strokeDasharray="1 1.5" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="#06b6d4" strokeOpacity="0.12" strokeWidth="0.3" strokeDasharray="1 1.5" />
            </g>
          )}

          {/* Constellations, Lines & Star Labels */}
          {(showConstellationLines || showConstellationNames || showConstellationFigures) && (
            <g aria-label="Constellation Stick Lines and Star Labels">
              {showConstellationLines && projectedConstellationOverlays.map((constellation) => (
                <g key={`${constellation.id}-lines`} opacity={constellation.isActiveRegion ? 0.95 : 0.55}>
                  {constellation.connections.map(([startIndex, endIndex]) => {
                    const start = constellation.stars[startIndex];
                    const end = constellation.stars[endIndex];
                    if (!start || !end) return null;
                    return (
                      <line
                        key={`${constellation.id}-${startIndex}-${endIndex}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={constellation.isActiveRegion ? '#06b6d4' : '#64748b'}
                        strokeOpacity={0.6}
                        strokeWidth={constellation.isActiveRegion ? 0.45 : 0.25}
                      />
                    );
                  })}
                  {constellation.stars.map((star) => (
                    <g key={`${constellation.id}-${star.name}`}>
                      <circle
                        cx={star.x}
                        cy={star.y}
                        r={Math.max(0.4, 1.4 - star.magnitude * 0.2)}
                        fill={constellation.isActiveRegion ? '#38bdf8' : '#cbd5e1'}
                      />
                      {showConstellationNames && star.magnitude <= 2.2 && (
                        <text
                          x={star.x + 1.2}
                          y={star.y + 0.5}
                          fill="#94a3b8"
                          fontSize="1.3"
                          fontFamily="monospace"
                          opacity="0.75"
                        >
                          {star.name}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              ))}

              {/* Constellation Names & Figures */}
              {showConstellationNames && projectedConstellationOverlays.map((constellation) => (
                <text
                  key={`${constellation.id}-label`}
                  x={constellation.labelX}
                  y={constellation.labelY}
                  fill={constellation.isActiveRegion ? '#06b6d4' : '#94a3b8'}
                  opacity={constellation.isActiveRegion ? 0.95 : 0.6}
                  fontSize={constellation.isActiveRegion ? 2.2 : 1.7}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {constellation.name}
                </text>
              ))}
            </g>
          )}

          {/* Deep Sky Presets */}
          {projectedPresetTargets.map((target) => (
            <g key={target.id} className="cursor-pointer" onClick={() => setTelescopeTarget(target.preset)}>
              <circle
                cx={target.x}
                cy={target.y}
                r={target.isActive ? 3.2 : 1.8}
                fill={target.color}
                filter={target.isActive ? 'url(#cyanGlow)' : undefined}
              />
              <circle
                cx={target.x}
                cy={target.y}
                r={target.isActive ? 5.5 : 3.2}
                fill="none"
                stroke={target.color}
                strokeWidth="0.35"
                strokeDasharray="0.8 0.8"
              />
              <text
                x={target.x + 2.2}
                y={target.y + 0.6}
                fill={target.isActive ? '#38bdf8' : '#e2e8f0'}
                fontSize={target.isActive ? 2.3 : 1.8}
                fontFamily="monospace"
                fontWeight={target.isActive ? 'bold' : 'normal'}
              >
                {target.name}
              </text>
            </g>
          ))}

          {/* Astronomical Media Photo Location Pins */}
          {showMediaDots && projectedMediaDots.map((dot) => {
            const isHovered = hoveredMediaDot?.id === dot.id;
            return (
              <g
                key={dot.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredMediaDot(dot)}
                onMouseLeave={() => setHoveredMediaDot(null)}
                onClick={() => {
                  setTelescopeTarget({
                    id: dot.id,
                    name: dot.title,
                    raHours: dot.raHours,
                    decDegrees: dot.decDegrees,
                    ra: `${dot.raHours}h`,
                    dec: `${dot.decDegrees}°`,
                    fov: '1.00°',
                    description: dot.desc,
                    color: dot.color,
                    url: '',
                  } as any);
                }}
              >
                <circle cx={dot.x} cy={dot.y} r={isHovered ? 2.6 : 1.8} fill={dot.color} className="animate-pulse" />
                <circle cx={dot.x} cy={dot.y} r={isHovered ? 4.4 : 3.2} fill="none" stroke={dot.color} strokeWidth="0.4" strokeDasharray="0.8 0.8" />
              </g>
            );
          })}
        </svg>

        {/* Media Photo Hover Tooltip */}
        {hoveredMediaDot && (
          <div
            className="absolute z-50 glass-panel p-3 rounded-xl border border-cyan-500/40 bg-slate-950/95 text-cyan-200 shadow-2xl pointer-events-none font-mono text-[9px] max-w-[220px]"
            style={{
              left: `${hoveredMediaDot.x}%`,
              top: `${hoveredMediaDot.y}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{hoveredMediaDot.title}</span>
            </div>
            <div className="text-slate-300 text-[8.5px] mb-1">
              Constellation: <span className="text-emerald-300 font-bold">{hoveredMediaDot.constellation}</span>
            </div>
            <div className="text-slate-400 text-[7.5px] leading-tight mb-1">
              {hoveredMediaDot.desc}
            </div>
            <div className="text-[7.5px] text-cyan-400 font-semibold border-t border-cyan-500/20 pt-1">
              Spectrum: {hoveredMediaDot.spectrum}
            </div>
          </div>
        )}
      </div>

      {/* SilverWolf Native Floating Controls & Drawer */}
      <div className="absolute top-4 left-4 z-floating flex flex-col pointer-events-auto">
        {drawerOpen ? (
          <div className="glass-panel w-[320px] flex flex-col border border-cyan-500/30 rounded-xl bg-slate-950/95 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-slate-900/80 border-b border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>SilverWolf Celestial Navigator</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <ChevronLeft size={14} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-900/50 border-b border-cyan-500/20 p-1 gap-1 text-[9px]">
              <button
                type="button"
                onClick={() => setActiveControlTab('navigator')}
                className={`flex-1 py-1.5 rounded text-center font-bold ${activeControlTab === 'navigator' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
              >
                Navigator
              </button>
              <button
                type="button"
                onClick={() => setActiveControlTab('overlays')}
                className={`flex-1 py-1.5 rounded text-center font-bold ${activeControlTab === 'overlays' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
              >
                Overlays
              </button>
              <button
                type="button"
                onClick={() => setActiveControlTab('imagery')}
                className={`flex-1 py-1.5 rounded text-center font-bold ${activeControlTab === 'imagery' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
              >
                Surveys
              </button>
              <button
                type="button"
                onClick={() => setActiveControlTab('photos')}
                className={`flex-1 py-1.5 rounded text-center font-bold ${activeControlTab === 'photos' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
              >
                Photos
              </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[380px] overflow-y-auto space-y-2.5 scroller text-[9.5px]">
              {activeControlTab === 'navigator' && (
                <div className="space-y-2">
                  <div className="flex items-center bg-slate-900 border border-cyan-500/20 rounded-lg px-2.5 py-1">
                    <Search className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search targets or constellations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none w-full text-slate-200 focus:outline-none placeholder:text-slate-500 text-[9.5px]"
                    />
                  </div>

                  {filteredPresets.map((preset) => {
                    const isActive = activePreset.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setTelescopeTarget(preset)}
                        className={`w-full text-left p-2.5 rounded-lg border flex items-start gap-2.5 transition-all ${
                          isActive
                            ? 'bg-cyan-950/80 border-cyan-500/60 shadow-lg'
                            : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: preset.color }} />
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {preset.name}
                          </div>
                          <div className="text-[8px] text-slate-400 mt-0.5 flex justify-between">
                            <span>Constellation: {preset.constellation || 'Deep Sky'}</span>
                            <span className="text-cyan-400 font-bold">{preset.fov}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeControlTab === 'overlays' && (
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-200 font-semibold">Constellation & Star Names</span>
                    <input
                      type="checkbox"
                      checked={showConstellationNames}
                      onChange={(e) => setShowConstellationNames(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-200">Constellation Stick Lines</span>
                    <input
                      type="checkbox"
                      checked={showConstellationLines}
                      onChange={(e) => setShowConstellationLines(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-200">Equatorial Coordinate Grid</span>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-200">Astronomical Media Pins</span>
                    <input
                      type="checkbox"
                      checked={showMediaDots}
                      onChange={(e) => setShowMediaDots(e.target.checked)}
                      className="h-4 w-4 rounded text-cyan-400"
                    />
                  </label>
                </div>
              )}

              {activeControlTab === 'imagery' && (
                <div className="space-y-2">
                  {BACKGROUND_LAYERS.map((layer) => {
                    const isSelected = wwtBackgroundLayer === layer.value;
                    return (
                      <button
                        key={layer.id}
                        onClick={() => setWwtBackgroundLayer(layer.value)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300 font-bold'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div>{layer.name}</div>
                        <div className="text-[8px] text-slate-400 mt-0.5">{layer.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeControlTab === 'photos' && (
                <div className="space-y-2">
                  {PHOTO_COLLECTIONS.map((photo) => (
                    <div key={photo.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                      <div className="font-bold text-slate-200">{photo.name}</div>
                      <div className="text-[8px] text-slate-400 mt-1">{photo.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="glass-panel p-2.5 rounded-xl border border-cyan-500/30 bg-slate-950/90 text-cyan-400 font-bold text-[10px] uppercase flex items-center gap-2 shadow-xl"
          >
            <Compass className="w-4 h-4" />
            <span>Controls</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
