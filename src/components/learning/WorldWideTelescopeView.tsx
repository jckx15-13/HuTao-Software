import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass, Eye, RefreshCw, X, Maximize2, Minimize2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Play, Pause,
  Calendar, Clock, Image as ImageIcon, Search, Grid, Plus, Radio, Star
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { getSpaceFocus } from '@/lib/spaceFocus';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS as presets, resolveTelescopePresetCoordinates } from '@/data/telescopePresets';
import TimelineLanes from './TimelineLanes';
import { pluginManager } from '@/core/plugins/PluginManager';
import { useWwtResearchApp } from '@/hooks/useWwtResearchApp';
import { useViewportSize } from '@/hooks/useViewportSize';
import {
  DEFAULT_WWT_OVERLAYS, isRecord, WWT_BACKGROUND_LAYERS, WWT_CONSTELLATION_COLORS,
  WWT_RESEARCH_APP_URL, WWT_VIEWPORT_ID, type WwtConstellationColor, type WwtOverlay,
} from '@/lib/wwt/researchApp';
import { formatRA, formatDec, raHoursToDegrees } from '@/lib/coordinateTransforms';
import { projectTelescopeTargetToEarth } from '@/lib/earthObserverProjection';

const PHOTO_COLLECTIONS = [
  { id: 'studieshubble', name: 'Hubble Studies', description: 'Star fields, nebulae, and galaxies.' },
  { id: 'studiesspitzer', name: 'Spitzer Studies', description: 'Infrared images of stellar nurseries and galaxies.' },
  { id: 'studieschandra', name: 'Chandra Studies', description: 'X-ray observations of high-energy objects.' },
  { id: 'astrophoto', name: 'Astrophotography', description: 'Selected images from astrophotographers.' },
];
const WWT_CATALOG_URL = 'https://worldwidetelescope.org/wwtweb/catalog.aspx';

const WwtFallbackView = lazy(() => import('./WwtFallbackView'));

const OVERLAY_CONTROLS = [
  { setting: 'showGrid', id: 'wwt-grid-lines', label: 'Celestial Grid Lines', ariaLabel: 'Toggle celestial grid lines', icon: Grid },
  { setting: 'showConstellationFigures', id: 'wwt-constellation-lines', label: 'Constellation Stick Figures', ariaLabel: 'Toggle constellation stick figures', icon: Star },
  { setting: 'showConstellationLabels', id: 'wwt-constellation-names', label: 'Constellation Names', ariaLabel: 'Constellation Names', icon: Star },
  { setting: 'showConstellationPictures', id: 'wwt-constellation-art', label: 'Constellation Artistic Art', ariaLabel: 'Toggle constellation artistic art', icon: ImageIcon },
  { setting: 'showConstellationBoundries', id: 'wwt-constellation-boundaries', label: 'Constellation Boundaries', ariaLabel: 'Toggle constellation boundaries', icon: Eye },
  { setting: 'showConstellationSelection', id: 'wwt-constellation-selection', label: 'Constellation Selection Highlight', ariaLabel: 'Toggle constellation selection highlight', icon: Compass },
] as const;

const FEED_HEADER_HEIGHT = 48;

function CrashComponent(): never {
  throw new Error('Simulated Telescope Crash');
}

const clampPx = (value: number, min: number, max: number): number => {
  const normalized = Math.round(value);
  if (!Number.isFinite(normalized)) return min;
  return Math.min(Math.max(normalized, min), max);
};

function parseDateSafe(value: unknown): Date | null {
  const date = value instanceof Date ? value :
    typeof value === 'number' || typeof value === 'string' ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function validateWtmlUrl(value: string): { url: string | null; error: string | null } {
  const trimmed = value.trim();
  if (!trimmed) return { url: null, error: 'Enter a WTML collection URL.' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { url: null, error: 'Use a complete URL, for example https://example.com/collection.wtml.' };
  }

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) {
    return { url: null, error: 'Use HTTPS for WTML collections. Localhost HTTP is allowed for development.' };
  }
  if (!parsed.pathname.toLowerCase().endsWith('.wtml')) {
    return { url: null, error: 'The collection URL must end in .wtml.' };
  }

  return { url: parsed.toString(), error: null };
}

