import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles, Compass, Eye, RefreshCw, X, Maximize2, Minimize2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Play, Pause,
  Calendar, Clock, Image as ImageIcon, Layers, Search,
  MapPin, Grid, Plus, Check, Info, Radio, Star, Camera, Tag
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS as presets, resolveTelescopePresetCoordinates } from '@/data/telescopePresets';
import { constellations } from '@/data/constellations';
import TimelineLanes from './TimelineLanes';
import { pluginManager } from '@/core/plugins/PluginManager';
import { useCameraSync } from '@/hooks/useCameraSync';
import { useWWTListener } from '@/hooks/useWWTListener';
import { formatRA, formatDec, precessEquatorialJ2000ToDate, raHoursToDegrees } from '@/lib/coordinateTransforms';
import {
  projectTelescopeTargetToEarth,
  projectTelescopeTargetToObserverView,
} from '@/lib/earthObserverProjection';

const BACKGROUND_LAYERS = [
  { id: 'solar-system', name: '3D Solar System (Earth-centered)', value: '3D Solar System View', desc: 'WWT solar-system view tracked on Earth.' },
  { id: 'dss', name: 'Digitized Sky Survey (Color)', value: 'Digitized Sky Survey (Color)', desc: 'Visible light survey mapping the sky.' },
  { id: 'visible', name: 'Visible Imagery', value: 'Visible Imagery', desc: 'Default visible spectrum optical composite.' },
  { id: 'hubble', name: 'Hubble Space Telescope', value: 'Hubble Space Telescope Imagery', desc: 'Ultra-high-res deep space observations.' },
  { id: 'chandra', name: 'Chandra (X-Ray)', value: 'RASS: ROSAT All Sky Survey (X-ray)', desc: 'High-energy X-ray universe scan.' },
  { id: 'planck', name: 'Planck Dust & Gas', value: 'Planck Dust & Gas', desc: 'Interstellar dust and CMB microwave spectrum.' },
  { id: 'radio', name: 'Radio (VLSS)', value: 'VLSS: VLA Low-frequency Sky Survey (Radio)', desc: 'Low-frequency radio sky map.' }
];

const PHOTO_COLLECTIONS = [
  { id: 'hubble', name: 'Hubble Heritage', url: 'https://worldwidetelescope.org/webclient/docs/wtml/hubbleheritage.wtml', desc: 'Panoramic collections of star fields and nebulae.' },
  { id: 'spitzer', name: 'Spitzer Infrared', url: 'https://worldwidetelescope.org/webclient/docs/wtml/spitzer.wtml', desc: 'Infrared penetrations of stellar nurseries.' },
  { id: 'chandra', name: 'Chandra X-Ray', url: 'https://worldwidetelescope.org/webclient/docs/wtml/chandra.wtml', desc: 'Hot gas remnants of supernovas.' },
  { id: 'astrophoto', name: 'Astrophotography', url: 'https://worldwidetelescope.org/webclient/docs/wtml/astrophoto.wtml', desc: 'Top images from worldwide observatories.' }
];

const MEDIA_LOCATION_DOTS = [
  {
    id: 'media-m31',
    title: 'Hubble M31 Core Panorama',
    raHours: 0.712,
    decDegrees: 41.27,
    constellation: 'Andromeda',
    wtmlUrl: 'https://worldwidetelescope.org/webclient/docs/wtml/hubbleheritage.wtml',
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
    wtmlUrl: 'https://worldwidetelescope.org/webclient/docs/wtml/hubbleheritage.wtml',
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
    wtmlUrl: 'https://worldwidetelescope.org/webclient/docs/wtml/hubbleheritage.wtml',
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
    wtmlUrl: 'https://worldwidetelescope.org/webclient/docs/wtml/chandra.wtml',
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
    wtmlUrl: 'https://worldwidetelescope.org/webclient/docs/wtml/hubbleheritage.wtml',
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
    wtmlUrl: 'https://worldwidetelescope.org/webclient/docs/wtml/spitzer.wtml',
    color: '#A370F7',
    spectrum: 'Infrared 8.0 μm',
    desc: 'Infrared emission from dust ring surrounding the galaxy bulge.'
  },
];

