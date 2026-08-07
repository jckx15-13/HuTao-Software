import type { TelescopePreset as UITelescopePreset } from '@/store/uiStore';

export interface TelescopePreset extends UITelescopePreset {
  id: string;
  raHours: number;
  decDegrees: number;
  color: string;
}

export interface ResolvedTelescopeCoordinates {
  raHours: number;
  decDegrees: number;
  ra: string;
  dec: string;
  source: 'fixed-catalog';
}

// Planet targets (Mercury..Neptune) were removed: this view is a fixed vantage
// between Earth and the Moon, not a solar-system navigator, so "fly to and
// zoom into a planet" is intentionally out of scope. All remaining presets
// resolve from the fixed deep-sky catalog below. `date` is kept as a parameter
// for call-site compatibility even though this catalog path ignores it.
export function resolveTelescopePresetCoordinates(
  preset: TelescopePreset,
  _date: Date = new Date()
): ResolvedTelescopeCoordinates {
  return {
    raHours: preset.raHours,
    decDegrees: preset.decDegrees,
    ra: preset.ra,
    dec: preset.dec,
    source: 'fixed-catalog'
  };
}

export const TELESCOPE_PRESETS: TelescopePreset[] = [
  {
    id: 'deep-sky-survey',
    name: 'Deep Sky Survey',
    url: 'https://worldwidetelescope.org/webclient/',
    ra: '00h 00m 00s',
    dec: '00° 00\' 00"',
    fov: '60.00°',
    description: 'Panoramic multi-wavelength view of the celestial sphere.',
    raHours: 0,
    decDegrees: 0,
    color: '#88d2ff'
  },
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy (M31)',
    url: 'https://worldwidetelescope.org/webclient/?ra=0.712&dec=41.27&fov=3.0',
    ra: '00h 42m 44s',
    dec: '+41° 16\' 09"',
    fov: '3.00°',
    description: 'Our nearest major galactic neighbor, located 2.5 million light-years away.',
    raHours: 0.712,
    decDegrees: 41.27,
    color: '#FF00AA'
  },
  {
    id: 'orion',
    name: 'Orion Nebula (M42)',
    url: 'https://worldwidetelescope.org/webclient/?ra=5.58&dec=-5.38&fov=2.0',
    ra: '05h 35m 17s',
    dec: '-05° 23\' 28"',
    fov: '2.00°',
    description: 'A massive star-forming nursery located in the Orion Constellation.',
    raHours: 5.58,
    decDegrees: -5.38,
    color: '#FF5500'
  },
  {
    id: 'pillars-of-creation',
    name: 'Pillars of Creation (M16)',
    url: 'https://worldwidetelescope.org/webclient/?ra=18.314&dec=-13.82&fov=0.5',
    ra: '18h 18m 48s',
    dec: '-13° 49\' 12"',
    fov: '0.50°',
    description: 'Eagle Nebula interstellar gas clouds imaged by Hubble/JWST.',
    raHours: 18.314,
    decDegrees: -13.82,
    color: '#00FFCC'
  },
  {
    id: 'crab-nebula',
    name: 'Crab Nebula (M1)',
    url: 'https://worldwidetelescope.org/webclient/?ra=5.575&dec=22.01&fov=0.3',
    ra: '05h 34m 32s',
    dec: '+22° 00\' 52"',
    fov: '0.30°',
    description: 'Supernova remnant from the stellar explosion recorded in 1054 AD.',
    raHours: 5.575,
    decDegrees: 22.01,
    color: '#FFAA00'
  },
  {
    id: 'ring-nebula',
    name: 'Ring Nebula (M57)',
    url: 'https://worldwidetelescope.org/webclient/?ra=18.885&dec=33.03&fov=0.15',
    ra: '18h 53m 35s',
    dec: '+33° 01\' 45"',
    fov: '0.15°',
    description: 'Archetypal planetary nebula in the Lyra constellation formed by a dying star.',
    raHours: 18.885,
    decDegrees: 33.03,
    color: '#E5C158'
  },
  {
    id: 'sombrero-galaxy',
    name: 'Sombrero Galaxy (M104)',
    url: 'https://worldwidetelescope.org/webclient/?ra=12.667&dec=-11.62&fov=0.25',
    ra: '12h 39m 59s',
    dec: '-11° 37\' 23"',
    fov: '0.25°',
    description: 'Unusually large central bulge and prominent dark dust lane in Virgo.',
    raHours: 12.667,
    decDegrees: -11.62,
    color: '#A370F7'
  },
  {
    id: 'pleiades',
    name: 'Pleiades Star Cluster (M45)',
    url: 'https://worldwidetelescope.org/webclient/?ra=3.78&dec=24.1&fov=2.5',
    ra: '03h 47m 00s',
    dec: '+24° 06\' 00"',
    fov: '2.50°',
    description: 'Bright open cluster of blue B-type stars in Taurus, enveloped in reflection nebulae.',
    raHours: 3.78,
    decDegrees: 24.1,
    color: '#5BFFD2'
  }
];
