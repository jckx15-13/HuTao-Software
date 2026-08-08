export interface WwtGraphNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'wwt' | 'adapter' | 'swvi';
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
  // Row 1: WWT Remote Iframe Host & PiP Window
  { id: 'w1', label: 'WWT Remote Research App', sublabel: 'web.wwtassets.org (Iframe)', category: 'wwt', x: 40, y: 40, width: 280, height: 60 },
  { id: 'a1', label: 'Direct Embed Host Adapter', sublabel: 'Watchdog & Bounds Clamp', category: 'adapter', x: 400, y: 40, width: 260, height: 60 },
  { id: 't1', label: 'WorldWideTelescopeView.tsx', sublabel: 'View Host & PiP Window', category: 'swvi', x: 760, y: 40, width: 260, height: 60 },

  // Row 2: WWT Multi-Spectrum Sky Surveys
  { id: 'w2', label: 'WWT Multi-Spectrum Surveys', sublabel: 'DSS, Chandra, Planck, Radio', category: 'wwt', x: 40, y: 130, width: 280, height: 60 },
  { id: 'a2', label: 'Preset Catalog Mapper', sublabel: 'Survey Layer Presets', category: 'adapter', x: 400, y: 130, width: 260, height: 60 },
  { id: 't2', label: 'telescopePresets.ts', sublabel: 'Deep-Sky & Planet Catalog', category: 'swvi', x: 760, y: 130, width: 260, height: 60 },

  // Row 3: WWT postMessage API & Telemetry Listener
  { id: 'w3', label: 'WWT postMessage Telemetry', sublabel: 'wwt_view_state Events', category: 'wwt', x: 40, y: 220, width: 280, height: 60 },
  { id: 'a3', label: 'Anti-Loop Mutex & 32ms Lock', sublabel: 'syncSource Lock & Throttle', category: 'adapter', x: 400, y: 220, width: 260, height: 60 },
  { id: 't3', label: 'useWWTListener.ts', sublabel: 'Telemetry Event Listener', category: 'swvi', x: 760, y: 220, width: 260, height: 60 },

  // Row 4: Cesium Camera Sync & ECEF Coordinates
  { id: 'w4', label: 'Cesium 3D Camera State', sublabel: 'ECEF Camera Vectors', category: 'wwt', x: 40, y: 310, width: 280, height: 60 },
  { id: 'a4', label: 'Camera Sync Transformer', sublabel: 'ECEF to RA/Dec Translation', category: 'adapter', x: 400, y: 310, width: 260, height: 60 },
  { id: 't4', label: 'useCameraSync.ts', sublabel: 'Bidirectional Camera Sync', category: 'swvi', x: 760, y: 310, width: 260, height: 60 },

  // Row 5: Exact Horizon FOV & Altitude Mapping
  { id: 'w5', label: 'Cesium Camera Altitude H', sublabel: 'Height d = Re + H', category: 'wwt', x: 40, y: 400, width: 280, height: 60 },
  { id: 'a5', label: 'Exact Horizon FOV Block', sublabel: '2 * arcsin(Re / d) = 3.8034°', category: 'adapter', x: 400, y: 400, width: 260, height: 60 },
  { id: 't5', label: 'WWT FOV Controller', sublabel: '0.25° to 60.0° FOV Range', category: 'swvi', x: 760, y: 400, width: 260, height: 60 },

  // Row 6: Astronomical Coordinate Transformations
  { id: 'w6', label: 'WWT J2000 Catalog Coords', sublabel: 'J2000 Equatorial Grid', category: 'wwt', x: 40, y: 490, width: 280, height: 60 },
  { id: 'a6', label: 'Precession & ERA Math', sublabel: 'IAU 1976 Precession & ERA', category: 'adapter', x: 400, y: 490, width: 260, height: 60 },
  { id: 't6', label: 'coordinateTransforms.ts', sublabel: 'Celestial Math Engine', category: 'swvi', x: 760, y: 490, width: 260, height: 60 },
];

export const wwtArchitectureEdges: WwtGraphEdge[] = [
  { from: 'w1', to: 'a1', label: 'Direct Embed', implemented: true },
  { from: 'a1', to: 't1', label: 'Host View', implemented: true },

  { from: 'w2', to: 'a2', label: 'Surveys', implemented: true },
  { from: 'a2', to: 't2', label: 'Presets', implemented: true },

  { from: 'w3', to: 'a3', label: 'postMessage' },
  { from: 'a3', to: 't3', label: 'View State' },

  { from: 'w4', to: 'a4', label: 'ECEF Vector' },
  { from: 'a4', to: 't4', label: 'RA/Dec Sync' },

  { from: 'w5', to: 'a5', label: 'Altitude H' },
  { from: 'a5', to: 't5', label: 'Framing FOV' },

  { from: 'w6', to: 'a6', label: 'J2000 Coords' },
  { from: 'a6', to: 't6', label: 'Precession' },
];
