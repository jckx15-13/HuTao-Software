import { useState } from 'react';
import { Sparkles, Compass, Eye, Space, Info, RefreshCw, Star } from 'lucide-react';
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
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeUrl = telescopeTarget.url;

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-black select-none pointer-events-auto">
      
      {/* 3D Celestial Sky/Planet Viewport */}
      <div className="relative flex-1 h-full bg-black flex items-center justify-center">
        {window.location.search.includes('fallback') ? (
          <div className="text-primary font-mono text-[10px] text-center p-8 border border-primary/20 bg-primary/10 rounded-lg max-w-md space-y-2">
            <div className="font-bold uppercase tracking-wider text-primary">Celestial Target Locked</div>
            <div className="text-white/60">Target ID: {telescopeTarget.name}</div>
            <div className="text-white/40 text-[8px] break-all">{iframeUrl}</div>
          </div>
        ) : (
          <iframe
            key={`${telescopeTarget.name}-${refreshKey}`}
            src={iframeUrl}
            title="WorldWide Telescope Web Client"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        
        {/* Luminous Vignette Mask for Space Opera feel */}
        <div className="absolute inset-0 pointer-events-none border border-primary/10 shadow-[inset_0_0_100px_rgba(var(--color-primary-rgb,138,91,199),0.06)]" />
      </div>
    </div>
  );
}
