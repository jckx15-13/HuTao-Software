import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, Compass, Eye, RefreshCw, X, Maximize2, Minimize2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink, Play, Pause,
  Calendar, Clock, Image as ImageIcon, Layers, Search,
  MapPin, Grid, Plus, Check, Info, Radio, Star
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { TELESCOPE_PRESETS as presets } from '@/data/telescopePresets';
import TimelineLanes from './TimelineLanes';
import { pluginManager } from '@/core/plugins/PluginManager';
import { useCameraSync } from '@/hooks/useCameraSync';
import { useWWTListener } from '@/hooks/useWWTListener';
import { formatRA, formatDec } from '@/lib/coordinateTransforms';

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

function CrashComponent(): any {
  throw new Error("Simulated Telescope Crash");
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
  const telescopeTelemetry = useUIStore((s) => s.telescopeTelemetry);
  const syncSource = useUIStore((s) => s.syncSource);
  const [refreshKey, setRefreshKey] = useState(0);

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
  const safeCurrentTime = useMemo(() => parseDateSafe(currentTime) || null, [currentTime]);

  // Floating PiP Dragging State
  // Floating PiP Dragging State (guard window for SSR safety)
  const getDefaultPos = () => ({ x: typeof window !== 'undefined' ? window.innerWidth - 500 : 500, y: 16 });
  const [pos, setPos] = useState(getDefaultPos());
  const [isDragging, setIsDragging] = useState(false);
  const [windowSize, setWindowSize] = useState<'normal' | 'large' | 'minimized'>('normal');

  const dragStart = useRef({ x: 0, y: 0 });
  const windowStart = useRef({ x: 0, y: 0 });

  // Floating Space Control Drawer State
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeControlTab, setActiveControlTab] = useState<'navigator' | 'overlays' | 'imagery' | 'photos'>('navigator');
  const [searchQuery, setSearchQuery] = useState('');

  // WWT Settings States
  const [showConstellationFigures, setShowConstellationFigures] = useState(false);
  const [showConstellationLines, setShowConstellationLines] = useState(true);
  const [showConstellationBoundries, setShowConstellationBoundries] = useState(false); // WWT typo mapped
  const [showConstellationSelection, setShowConstellationSelection] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Custom WTML loader state
  const [customWtml, setCustomWtml] = useState('');
  const [wtmlStatus, setWtmlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Iframe reference
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Iframe loading / connection state
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Post message to WWT iframe helper — with full error handling
  const postToWWT = (message: any) => {
    if (controlsOnly && typeof window !== 'undefined' && (window as any).postToWWTBackground) {
      (window as any).postToWWTBackground(message);
      return;
    }
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;
      let targetOrigin = '*';
      try {
        const url = new URL(String(telescopeTarget?.url || ''));
        targetOrigin = url.origin;
      } catch (e) {
        // fallback to wildcard origin
      }
      // Prefer wildcard when running on localhost/127.0.0.1 to avoid noisy
      // postMessage origin warnings during development or when iframe hasn't
      // fully loaded yet.
      if (typeof window !== 'undefined' && (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.hostname === '0.0.0.0')) {
        targetOrigin = '*';
      }

      // If the iframe's actual src origin differs from computed target origin,
      // prefer using wildcard to avoid repeated console warnings. Log a single
      // diagnostic to help triage the mismatch.
      try {
        const src = iframeRef.current.getAttribute?.('src') || iframeRef.current.src || '';
        let actualOrigin = '';
        try { actualOrigin = src ? new URL(src).origin : ''; } catch (e) { actualOrigin = ''; }

        if (actualOrigin && targetOrigin !== '*' && actualOrigin !== targetOrigin) {
          // Record diagnostic once per mismatch to avoid spam
          if (!(postToWWT as any)._warnedMismatch) {
            (postToWWT as any)._warnedMismatch = true;
            try {
              (globalThis as any).useDiagnosticsStore?.getState?.().add?.({
                level: 'warning',
                message: 'WWT iframe origin mismatch detected',
                suggestion: `Iframe src origin ${actualOrigin} differs from telescope target origin ${targetOrigin}. Using wildcard postMessage to avoid console spam.`,
                metadata: { component: 'WorldWideTelescopeView', actualOrigin, targetOrigin }
              });
            } catch (e) {
              // ignore diagnostics failures
            }
          }
          // Use wildcard to avoid the browser warning
          targetOrigin = '*';
        }
      } catch (e) {
        // best-effort only
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
        ra: activePreset.raHours,
        dec: activePreset.decDegrees,
        fov: parseFloat(activePreset.fov) || 1.0,
        instant: false
      });
      useUIStore.getState().addChangeLog('TELESCOPE', `Telescope panned to ${activePreset.name} (RA: ${activePreset.ra}, DEC: ${activePreset.dec})`, 'success');
    }
  }, [activePreset, refreshKey]);

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

      const nextX = Math.max(16, Math.min(window.innerWidth - 180, windowStart.current.x + dx));
      const nextY = Math.max(16, Math.min(window.innerHeight - 80, windowStart.current.y + dy));

      setPos({ x: nextX, y: nextY });
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
  }, [isDragging]);

  // Recalculate default pos on mount & window resize
  useEffect(() => {
    const updateDefaultPos = () => {
      setPos({
        x: window.innerWidth - (windowSize === 'large' ? 740 : windowSize === 'minimized' ? 340 : 500),
        y: 80
      });
    };
    updateDefaultPos();
    window.addEventListener('resize', updateDefaultPos);
    return () => window.removeEventListener('resize', updateDefaultPos);
  }, [windowSize]);

  // Iframe load and error handlers
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  // Connection watchdog — if iframe doesn't load within 15s, show degraded state
  useEffect(() => {
    if (window.location.search.includes('fallback')) return;
    setIframeLoaded(false);
    setIframeError(false);
    watchdogTimerRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setIframeError(true);
        console.warn('[WorldWideTelescopeView] WWT iframe failed to load within 15 seconds');
        useUIStore.getState().addChangeLog('TELESCOPE', 'WWT connection timed out — showing degraded mode', 'warning');
      }
    }, 15000);

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, [refreshKey, telescopeTarget?.url]);

  // Load WTML collection event trigger
  const handleLoadCollection = (url: string, name: string) => {
    if (!url) return;
    setWtmlStatus('loading');
    try {
      postToWWT({
        event: 'load_image_collection',
        url: url
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
    postToWWT({
      event: 'set_background_by_name',
      name: layerName
    });
    useUIStore.getState().addChangeLog('TELESCOPE', `Background imagery array set to: ${layerName}`, 'info');
  };

  // Register window callbacks in background mode for communication from controls
  useEffect(() => {
    if (bgOnly && typeof window !== 'undefined') {
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

  const iframeUrl = typeof telescopeTarget?.url === 'string' && telescopeTarget.url.length > 0 ? telescopeTarget.url : 'https://worldwidetelescope.org/webclient/';
  const safeIframeUrl = isValidUrl(iframeUrl) ? iframeUrl : null;

  // Window size CSS styling mapping
  const windowDimensions = {
    normal: { width: '480px', height: '320px' },
    large: { width: '720px', height: '480px' },
    minimized: { width: '320px', height: '38px' }
  };

  const dim = windowDimensions[windowSize];

  // Search filter for presets
  const filteredPresets = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return presets;
    return presets.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  }, [searchQuery]);

  // Time metrics calculations
  const timeStart = useMemo(() => {
    const s = parseDateSafe(timeRange?.start);
    if (s) return s.getTime();
    return Date.now() - 86400000;
  }, [timeRange]);

  const timeEnd = useMemo(() => {
    const e = parseDateSafe(timeRange?.end);
    if (e) return e.getTime();
    return Date.now();
  }, [timeRange]);

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
    if (window.location.search.includes('fallback')) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05070a] overflow-hidden">
          {/* Simulated Starfield Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 2}px`,
                  height: `${Math.random() * 2}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* Constellation Schematic Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-primary fill-none stroke-current stroke-[0.2]">
              <path d="M 20 20 L 40 30 L 60 20 M 40 30 L 40 60 L 20 80 M 40 60 L 70 70" />
              <circle cx="20" cy="20" r="0.5" className="fill-current stroke-none" />
              <circle cx="40" cy="30" r="0.5" className="fill-current stroke-none" />
              <circle cx="60" cy="20" r="0.5" className="fill-current stroke-none" />
              <circle cx="40" cy="60" r="0.5" className="fill-current stroke-none" />
              <circle cx="20" cy="80" r="0.5" className="fill-current stroke-none" />
              <circle cx="70" cy="70" r="0.5" className="fill-current stroke-none" />
            </svg>
          </div>

          <div className="text-primary font-mono text-[9px] text-center p-6 border border-primary/20 bg-primary/10 rounded-lg max-w-[85%] space-y-2 pointer-events-auto select-text uppercase relative z-10 backdrop-blur-md">
            <div className="font-bold tracking-wider text-primary">Celestial Target Synchronized</div>
            <div className="text-white/60">Target: {telescopeTarget.name}</div>
            <div className="text-white/40 text-[7px] break-all lowercase">{iframeUrl}</div>
            <div className="mt-4 pt-4 border-t border-primary/10 text-[7px] text-primary/50">
              Fallback mode active: Starfield telemetry simulated via constellation schematic
            </div>
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
            Unable to reach WorldWide Telescope servers. Check your internet connection or try again.
          </div>
          <div className="text-white/30 font-mono text-[7px] break-all lowercase">{safeIframeUrl || String(iframeUrl)}</div>
          <button
            onClick={() => { setIframeError(false); setIframeLoaded(false); setRefreshKey(k => k + 1); }}
            className="mt-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-1.5 rounded text-[9px] font-bold font-mono uppercase transition-all cursor-pointer pointer-events-auto z-20"
          >
            Retry Connection
          </button>
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
            className={`w-full h-full border-0 transition-all ${
              spaceInteractionTarget === 'telescope' ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
              className="mt-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-1.5 rounded text-[9px] font-bold font-mono uppercase transition-all cursor-pointer pointer-events-auto"
            >
              Retry
            </button>
          </div>
        )}
      </>
    );
  };

  const renderHUDAndTimeline = () => {
    return (
      <div className="absolute inset-0 w-full h-full flex overflow-hidden bg-transparent select-none pointer-events-none">
        
        {/* --- Real-time Telescope Telemetry Overlay --- */}
        {telescopeTelemetry && (
          <div className="absolute top-4 right-4 z-50 pointer-events-auto">
            <div className="glass-panel border border-primary/20 p-2.5 px-4 font-mono text-[9px] uppercase tracking-wider space-y-1 shadow-xl">
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

        {/* Space HUD / Controls Panel (Collapsible Drawer on Left) */}
        {spaceInteractionTarget === 'telescope' && (
          <div className="absolute top-24 left-4 z-40 flex flex-col pointer-events-auto max-h-[calc(100%-185px)]">
            {drawerOpen ? (
              <div className="glass-panel w-[320px] flex flex-col border border-primary/20 overflow-hidden shadow-2xl animate-slide-in">
                {/* Drawer Header */}
                <div className="flex h-10 items-center justify-between px-3 bg-black/40 border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 glow-pulse animate-spin-slow" />
                    <span>Space Array Control</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRefreshKey(k => k + 1)}
                      className="text-white/40 hover:text-white/80 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                      title="Refresh WWT Client"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="text-white/40 hover:text-white/80 p-1 hover:bg-white/5 rounded cursor-pointer transition-colors"
                      title="Collapse Panel"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>

                {/* Tab Selectors */}
                <div className="flex bg-black/20 border-b border-white/5 p-1 gap-1 text-[9px] font-mono">
                  <button
                    onClick={() => setActiveControlTab('navigator')}
                    className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${activeControlTab === 'navigator' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Navigator
                  </button>
                  <button
                    onClick={() => setActiveControlTab('overlays')}
                    className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${activeControlTab === 'overlays' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Overlays
                  </button>
                  <button
                    onClick={() => setActiveControlTab('imagery')}
                    className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${activeControlTab === 'imagery' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Imagery
                  </button>
                  <button
                    onClick={() => setActiveControlTab('photos')}
                    className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${activeControlTab === 'photos' ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Photos
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 scroller max-h-[300px]">
                  {/* Tab 1: Celestial Navigator */}
                  {activeControlTab === 'navigator' && (
                    <div className="space-y-2.5">
                      <div className="relative flex items-center bg-black/40 border border-white/5 rounded px-2 text-white/50">
                        <Search className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                        <input
                          id="wwt-search-targets"
                          name="wwt-search-targets"
                          type="text"
                          placeholder="Search targets..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="bg-transparent border-none text-[10px] py-1.5 w-full text-white/80 focus:outline-none placeholder:text-white/20 font-mono"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-white/10 rounded cursor-pointer text-white/40">
                            <X size={10} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {filteredPresets.map(preset => {
                          const isActive = activePreset.id === preset.id;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setTelescopeTarget(preset);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg border flex items-start gap-2.5 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-primary/10 border-primary/40 shadow-[inset_0_0_12px_color-mix(in_srgb,var(--theme-primary)_10%,transparent)]'
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

                        <label className="flex items-center justify-between py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Grid className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Celestial Grid Lines</span>
                          </div>
                          <input
                            id="wwt-grid-lines"
                            name="wwt-grid-lines"
                            type="checkbox"
                            checked={showGrid}
                            onChange={e => setShowGrid(e.target.checked)}
                            className="rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer w-3.5 h-3.5"
                          />
                        </label>

                        <label className="flex items-center justify-between py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Stick Figures</span>
                          </div>
                          <input
                            id="wwt-constellation-lines"
                            name="wwt-constellation-lines"
                            type="checkbox"
                            checked={showConstellationLines}
                            onChange={e => setShowConstellationLines(e.target.checked)}
                            className="rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer w-3.5 h-3.5"
                          />
                        </label>

                        <label className="flex items-center justify-between py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Artistic Art</span>
                          </div>
                          <input
                            id="wwt-constellation-art"
                            name="wwt-constellation-art"
                            type="checkbox"
                            checked={showConstellationFigures}
                            onChange={e => setShowConstellationFigures(e.target.checked)}
                            className="rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer w-3.5 h-3.5"
                          />
                        </label>

                        <label className="flex items-center justify-between py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Boundaries</span>
                          </div>
                          <input
                            id="wwt-constellation-boundaries"
                            name="wwt-constellation-boundaries"
                            type="checkbox"
                            checked={showConstellationBoundries}
                            onChange={e => setShowConstellationBoundries(e.target.checked)}
                            className="rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer w-3.5 h-3.5"
                          />
                        </label>

                        <label className="flex items-center justify-between py-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-white/80">Constellation Selection Highlight</span>
                          </div>
                          <input
                            id="wwt-constellation-selection"
                            name="wwt-constellation-selection"
                            type="checkbox"
                            checked={showConstellationSelection}
                            onChange={e => setShowConstellationSelection(e.target.checked)}
                            className="rounded border-white/10 bg-black text-primary focus:ring-primary/40 cursor-pointer w-3.5 h-3.5"
                          />
                        </label>
                      </div>

                      <div className="p-2 bg-white/5 border border-white/5 rounded text-[8px] text-white/50 leading-relaxed uppercase">
                        Constellation configurations update the embedded WorldWide Telescope WebGL render pipeline in real-time.
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
                          className="w-full text-left p-2 rounded border border-white/5 bg-black/25 hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between"
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
                            className="w-full text-left p-2.5 rounded border border-white/5 bg-black/25 hover:border-primary/30 transition-all cursor-pointer block"
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
                          className="w-full bg-black/45 border border-white/5 rounded p-1.5 text-[9px] text-white/80 focus:outline-none placeholder:text-white/20 select-text"
                        />
                        <button
                          onClick={() => handleLoadCollection(customWtml, 'Custom Collection')}
                          disabled={!customWtml || wtmlStatus === 'loading'}
                          className="w-full bg-primary/20 hover:bg-primary/45 text-primary border border-primary/30 p-1.5 rounded text-[9px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {wtmlStatus === 'loading' ? 'Ingesting...' :
                           wtmlStatus === 'success' ? 'Ingested Successfully' :
                           wtmlStatus === 'error' ? 'Ingestion Failed' : 'Load Custom WTML'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="glass-panel p-3 px-4 hover:bg-white/10 text-white/80 hover:text-white transition-colors rounded shadow-lg flex items-center gap-2 text-xs font-bold font-mono cursor-pointer border border-primary/20"
                title="Expand Control Panel"
              >
                <Compass className="w-4 h-4 text-primary animate-pulse" />
                <span>Show Space Array controls</span>
              </button>
            )}
          </div>
        )}

        {/* Floating Telemetry Timeline Playback Controller (Bottom Center) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-[620px] max-w-[95vw]">
          <div className="glass-panel border border-primary/20 shadow-2xl p-3 px-5 flex flex-col gap-2 font-mono text-white text-[10px]">

            {/* Timeline Header Row */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaybackMode(!isPlaybackMode)}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold border transition-all cursor-pointer ${
                    isPlaybackMode
                      ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'
                      : 'border-green-500/30 bg-green-950/20 text-green-400'
                  }`}
                  title="Toggle Live vs Recorded Playback Mode"
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaybackMode ? 'bg-cyan-400' : 'bg-green-400 animate-pulse'}`} />
                    <span>{isPlaybackMode ? 'PLAYBACK MODE' : 'LIVE TELEMETRY'}</span>
                  </div>
                </button>

                {isPlaybackMode && (
                  <button
                    onClick={() => setPlaying(!isPlaying)}
                    className="flex items-center justify-center p-1 rounded hover:bg-white/5 text-primary hover:text-primary-hover cursor-pointer"
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
                    min="0"
                    max="1"
                    step="0.0001"
                    value={progressPct}
                    onChange={handleSliderChange}
                    disabled={!isPlaybackMode}
                    className="w-full h-1 bg-black/45 border border-white/5 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(to right, var(--theme-primary) 0%, var(--theme-primary) ${progressPct * 100}%, rgba(255,255,255,0.05) ${progressPct * 100}%, rgba(255,255,255,0.05) 100%)`
                    }}
                  />
                  <span className="text-[8px] text-white/30">NOW</span>
                </div>

                {isPlaybackMode && (
                  <div className="flex items-center gap-1 bg-black/30 border border-white/5 p-0.5 rounded text-[8px]">
                    {['1', '10', '100', '1000'].map(spd => {
                      const s = parseInt(spd);
                      const isSpeed = playbackSpeed === s;
                      return (
                        <button
                          key={spd}
                          onClick={() => setPlaybackSpeed(s)}
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                            isSpeed ? 'bg-primary/20 text-primary font-bold' : 'text-white/40 hover:text-white/70'
                          }`}
                        >
                          {spd}x
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Branch return statements
  if (bgOnly) {
    return (
      <div className="absolute inset-0 w-full h-full bg-black select-none pointer-events-none">
        {typeof window !== 'undefined' && (window as any).__triggerTelescopeCrash && <CrashComponent />}
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          {renderIframe()}
        </div>
      </div>
    );
  }

  if (controlsOnly) {
    return renderHUDAndTimeline();
  }

  // Fallback: render both side-by-side / overlayed if no props passed (for safety)
  return (
    <div className="relative w-full h-full flex overflow-hidden bg-transparent select-none pointer-events-none">
      <div className="absolute inset-0 z-0">
        {renderIframe()}
      </div>
      {renderHUDAndTimeline()}
    </div>
  );
}
