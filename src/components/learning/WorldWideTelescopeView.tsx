import { useState, useEffect, useRef } from 'react';
import { Sparkles, Compass, Eye, RefreshCw, X, Maximize2, Minimize2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export interface TelescopePreset {
  name: string;
  url: string;
  ra: string;
  dec: string;
  fov: string;
  description: string;
}

export const presets: TelescopePreset[] = [
  {
    name: 'Deep Sky Survey',
    url: 'https://worldwidetelescope.org/webclient/',
    ra: '00h 00m 00s',
    dec: '00° 00\' 00"',
    fov: '60.00°',
    description: 'Panoramic multi-wavelength view of the celestial sphere.',
  },
  {
    name: 'Andromeda Galaxy (M31)',
    url: 'https://worldwidetelescope.org/webclient/?ra=0.712&dec=41.27&fov=3.0',
    ra: '00h 42m 44s',
    dec: '+41° 16\' 09"',
    fov: '3.00°',
    description: 'Our nearest major galactic neighbor, located 2.5 million light-years away.',
  },
  {
    name: 'Orion Nebula (M42)',
    url: 'https://worldwidetelescope.org/webclient/?ra=5.58&dec=-5.38&fov=2.0',
    ra: '05h 35m 17s',
    dec: '-05° 23\' 28"',
    fov: '2.00°',
    description: 'A massive star-forming nursery located in the Orion Constellation.',
  },
  {
    name: 'Pillars of Creation (M16)',
    url: 'https://worldwidetelescope.org/webclient/?ra=18.314&dec=-13.82&fov=0.5',
    ra: '18h 18m 48s',
    dec: '-13° 49\' 12"',
    fov: '0.50°',
    description: 'Eagle Nebula interstellar gas clouds imaged by Hubble/JWST.',
  },
  {
    name: 'Crab Nebula (M1)',
    url: 'https://worldwidetelescope.org/webclient/?ra=5.575&dec=22.01&fov=0.3',
    ra: '05h 34m 32s',
    dec: '+22° 00\' 52"',
    fov: '0.30°',
    description: 'Supernova remnant from the stellar explosion recorded in 1054 AD.',
  },
  {
    name: 'Planet Mars',
    url: 'https://worldwidetelescope.org/webclient/?ra=0&dec=0&fov=60&lookAt=Mars',
    ra: '00h 00m 00s',
    dec: '00° 00\' 00"',
    fov: '60.00°',
    description: 'Orthographic geological surface mapping of the Red Planet.',
  },
  {
    name: 'Planet Jupiter',
    url: 'https://worldwidetelescope.org/webclient/?ra=0&dec=0&fov=60&lookAt=Jupiter',
    ra: '00h 00m 00s',
    dec: '00° 00\' 00"',
    fov: '60.00°',
    description: 'Gas giant atmospheric bands and Jovian satellite orbit tracks.',
  },
];

export default function WorldWideTelescopeView() {
  const telescopeTarget = useUIStore((s) => s.telescopeTarget) || presets[0];
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const [refreshKey, setRefreshKey] = useState(0);

  // Floating PiP Dragging State
  const [pos, setPos] = useState({ x: window.innerWidth - 500, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [windowSize, setWindowSize] = useState<'normal' | 'large' | 'minimized'>('normal');

  const dragStart = useRef({ x: 0, y: 0 });
  const windowStart = useRef({ x: 0, y: 0 });

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
        y: 16
      });
    };
    updateDefaultPos();
    window.addEventListener('resize', updateDefaultPos);
    return () => window.removeEventListener('resize', updateDefaultPos);
  }, [windowSize]);

  const iframeUrl = telescopeTarget.url;

  // Window size CSS styling mapping
  const windowDimensions = {
    normal: { width: '480px', height: '320px' },
    large: { width: '720px', height: '480px' },
    minimized: { width: '320px', height: '38px' }
  };

  const dim = windowDimensions[windowSize];

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-transparent select-none pointer-events-none">
      
      {/* HUD Migration Notice (Top-Left overlay) */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 pointer-events-auto">
        {!useUIStore.getState().leftPanelOpen && (
          <div className="glass-panel p-3 px-4 flex items-center gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2 text-white/80 text-xs font-mono">
              <Compass className="w-4 h-4 text-primary animate-pulse" />
              <span>Controls moved to Spatial HUD</span>
            </div>
            <button
              onClick={() => useUIStore.getState().setLeftPanelOpen(true)}
              className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer"
            >
              Open HUD
            </button>
          </div>
        )}
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="glass-panel p-3 px-4 hover:bg-white/10 text-white/80 hover:text-white transition-colors rounded shadow-lg flex items-center gap-2 text-xs font-bold font-mono cursor-pointer"
          title="Reload Telescope Client"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>Refresh WWT</span>
        </button>
      </div>

      {/* Floating Picture-in-Picture Glass Panel */}
      <div
        className="absolute z-40 glass-panel border border-primary/20 shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-shadow hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb,138,91,199),0.15)]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: dim.width,
          height: dim.height,
          transition: isDragging ? 'none' : 'width 0.3s ease, height 0.3s ease, top 0.3s ease, left 0.3s ease'
        }}
      >
        {/* Titlebar / Drag Handle */}
        <header
          onMouseDown={handleMouseDown}
          className="pip-drag-handle flex h-[38px] shrink-0 items-center justify-between px-3 border-b border-white/5 bg-black/40 cursor-grab active:cursor-grabbing text-white"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-primary glow-pulse shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider truncate">
              WWT PIP Interface: {telescopeTarget.name}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Collapse / Minimized Toggle */}
            <button
              onClick={() => setWindowSize(s => s === 'minimized' ? 'normal' : 'minimized')}
              className="pip-action-btn hover:bg-white/10 p-1 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
              title={windowSize === 'minimized' ? 'Restore Window' : 'Collapse Window'}
            >
              {windowSize === 'minimized' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {/* Normal / Large toggle */}
            {windowSize !== 'minimized' && (
              <button
                onClick={() => setWindowSize(s => s === 'large' ? 'normal' : 'large')}
                className="pip-action-btn hover:bg-white/10 p-1 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
                title={windowSize === 'large' ? 'Shrink Window' : 'Expand Window'}
              >
                {windowSize === 'large' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            )}

            {/* External link */}
            <a
              href={iframeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pip-action-btn hover:bg-white/10 p-1 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Open full page telescope client"
            >
              <ExternalLink size={14} />
            </a>

            {/* Close pip / return to orbital mode */}
            <button
              onClick={() => setInteractionMode('orbital')}
              className="pip-action-btn hover:bg-red-500/20 hover:text-red-400 p-1 rounded text-white/50 transition-colors cursor-pointer"
              title="Exit Telescope View"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* Viewport Frame Container */}
        {windowSize !== 'minimized' && (
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {window.location.search.includes('fallback') ? (
              <div className="text-primary font-mono text-[9px] text-center p-6 border border-primary/20 bg-primary/10 rounded-lg max-w-[85%] space-y-2 pointer-events-auto select-text uppercase">
                <div className="font-bold tracking-wider text-primary">Celestial Target Synchronized</div>
                <div className="text-white/60">Target: {telescopeTarget.name}</div>
                <div className="text-white/40 text-[7px] break-all lowercase">{iframeUrl}</div>
              </div>
            ) : (
              <iframe
                key={`${telescopeTarget.name}-${refreshKey}`}
                src={iframeUrl}
                title="WorldWide Telescope PIP Window"
                className="w-full h-full border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            
            {/* Luminous Vignette Mask for Space Opera feel */}
            <div className="absolute inset-0 pointer-events-none border border-primary/5 shadow-[inset_0_0_40px_rgba(var(--color-primary-rgb,138,91,199),0.04)]" />
          </div>
        )}
      </div>

    </div>
  );
}
