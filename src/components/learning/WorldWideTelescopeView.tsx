import { useState } from 'react';
import { Sparkles, Compass, Eye, Space, Info, RefreshCw, Star } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

interface TelescopePreset {
  name: string;
  url: string;
  ra: string;
  dec: string;
  fov: string;
  description: string;
}

const presets: TelescopePreset[] = [
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
  const [activePreset, setActivePreset] = useState<TelescopePreset>(presets[0]);
  const [iframeUrl, setIframeUrl] = useState(presets[0].url);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectPreset = (preset: TelescopePreset) => {
    setActivePreset(preset);
    setIframeUrl(preset.url);
    useUIStore.getState().addChangeLog('TELESCOPE', `Telescope target pointed: ${preset.name}`, 'success');
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    useUIStore.getState().addChangeLog('TELESCOPE', 'Telescope interface matrix refreshed.', 'info');
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden bg-black select-none pointer-events-auto">
      
      {/* 3D Celestial Sky/Planet Viewport */}
      <div className="relative flex-1 h-full bg-black flex items-center justify-center">
        {window.location.search.includes('fallback') ? (
          <div className="text-cyan-400 font-mono text-[10px] text-center p-8 border border-cyan-500/20 bg-cyan-950/10 rounded-lg max-w-md space-y-2">
            <div className="font-bold uppercase tracking-wider text-cyan-300">Celestial Target Locked</div>
            <div className="text-white/60">Target ID: {activePreset.name}</div>
            <div className="text-white/40 text-[8px] break-all">{iframeUrl}</div>
          </div>
        ) : (
          <iframe
            key={`${activePreset.name}-${refreshKey}`}
            src={iframeUrl}
            title="WorldWide Telescope Web Client"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        
        {/* Luminous Vignette Mask for Space Opera feel */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/10 shadow-[inset_0_0_100px_rgba(0,255,247,0.06)]" />
      </div>

      {/* Cybernetic Telemetry controls sidepanel */}
      <aside className="w-full md:w-[260px] bg-[#06070a]/90 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/5 p-4 flex flex-col font-mono text-[9px] gap-4 z-20 shrink-0">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-widest uppercase">
            <Compass className="h-4 w-4 animate-spin-slow" />
            <span>WWT STAR ARRAY</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 hover:bg-white/5 text-white/40 hover:text-white/80 rounded transition-colors"
            title="Realign Celestial Array"
          >
            <RefreshCw size={11} />
          </button>
        </div>

        {/* Telemetry Matrix Readout */}
        <div className="glass-panel p-2.5 border border-cyan-500/10 space-y-2 rounded-lg bg-cyan-950/5">
          <div className="text-[10px] font-bold text-white/80 uppercase">Target Coordinates</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-white/50 text-[8px]">
            <div>
              <span className="text-white/20 block uppercase">Right Ascension</span>
              <span className="text-cyan-300 font-bold">{activePreset.ra}</span>
            </div>
            <div>
              <span className="text-white/20 block uppercase">Declination</span>
              <span className="text-cyan-300 font-bold">{activePreset.dec}</span>
            </div>
            <div className="col-span-2">
              <span className="text-white/20 block uppercase">Field of View</span>
              <span className="text-white/80 font-bold">{activePreset.fov}</span>
            </div>
          </div>
        </div>

        {/* Target Presets Grid */}
        <div className="flex-1 flex flex-col min-h-0 gap-2">
          <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Point Coordinates to Array</span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scroller">
            {presets.map((preset) => {
              const isActive = activePreset.name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-2 rounded border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                    isActive
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold'
                      : 'border-white/5 bg-white/5 text-white/60 hover:border-white/10 hover:text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Star className={`h-3 w-3 shrink-0 ${isActive ? 'fill-cyan-400 text-cyan-400' : 'text-white/20'}`} />
                    <span className="truncate uppercase text-[8px]">{preset.name}</span>
                  </div>
                  <span className="text-[7px] text-white/30 shrink-0 font-normal">{preset.fov}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected target synopsis */}
        <div className="p-2.5 rounded-lg border border-white/5 bg-black/35 leading-relaxed text-white/40 text-[8px] uppercase">
          <div className="font-bold text-white/70 mb-1 flex items-center gap-1">
            <Info size={10} className="text-cyan-400" />
            <span>Synopsis</span>
          </div>
          {activePreset.description}
        </div>
        
      </aside>
    </div>
  );
}
