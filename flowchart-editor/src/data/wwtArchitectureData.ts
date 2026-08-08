export interface WwtGraphNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'wwt' | 'adapter' | 'swvi';
  layer: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WwtGraphEdge {
  from: string;
  to: string;
  label?: string;
  implemented?: boolean;
}

export const wwtArchitectureNodes: WwtGraphNode[] = [
  // Layer 1: Remote WebGL Engine & All-Sky Surveys (Y: 40)
  { id: 'w1_engine', label: 'web.wwtassets.org/research/latest/', sublabel: 'AAS HTML5 WebGL Research Engine Shell', category: 'wwt', layer: 'WebGL Engine', x: 40, y: 40, width: 310, height: 56 },
  { id: 'w1_surveys', label: 'Multi-Spectrum Survey Datasets', sublabel: 'DSS Visible, Chandra X-Ray, Planck, Radio VLSS', category: 'wwt', layer: 'WebGL Engine', x: 410, y: 40, width: 310, height: 56 },
  { id: 'w1_grid', label: 'J2000 Celestial Reference Frame', sublabel: '3D Solar System Ephemeris & Equatorial Grid', category: 'wwt', layer: 'WebGL Engine', x: 780, y: 40, width: 310, height: 56 },

  // Layer 2: postMessage Command & Telemetry Protocol (Y: 140)
  { id: 'w2_outbound', label: 'Outbound postMessage Protocol', sublabel: 'set_view, load_background, set_fov Commands', category: 'wwt', layer: 'Bridge Protocol', x: 40, y: 140, width: 310, height: 56 },
  { id: 'w2_inbound', label: 'wwt_view_state Telemetry Broadcast', sublabel: '60 FPS Broadcast (RA, Dec, FOV, Roll, Target)', category: 'wwt', layer: 'Bridge Protocol', x: 410, y: 140, width: 310, height: 56 },
  { id: 'w2_listener', label: 'src/hooks/useWWTListener.ts', sublabel: 'Anti-Loop Mutex (syncSource) & 32ms Throttle', category: 'adapter', layer: 'Bridge Protocol', x: 780, y: 140, width: 310, height: 56 },

  // Layer 3: Astrodynamics & Celestial Math Matrix (Y: 240)
  { id: 'w3_precession', label: 'src/lib/coordinateTransforms.ts', sublabel: 'IAU 1976 Precession & IAU 2000 ERA Sidereal Time', category: 'adapter', layer: 'Celestial Math', x: 40, y: 240, width: 310, height: 56 },
  { id: 'w3_fov_engine', label: 'src/hooks/useCameraSync.ts', sublabel: 'Exact Horizon FOV Engine = 2*arcsin(Re / (Re+H))', category: 'adapter', layer: 'Celestial Math', x: 410, y: 240, width: 310, height: 56 },
  { id: 'w3_sgp4', label: 'src/core/satellites/OrbitEngine.ts', sublabel: 'SGP4 Real-Time Satellite Trajectory Propagator', category: 'adapter', layer: 'Celestial Math', x: 780, y: 240, width: 310, height: 56 },

  // Layer 4: UI Containers & HUD Controls (Y: 340)
  { id: 'w4_view_host', label: 'WorldWideTelescopeView.tsx', sublabel: 'WebGL View Host & PiP Window Manager', category: 'swvi', layer: 'UI Containers', x: 40, y: 340, width: 310, height: 56 },
  { id: 'w4_presets', label: 'src/data/telescopePresets.ts', sublabel: 'Deep-Sky Astronomical Survey Catalog Mapper', category: 'swvi', layer: 'UI Containers', x: 410, y: 340, width: 310, height: 56 },
  { id: 'w4_hud_pill', label: 'SpaceHudPillControls.tsx', sublabel: 'Docked Space HUD Pill Control Strip', category: 'swvi', layer: 'UI Containers', x: 780, y: 340, width: 310, height: 56 },

  // Layer 5: Temporal Timeline & Globe Synchronization (Y: 440)
  { id: 'w5_timeline', label: 'src/components/learning/TimelineLanes.tsx', sublabel: 'Multi-Lane Timeline Scrubber & Speed Control', category: 'swvi', layer: 'Synchronization', x: 410, y: 440, width: 310, height: 56 },
];

export const wwtArchitectureEdges: WwtGraphEdge[] = [
  // Interconnected Bridge & Math Flow
  { from: 'w1_engine', to: 'w2_inbound', label: 'Telemetry Event', implemented: true },
  { from: 'w1_surveys', to: 'w1_engine', label: 'Layer Render', implemented: true },
  { from: 'w1_grid', to: 'w3_precession', label: 'J2000 Vector' },

  { from: 'w2_inbound', to: 'w2_listener', label: 'postMessage', implemented: true },
  { from: 'w2_listener', to: 'w3_fov_engine', label: 'RA/Dec Sync' },

  { from: 'w3_precession', to: 'w3_fov_engine', label: 'Rotation Matrix' },
  { from: 'w3_fov_engine', to: 'w4_view_host', label: 'FOV Bounds' },

  { from: 'w4_presets', to: 'w2_outbound', label: 'load_background' },
  { from: 'w2_outbound', to: 'w1_engine', label: 'Iframe Post' },

  { from: 'w4_hud_pill', to: 'w3_fov_engine', label: 'North / FlyTo' },
  { from: 'w5_timeline', to: 'w3_sgp4', label: 'currentTime Scrub' },
  { from: 'w3_sgp4', to: 'w3_fov_engine', label: 'Orbital Position' },
];