const FALLBACK_STAR_FIELD = Array.from({ length: 96 }, (_, index) => ({
  id: `star-${index}`,
  x: ((index * 37) % 1000) / 10,
  y: ((index * 83) % 1000) / 10,
  radius: index % 11 === 0 ? 0.24 : index % 5 === 0 ? 0.16 : 0.1,
  opacity: 0.18 + ((index * 19) % 50) / 100,
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

type WwtRuntimeState = 'Connecting' | 'Static fallback' | 'WWT iframe loaded' | 'WWT unavailable';

const WWT_RUNTIME_STATE_EVENT = 'silver-wolf-wwt-runtime-state';
const WWT_LOAD_WATCHDOG_MS = 45_000;
const WWT_RESEARCH_APP_URL = 'https://web.wwtassets.org/research/latest/';
const WWT_SOLAR_SYSTEM_LAYER = '3D Solar System View';
const WWT_EARTH_TRACK_CODE = 19;

const clampPx = (value: number, min: number, max: number): number => {
  const normalized = Math.round(value);
  if (!Number.isFinite(normalized)) return min;
  return Math.min(Math.max(normalized, min), max);
};

function publishWwtRuntimeState(state: WwtRuntimeState) {
  if (typeof window === 'undefined') return;
  (window as any).__silverWolfWwtRuntimeState = state;
  window.dispatchEvent(new CustomEvent(WWT_RUNTIME_STATE_EVENT, { detail: state }));
}

function readSharedWwtRuntimeState(): WwtRuntimeState {
  if (typeof window === 'undefined') return 'Connecting';
  return ((window as any).__silverWolfWwtRuntimeState as WwtRuntimeState | undefined) || 'Connecting';
}

export default function WorldWideTelescopeView({
  bgOnly = false,
  controlsOnly = false,
}: {
  bgOnly?: boolean;
  controlsOnly?: boolean;
} = {}) {
  const storeTarget = useUIStore((s) => s.telescopeTarget);
  const spaceInteractionTarget = useUIStore((s) => s.spaceInteractionTarget);
  
  // Normalize store value: accept object or JSON string, validate fields
  const telescopeTarget = useMemo(() => {
    try {
      let tgt: any = storeTarget;
      if (typeof tgt === 'string') {
        try {
          tgt = JSON.parse(tgt);
        } catch (e) {
          // invalid json string
        }
      }
      if (!tgt || typeof tgt !== 'object' || !tgt.name || !tgt.url) return presets[0];
      return tgt;
    } catch (e) {
      return presets[0];
    }
  }, [storeTarget]);

  const setTelescopeTarget = useUIStore((s) => s.setTelescopeTarget);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const interactionMode = useUIStore((s) => s.interactionMode);
  const syncSource = useUIStore((s) => s.syncSource);
  const wwtBackgroundLayer = useUIStore((s) => s.wwtBackgroundLayer);
  const setWwtBackgroundLayer = useUIStore((s) => s.setWwtBackgroundLayer);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const [refreshKey, setRefreshKey] = useState(0);
  const telescopeWindowActive = interactionMode === 'telescope' || spaceInteractionTarget === 'telescope';

  // Resolve telescopeTarget to data-level TelescopePreset
  const activePreset = useMemo(() => {
    if (!telescopeTarget || !telescopeTarget.name) return presets[0];
    return presets.find(p => p.name === telescopeTarget.name) || presets[0];
  }, [telescopeTarget]);

  // Core Zustand state for timeline syncing
  const currentTime = useStore((s) => s.currentTime);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const timeRange = useStore((s) => s.timeRange);

  // Safe derived values
  const [defaultTime] = useState(() => Date.now());
  const safeCurrentTime = useMemo(() => parseDateSafe(currentTime) || null, [currentTime]);
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
      frameLabel: spaceInteractionTarget === 'telescope' ? 'Telescope focus' : 'Earth focus',
      coordinateSource: activePresetCoordinates.source,
    };
  }, [activePresetCoordinates, coordinateDate, spaceInteractionTarget]);

  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));
  const initialWindowSize = spaceInteractionTarget === 'telescope' ? 'minimized' : 'normal';
  const [windowSize, setWindowSize] = useState<'normal' | 'large' | 'minimized'>(initialWindowSize);

  // Constellation Overlay States (Default enabled so users immediately see stars & constellation labels!)
  const [showConstellationFigures, setShowConstellationFigures] = useState(true);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [showConstellationNames, setShowConstellationNames] = useState(true);
  const [showConstellationBoundries, setShowConstellationBoundries] = useState(false);
  const [showConstellationSelection, setShowConstellationSelection] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMediaDots, setShowMediaDots] = useState(true);
  const [hoveredMediaDot, setHoveredMediaDot] = useState<typeof MEDIA_LOCATION_DOTS[0] | null>(null);

  // Floating Space Control Drawer State
  const [drawerOpen, setDrawerOpen] = useState(() => spaceInteractionTarget !== 'telescope');
  const [activeControlTab, setActiveControlTab] = useState<'navigator' | 'overlays' | 'imagery' | 'photos'>('navigator');
  const [searchQuery, setSearchQuery] = useState('');
  const [telemetryTimelineCollapsed, setTelemetryTimelineCollapsed] = useState(true);

  const panelInsetPx = clampPx(viewportSize.width * 0.22, 160, 360);
  const leftPanelInset = leftPanelOpen
    ? clampPx(panelInsetPx, 176, 336)
    : clampPx(viewportSize.width * 0.025, 12, 20);
  const rightPanelInset = rightPanelOpen
    ? clampPx(panelInsetPx, 180, 344)
    : clampPx(panelInsetPx * 0.96, 140, 328);

  const workspaceInsets = useMemo(() => ({
    left: leftPanelInset,
    right: rightPanelInset,
    top: clampPx(viewportSize.height * 0.075, 56, 88),
    bottom: spaceInteractionTarget === 'telescope'
      ? (telemetryTimelineCollapsed
        ? clampPx(viewportSize.height * 0.11, 84, 108)
        : clampPx(viewportSize.height * 0.205, 132, 206))
      : clampPx(viewportSize.height * 0.075, 62, 84),
  }), [leftPanelInset, rightPanelInset, spaceInteractionTarget, telemetryTimelineCollapsed]);

  const drawerWidth = clampPx(
    Math.min(
      Math.round(viewportSize.width * 0.3),
      Math.round(viewportSize.width - leftPanelInset - rightPanelInset - 24)
    ),
    248,
    360
  );
  const drawerReserveWidth = spaceInteractionTarget === 'telescope' && drawerOpen ? drawerWidth + 16 : 0;
  const pipSafeLeft = workspaceInsets.left + drawerReserveWidth + (drawerReserveWidth ? 16 : 0);
  const pipViewportBounds = {
    width: Math.max(viewportSize.width, typeof window !== 'undefined' ? window.innerWidth : viewportSize.width),
    height: Math.max(viewportSize.height, typeof window !== 'undefined' ? window.innerHeight : viewportSize.height),
  };
  const pipAvailableWidth = Math.max(320, pipViewportBounds.width - pipSafeLeft - workspaceInsets.right);
  const pipAvailableHeight = Math.max(300, pipViewportBounds.height - workspaceInsets.top - workspaceInsets.bottom);
  const drawerTopPadding = {
    collapsed: clampPx(viewportSize.height * 0.065, 52, 78),
    expanded: clampPx(viewportSize.height * 0.11, 76, 96),
  };

  const windowPixelDimensions = useMemo(() => ({
    normal: { width: Math.min(480, pipAvailableWidth), height: Math.min(320, pipAvailableHeight) },
    large: { width: Math.min(720, pipAvailableWidth), height: Math.min(480, pipAvailableHeight) },
    minimized: { width: Math.min(320, pipAvailableWidth), height: 48 },
  }), [pipAvailableHeight, pipAvailableWidth]);

  const clampPipPosition = (x: number, y: number, size: 'normal' | 'large' | 'minimized' = windowSize) => {
    const dimensions = windowPixelDimensions[size];
    const maxX = Math.max(pipSafeLeft, pipViewportBounds.width - workspaceInsets.right - dimensions.width);
    const maxY = Math.max(workspaceInsets.top, pipViewportBounds.height - workspaceInsets.bottom - dimensions.height);
    return {
      x: Math.max(pipSafeLeft, Math.min(maxX, x)),
      y: Math.max(workspaceInsets.top, Math.min(maxY, y)),
    };
  };

  const getDefaultPos = (size: 'normal' | 'large' | 'minimized' = windowSize) => clampPipPosition(
    pipViewportBounds.width - workspaceInsets.right - windowPixelDimensions[size].width,
    workspaceInsets.top,
    size
  );

  const [pos, setPos] = useState(() => getDefaultPos(initialWindowSize));
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowStart = useRef({ x: 0, y: 0 });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRootRef = useRef<HTMLDivElement>(null);

  const rawIframeUrl = spaceInteractionTarget === 'telescope'
    ? WWT_RESEARCH_APP_URL
    : activePreset.url || WWT_RESEARCH_APP_URL;

  const sanitizeUrl = (urlStr: string): string => {
    if (!urlStr) return '';
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch (e) {
      // invalid URL
    }
    return '';
  };

  const iframeUrl = useMemo(() => sanitizeUrl(rawIframeUrl), [rawIframeUrl]);
  const safeIframeUrl = iframeUrl || WWT_RESEARCH_APP_URL;
  const externalWwtUrl = activePreset.url || safeIframeUrl;
  const safeExternalWwtUrl = useMemo(() => sanitizeUrl(externalWwtUrl), [externalWwtUrl]);

  // Universal postMessage helper to send events with both event and type keys
  const postToWWT = (message: any) => {
    if (!message) return;
    const payload = {
      ...message,
      event: message.event || message.type,
      type: message.type || message.event,
    };

    if (controlsOnly && typeof window !== 'undefined' && (window as any).postToWWTBackground) {
      (window as any).postToWWTBackground(payload);
      return;
    }

    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;
      let targetOrigin = '';
      try {
        const src = iframeRef.current.getAttribute?.('src') || iframeRef.current.src || '';
        targetOrigin = src ? new URL(src).origin : new URL(WWT_RESEARCH_APP_URL).origin;
      } catch (e) {
        targetOrigin = new URL(WWT_RESEARCH_APP_URL).origin;
      }

      iframeRef.current.contentWindow.postMessage(payload, targetOrigin);
    } catch (err) {
      console.warn('[WorldWideTelescopeView] postToWWT failed:', err);
    }
  };

  // Connect WWT and Cesium via useCameraSync & useWWTListener
  const cesiumViewer = typeof window !== 'undefined' ? (window as any).cesiumViewer : null;
  useCameraSync(cesiumViewer, postToWWT);
  useWWTListener();

  // Sync active preset location and WTML collection on preset change
  useEffect(() => {
    if (!activePreset) return;

    const raDeg = raHoursToDegrees(activePresetCoordinates.raHours);
    const decDeg = activePresetCoordinates.decDegrees;
    const fovVal = parseFloat(activePreset.fov) || 1.0;

    postToWWT({
      event: 'center_on_coordinates',
      type: 'center_on_coordinates',
      ra: raDeg,
      dec: decDeg,
      fov: fovVal,
      instant: false,
    });

    if (activePreset.wtmlUrl) {
      postToWWT({
        event: 'load_image_collection',
        type: 'load_image_collection',
        url: activePreset.wtmlUrl,
        load_image_collection: activePreset.wtmlUrl,
      });
    }

    useUIStore.getState().addChangeLog(
      'TELESCOPE',
      `Telescope panned to ${activePreset.name} (RA: ${activePresetCoordinates.ra}, DEC: ${activePresetCoordinates.dec})`,
      'success'
    );
  }, [activePreset, activePresetCoordinates, refreshKey]);

  // Sync date/time to WWT engine
  useEffect(() => {
    const d = parseDateSafe(currentTime);
    if (d) {
      postToWWT({ event: 'set_datetime', type: 'set_datetime', isot: d.toISOString() });
    }
  }, [currentTime]);

  // Sync Overlay Settings to WWT Engine (Constellations, figures, names, boundaries, grid)
  useEffect(() => {
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationFigures', value: showConstellationFigures });
  }, [showConstellationFigures]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationLines', value: showConstellationLines });
  }, [showConstellationLines]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationNames', value: showConstellationNames });
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationLabels', value: showConstellationNames });
  }, [showConstellationNames]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationBoundries', value: showConstellationBoundries });
  }, [showConstellationBoundries]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationSelection', value: showConstellationSelection });
  }, [showConstellationSelection]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showGrid', value: showGrid });
  }, [showGrid]);

  // Sync background survey layer
  useEffect(() => {
    if (!wwtBackgroundLayer) return;
    postToWWT({ event: 'set_background_by_name', type: 'set_background_by_name', name: wwtBackgroundLayer });
    postToWWT({ event: 'set_background', type: 'set_background', name: wwtBackgroundLayer });

    if (wwtBackgroundLayer === WWT_SOLAR_SYSTEM_LAYER) {
      postToWWT({ event: 'track_object', type: 'track_object', code: WWT_EARTH_TRACK_CODE });
    }
  }, [wwtBackgroundLayer, refreshKey]);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [sharedWwtRuntimeState, setSharedWwtRuntimeState] = useState<WwtRuntimeState>(() => readSharedWwtRuntimeState());
  const isFallbackRuntime = typeof window !== 'undefined' && window.location.search.includes('fallback');
  const localWwtRuntimeState: WwtRuntimeState = isFallbackRuntime
    ? 'Static fallback'
    : iframeError
      ? 'WWT unavailable'
      : iframeLoaded
        ? 'WWT iframe loaded'
        : 'Connecting';
  const wwtRuntimeState = controlsOnly && !isFallbackRuntime ? sharedWwtRuntimeState : localWwtRuntimeState;
  const wwtRuntimeHealthy = wwtRuntimeState === 'WWT iframe loaded';

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
    publishWwtRuntimeState('WWT iframe loaded');

    // Dispatch initial constellation overlays & background layer upon iframe load
    setTimeout(() => {
      postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationFigures', value: showConstellationFigures });
      postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationLines', value: showConstellationLines });
      postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showConstellationNames', value: showConstellationNames });
      postToWWT({ event: 'modify_setting', type: 'modify_setting', setting: 'showGrid', value: showGrid });
      if (wwtBackgroundLayer) {
        postToWWT({ event: 'set_background_by_name', type: 'set_background_by_name', name: wwtBackgroundLayer });
      }
    }, 500);
  };

  const handleIframeError = () => {
    setIframeError(true);
    publishWwtRuntimeState('WWT unavailable');
  };

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

  const drawerVisiblePresets = filteredPresets;

  const timeStart = timeRange.start.getTime();
  const timeEnd = timeRange.end.getTime();
  const totalMs = Math.max(1, timeEnd - timeStart);

  const earthViewportTarget = useMemo(() => {
    return {
      x: 50,
      y: 50,
      orbitTilt: earthReferenceFrame.latitudeDegrees >= 0 ? -14 : 14,
      color: activePreset.color || '#00fff7',
    };
  }, [activePreset, earthReferenceFrame]);

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
        latitudeLabel: observerProjection.latitudeLabel,
        longitudeLabel: observerProjection.longitudeLabel,
        angularSeparationDegrees: observerProjection.angularSeparationDegrees,
        altitudeAngleDegrees: observerProjection.altitudeAngleDegrees,
        visibleHemisphere: observerProjection.visibleHemisphere,
        relation: observerProjection.relation,
        horizonClass: observerProjection.horizonClass,
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

  const renderIframe = () => {
    return (
      <div className="relative w-full h-full">
        {safeIframeUrl && (
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={safeIframeUrl}
            title="WorldWide Telescope Viewport"
            aria-hidden={bgOnly ? true : undefined}
            tabIndex={bgOnly ? -1 : undefined}
            className={`w-full h-full border-0 transition-all ${
              !bgOnly && spaceInteractionTarget === 'telescope' ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; clipboard-write; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {/* Media Photo Location Dots Overlay */}
        {showMediaDots && spaceInteractionTarget === 'telescope' && (
          <div className="absolute inset-0 pointer-events-none z-floating">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {projectedMediaDots.map((dot) => {
                if (!dot.visibleHemisphere) return null;
                const isHovered = hoveredMediaDot?.id === dot.id;

                return (
                  <g key={dot.id} className="pointer-events-auto cursor-pointer">
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={isHovered ? 2.5 : 1.8}
                      fill={dot.color}
                      className="animate-pulse"
                      onMouseEnter={() => setHoveredMediaDot(dot)}
                      onMouseLeave={() => setHoveredMediaDot(null)}
                      onClick={() => {
                        postToWWT({
                          event: 'center_on_coordinates',
                          type: 'center_on_coordinates',
                          ra: raHoursToDegrees(dot.raHours),
                          dec: dot.decDegrees,
                          fov: 0.8,
                          instant: false,
                        });
                        if (dot.wtmlUrl) {
                          postToWWT({
                            event: 'load_image_collection',
                            type: 'load_image_collection',
                            url: dot.wtmlUrl,
                          });
                        }
                        useUIStore.getState().addChangeLog(
                          'TELESCOPE',
                          `Centered on media photo: ${dot.title} (${dot.constellation})`,
                          'success'
                        );
                      }}
                    />
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={isHovered ? 4.2 : 3.0}
                      fill="none"
                      stroke={dot.color}
                      strokeWidth="0.4"
                      strokeDasharray="0.8 0.8"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip for Astronomical Photo Location Dots */}
            {hoveredMediaDot && (
              <div
                className="absolute z-50 glass-panel p-2.5 rounded-lg border border-cyan-500/40 bg-slate-950/90 text-cyan-200 shadow-2xl pointer-events-none font-mono text-[9px] max-w-[220px]"
                style={{
                  left: `${hoveredMediaDot.x}%`,
                  top: `${hoveredMediaDot.y}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>{hoveredMediaDot.title}</span>
                </div>
                <div className="text-slate-300 text-[8px] mb-1">
                  Constellation: <span className="text-emerald-300">{hoveredMediaDot.constellation}</span>
                </div>
                <div className="text-slate-400 text-[7.5px] leading-tight">
                  {hoveredMediaDot.desc}
                </div>
                <div className="mt-1 text-[7px] text-cyan-400/80 font-semibold border-t border-cyan-500/20 pt-1">
                  Spectrum: {hoveredMediaDot.spectrum} • Click to center
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHUDAndTimeline = () => {
    if (!telescopeWindowActive) return null;

    return (
      <div ref={overlayRootRef} className="fixed inset-0 w-full h-full flex overflow-hidden bg-transparent select-none pointer-events-none z-chrome">
        {/* Space HUD / Controls Panel */}
        {spaceInteractionTarget === 'telescope' && (
          <div
            className="absolute z-floating flex flex-col pointer-events-auto"
            style={{
              left: workspaceInsets.left,
              top: drawerTopPadding.expanded,
              maxHeight: `calc(100% - ${workspaceInsets.top + workspaceInsets.bottom + drawerTopPadding.expanded}px)`,
            }}
          >
            {drawerOpen ? (
              <div
                className="glass-panel flex flex-col border border-cyan-500/30 overflow-hidden shadow-2xl animate-slide-in bg-slate-950/90 rounded-xl"
                style={{ width: drawerWidth }}
              >
                {/* Drawer Header */}
                <div className="flex min-h-12 items-center justify-between px-3 bg-slate-900/80 border-b border-cyan-500/20">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Space Array Control</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-9 min-w-9 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                    aria-label="Collapse Space Array controls"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>

                {/* Tab Selectors */}
                <div className="flex bg-slate-900/60 border-b border-cyan-500/20 p-1 gap-1 text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('navigator')}
                    className={`min-h-9 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${
                      activeControlTab === 'navigator' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Navigator
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('overlays')}
                    className={`min-h-9 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${
                      activeControlTab === 'overlays' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Overlays
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('imagery')}
                    className={`min-h-9 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${
                      activeControlTab === 'imagery' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Surveys
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('photos')}
                    className={`min-h-9 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${
                      activeControlTab === 'photos' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Photos
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scroller text-slate-200 font-mono">
                  {/* Tab 1: Celestial Navigator */}
                  {activeControlTab === 'navigator' && (
                    <div className="space-y-2.5">
                      <div className="relative flex min-h-10 items-center bg-slate-900/80 border border-cyan-500/20 rounded-lg px-2.5">
                        <Search className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                        <input
                          id="wwt-search-targets"
                          name="wwt-search-targets"
                          type="text"
                          placeholder="Search targets or constellations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="min-h-9 bg-transparent border-none text-[10px] py-1 w-full text-slate-200 focus:outline-none placeholder:text-slate-500 font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        {drawerVisiblePresets.map((preset) => {
                          const isActive = activePreset.id === preset.id;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setTelescopeTarget(preset);
                                postToWWT({
                                  event: 'center_on_coordinates',
                                  type: 'center_on_coordinates',
                                  ra: raHoursToDegrees(preset.raHours),
                                  dec: preset.decDegrees,
                                  fov: parseFloat(preset.fov) || 1.0,
                                  instant: false,
                                });
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border flex items-start gap-2.5 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-cyan-950/80 border-cyan-500/60 shadow-lg'
                                  : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/30'
                              }`}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 animate-pulse"
                                style={{ backgroundColor: preset.color }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className={`text-[10px] font-bold ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                                  {preset.name}
                                </div>
                                <div className="text-[8px] text-slate-400 mt-0.5 flex justify-between">
                                  <span>Constellation: {preset.constellation || 'Deep Sky'}</span>
                                  <span className="text-cyan-400 font-bold">{preset.fov}</span>
                                </div>
                                <div className="text-[8px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                  {preset.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Constellations & Overlays */}
                  {activeControlTab === 'overlays' && (
                    <div className="space-y-3 text-[9px]">
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-cyan-500/20 space-y-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 block border-b border-cyan-500/20 pb-1.5">
                          Constellation & Star Labels
                        </span>

                        <label className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded hover:bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-200 font-semibold">Constellation & Star Names</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={showConstellationNames}
                            onChange={(e) => setShowConstellationNames(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded hover:bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-slate-200">Constellation Stick Lines</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={showConstellationLines}
                            onChange={(e) => setShowConstellationLines(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded hover:bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-slate-200">Constellation Art Figures</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={showConstellationFigures}
                            onChange={(e) => setShowConstellationFigures(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded hover:bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-slate-200">IAU Constellation Boundaries</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={showConstellationBoundries}
                            onChange={(e) => setShowConstellationBoundries(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded hover:bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            <Grid className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-slate-200">Equatorial Coordinate Grid</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(e) => setShowGrid(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between gap-3 cursor-pointer p-1.5 rounded hover:bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            <Camera className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-slate-200">Media Photo Dots</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={showMediaDots}
                            onChange={(e) => setShowMediaDots(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-400 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Sky Survey Imagery Layers */}
                  {activeControlTab === 'imagery' && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 block mb-2">
                        Sky Wavelength Surveys
                      </span>
                      {BACKGROUND_LAYERS.map((layer) => {
                        const isSelected = wwtBackgroundLayer === layer.value;
                        return (
                          <button
                            key={layer.id}
                            type="button"
                            onClick={() => {
                              setWwtBackgroundLayer(layer.value);
                              postToWWT({
                                event: 'set_background_by_name',
                                type: 'set_background_by_name',
                                name: layer.value,
                              });
                              postToWWT({
                                event: 'set_background',
                                type: 'set_background',
                                name: layer.value,
                              });
                            }}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300 font-bold shadow-md'
                                : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-cyan-500/30'
                            }`}
                          >
                            <div className="text-[10px] font-mono">{layer.name}</div>
                            <div className="text-[8px] text-slate-400 mt-1 font-sans leading-relaxed">
                              {layer.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tab 4: Photos & WTML Media Collections */}
                  {activeControlTab === 'photos' && (
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                        Astronomical Media Collections
                      </span>
                      {PHOTO_COLLECTIONS.map((photo) => (
                        <div key={photo.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 space-y-2">
                          <div className="text-[10px] font-bold text-slate-200">{photo.name}</div>
                          <div className="text-[8px] text-slate-400 leading-relaxed font-sans">{photo.desc}</div>
                          <button
                            type="button"
                            onClick={() => {
                              postToWWT({
                                event: 'load_image_collection',
                                type: 'load_image_collection',
                                url: photo.url,
                              });
                              useUIStore.getState().addChangeLog(
                                'TELESCOPE',
                                `Loaded photo collection: ${photo.name}`,
                                'success'
                              );
                            }}
                            className="w-full min-h-8 px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold uppercase cursor-pointer transition-colors"
                          >
                            Load WTML Collection
                          </button>
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
                className="glass-panel flex min-h-12 items-center gap-2 px-3 border border-cyan-500/30 rounded-xl text-cyan-400 hover:text-cyan-300 bg-slate-950/90 cursor-pointer shadow-xl"
              >
                <Compass className="w-4 h-4 animate-spin-slow" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Controls</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {renderIframe()}
      {renderHUDAndTimeline()}
    </div>
  );
}

function parseDateSafe(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
