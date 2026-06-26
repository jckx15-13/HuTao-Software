import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, Compass, Eye, RefreshCw, X, Maximize2, Minimize2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Play, Pause,
  Calendar, Clock, Image as ImageIcon, Layers, Search,
  MapPin, Grid, Plus, Check, Info, Radio, Star
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

function CrashComponent(): any {
  throw new Error("Simulated Telescope Crash");
}

type WwtRuntimeState = 'Connecting' | 'Static fallback' | 'WWT iframe loaded' | 'WWT unavailable';

const WWT_RUNTIME_STATE_EVENT = 'silver-wolf-wwt-runtime-state';
const WWT_LOAD_WATCHDOG_MS = 45_000;
const WWT_RESEARCH_APP_URL = 'https://web.wwtassets.org/research/latest/';

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
          // leave as string -> invalid
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
  const telescopeTelemetry = useUIStore((s) => s.telescopeTelemetry);
  const syncSource = useUIStore((s) => s.syncSource);
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
  const isPlaying = useStore((s) => s.isPlaying);
  const setPlaying = useStore((s) => s.setPlaying);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useStore((s) => s.setPlaybackSpeed);
  const isPlaybackMode = useStore((s) => s.isPlaybackMode);
  const setPlaybackMode = useStore((s) => s.setPlaybackMode);
  const timeRange = useStore((s) => s.timeRange);
  const setTimeRange = useStore((s) => s.setTimeRange);

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
      lightTimeMinutes: activePresetCoordinates.lightTimeMinutes,
    };
  }, [activePresetCoordinates, coordinateDate, spaceInteractionTarget]);

  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));
  const initialWindowSize = spaceInteractionTarget === 'telescope' ? 'minimized' : 'normal';
  const [windowSize, setWindowSize] = useState<'normal' | 'large' | 'minimized'>(initialWindowSize);

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
  const drawerContentReserve = clampPx(viewportSize.height * 0.19, 170, 224);

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

  // Floating PiP Dragging State
  const getDefaultPos = (size: 'normal' | 'large' | 'minimized' = windowSize) => clampPipPosition(
    pipViewportBounds.width - workspaceInsets.right - windowPixelDimensions[size].width,
    workspaceInsets.top,
    size
  );
  const [pos, setPos] = useState(() => getDefaultPos(initialWindowSize));
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const windowStart = useRef({ x: 0, y: 0 });
  const previousSpaceInteractionTarget = useRef(spaceInteractionTarget);

  // WWT Settings States
  const [showConstellationFigures, setShowConstellationFigures] = useState(true);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [showConstellationBoundries, setShowConstellationBoundries] = useState(false); // WWT typo mapped
  const [showConstellationSelection, setShowConstellationSelection] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  // Custom WTML loader state
  const [customWtml, setCustomWtml] = useState('');
  const [wtmlStatus, setWtmlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Iframe reference
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRootRef = useRef<HTMLDivElement>(null);

  // Utility: safely parse dates from a variety of inputs
  function parseDateSafe(v: any): Date | null {
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === 'number') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  const isValidUrl = (u?: string | null) => {
    if (!u || typeof u !== 'string') return false;
    try {
      // eslint-disable-next-line no-new
      new URL(u);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isLoopbackHost = (hostname: string) => (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  );

  const validateWtmlUrl = (value: string): { url: string | null; error: string | null } => {
    const trimmed = value.trim();
    if (!trimmed) return { url: null, error: 'Enter a WTML collection URL.' };

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch (err) {
      return { url: null, error: 'Use a complete URL, for example https://example.com/collection.wtml.' };
    }

    const allowedProtocol = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname));
    if (!allowedProtocol) {
      return { url: null, error: 'Use HTTPS for WTML collections. Localhost HTTP is allowed only for local development.' };
    }

    if (!parsed.pathname.toLowerCase().endsWith('.wtml')) {
      return { url: null, error: 'The collection URL must end in .wtml so WWT receives a real image collection manifest.' };
    }

    return { url: parsed.toString(), error: null };
  };

  // Iframe loading / connection state
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeLoadedRef = useRef(iframeLoaded);
  useEffect(() => {
    iframeLoadedRef.current = iframeLoaded;
  }, [iframeLoaded]);
  const [iframeError, setIframeError] = useState(false);
  const [sharedWwtRuntimeState, setSharedWwtRuntimeState] = useState<WwtRuntimeState>(() => readSharedWwtRuntimeState());
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Post message to WWT iframe helper — with full error handling
  const postToWWT = (message: any) => {
    if (controlsOnly && typeof window !== 'undefined' && (window as any).postToWWTBackground) {
      (window as any).postToWWTBackground(message);
      return;
    }
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;
      let actualOrigin = '';
      try {
        const src = iframeRef.current.getAttribute?.('src') || iframeRef.current.src || '';
        actualOrigin = src ? new URL(src).origin : '';
      } catch (e) {
        actualOrigin = '';
      }

      let targetOrigin = actualOrigin;
      if (!targetOrigin) {
        try {
          targetOrigin = new URL(WWT_RESEARCH_APP_URL).origin;
        } catch (e) {
          targetOrigin = '';
        }
      }

      if (!targetOrigin) {
        console.warn('[WorldWideTelescopeView] postToWWT skipped: no concrete target origin');
        return;
      }

      iframeRef.current.contentWindow.postMessage(message, targetOrigin);
    } catch (err) {
      console.warn('[WorldWideTelescopeView] postToWWT failed:', err);
    }
  };

  // --- Camera Sync Integration ---
  // Connects WWT and Cesium via the useCameraSync Mutex and postMessage listener
  const cesiumViewer = typeof window !== 'undefined' ? (window as any).cesiumViewer : null;
  useCameraSync(cesiumViewer, postToWWT);
  useWWTListener();

  // Sync Coordinates on activePreset change (smooth pans!)
  useEffect(() => {
    if (!activePreset) return;

    // Check if WWT iframe is ready and target coordinates are available
    if (activePreset.lookAt) {
      postToWWT({
        event: 'set_viewer_mode',
        mode: activePreset.lookAt.toLowerCase()
      });
      useUIStore.getState().addChangeLog('TELESCOPE', `Viewer mode changed to: ${activePreset.lookAt}`, 'success');
    } else {
      // WWT coordinates: ra (decimal hours), dec (decimal degrees)
      postToWWT({
        event: 'center_on_coordinates',
        ra: raHoursToDegrees(activePresetCoordinates.raHours),
        dec: activePresetCoordinates.decDegrees,
        fov: parseFloat(activePreset.fov) || 1.0,
        instant: false
      });
      useUIStore.getState().addChangeLog('TELESCOPE', `Telescope panned to ${activePreset.name} (RA: ${activePresetCoordinates.ra}, DEC: ${activePresetCoordinates.dec})`, 'success');
    }
  }, [activePreset, activePresetCoordinates, refreshKey]);

  // Sync datetime on currentTime change (defensive)
  useEffect(() => {
    const d = parseDateSafe(currentTime);
    if (d) {
      try {
        postToWWT({ event: 'set_datetime', isot: d.toISOString() });
      } catch (err) {
        console.error('[WorldWideTelescopeView] Failed to format date for WWT sync', err);
      }
    }
  }, [currentTime]);

  // Sync Overlay Settings when they change
  useEffect(() => {
    postToWWT({ event: 'modify_setting', setting: 'showConstellationFigures', value: showConstellationFigures });
  }, [showConstellationFigures]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', setting: 'showConstellationLines', value: showConstellationLines });
  }, [showConstellationLines]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', setting: 'showConstellationBoundries', value: showConstellationBoundries });
  }, [showConstellationBoundries]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', setting: 'showConstellationSelection', value: showConstellationSelection });
  }, [showConstellationSelection]);

  useEffect(() => {
    postToWWT({ event: 'modify_setting', setting: 'showGrid', value: showGrid });
  }, [showGrid]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Trigger drag if clicking title bar or details inside header
    if (target.closest('.pip-drag-handle') && !target.closest('.pip-action-btn')) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      windowStart.current = { x: pos.x, y: pos.y };
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      setPos(clampPipPosition(windowStart.current.x + dx, windowStart.current.y + dy));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, windowPixelDimensions, windowSize, workspaceInsets, pipSafeLeft, viewportSize]);

  // Recalculate desktop-safe panel bounds on mount, resize, and side-panel changes.
  useEffect(() => {
    const updateViewport = () => {
      const rootRect = controlsOnly ? overlayRootRef.current?.getBoundingClientRect() : null;
      setViewportSize({
        width: rootRect?.width || window.innerWidth,
        height: rootRect?.height || window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    let resizeObserver: ResizeObserver | null = null;
    if (controlsOnly && overlayRootRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateViewport);
      resizeObserver.observe(overlayRootRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      resizeObserver?.disconnect();
    };
  }, [controlsOnly]);

  useEffect(() => {
    setPos((current) => clampPipPosition(current.x, current.y));
  }, [windowPixelDimensions, windowSize, workspaceInsets, pipSafeLeft, viewportSize]);

  useEffect(() => {
    if (!controlsOnly || typeof window === 'undefined') return;

    const syncSharedRuntimeState = (event?: Event) => {
      const customEvent = event as CustomEvent<WwtRuntimeState> | undefined;
      setSharedWwtRuntimeState(customEvent?.detail || readSharedWwtRuntimeState());
    };

    syncSharedRuntimeState();
    window.addEventListener(WWT_RUNTIME_STATE_EVENT, syncSharedRuntimeState);
    const intervalId = window.setInterval(syncSharedRuntimeState, 1000);

    return () => {
      window.removeEventListener(WWT_RUNTIME_STATE_EVENT, syncSharedRuntimeState);
      window.clearInterval(intervalId);
    };
  }, [controlsOnly]);

  useEffect(() => {
    const enteredTelescopeMode =
      previousSpaceInteractionTarget.current !== 'telescope' &&
      spaceInteractionTarget === 'telescope';

    if (enteredTelescopeMode) {
      setDrawerOpen(false);
      setWindowSize('minimized');
      setPos(getDefaultPos('minimized'));
    }

    previousSpaceInteractionTarget.current = spaceInteractionTarget;
  }, [spaceInteractionTarget, viewportSize, workspaceInsets, windowPixelDimensions]);

  // Iframe load and error handlers
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
    publishWwtRuntimeState('WWT iframe loaded');
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
    publishWwtRuntimeState('WWT unavailable');
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  // Connection watchdog for the external WWT client. It can be slow in embedded browsers,
  // so only declare degraded mode after the iframe has had a realistic load window.
  useEffect(() => {
    if (window.location.search.includes('fallback')) return;

    const iframeMounted = bgOnly || !controlsOnly || telescopeWindowActive;
    if (!iframeMounted) {
      setIframeLoaded(false);
      setIframeError(false);
      return;
    }

    setIframeLoaded(false);
    setIframeError(false);
    if (bgOnly) {
      publishWwtRuntimeState('Connecting');
    }

    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
    }

    watchdogTimerRef.current = setTimeout(() => {
      if (!iframeLoadedRef.current) {
        setIframeError(true);
        publishWwtRuntimeState('WWT unavailable');
        console.warn(`[WorldWideTelescopeView] WWT iframe failed to load within ${Math.round(WWT_LOAD_WATCHDOG_MS / 1000)} seconds`);
        useUIStore.getState().addChangeLog('TELESCOPE', 'WWT connection timed out — showing degraded mode', 'warning');
      }
    }, WWT_LOAD_WATCHDOG_MS);

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, [bgOnly, controlsOnly, refreshKey, telescopeTarget?.url, telescopeWindowActive]);

  // Load WTML collection event trigger
  const handleLoadCollection = (url: string, name: string) => {
    if (!url) return;
    const validation = validateWtmlUrl(url);
    if (!validation.url) {
      setWtmlStatus('error');
      useUIStore.getState().addChangeLog('TELESCOPE', `Cannot load ${name}: ${validation.error}`, 'warning');
      setTimeout(() => setWtmlStatus('idle'), 3000);
      return;
    }

    if (!wwtRuntimeHealthy) {
      setWtmlStatus('error');
      useUIStore.getState().addChangeLog('TELESCOPE', `Cannot load ${name}: WWT client is ${wwtRuntimeState}.`, 'warning');
      setTimeout(() => setWtmlStatus('idle'), 3000);
      return;
    }
    setWtmlStatus('loading');
    try {
      postToWWT({
        event: 'load_image_collection',
        url: validation.url
      });
      setWtmlStatus('success');
      useUIStore.getState().addChangeLog('TELESCOPE', `Ingested stellar photo collection: ${name}`, 'success');
      setTimeout(() => setWtmlStatus('idle'), 3000);
    } catch (err) {
      setWtmlStatus('error');
      setTimeout(() => setWtmlStatus('idle'), 3000);
    }
  };

  // Set Background Image Set layer
  const handleSetBackground = (layerName: string) => {
    if (!wwtRuntimeHealthy) {
      useUIStore.getState().addChangeLog('TELESCOPE', `Cannot change WWT background imagery while client is ${wwtRuntimeState}.`, 'warning');
      return;
    }
    postToWWT({
      event: 'set_background_by_name',
      name: layerName
    });
    useUIStore.getState().addChangeLog('TELESCOPE', `Background imagery array set to: ${layerName}`, 'info');
  };

  // Register window callbacks in background mode for communication from controls
  useEffect(() => {
    if (bgOnly && typeof window !== 'undefined') {
      publishWwtRuntimeState(isFallbackRuntime ? 'Static fallback' : localWwtRuntimeState);
      (window as any).postToWWTBackground = postToWWT;
      (window as any).refreshWwtIframe = () => setRefreshKey(k => k + 1);
      (window as any).wwtLoadCollection = handleLoadCollection;
      (window as any).wwtSetBackground = handleSetBackground;
    }
    return () => {
      if (bgOnly && typeof window !== 'undefined') {
        delete (window as any).postToWWTBackground;
        delete (window as any).refreshWwtIframe;
        delete (window as any).wwtLoadCollection;
        delete (window as any).wwtSetBackground;
      }
    };
  }, [bgOnly, refreshKey, telescopeTarget]);

  const isHeadless = typeof window !== 'undefined' && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    window.location.search.includes('fallback')
  );
  const iframeUrl = isHeadless
    ? 'about:blank'
    : WWT_RESEARCH_APP_URL;
  const safeIframeUrl = isValidUrl(iframeUrl) ? iframeUrl : null;
  const safeExternalWwtUrl = isValidUrl(telescopeTarget?.url) ? telescopeTarget.url : null;
  const customWtmlValidation = useMemo(() => validateWtmlUrl(customWtml), [customWtml]);

  // Window size CSS styling mapping, constrained to the desktop shell safe area.
  const dim = {
    width: `${windowPixelDimensions[windowSize].width}px`,
    height: `${windowPixelDimensions[windowSize].height}px`,
  };
  const drawerTop = drawerOpen
    ? workspaceInsets.top + drawerTopPadding.expanded
    : workspaceInsets.top + drawerTopPadding.collapsed;
  const drawerContentMaxHeight = Math.min(
    300,
    Math.max(180, viewportSize.height - drawerTop - workspaceInsets.bottom - drawerContentReserve)
  );

  // Search filter for presets
  const filteredPresets = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return presets;
    return presets.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }, [searchQuery]);
  const drawerVisiblePresets = useMemo(() => filteredPresets.slice(0, 3), [filteredPresets]);

  // Time metrics calculations
  const timeStart = useMemo(() => {
    const s = parseDateSafe(timeRange?.start);
    if (s) return s.getTime();
    return defaultTime - 86400000;
  }, [timeRange, defaultTime]);

  const timeEnd = useMemo(() => {
    const e = parseDateSafe(timeRange?.end);
    if (e) return e.getTime();
    return defaultTime;
  }, [timeRange, defaultTime]);

  const totalMs = useMemo(() => {
    const diff = timeEnd - timeStart;
    return isNaN(diff) || diff <= 0 ? 86400000 : diff;
  }, [timeStart, timeEnd]);

  const progressPct = useMemo(() => {
    if (!safeCurrentTime) return 0;
    const pct = (safeCurrentTime.getTime() - timeStart) / totalMs;
    return isNaN(pct) ? 0 : Math.max(0, Math.min(1, pct));
  }, [safeCurrentTime, timeStart, totalMs]);

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
      };
    });
  }, [activePreset.name, activePresetCoordinates, coordinateDate]);

  const projectedPresetSummary = useMemo(() => {
    const nearSide = projectedPresetTargets.filter((target) => target.visibleHemisphere).length;
    const activeTarget = projectedPresetTargets.find((target) => target.isActive);
    return {
      nearSide,
      farSide: projectedPresetTargets.length - nearSide,
      activeAltitude: activeTarget?.altitudeAngleDegrees ?? 90,
      activeHorizonClass: activeTarget?.horizonClass ?? 'zenith',
    };
  }, [projectedPresetTargets]);

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

  const projectedConstellationSummary = useMemo(() => ({
    visibleConstellations: projectedConstellationOverlays.filter((constellation) => constellation.visibleStarCount > 0).length,
    activeRegion: projectedConstellationOverlays.find((constellation) => constellation.isActiveRegion)?.name || 'none',
  }), [projectedConstellationOverlays]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const targetMs = timeStart + val * totalMs;
    if (!isNaN(targetMs)) {
      setCurrentTime(new Date(targetMs));

      // Center the active timeRange on scrubbed time to make plugin fetches
      // and availability timelines predictable for the user.
      const newRange = { start: new Date(targetMs - totalMs), end: new Date(targetMs) };
      try {
        (useUIStore.getState() as any).setTimeRange?.(newRange as any);
      } catch (err) {
        // ignore if store doesn't expose setTimeRange in some environments
      }

      // Debounced fetch/update of plugin data for scrubbed time
      if ((handleSliderChange as any)._debounce) {
        clearTimeout((handleSliderChange as any)._debounce);
      }
      (handleSliderChange as any)._debounce = window.setTimeout(() => {
        try {
          // Ask plugin manager to update enabled plugins to the new range
          (window as any).pluginManager?.updateTimeRange(newRange as any).catch(() => {});
        } catch (e) {
          // swallow errors to avoid breaking UI
        }
      }, 220);
    }
  };

  const renderIframe = () => {
    if (isFallbackRuntime) {
      return (
        <div className="absolute inset-0 overflow-hidden bg-[#03070b]">
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Earth observer fallback view for ${activePreset.name}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="wwtFallbackEarth" cx="42%" cy="36%" r="62%">
                <stop offset="0%" stopColor="#55e6ff" stopOpacity="0.92" />
                <stop offset="48%" stopColor="#0b63d8" stopOpacity="0.78" />
                <stop offset="82%" stopColor="#06214f" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#020713" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="wwtFallbackTerminator" x1="20%" x2="84%" y1="18%" y2="78%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
                <stop offset="54%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.46" />
              </linearGradient>
              <filter id="wwtFallbackGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="wwtFallbackLineOfSight" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
                <stop offset="42%" stopColor={earthViewportTarget.color} stopOpacity="0.1" />
                <stop offset="100%" stopColor={earthViewportTarget.color} stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x="0" y="0" width="100" height="100" fill="#03070b" />
            {FALLBACK_STAR_FIELD.map((star) => (
              <circle
                key={star.id}
                cx={star.x}
                cy={star.y}
                r={star.radius}
                fill="#dff7ff"
                opacity={star.opacity}
              />
            ))}

            {showGrid && (
              <g aria-label="Fallback celestial grid">
                <circle cx="50" cy="50" r="30" fill="none" stroke="#0ea5e9" strokeOpacity="0.09" strokeWidth="0.6" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#0ea5e9" strokeOpacity="0.07" strokeWidth="0.45" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeOpacity="0.045" strokeWidth="0.35" strokeDasharray="0.9 2.2" />
                <ellipse
                  cx="50"
                  cy="50"
                  rx="41"
                  ry="12"
                  fill="none"
                  stroke={earthViewportTarget.color}
                  strokeOpacity="0.22"
                  strokeWidth="0.55"
                  transform={`rotate(${earthViewportTarget.orbitTilt} 50 50)`}
                />
                <line x1="50" y1="50" x2={earthViewportTarget.x} y2={earthViewportTarget.y} stroke={earthViewportTarget.color} strokeOpacity="0.55" strokeWidth="0.35" />
                <g opacity="0.3">
                  <ellipse cx="50" cy="50" rx="24" ry="8.2" fill="none" stroke="#b6f3ff" strokeWidth="0.25" />
                  <ellipse cx="50" cy="50" rx="24" ry="15.8" fill="none" stroke="#b6f3ff" strokeWidth="0.18" />
                  <line x1="26" y1="50" x2="74" y2="50" stroke="#b6f3ff" strokeWidth="0.22" />
                  <path d="M 50 26 C 44 34 44 66 50 74" fill="none" stroke="#b6f3ff" strokeWidth="0.18" />
                  <path d="M 50 26 C 56 34 56 66 50 74" fill="none" stroke="#b6f3ff" strokeWidth="0.18" />
                </g>
              </g>
            )}
            <circle cx="50" cy="50" r="24" fill="url(#wwtFallbackEarth)" stroke="#6ee7ff" strokeOpacity="0.34" strokeWidth="0.7" />
            <path d="M 35 41 C 39 36 47 36 50 42 C 45 44 42 48 36 47 C 33 45 32 43 35 41 Z" fill="#39a66b" fillOpacity="0.48" />
            <path d="M 56 35 C 64 37 69 43 68 49 C 63 47 60 45 56 47 C 53 44 52 39 56 35 Z" fill="#39a66b" fillOpacity="0.42" />
            <path d="M 49 55 C 54 53 61 56 62 62 C 57 66 49 65 47 60 C 46 58 47 56 49 55 Z" fill="#39a66b" fillOpacity="0.38" />
            <circle cx="50" cy="50" r="24" fill="url(#wwtFallbackTerminator)" />
            <circle cx="50" cy="50" r="25.2" fill="none" stroke="#67e8f9" strokeOpacity="0.18" strokeWidth="2.2" filter="url(#wwtFallbackGlow)" />
            <circle cx="50" cy="50" r="24" fill="none" stroke="#dff7ff" strokeOpacity="0.18" strokeWidth="0.35" />
            <circle cx="50" cy="50" r="31.5" fill="none" stroke="#fbbf24" strokeOpacity="0.22" strokeWidth="0.34" strokeDasharray="1 1.8" />
            <text x="25" y="22.5" fill="#dff7ff" opacity="0.42" fontSize="1.85" fontFamily="monospace" letterSpacing="0">
              near-side sky objects
            </text>
            <text x="58.5" y="82.5" fill="#fbbf24" opacity="0.48" fontSize="1.85" fontFamily="monospace" letterSpacing="0">
              far-side limb
            </text>

            {showConstellationSelection && (
              <g aria-label="Active constellation region">
                {projectedConstellationOverlays.filter((constellation) => constellation.isActiveRegion).map((constellation) => (
                  <circle
                    key={`${constellation.id}-active-region`}
                    cx={constellation.labelX}
                    cy={constellation.labelY}
                    r="9.2"
                    fill="none"
                    stroke={earthViewportTarget.color}
                    strokeOpacity="0.28"
                    strokeWidth="0.42"
                    strokeDasharray="1.4 1.2"
                  />
                ))}
              </g>
            )}

            {(showConstellationLines || showConstellationFigures) && (
              <g aria-label="Projected constellation context">
                {showConstellationLines && projectedConstellationOverlays.map((constellation) => (
                  <g key={`${constellation.id}-lines`} opacity={constellation.isActiveRegion ? 0.86 : 0.5}>
                    {constellation.connections.map(([startIndex, endIndex]) => {
                      const start = constellation.stars[startIndex];
                      const end = constellation.stars[endIndex];
                      if (!start || !end) return null;
                      const nearSegment = start.visibleHemisphere && end.visibleHemisphere;
                      return (
                        <line
                          key={`${constellation.id}-${startIndex}-${endIndex}`}
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke={constellation.isActiveRegion ? earthViewportTarget.color : '#dff7ff'}
                          strokeOpacity={nearSegment ? 0.42 : 0.18}
                          strokeWidth={constellation.isActiveRegion ? 0.42 : 0.24}
                          strokeDasharray={nearSegment ? undefined : '0.8 1.1'}
                        />
                      );
                    })}
                    {constellation.stars.map((star) => (
                      <circle
                        key={`${constellation.id}-${star.name}`}
                        cx={star.x}
                        cy={star.y}
                        r={Math.max(0.38, 1.35 - star.magnitude * 0.22)}
                        fill={constellation.isActiveRegion ? earthViewportTarget.color : '#eefbff'}
                        opacity={star.visibleHemisphere ? 0.82 : 0.36}
                      />
                    ))}
                  </g>
                ))}
                {showConstellationFigures && projectedConstellationOverlays.map((constellation) => (
                  <text
                    key={`${constellation.id}-label`}
                    x={constellation.labelX + 1.8}
                    y={constellation.labelY - 1.8}
                    fill={constellation.isActiveRegion ? earthViewportTarget.color : '#dff7ff'}
                    opacity={constellation.visibleStarCount > 0 ? 0.64 : 0.24}
                    fontSize={constellation.isActiveRegion ? 2.1 : 1.75}
                    fontFamily="monospace"
                    letterSpacing="0"
                  >
                    {constellation.name}
                  </text>
                ))}
              </g>
            )}

            <g aria-label="Projected WWT telescope objects">
              {projectedPresetTargets.map((target) => (
                <g
                  key={target.id}
                  opacity={target.isActive ? 1 : target.visibleHemisphere ? 0.62 : 0.36}
                >
                  {target.isActive && (
                    <>
                      <circle cx="50" cy="50" r="12" fill="url(#wwtFallbackLineOfSight)" />
                      <circle cx="50" cy="50" r="6.6" fill="none" stroke={target.color} strokeOpacity="0.36" strokeWidth="0.35" strokeDasharray="1.2 1.2" />
                      <circle cx="50" cy="50" r="10.8" fill="none" stroke={target.color} strokeOpacity="0.22" strokeWidth="0.3" strokeDasharray="0.8 1.6" />
                      <text
                        x="53.2"
                        y="45.4"
                        fill="#eefbff"
                        fontSize="2.1"
                        fontFamily="monospace"
                        letterSpacing="0"
                      >
                        zenith subpoint
                      </text>
                    </>
                  )}
                  {!target.isActive && (
                    <circle
                      cx={target.x}
                      cy={target.y}
                      r={target.visibleHemisphere ? 0.9 : 0.72}
                      fill={target.color}
                    />
                  )}
                  <circle
                    cx={target.x}
                    cy={target.y}
                    r={target.isActive ? 4.6 : target.visibleHemisphere ? 2.6 : 2.3}
                    fill="none"
                    stroke={target.color}
                    strokeOpacity={target.isActive ? 0.62 : target.visibleHemisphere ? 0.26 : 0.18}
                    strokeWidth={target.isActive ? 0.5 : 0.28}
                    strokeDasharray={target.visibleHemisphere ? undefined : '0.9 1.3'}
                  />
                  {target.isActive && (
                    <text
                      x={target.x + 2.6}
                      y={Math.max(8, target.y - 3)}
                      fill="#eefbff"
                      fontSize="2.4"
                      fontFamily="monospace"
                      letterSpacing="0"
                    >
                      {target.name}
                    </text>
                  )}
                  {!target.isActive && target.visibleHemisphere && target.angularSeparationDegrees <= 28 && (
                    <text
                      x={target.x + 2.1}
                      y={target.y + 0.8}
                      fill={target.color}
                      opacity="0.62"
                      fontSize="1.75"
                      fontFamily="monospace"
                      letterSpacing="0"
                    >
                      {target.altitudeAngleDegrees.toFixed(0)}deg alt
                    </text>
                  )}
                  {!target.isActive && !target.visibleHemisphere && (
                    <path
                      d={`M ${target.x - 1.7} ${target.y - 1.7} L ${target.x + 1.7} ${target.y + 1.7} M ${target.x + 1.7} ${target.y - 1.7} L ${target.x - 1.7} ${target.y + 1.7}`}
                      stroke={target.color}
                      strokeOpacity="0.28"
                      strokeWidth="0.22"
                    />
                  )}
                </g>
              ))}
            </g>

            <g filter="url(#wwtFallbackGlow)">
              <circle cx={earthViewportTarget.x} cy={earthViewportTarget.y} r="2.2" fill={earthViewportTarget.color} />
              <circle cx={earthViewportTarget.x} cy={earthViewportTarget.y} r="5" fill="none" stroke={earthViewportTarget.color} strokeOpacity="0.55" strokeWidth="0.55" strokeDasharray="1.2 1.1" />
              <path
                d={`M ${earthViewportTarget.x - 5} ${earthViewportTarget.y} L ${earthViewportTarget.x + 5} ${earthViewportTarget.y} M ${earthViewportTarget.x} ${earthViewportTarget.y - 5} L ${earthViewportTarget.x} ${earthViewportTarget.y + 5}`}
                stroke={earthViewportTarget.color}
                strokeOpacity="0.68"
                strokeWidth="0.45"
              />
            </g>
          </svg>

            <div className="absolute inset-x-4 bottom-4 z-10 rounded border border-primary/20 bg-black/65 p-3 font-mono text-[8px] uppercase tracking-wider text-white/55 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-bold text-primary">Earth Observer Frame</span>
                <span className="text-right text-white/70">{activePreset.name}</span>
              </div>
            <div className="grid grid-cols-4 gap-2 text-[7.5px]">
              <div>
                <span className="block text-white/30">Subpoint lon</span>
                <span className="text-primary">{earthReferenceFrame.longitude}</span>
              </div>
              <div>
                <span className="block text-white/30">Declination</span>
                <span className="text-primary">{earthReferenceFrame.latitude}</span>
              </div>
              <div>
                <span className="block text-white/30">Target alt</span>
                <span className="text-primary">{projectedPresetSummary.activeAltitude.toFixed(1)} deg</span>
              </div>
              <div>
                <span className="block text-white/30">Runtime state</span>
                <span className="text-amber-300">{wwtRuntimeState}</span>
              </div>
            </div>
            <div className="mt-2 border-t border-white/10 pt-2 text-[7px] leading-relaxed text-white/45">
              Coordinate source: {earthReferenceFrame.coordinateSource === 'kepler-planet' ? 'light-time Keplerian ephemeris' : 'fixed catalog coordinates'}{earthReferenceFrame.lightTimeMinutes ? `; light time ${earthReferenceFrame.lightTimeMinutes.toFixed(1)} min` : ''}.
            </div>
            <div className="mt-2 border-t border-white/10 pt-2 text-[7px] leading-relaxed text-white/40">
              WWT iframe unavailable in this audit mode. This Earth-facing fallback projects WWT preset coordinates onto a local observer frame: center means zenith above the subpoint, solid objects are near-side, and dashed objects are beyond the Earth limb. It is not live WWT imagery.
            </div>
            </div>
            <div className="absolute left-4 top-4 z-10 rounded border border-white/10 bg-black/50 px-3 py-2 font-mono text-[7px] uppercase tracking-wider text-white/45 backdrop-blur-md">
              <div className="font-bold text-white/70">Projected WWT Objects</div>
              <div>{projectedPresetTargets.length} presets in observer frame</div>
              <div>{projectedPresetSummary.nearSide} near side / {projectedPresetSummary.farSide} far limb</div>
              <div>active target: {projectedPresetSummary.activeHorizonClass}</div>
              <div>{projectedConstellationSummary.visibleConstellations} constellation groups visible</div>
              <div>active region: {projectedConstellationSummary.activeRegion}</div>
              <div className="mt-1 text-amber-200/70">schematic fallback, not live WWT imagery</div>
            </div>
          </div>
        );
      }

    if (iframeError) {
      return (
        <div className="text-center p-6 max-w-[85%] space-y-3 pointer-events-auto select-text z-10">
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg">⚠</div>
          <div className="text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">WWT Connection Failed</div>
          <div className="text-white/50 font-mono text-[8px] leading-relaxed">
            The embedded telescope feed did not finish loading. The Earth projection remains available, and the live WWT client can be retried or opened outside the panel.
          </div>
          <div className="text-white/30 font-mono text-[7px] break-all lowercase">{safeIframeUrl || String(iframeUrl)}</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Retry embedded WorldWide Telescope connection"
              onClick={() => { setIframeError(false); setIframeLoaded(false); setRefreshKey(k => k + 1); }}
              className="min-h-11 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-1.5 rounded text-[9px] font-bold font-mono uppercase transition-all cursor-pointer pointer-events-auto z-20"
            >
              Retry Connection
            </button>
            {(safeExternalWwtUrl || safeIframeUrl) && (
              <a
                href={safeExternalWwtUrl || safeIframeUrl || WWT_RESEARCH_APP_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center justify-center rounded border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-[9px] font-bold uppercase text-white/60 transition-all hover:bg-white/10 hover:text-white"
              >
                Open WWT
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-primary/60 animate-pulse">
              Connecting to WWT...
            </span>
          </div>
        )}
        {safeIframeUrl ? (
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
        ) : (
          <div className="text-center p-6 max-w-[85%] space-y-3 pointer-events-auto select-text">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 text-lg">⚠</div>
            <div className="text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">Invalid Telescope URL</div>
            <div className="text-white/50 font-mono text-[8px] leading-relaxed">
              The configured telescope iframe URL is invalid. Please choose a different target.
            </div>
            <div className="text-white/30 font-mono text-[7px] break-all lowercase">{String(iframeUrl)}</div>
            <button
              onClick={() => { setIframeError(false); setIframeLoaded(false); setRefreshKey(k => k + 1); }}
              className="mt-2 min-h-11 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-1.5 rounded text-[9px] font-bold font-mono uppercase transition-all cursor-pointer pointer-events-auto"
            >
              Retry
            </button>
          </div>
        )}
      </>
    );
  };

  const renderHUDAndTimeline = () => {
    if (!telescopeWindowActive) {
      return null;
    }

    return (
      <div ref={overlayRootRef} className="fixed inset-0 w-full h-full flex overflow-hidden bg-transparent select-none pointer-events-none">

        {/* --- Real-time Telescope Telemetry Overlay --- */}
        {telescopeTelemetry && (
          <div className="absolute top-4 right-4 z-50 pointer-events-auto">
            <div className="glass-panel-strong border border-primary/20 p-2.5 px-4 font-mono text-[9px] uppercase tracking-wider space-y-1 shadow-xl">
              <div className="flex items-center justify-between gap-6">
                <span className="text-white/40">Right Ascension</span>
                <span className="text-primary font-bold">{formatRA(telescopeTelemetry.ra)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-white/40">Declination</span>
                <span className="text-primary font-bold">{formatDec(telescopeTelemetry.dec)}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="text-white/40">Camera Roll</span>
                <span className="text-primary/60">{telescopeTelemetry.roll.toFixed(2)}°</span>
              </div>
              {syncSource !== 'none' && (
                <div className="pt-1 mt-1 border-t border-white/5 flex items-center gap-1.5 text-[7px] text-white/30 italic">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span>SYNC SOURCE: {syncSource.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="absolute right-[clamp(1rem,4vw,2rem)] top-[clamp(4.75rem,10vh,6rem)] z-40 w-[min(88vw,18rem)] pointer-events-none">
          <div className="glass-panel-strong border border-primary/15 px-3 py-2 font-mono text-[9px] uppercase tracking-wider shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="text-primary font-bold">Earth Observer Frame</span>
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold text-primary">{earthReferenceFrame.frameLabel}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/45">
              <div>
                <span className="block text-white/25">Target</span>
                <span className="block truncate text-white/80">{activePreset.name}</span>
              </div>
              <div>
                <span className="block text-white/25">Subpoint</span>
                <span className="block text-primary">{earthReferenceFrame.latitude}</span>
              </div>
              <div>
                <span className="block text-white/25">Limb</span>
                <span className="block truncate text-white/70">{earthReferenceFrame.relation}</span>
              </div>
              <div>
                <span className="block text-white/25">GMST</span>
                <span className="block text-white/70">{earthReferenceFrame.gmstHours.toFixed(2)}h</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/5 pt-1.5 text-[7px]">
              <span className="text-white/30">Viewport state</span>
              <span className={wwtRuntimeHealthy ? 'text-emerald-300' : 'text-amber-300'}>
                {wwtRuntimeState}
              </span>
            </div>
          </div>
        </div>

        {/* Space HUD / Controls Panel (Collapsible Drawer on Left) */}
        {spaceInteractionTarget === 'telescope' && (
          <div
            className="absolute z-30 flex flex-col pointer-events-auto"
            style={{
              left: workspaceInsets.left,
              top: drawerTop,
              maxHeight: `calc(100% - ${workspaceInsets.top + workspaceInsets.bottom + (drawerOpen ? drawerTopPadding.expanded : drawerTopPadding.collapsed)}px)`,
            }}
          >
            {drawerOpen ? (
              <div
                className="glass-panel-strong flex flex-col border border-primary/20 overflow-hidden shadow-2xl animate-slide-in"
                style={{ width: drawerWidth }}
              >
                {/* Drawer Header */}
                <div className="flex min-h-12 items-center justify-between px-3 bg-black/40 border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 glow-pulse animate-spin-slow" />
                    <span>Space Array Control</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/5 hover:text-white/80 cursor-pointer"
                      aria-label="Collapse Space Array controls"
                      title="Collapse Panel"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>

                {/* Tab Selectors */}
                <div className="flex bg-black/20 border-b border-white/5 p-1 gap-1 text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('navigator')}
                    className={`min-h-11 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${activeControlTab === 'navigator' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Navigator
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('overlays')}
                    className={`min-h-11 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${activeControlTab === 'overlays' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Overlays
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('imagery')}
                    className={`min-h-11 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${activeControlTab === 'imagery' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Imagery
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveControlTab('photos')}
                    className={`min-h-11 flex-1 rounded px-1 py-1 text-center transition-colors cursor-pointer ${activeControlTab === 'photos' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Photos
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scroller" style={{ maxHeight: drawerContentMaxHeight }}>
                  {/* Tab 1: Celestial Navigator */}
                  {activeControlTab === 'navigator' && (
                    <div className="space-y-2.5">
                      <div className="relative flex min-h-11 items-center bg-black/40 border border-white/5 rounded px-2 text-white/50">
                        <Search className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        <input
                          id="wwt-search-targets"
                          name="wwt-search-targets"
                          type="text"
                          placeholder="Search targets..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="min-h-11 bg-transparent border-none text-[10px] py-1.5 w-full text-white/80 focus:outline-none placeholder:text-white/20 font-mono"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded text-white/40 hover:bg-white/10 cursor-pointer"
                            aria-label="Clear telescope target search"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>

                      <div className="rounded-lg border border-primary/15 bg-primary/5 p-2 font-mono text-[8px] uppercase tracking-wider">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-primary">Earth-relative target</span>
                          <span className="text-white/40">{earthReferenceFrame.longitude}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-white/45">
                          <span>{activePresetCoordinates.ra} / {activePresetCoordinates.dec}</span>
                          <span className="text-white/60">{earthReferenceFrame.relation}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {drawerVisiblePresets.map(preset => {
                          const isActive = activePreset.id === preset.id;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setTelescopeTarget(preset);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border flex items-start gap-2.5 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-primary/10 border-primary/40 shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]'
                                  : 'bg-black/25 border-white/5 hover:border-white/15'
                              }`}
                            >
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse"
                                style={{ backgroundColor: preset.color }}
                              />
                              <div className="min-w-0">
                                <div className={`text-[10px] font-bold font-mono ${isActive ? 'text-primary' : 'text-white/80'}`}>
                                  {preset.name}
                                </div>
                                <div className="text-[8px] text-white/40 mt-0.5 font-mono">
                                  RA: {preset.ra} • DEC: {preset.dec} • FOV: {preset.fov}
                                </div>
                                <div className="text-[8px] text-white/50 mt-1 leading-relaxed truncate font-sans">
                                  {preset.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                        {filteredPresets.length > drawerVisiblePresets.length && (
                          <div className="rounded border border-white/5 bg-black/20 px-2.5 py-2 font-mono text-[8px] uppercase leading-relaxed tracking-wider text-white/35">
                            {filteredPresets.length - drawerVisiblePresets.length} more targets available in Star Array Presets.
                          </div>
                        )}
                        {filteredPresets.length === 0 && (
                          <div className="text-center font-mono text-[8px] py-6 text-white/20 italic">
                            No astronomical objects found
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Constellations & Overlays */}
                  {activeControlTab === 'overlays' && (
                    <div className="space-y-3 font-mono text-[9px]">
                      <div className="glass-panel p-2.5 bg-black/30 space-y-2.5 border border-white/5">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-primary block">Sky Map Overlays</span>

                        <label className="flex min-h-11 items-center justify-between gap-3 py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Grid className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Celestial Grid Lines</span>
                          </div>
                          <input
                            id="wwt-grid-lines"
                            name="wwt-grid-lines"
                            type="checkbox"
                            aria-label="Toggle celestial grid lines"
                            checked={showGrid}
                            onChange={e => setShowGrid(e.target.checked)}
                            className="h-11 w-11 rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer"
                          />
                        </label>

                        <label className="flex min-h-11 items-center justify-between gap-3 py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Stick Figures</span>
                          </div>
                          <input
                            id="wwt-constellation-lines"
                            name="wwt-constellation-lines"
                            type="checkbox"
                            aria-label="Toggle constellation stick figures"
                            checked={showConstellationLines}
                            onChange={e => setShowConstellationLines(e.target.checked)}
                            className="h-11 w-11 rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer"
                          />
                        </label>

                        <label className="flex min-h-11 items-center justify-between gap-3 py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Artistic Art</span>
                          </div>
                          <input
                            id="wwt-constellation-art"
                            name="wwt-constellation-art"
                            type="checkbox"
                            aria-label="Toggle constellation artistic art"
                            checked={showConstellationFigures}
                            onChange={e => setShowConstellationFigures(e.target.checked)}
                            className="h-11 w-11 rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer"
                          />
                        </label>

                        <label className="flex min-h-11 items-center justify-between gap-3 py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Boundaries</span>
                          </div>
                          <input
                            id="wwt-constellation-boundaries"
                            name="wwt-constellation-boundaries"
                            type="checkbox"
                            aria-label="Toggle constellation boundaries"
                            checked={showConstellationBoundries}
                            onChange={e => setShowConstellationBoundries(e.target.checked)}
                            className="h-11 w-11 rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer"
                          />
                        </label>

                        <label className="flex min-h-11 items-center justify-between gap-3 py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Selection Highlight</span>
                          </div>
                          <input
                            id="wwt-constellation-selection"
                            name="wwt-constellation-selection"
                            type="checkbox"
                            aria-label="Toggle constellation selection highlight"
                            checked={showConstellationSelection}
                            onChange={e => setShowConstellationSelection(e.target.checked)}
                            className="h-11 w-11 rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer"
                          />
                        </label>
                      </div>

                      <div className="p-2 bg-white/5 border border-white/5 rounded text-[8px] text-white/50 leading-relaxed uppercase">
                        {wwtRuntimeHealthy
                          ? 'Constellation configurations update the embedded WorldWide Telescope WebGL render pipeline.'
                          : `WWT controls are visible for review, but ${wwtRuntimeState} means these overlay changes are not confirmed in live imagery.`}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Background Imagery Layers */}
                  {activeControlTab === 'imagery' && (
                    <div className="space-y-1.5 font-mono">
                      {BACKGROUND_LAYERS.map(layer => (
                        <button
                          key={layer.id}
                          onClick={() => handleSetBackground(layer.value)}
                          disabled={!wwtRuntimeHealthy}
                          className="w-full min-h-11 text-left p-2 rounded border border-white/5 bg-black/25 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <div>
                            <div className="text-[10px] text-white/80 font-bold">{layer.name}</div>
                            <div className="text-[8px] text-white/40 mt-0.5">{layer.desc}</div>
                          </div>
                          <Plus size={12} className="text-white/30" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab 4: Pictures & Photos */}
                  {activeControlTab === 'photos' && (
                    <div className="space-y-3 font-mono">
                      <div className="space-y-2">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-primary block">Premium Imagery Databases</span>
                        {PHOTO_COLLECTIONS.map(col => (
                          <button
                            key={col.id}
                            onClick={() => handleLoadCollection(col.url, col.name)}
                            disabled={!wwtRuntimeHealthy}
                            className="w-full min-h-11 text-left p-2.5 rounded border border-white/5 bg-black/25 hover:border-primary/30 transition-all cursor-pointer block disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <div className="text-[10px] text-primary font-bold flex items-center justify-between">
                              <span>{col.name}</span>
                              <span className="text-[7.5px] uppercase bg-primary/20 text-primary px-1 py-0.5 rounded">WTML</span>
                            </div>
                            <div className="text-[8px] text-white/50 mt-1 leading-relaxed">{col.desc}</div>
                          </button>
                        ))}
                      </div>

                      <div className="glass-panel p-2.5 border border-white/5 bg-black/30 space-y-2">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-primary block">Ingest Custom WTML Collection</span>
                        <input
                          id="wwt-custom-wtml"
                          name="wwt-custom-wtml"
                          type="text"
                          placeholder="https://example.com/collection.wtml"
                          value={customWtml}
                          onChange={e => setCustomWtml(e.target.value)}
                          aria-invalid={Boolean(customWtml && customWtmlValidation.error)}
                          aria-describedby="wwt-custom-wtml-help"
                          className="min-h-11 w-full rounded border border-white/5 bg-black/45 p-2 text-[9px] text-white/80 focus:outline-none placeholder:text-white/20 select-text"
                        />
                        <div
                          id="wwt-custom-wtml-help"
                          className={`rounded border p-2 text-[8px] uppercase leading-relaxed ${
                            customWtml && customWtmlValidation.error
                              ? 'border-amber-300/20 bg-amber-300/10 text-amber-100/70'
                              : 'border-white/5 bg-white/5 text-white/45'
                          }`}
                        >
                          {customWtml && customWtmlValidation.error
                            ? customWtmlValidation.error
                            : 'Custom collections must be HTTPS .wtml manifests. Localhost HTTP is accepted only for local development.'}
                        </div>
                        <button
                          type="button"
                          onClick={() => customWtmlValidation.url && handleLoadCollection(customWtmlValidation.url, 'Custom Collection')}
                          disabled={!customWtmlValidation.url || wtmlStatus === 'loading' || !wwtRuntimeHealthy}
                          className="min-h-11 w-full rounded border border-primary/30 bg-primary/20 p-2 text-[9px] font-bold text-primary transition-all hover:bg-primary/45 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {wtmlStatus === 'loading' ? 'Ingesting...' :
                           wtmlStatus === 'success' ? 'Ingested Successfully' :
                           wtmlStatus === 'error' ? 'Ingestion Failed' :
                           !customWtmlValidation.url && customWtml ? 'Fix WTML URL' : 'Load Custom WTML'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="glass-panel flex h-11 w-11 items-center justify-center rounded border border-primary/20 text-primary shadow-lg transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                title="Show Space Array controls"
                aria-label="Show Space Array controls"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Floating Telemetry Timeline Playback Controller (Bottom Center) */}
        <div
          className={`absolute z-40 pointer-events-auto transition-all duration-200 ${
            telemetryTimelineCollapsed ? 'bottom-2' : 'bottom-4'
          }`}
          style={{
            left: 'clamp(1rem, 4vw, 2rem)',
            right: 'clamp(4.75rem, 8vw, 6rem)',
          }}
        >
          <div
            className={`glass-panel-strong relative border border-primary/20 shadow-2xl font-mono text-white text-[10px] ${
              telemetryTimelineCollapsed ? 'flex min-h-12 items-center justify-between gap-3 px-4 py-2' : 'flex flex-col gap-2 p-3 px-5'
            }`}
          >
            <button
              type="button"
              onClick={() => setTelemetryTimelineCollapsed((value) => !value)}
              className="absolute left-1/2 top-0 z-10 flex min-h-8 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/25 bg-[#0f111a] text-primary shadow-lg transition-colors hover:bg-primary/20 hover:text-white"
              aria-label={telemetryTimelineCollapsed ? 'Expand telemetry timeline' : 'Collapse telemetry timeline to bottom bar'}
              aria-expanded={!telemetryTimelineCollapsed}
              title={telemetryTimelineCollapsed ? 'Expand telemetry timeline' : 'Collapse telemetry timeline to bottom bar'}
            >
              {telemetryTimelineCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Timeline Header Row */}
            <div className={`flex items-center justify-between gap-3 ${telemetryTimelineCollapsed ? 'contents' : 'border-b border-white/5 pb-2'}`}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlaybackMode(!isPlaybackMode)}
                  className={`min-h-11 px-4 py-1.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                    isPlaybackMode
                      ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'
                      : 'border-green-500/30 bg-green-950/20 text-green-400'
                  }`}
                  aria-label="Toggle live telemetry and recorded playback mode"
                  title="Toggle Live vs Recorded Playback Mode"
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isPlaybackMode ? 'bg-cyan-400' : 'bg-green-400 animate-pulse'}`} />
                    <span>{isPlaybackMode ? 'PLAYBACK MODE' : 'LIVE TELEMETRY'}</span>
                  </div>
                </button>

                {isPlaybackMode && (
                  <button
                    type="button"
                    onClick={() => setPlaying(!isPlaying)}
                    className="flex min-h-11 min-w-11 items-center justify-center p-2 rounded hover:bg-white/5 text-primary hover:text-primary-hover cursor-pointer"
                    aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
                    title={isPlaying ? 'Pause Playback' : 'Start Playback'}
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                )}
              </div>

              {/* DateTime Display */}
              <div className="flex items-center gap-2.5 text-white/80 text-[9px]">
                <div className="flex items-center gap-1 text-white/50">
                  <Calendar size={11} />
                  <span>
                    {safeCurrentTime ? safeCurrentTime.toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-white/50">
                  <Clock size={11} />
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {safeCurrentTime ? safeCurrentTime.toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline slider and speed multipliers */}
            {!telemetryTimelineCollapsed && (
            <div className="flex flex-col gap-2">
              <div className="px-1">
                <TimelineLanes timeStart={timeStart} timeEnd={timeEnd} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[8px] text-white/30">START</span>
                  <input
                    id="wwt-timeline-progress"
                    name="wwt-timeline-progress"
                    type="range"
                    aria-label="Telescope telemetry timeline progress"
                    min="0"
                    max="1"
                    step="0.0001"
                    value={progressPct}
                    onChange={handleSliderChange}
                    disabled={!isPlaybackMode}
                    className="h-11 w-full rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/70"
                    style={{
                      background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${progressPct * 100}%, rgba(255,255,255,0.05) ${progressPct * 100}%, rgba(255,255,255,0.05) 100%) center / 100% 4px no-repeat`
                    }}
                  />
                  <span className="text-[8px] text-white/30">NOW</span>
                </div>

                {isPlaybackMode && (
                  <div className="flex items-center gap-1 bg-black/30 border border-white/5 p-1 rounded text-[8px]">
                    {['1', '10', '100', '1000'].map(spd => {
                      const s = parseInt(spd);
                      const isSpeed = playbackSpeed === s;
                      return (
                        <button
                          type="button"
                          key={spd}
                          onClick={() => setPlaybackSpeed(s)}
                          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 py-1 transition-all cursor-pointer ${
                            isSpeed ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'
                          }`}
                          aria-label={`Set playback speed to ${spd}x`}
                        >
                          {spd}x
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}

          </div>
        </div>

        {/* Draggable floating Picture-in-Picture window overlay */}
        {telescopeWindowActive && (
          <div
            className="glass-panel border border-primary/20 flex flex-col overflow-hidden shadow-2xl pointer-events-auto absolute z-50"
            style={{
              left: pos.x,
              top: pos.y,
              width: dim.width,
              height: dim.height,
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Window Drag Handle Header */}
            <div className="pip-drag-handle flex min-h-12 items-center justify-between px-3 bg-black/60 border-b border-white/10 cursor-move select-none">
              <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>Stellar Telescope Feed</span>
                {windowSize !== 'minimized' && (
                  <span className="text-[8px] text-white/40 normal-case font-normal ml-2">
                    {activePreset.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 pip-action-btn">
                <button
                  type="button"
                  onClick={() => setWindowSize(windowSize === 'minimized' ? 'normal' : 'minimized')}
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/40 hover:text-white/85 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                  aria-label={windowSize === 'minimized' ? 'Expand telescope feed' : 'Minimize telescope feed'}
                  title={windowSize === 'minimized' ? 'Expand' : 'Minimize'}
                >
                  {windowSize === 'minimized' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => setWindowSize(windowSize === 'large' ? 'normal' : 'large')}
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/40 hover:text-white/85 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                  aria-label={windowSize === 'large' ? 'Shrink telescope feed' : 'Maximize telescope feed'}
                  title={windowSize === 'large' ? 'Shrink' : 'Maximize'}
                  disabled={windowSize === 'minimized'}
                >
                  {windowSize === 'large' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/40 hover:text-white/85 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                  aria-label="Reload telescope client"
                  title="Reload Telescope Client"
                  disabled={windowSize === 'minimized'}
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInteractionMode('orbital');
                    useUIStore.getState().setSpaceInteractionTarget('earth');
                  }}
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/40 hover:text-red-400 p-1 hover:bg-red-950/20 rounded cursor-pointer transition-colors"
                  aria-label="Close telescope feed"
                  title="Close Telescope Feed"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Window Body (WWT iframe) */}
            {windowSize !== 'minimized' && (
              <div className="flex-1 w-full h-full relative overflow-hidden bg-black/85">
                {renderIframe()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Branch return statements
  if (bgOnly) {
    return (
      <div className="absolute inset-0 w-full h-full bg-black select-none pointer-events-none" aria-hidden="true">
        {typeof window !== 'undefined' && (window as any).__triggerTelescopeCrash && <CrashComponent />}
        {!telescopeWindowActive && (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            {renderIframe()}
          </div>
        )}
      </div>
    );
  }

  if (controlsOnly) {
    return renderHUDAndTimeline();
  }

  // Fallback: render both side-by-side / overlayed if no props passed (for safety)
  return renderHUDAndTimeline();
}
