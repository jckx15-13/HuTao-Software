export interface ArchitectureNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'wwt' | 'wwv' | 'prisma' | 'agent' | 'adapter' | 'swvi';
  row: 'Row 1: WorldWideView (WWV)' | 'Row 2: World Wide Telescope (WWT)';
  column: 'Source' | 'Changes / Adapters' | 'Destination File';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  implemented?: boolean;
}

export const silverWolfViNodes: ArchitectureNode[] = [
  // =========================================================================
  // ROW 1: WORLDWIDEVIEW (WWV) INTEGRATION PIPELINE
  // =========================================================================

  // Row 1.1: Static GeoJSON Assets (borders, cameras, bases)
  {
    id: 'v1',
    label: 'WWV Static GeoJSON Data',
    sublabel: 'borders.geojson (4.04MB), cameras_geojson.json (1.93MB), military_bases.geojson (6.65MB)',
    category: 'wwv',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Source',
    x: 40,
    y: 40,
    width: 350,
    height: 56,
  },
  {
    id: 'a1',
    label: 'Local Asset Sync Build Script',
    sublabel: 'scripts/sync_wwv_assets.cjs (predev/prebuild lifecycle)',
    category: 'adapter',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Changes / Adapters',
    x: 430,
    y: 40,
    width: 330,
    height: 56,
  },
  {
    id: 's1',
    label: 'public/wwv-assets/*.geojson',
    sublabel: 'public/wwv-assets/borders.geojson & military_bases.geojson',
    category: 'swvi',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Destination File',
    x: 800,
    y: 40,
    width: 300,
    height: 56,
  },

  // Row 1.2: 3D Flight Models & SVG Icons (airplane.zip, plane-icon.svg)
  {
    id: 'v2',
    label: 'WWV 3D Models & Map Icons',
    sublabel: 'airplane.zip (82.1KB), plane-icon.svg (445B), military-plane-icon.svg (351B)',
    category: 'wwv',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Source',
    x: 40,
    y: 115,
    width: 350,
    height: 56,
  },
  {
    id: 'a2',
    label: 'Local-First URL Candidate Resolver',
    sublabel: 'getWwtAssetLocalCandidateUrls Fallback Engine',
    category: 'adapter',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Changes / Adapters',
    x: 430,
    y: 115,
    width: 330,
    height: 56,
  },
  {
    id: 's2',
    label: 'src/lib/wwt/repositoryData.ts',
    sublabel: 'public/wwv-assets/airplane.zip & plane-icon.svg Resolver',
    category: 'swvi',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Destination File',
    x: 800,
    y: 115,
    width: 300,
    height: 56,
  },

  // Row 1.3: Layer Manifests & Plugin Parser
  {
    id: 'v3',
    label: 'WWV Layer Manifest Schema',
    sublabel: 'worldwideview/public/data/manifest.json & Dynamic CDN Plugins',
    category: 'wwv',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Source',
    x: 40,
    y: 190,
    width: 350,
    height: 56,
  },
  {
    id: 'a3',
    label: 'Manifest & Plugin Layer Parser',
    sublabel: 'loadFromManifest() Plugin Layer Registrar',
    category: 'adapter',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Changes / Adapters',
    x: 430,
    y: 190,
    width: 330,
    height: 56,
  },
  {
    id: 's3',
    label: 'src/core/plugins/parseWwvManifest.ts',
    sublabel: 'Dynamic Plugin Manifest Parser File',
    category: 'swvi',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Destination File',
    x: 800,
    y: 190,
    width: 300,
    height: 56,
  },

  // Row 1.4: Real-Time DataBus & Store Boundary
  {
    id: 'v4',
    label: 'WWV DataBus & Zustand Store',
    sublabel: 'WebSocket /stream, entitySlice, filterSlice, pluginSlice',
    category: 'wwv',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Source',
    x: 40,
    y: 265,
    width: 350,
    height: 56,
  },
  {
    id: 'a4',
    label: 'Store Ownership Boundary Sync',
    sublabel: 'uiStore.ts (UI/Layout) vs store.ts (Domain Telemetry State)',
    category: 'adapter',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Changes / Adapters',
    x: 430,
    y: 265,
    width: 330,
    height: 56,
  },
  {
    id: 's4',
    label: 'src/store/uiStore.ts & store.ts',
    sublabel: 'Decoupled Store Modules in Silver Wolf VI',
    category: 'swvi',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Destination File',
    x: 800,
    y: 265,
    width: 300,
    height: 56,
  },

  // Row 1.5: Static Ground Features & Terrain Alignment
  {
    id: 'v5',
    label: 'WWV Geographic Ground Landmarks',
    sublabel: 'Observatories, Launchpads & Country Label Coordinates',
    category: 'wwv',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Source',
    x: 40,
    y: 340,
    width: 350,
    height: 56,
  },
  {
    id: 'a5',
    label: 'Landmark Terrain Clamping Policy',
    sublabel: 'HeightReference.CLAMP_TO_GROUND Primitive Alignment',
    category: 'adapter',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Changes / Adapters',
    x: 430,
    y: 340,
    width: 330,
    height: 56,
  },
  {
    id: 's5',
    label: 'src/hooks/cesium/useLandmarks.ts',
    sublabel: 'Terrain Clamping Primitive Hook',
    category: 'swvi',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Destination File',
    x: 800,
    y: 340,
    width: 300,
    height: 56,
  },

  // Row 1.6: Prisma 7 Schema & Agent Bus
  {
    id: 'v6',
    label: 'WWV Prisma 7 Models & Agent Bus',
    sublabel: 'schema.prisma (InstalledPlugin, Setting) & szski/wwv-mcp',
    category: 'prisma',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Source',
    x: 40,
    y: 415,
    width: 350,
    height: 56,
  },
  {
    id: 'a6',
    label: 'Database & Agent Bridge Adapter',
    sublabel: 'PostgreSQL Models & LLM SSE Control Surface',
    category: 'adapter',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Changes / Adapters',
    x: 430,
    y: 415,
    width: 330,
    height: 56,
  },
  {
    id: 's6',
    label: 'worldwideview/prisma/schema.prisma',
    sublabel: 'Multi-Tenant Database Models',
    category: 'swvi',
    row: 'Row 1: WorldWideView (WWV)',
    column: 'Destination File',
    x: 800,
    y: 415,
    width: 300,
    height: 56,
  },

  // =========================================================================
  // ROW 2: WORLD WIDE TELESCOPE (WWT) INTEGRATION PIPELINE
  // =========================================================================

  // Row 2.1: Remote WebGL Iframe & View Host Wrapper
  {
    id: 'w1',
    label: 'WWT WebGL Iframe Research App',
    sublabel: 'web.wwtassets.org/research/latest/ (HTML5 Engine)',
    category: 'wwt',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Source',
    x: 40,
    y: 520,
    width: 350,
    height: 56,
  },
  {
    id: 'b1',
    label: 'Iframe Host Wrapper & PiP Clamp',
    sublabel: 'Watchdog Timer, Window Bounds Clamp & 4-Tab Control Drawer',
    category: 'adapter',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Changes / Adapters',
    x: 430,
    y: 520,
    width: 330,
    height: 56,
  },
  {
    id: 't1',
    label: 'src/components/learning/WorldWideTelescopeView.tsx',
    sublabel: 'View Host Container File',
    category: 'swvi',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Destination File',
    x: 800,
    y: 520,
    width: 300,
    height: 56,
  },

  // Row 2.2: All-Sky Surveys (DSS, Chandra, Planck, Radio)
  {
    id: 'w2',
    label: 'WWT All-Sky Surveys',
    sublabel: 'DSS Color Visible, Chandra X-Ray, Planck Dust, Radio VLSS',
    category: 'wwt',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Source',
    x: 40,
    y: 595,
    width: 350,
    height: 56,
  },
  {
    id: 'b2',
    label: 'Survey Preset Catalog Mapper',
    sublabel: 'TELESCOPE_PRESETS Array & Layer Dispatcher',
    category: 'adapter',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Changes / Adapters',
    x: 430,
    y: 595,
    width: 330,
    height: 56,
  },
  {
    id: 't2',
    label: 'src/data/telescopePresets.ts',
    sublabel: 'Deep-Sky Survey Catalog File',
    category: 'swvi',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Destination File',
    x: 800,
    y: 595,
    width: 300,
    height: 56,
  },

  // Row 2.3: postMessage Telemetry & Anti-Loop Mutex
  {
    id: 'w3',
    label: 'postMessage Telemetry API',
    sublabel: 'wwt_view_state Events (ra, dec, fov, roll, target)',
    category: 'wwt',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Source',
    x: 40,
    y: 670,
    width: 350,
    height: 56,
  },
  {
    id: 'b3',
    label: 'Anti-Loop Mutex & 32ms Throttle',
    sublabel: 'syncSource Lock ("none"|"cesium"|"wwt") + 30FPS Timer',
    category: 'adapter',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Changes / Adapters',
    x: 430,
    y: 670,
    width: 330,
    height: 56,
  },
  {
    id: 't3',
    label: 'src/hooks/useWWTListener.ts',
    sublabel: 'Telemetry Event Listener Hook File',
    category: 'swvi',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Destination File',
    x: 800,
    y: 670,
    width: 300,
    height: 56,
  },

  // Row 2.4: Cesium Camera Altitude H & Exact Horizon FOV Engine
  {
    id: 'w4',
    label: 'Cesium Camera Altitude H',
    sublabel: 'Camera Height d = Re + H',
    category: 'wwt',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Source',
    x: 40,
    y: 745,
    width: 350,
    height: 56,
  },
  {
    id: 'b4',
    label: 'Exact Horizon FOV Engine',
    sublabel: 'FOV = 2 * arcsin(Re / (Re+H)) (3.8034° at midpoint)',
    category: 'adapter',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Changes / Adapters',
    x: 430,
    y: 745,
    width: 330,
    height: 56,
  },
  {
    id: 't4',
    label: 'src/hooks/useCameraSync.ts',
    sublabel: 'Camera Synchronization Engine File',
    category: 'swvi',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Destination File',
    x: 800,
    y: 745,
    width: 300,
    height: 56,
  },

  // Row 2.5: J2000 Coordinates & IAU 1976 Precession Math
  {
    id: 'w5',
    label: 'J2000 Celestial Frame & ERA',
    sublabel: 'Equatorial Grid & Earth Rotation Angle Matrix',
    category: 'wwt',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Source',
    x: 40,
    y: 820,
    width: 350,
    height: 56,
  },
  {
    id: 'b5',
    label: 'Precession & Sidereal Math Matrix',
    sublabel: 'IAU 1976 Precession & ERA Coordinate Matrices',
    category: 'adapter',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Changes / Adapters',
    x: 430,
    y: 820,
    width: 330,
    height: 56,
  },
  {
    id: 't5',
    label: 'src/lib/coordinateTransforms.ts',
    sublabel: 'Celestial Transformation Math File',
    category: 'swvi',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Destination File',
    x: 800,
    y: 820,
    width: 300,
    height: 56,
  },

  // Row 2.6: Space HUD Controls & Timeline SGP4 Sync
  {
    id: 'w6',
    label: 'Space HUD Controls & Timeline',
    sublabel: 'NAV/LAYERS Pill, Timeline Scrubbing & SGP4 Orbits',
    category: 'wwt',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Source',
    x: 40,
    y: 895,
    width: 350,
    height: 56,
  },
  {
    id: 'b6',
    label: 'HUD Action Dispatcher & SGP4 Linker',
    sublabel: 'Docked Pill Actions & Temporal Orbital Propagation',
    category: 'adapter',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Changes / Adapters',
    x: 430,
    y: 895,
    width: 330,
    height: 56,
  },
  {
    id: 't6',
    label: 'src/components/panels/SpaceHudPillControls.tsx',
    sublabel: 'Docked Space HUD Pill & Timeline Component Files',
    category: 'swvi',
    row: 'Row 2: World Wide Telescope (WWT)',
    column: 'Destination File',
    x: 800,
    y: 895,
    width: 300,
    height: 56,
  },
];