export default function WorldWideTelescopeView() {
  const storeTarget = useUIStore((s) => s.telescopeTarget);
  const setTelescopeTarget = useUIStore((s) => s.setTelescopeTarget);
  const telescopeWindowActive = useUIStore((s) => getSpaceFocus(s.interactionMode, s.spaceInteractionTarget) === 'telescope');
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const wwtBackgroundLayer = useUIStore((s) => s.wwtBackgroundLayer);
  const useSkyGrade = useUIStore((s) => s.cosmosBackgroundMode !== 'deep-black');
  const setWwtBackgroundLayer = useUIStore((s) => s.setWwtBackgroundLayer);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);

  const activePreset = useMemo(() => {
    let target: unknown = storeTarget;
    if (typeof target === 'string') {
      try {
        target = JSON.parse(target);
      } catch {
        return presets[0];
      }
    }
    const preset = presets.find((entry) => isRecord(target) && entry.name === target.name) ?? presets[0];
    // Choosing the same target again should recenter the live camera after a manual pan.
    return { ...preset };
  }, [storeTarget]);

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
    () => resolveTelescopePresetCoordinates(activePreset),
    [activePreset],
  );
  const earthReferenceFrame = useMemo(() => projectTelescopeTargetToEarth(
    activePresetCoordinates.raHours,
    activePresetCoordinates.decDegrees,
    coordinateDate,
  ), [activePresetCoordinates, coordinateDate]);

  const viewportSize = useViewportSize();
  const [windowSize, setWindowSize] = useState<'normal' | 'large' | 'minimized'>('minimized');
  const floating = telescopeWindowActive && windowSize !== 'minimized';

  // Floating Space Control Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<'navigator' | 'overlays' | 'imagery' | 'photos'>('navigator');
  const [searchQuery, setSearchQuery] = useState('');
  const [telemetryTimelineCollapsed, setTelemetryTimelineCollapsed] = useState(true);

  const compactViewport = viewportSize.width < 768;
  const panelInsetPx = clampPx(viewportSize.width * 0.22, 160, 360);
  const leftPanelInset = leftPanelOpen && !compactViewport
    ? clampPx(panelInsetPx, 176, 336)
    : clampPx(viewportSize.width * 0.025, 12, 20);
  const rightPanelInset = compactViewport ? 12 :
    rightPanelOpen ? clampPx(panelInsetPx, 180, 344) : clampPx(panelInsetPx * 0.96, 140, 328);

  const workspaceInsets = useMemo(() => ({
    left: leftPanelInset,
    right: rightPanelInset,
    top: clampPx(viewportSize.height * 0.075, 56, 88),
    bottom: telemetryTimelineCollapsed
      ? clampPx(viewportSize.height * 0.11, 84, 108)
      : clampPx(viewportSize.height * 0.205, 132, 206),
  }), [leftPanelInset, rightPanelInset, telemetryTimelineCollapsed, viewportSize.height]);

  const drawerWidth = clampPx(
    Math.min(
      Math.round(viewportSize.width * 0.3),
      Math.round(viewportSize.width - leftPanelInset - rightPanelInset - 24)
    ),
    248,
    360
  );
  const canReserveDrawer = viewportSize.width - leftPanelInset - rightPanelInset >= drawerWidth + 352;
  const drawerReserveWidth = drawerOpen && canReserveDrawer ? drawerWidth + 16 : 0;
  const pipSafeLeft = workspaceInsets.left + drawerReserveWidth + (drawerReserveWidth ? 16 : 0);
  const pipAvailableWidth = Math.max(0, viewportSize.width - pipSafeLeft - workspaceInsets.right);
  const pipAvailableHeight = Math.max(FEED_HEADER_HEIGHT, viewportSize.height - workspaceInsets.top - workspaceInsets.bottom);
  const drawerTopPadding = {
    collapsed: clampPx(viewportSize.height * 0.065, 52, 78),
    expanded: clampPx(viewportSize.height * 0.11, 76, 96),
  };
  const drawerContentReserve = clampPx(viewportSize.height * 0.19, 170, 224);

  const windowPixelDimensions = useMemo(() => ({
    normal: { width: Math.min(480, pipAvailableWidth), height: Math.min(320, pipAvailableHeight) },
    large: { width: Math.min(720, pipAvailableWidth), height: Math.min(480, pipAvailableHeight) },
    minimized: { width: Math.min(320, pipAvailableWidth), height: FEED_HEADER_HEIGHT },
  }), [pipAvailableHeight, pipAvailableWidth]);

  const dim = windowPixelDimensions[windowSize];
  const maxPipX = Math.max(pipSafeLeft, viewportSize.width - workspaceInsets.right - dim.width);
  const maxPipY = Math.max(workspaceInsets.top, viewportSize.height - workspaceInsets.bottom - dim.height);
  const [requestedPosition, setRequestedPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const pos = {
    x: Math.max(pipSafeLeft, Math.min(maxPipX, requestedPosition?.x ?? maxPipX)),
    y: Math.max(workspaceInsets.top, Math.min(maxPipY, requestedPosition?.y ?? maxPipY)),
  };

  const [overlays, setOverlays] = useState(DEFAULT_WWT_OVERLAYS);
  const [customWtml, setCustomWtml] = useState('');
  const scrubTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const forceStaticView = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('fallback');
  const { attempt, collectionStatus, connection, iframeRef, loadCollection, onFrameLoad, retry, send, telemetry } =
    useWwtResearchApp(!forceStaticView);

  const wwtRuntimeHealthy = !forceStaticView && connection === 'ready';
  const showStaticProjection = forceStaticView || connection === 'unavailable';
  const wwtRuntimeState = forceStaticView ? 'Static fallback' : {
    connecting: 'Connecting',
    ready: 'WWT connected',
    unavailable: 'WWT unavailable',
  }[connection];
  const iframeUrl = typeof window === 'undefined' ? WWT_RESEARCH_APP_URL :
    `${WWT_RESEARCH_APP_URL}?origin=${encodeURIComponent(window.location.origin)}`;

  useEffect(() => {
    if (!wwtRuntimeHealthy) return;
    send({ event: 'set_viewer_mode', mode: 'sky' });
    for (const setting of Object.keys(WWT_CONSTELLATION_COLORS) as WwtConstellationColor[]) {
      send({ event: 'setting_set', setting, value: WWT_CONSTELLATION_COLORS[setting] });
    }
  }, [send, wwtRuntimeHealthy]);

  useEffect(() => {
    if (wwtRuntimeHealthy) send({ event: 'set_background_by_name', name: wwtBackgroundLayer });
  }, [send, wwtBackgroundLayer, wwtRuntimeHealthy]);

  useEffect(() => {
    if (!wwtRuntimeHealthy) return;
    send({
      event: 'center_on_coordinates',
      ra: raHoursToDegrees(activePreset.raHours),
      dec: activePreset.decDegrees,
      fov: Number.parseFloat(activePreset.fov),
      instant: false,
    });
  }, [activePreset, send, wwtRuntimeHealthy]);

  useEffect(() => {
    if (!wwtRuntimeHealthy || !safeCurrentTime) return;
    send({ event: 'set_datetime', isot: safeCurrentTime.toISOString() });
  }, [safeCurrentTime, send, wwtRuntimeHealthy]);

  useEffect(() => {
    if (!wwtRuntimeHealthy) return;
    send(isPlaybackMode && !isPlaying
      ? { event: 'pause_time' }
      : { event: 'resume_time', rate: isPlaybackMode ? playbackSpeed : 1 });
  }, [isPlaybackMode, isPlaying, playbackSpeed, send, wwtRuntimeHealthy]);

  useEffect(() => {
    if (!wwtRuntimeHealthy) return;
    for (const setting of Object.keys(overlays) as WwtOverlay[]) {
      send({ event: 'setting_set', setting, value: overlays[setting] });
    }
  }, [overlays, send, wwtRuntimeHealthy]);

  function setOverlay(setting: WwtOverlay, value: boolean) {
    setOverlays((previous) => ({ ...previous, [setting]: value }));
  }

  useEffect(() => () => clearTimeout(scrubTimer.current), []);

  function startDragging(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - pos.x,
      offsetY: event.clientY - pos.y,
    };
  }

  function moveFeed(event: React.PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    setRequestedPosition({ x: event.clientX - start.offsetX, y: event.clientY - start.offsetY });
  }

  function moveFeedWithKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16],
    };
    const offset = movement[event.key];
    if (!offset) return;
    event.preventDefault();
    setRequestedPosition({ x: pos.x + offset[0], y: pos.y + offset[1] });
  }

  const customWtmlValidation = useMemo(() => validateWtmlUrl(customWtml), [customWtml]);

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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetMs = timeStart + Number(e.target.value) * totalMs;
    if (!Number.isFinite(targetMs)) return;
    setCurrentTime(new Date(targetMs));

    // Update plugin windows after the user finishes scrubbing the current range.
    const newRange = { start: new Date(targetMs - totalMs), end: new Date(targetMs) };
    clearTimeout(scrubTimer.current);
    scrubTimer.current = setTimeout(() => {
      setTimeRange(newRange);
      void pluginManager.updateTimeRange(newRange).catch((error: unknown) => {
        console.warn('[WorldWideTelescopeView] Could not update the plugin time range:', error);
      });
    }, 220);
  };

  const renderViewport = () => {
    if (showStaticProjection) {
      return telescopeWindowActive && (
        <Suspense fallback={null}>
          <WwtFallbackView
            activePreset={activePreset}
            activePresetCoordinates={activePresetCoordinates}
            coordinateDate={coordinateDate}
            earthReferenceFrame={earthReferenceFrame}
            floating={floating}
            overlays={overlays}
            wwtRuntimeState={wwtRuntimeState}
          />
        </Suspense>
      );
    }

    return (
      <>
        <iframe
          ref={iframeRef}
          key={attempt}
          src={iframeUrl}
          title="WorldWide Telescope Viewport"
          className={`h-full w-full border-0 ${useSkyGrade ? 'space-sky-survey' : ''}`}
          tabIndex={wwtRuntimeHealthy && telescopeWindowActive ? undefined : -1}
          aria-hidden={!wwtRuntimeHealthy || !telescopeWindowActive}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; fullscreen; gyroscope"
          allowFullScreen
          onLoad={(event) => onFrameLoad(event.currentTarget)}
        />
        {!wwtRuntimeHealthy && telescopeWindowActive && (
          <div role="status" className={`absolute inset-0 flex flex-col items-center justify-center ${useSkyGrade ? 'space-sky-backdrop' : 'bg-black'}`}>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="mt-2 font-mono text-xs uppercase tracking-wider text-primary">
              Connecting to WorldWide Telescope…
            </span>
          </div>
        )}
      </>
    );
  };

  const renderHUDAndTimeline = () => {
    return (
      <div className="fixed inset-0 w-full h-full flex overflow-hidden bg-transparent select-none pointer-events-none">

        <div className="absolute right-[clamp(1rem,4vw,2rem)] top-44 sm:top-[clamp(4.75rem,10vh,6rem)] z-panel w-[min(76vw,18rem)] pointer-events-none">
          <div className="glass-panel-strong border border-primary/15 px-3 py-2 font-mono text-[9px] uppercase tracking-wider shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="text-primary font-bold">Earth Observer Frame</span>
              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold text-primary">Telescope focus</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-white/45">
              <div>
                <span className="block text-white/25">Target</span>
                <span className="block truncate text-white/80">{activePreset.name}</span>
              </div>
              <div>
                <span className="block text-white/25">Subpoint</span>
                <span className="block text-primary">{earthReferenceFrame.latitudeLabel}</span>
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
            {telemetry && (
              <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-white/5 pt-1.5">
                <div>
                  <dt className="text-white/40">Right Ascension</dt>
                  <dd className="text-primary">{formatRA(telemetry.ra)}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Declination</dt>
                  <dd className="text-primary">{formatDec(telemetry.dec)}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Camera Roll</dt>
                  <dd className="text-white/70">{telemetry.roll === null ? '—' : `${telemetry.roll.toFixed(2)}°`}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Field of View</dt>
                  <dd className="text-white/70">{telemetry.fov.toFixed(2)}°</dd>
                </div>
              </dl>
            )}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/5 pt-1.5 text-[7px]">
              <span className="text-white/30">Viewport state</span>
              <span role="status" className={wwtRuntimeHealthy ? 'text-emerald-300' : 'text-amber-300'}>
                {wwtRuntimeState}
              </span>
            </div>
            {!forceStaticView && connection === 'unavailable' && (
              <div className="mt-2 flex flex-wrap gap-2 pointer-events-auto">
                <button type="button" onClick={retry} className="min-h-11 rounded border border-primary/30 px-2 text-primary">
                  Retry WWT connection
                </button>
                <a href={WWT_RESEARCH_APP_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded border border-white/20 px-2 text-white/70">
                  Open WWT
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Space HUD / Controls Panel (Collapsible Drawer on Left) */}
        {telescopeWindowActive && (
          <div
            className="absolute z-floating flex flex-col pointer-events-auto"
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
                          <span className="text-white/40">{earthReferenceFrame.longitudeLabel}</span>
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

                        {OVERLAY_CONTROLS.map(({ setting, id, label, ariaLabel, icon: Icon }) => (
                          <label key={setting} className="flex min-h-11 items-center justify-between gap-3 py-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-primary/70" />
                              <span className="text-white/80">{label}</span>
                            </div>
                            <input
                              id={id}
                              name={id}
                              type="checkbox"
                              aria-label={ariaLabel}
                              checked={overlays[setting]}
                              onChange={event => setOverlay(setting, event.target.checked)}
                              className="h-11 w-11 rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>

                      <div className="p-2 bg-white/5 border border-white/5 rounded text-[8px] text-white/50 leading-relaxed uppercase">
                        {wwtRuntimeHealthy
                          ? 'Constellation configurations update the embedded WorldWide Telescope WebGL render pipeline.'
                          : 'Overlay settings are applied when the research app connects.'}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Background Imagery Layers */}
                  {activeControlTab === 'imagery' && (
                    <div className="space-y-1.5 font-mono">
                      {WWT_BACKGROUND_LAYERS.map(layer => (
                        <button
                          key={layer.value}
                          type="button"
                          onClick={() => setWwtBackgroundLayer(layer.value)}
                            className={`w-full min-h-11 text-left p-2 rounded border transition-all cursor-pointer flex items-center justify-between disabled:cursor-not-allowed disabled:opacity-45 ${
                              layer.value === wwtBackgroundLayer
                                ? 'border-primary/50 bg-primary/10'
                                : 'border-white/5 bg-black/25 hover:border-primary/30'
                            }`}
                        >
                          <div>
                            <div className="text-[10px] text-white/80 font-bold">{layer.label}</div>
                            <div className="text-[8px] text-white/40 mt-0.5">{layer.description}</div>
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
                        <span className="text-[8px] font-bold uppercase tracking-wider text-primary block">WWT Image Collections</span>
                        {PHOTO_COLLECTIONS.map(col => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => loadCollection(`${WWT_CATALOG_URL}?W=${col.id}`)}
                            disabled={!wwtRuntimeHealthy || collectionStatus === 'loading'}
                            className="w-full min-h-11 text-left p-2.5 rounded border border-white/5 bg-black/25 hover:border-primary/30 transition-all cursor-pointer block disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <div className="text-[10px] text-primary font-bold flex items-center justify-between">
                              <span>{col.name}</span>
                              <span className="text-[7.5px] uppercase bg-primary/20 text-primary px-1 py-0.5 rounded">WTML</span>
                            </div>
                            <div className="text-[8px] text-white/50 mt-1 leading-relaxed">{col.description}</div>
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
                          onClick={() => customWtmlValidation.url && loadCollection(customWtmlValidation.url)}
                          disabled={!customWtmlValidation.url || collectionStatus === 'loading' || !wwtRuntimeHealthy}
                          className="min-h-11 w-full rounded border border-primary/30 bg-primary/20 p-2 text-[9px] font-bold text-primary transition-all hover:bg-primary/45 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          Load Custom WTML
                        </button>
                        <div role="status" className="text-white/60">
                          {collectionStatus === 'loading' && 'Loading collection…'}
                          {collectionStatus === 'loaded' && 'WWT confirmed the collection loaded.'}
                          {collectionStatus === 'unconfirmed' && 'WWT did not confirm the collection. Check the URL and retry.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (compactViewport) setWindowSize('minimized');
                  setDrawerOpen(true);
                }}
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
          className={`absolute z-panel pointer-events-auto transition-all duration-200 ${
            telemetryTimelineCollapsed ? 'bottom-2' : 'bottom-4'
          }`}
          style={{
            left: leftPanelOpen ? `calc(${leftPanelInset}px + 1rem)` : 'clamp(1rem, 4vw, 2rem)',
            // right: 'clamp(4.75rem, 8vw, 6rem)'
            right: rightPanelOpen ? `calc(${rightPanelInset}px + 1rem)` : 'clamp(4.75rem, 8vw, 6rem)',
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
              className="absolute left-1/2 top-0 z-content flex min-h-8 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/25 bg-[#0f111a] text-primary shadow-lg transition-colors hover:bg-primary/20 hover:text-white"
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
        {telescopeWindowActive && typeof document !== 'undefined' && createPortal(
          <div
            className="flex flex-col overflow-hidden rounded border border-primary/20 shadow-2xl pointer-events-none fixed z-popover"
            style={{
              left: pos.x,
              top: pos.y,
              width: dim.width,
              height: dim.height,
            }}
          >
            {/* Window Drag Handle Header */}
            <div className="glass-panel flex h-12 shrink-0 items-center justify-between px-3 bg-black/80 border-b border-white/10 select-none pointer-events-auto">
              <button
                type="button"
                aria-label="Move telescope feed with arrow keys"
                onPointerDown={startDragging}
                onPointerMove={moveFeed}
                onLostPointerCapture={() => { dragStart.current = null; }}
                onKeyDown={moveFeedWithKeyboard}
                className="flex h-full min-w-0 grow touch-none cursor-move items-center gap-1.5 text-primary text-[10px] font-mono font-bold uppercase tracking-wider"
              >
                <Radio className="w-3.5 h-3.5 shrink-0 animate-pulse text-cyan-400" />
                <span className="truncate">Stellar Telescope Feed</span>
                {windowSize !== 'minimized' && (
                  <span className="hidden truncate text-[8px] text-white/40 normal-case font-normal ml-2 lg:inline">
                    {activePreset.name}
                  </span>
                )}
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (compactViewport && !floating) setDrawerOpen(false);
                    setWindowSize(floating ? 'minimized' : 'normal');
                  }}
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
                  onClick={retry}
                  className="flex min-h-11 min-w-11 items-center justify-center text-white/40 hover:text-white/85 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                  aria-label="Reload telescope client"
                  title="Reload Telescope Client"
                  disabled={forceStaticView}
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

          </div>,
          document.body
        )}
      </div>
    );
  };

  const viewport = document.getElementById(WWT_VIEWPORT_ID);
  return (
    <>
      {telescopeWindowActive && Boolean(Reflect.get(window, '__triggerTelescopeCrash')) && <CrashComponent />}
      {viewport && createPortal(
        <div
          data-space-layer="sky"
          inert={!telescopeWindowActive}
          className={`absolute isolate overflow-hidden ${useSkyGrade ? 'space-sky-backdrop' : 'bg-black'}
            ${telescopeWindowActive ? 'pointer-events-auto' : 'pointer-events-none'}
            ${!telescopeWindowActive && !wwtRuntimeHealthy ? 'invisible' : ''}
            ${floating ? 'z-[2]' : 'inset-x-0 bottom-0 top-14 z-[0]'}`}
          style={floating
            ? { left: pos.x, top: pos.y + FEED_HEADER_HEIGHT, width: dim.width, height: dim.height - FEED_HEADER_HEIGHT }
            : undefined}
        >
          {renderViewport()}
        </div>,
        viewport
      )}
      {telescopeWindowActive && renderHUDAndTimeline()}
    </>
  );
}