export const silverWolfViEdges: ArchitectureEdge[] = [
  // ROW 1: WWV Connections (Source -> Changes -> Destination)
  { from: 'v1', to: 'a1', label: 'Copy Source', implemented: true },
  { from: 'a1', to: 's1', label: 'Local Assets', implemented: true },

  { from: 'v2', to: 'a2', label: 'Models & Icons' },
  { from: 'a2', to: 's2', label: 'Asset Resolver' },

  { from: 'v3', to: 'a3', label: 'Manifest JSON' },
  { from: 'a3', to: 's3', label: 'Plugin Parser' },

  { from: 'v4', to: 'a4', label: 'Store Slices' },
  { from: 'a4', to: 's4', label: 'Decoupled Stores' },

  { from: 'v5', to: 'a5', label: 'Ground Features' },
  { from: 'a5', to: 's5', label: 'Terrain Clamp' },

  { from: 'v6', to: 'a6', label: 'Prisma Schema' },
  { from: 'a6', to: 's6', label: 'DB Models' },

  // ROW 2: WWT Connections (Source -> Changes -> Destination)
  { from: 'w1', to: 'b1', label: 'Direct Embed', implemented: true },
  { from: 'b1', to: 't1', label: 'View Host', implemented: true },

  { from: 'w2', to: 'b2', label: 'Sky Surveys', implemented: true },
  { from: 'b2', to: 't2', label: 'Presets File', implemented: true },

  { from: 'w3', to: 'b3', label: 'postMessage' },
  { from: 'b3', to: 't3', label: 'Telemetry Hook' },

  { from: 'w4', to: 'b4', label: 'Altitude H' },
  { from: 'b4', to: 't4', label: 'Exact FOV' },

  { from: 'w5', to: 'b5', label: 'J2000 Grid' },
  { from: 'b5', to: 't5', label: 'Precession' },

  { from: 'w6', to: 'b6', label: 'HUD & Time', implemented: true },
  { from: 'b6', to: 't6', label: 'Docked Pill', implemented: true },
];
