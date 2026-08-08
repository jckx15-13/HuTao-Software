export interface ArchitectureNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'wwt' | 'wwv' | 'prisma' | 'agent' | 'adapter' | 'swvi';
  section: 'WWT Source Architecture' | 'WWV Source Architecture' | 'Silver Wolf VI Integration Pipeline';
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
  type?: 'top-down' | 'left-to-right';
}

export const silverWolfViNodes: ArchitectureNode[] = [
  // =========================================================================
  // SECTION 1: WWT SOURCE ARCHITECTURE (TOP-DOWN FLOW)
  // =========================================================================
  // Layer 1: Engine & Surveys
  { id: 'wwt_w1', label: 'WWT WebGL Iframe Engine', sublabel: 'web.wwtassets.org/research/latest/', category: 'wwt', section: 'WWT Source Architecture', x: 40, y: 40, width: 310, height: 54 },
  { id: 'wwt_w2', label: 'Multi-Spectrum Sky Surveys', sublabel: 'DSS Visible, Chandra X-Ray, Planck, Radio VLSS', category: 'wwt', section: 'WWT Source Architecture', x: 410, y: 40, width: 310, height: 54 },
  { id: 'wwt_w3', label: 'J2000 Celestial Grid & Ephemeris', sublabel: '3D Solar System Reference Frame', category: 'wwt', section: 'WWT Source Architecture', x: 780, y: 40, width: 310, height: 54 },

  // Layer 2: Protocol & Telemetry
  { id: 'wwt_b1', label: 'Outbound postMessage Protocol', sublabel: 'set_view, load_background, set_fov', category: 'wwt', section: 'WWT Source Architecture', x: 40, y: 130, width: 310, height: 54 },
  { id: 'wwt_b2', label: 'wwt_view_state Telemetry Broadcast', sublabel: '60 FPS Broadcast (RA, Dec, FOV, Roll)', category: 'wwt', section: 'WWT Source Architecture', x: 410, y: 130, width: 310, height: 54 },
  { id: 'wwt_b3', label: 'useWWTListener.ts (Mutex Lock)', sublabel: 'syncSource Lock ("none"|"cesium"|"wwt") + 32ms Timer', category: 'adapter', section: 'WWT Source Architecture', x: 780, y: 130, width: 310, height: 54 },

  // Layer 3: Math Engine & Control UI
  { id: 'wwt_m1', label: 'coordinateTransforms.ts', sublabel: 'IAU 1976 Precession & ERA Sidereal Time', category: 'adapter', section: 'WWT Source Architecture', x: 40, y: 220, width: 310, height: 54 },
  { id: 'wwt_m2', label: 'useCameraSync.ts (Exact Horizon FOV)', sublabel: 'Exact Spherical FOV = 2*arcsin(Re / (Re+H))', category: 'adapter', section: 'WWT Source Architecture', x: 410, y: 220, width: 310, height: 54 },
  { id: 'wwt_m3', label: 'OrbitEngine.ts (SGP4 Solver)', sublabel: 'Real-Time Satellite Trajectory Propagation', category: 'adapter', section: 'WWT Source Architecture', x: 780, y: 220, width: 310, height: 54 },

  // =========================================================================
  // SECTION 2: WWV SOURCE ARCHITECTURE (TOP-DOWN FLOW)
  // =========================================================================
  // Layer 1: External Feeds & Control
  { id: 'wwv_e1', label: 'External REST APIs & Seeders', sublabel: 'OpenSky Aviation, USGS Earthquakes, Webcams', category: 'wwv', section: 'WWV Source Architecture', x: 40, y: 350, width: 310, height: 54 },
  { id: 'wwv_e2', label: 'Opt-in Agent Bus (HTTP+SSE)', sublabel: 'szski/wwv-mcp Control Surface for LLMs', category: 'agent', section: 'WWV Source Architecture', x: 410, y: 350, width: 310, height: 54 },
  { id: 'wwv_e3', label: 'Static GeoJSON & 3D Assets', sublabel: 'borders (4.0MB), bases (6.6MB), airplane.zip', category: 'wwv', section: 'WWV Source Architecture', x: 780, y: 350, width: 310, height: 54 },

  // Layer 2: Core Data Bus & Logic
  { id: 'wwv_b1', label: 'DataBus WebSocket (/stream)', sublabel: 'High-Frequency Real-Time Event Bus', category: 'wwv', section: 'WWV Source Architecture', x: 40, y: 440, width: 310, height: 54 },
  { id: 'wwv_b2', label: 'AgentBusController.ts', sublabel: 'FlyTo, Selection & Layer Command Dispatcher', category: 'agent', section: 'WWV Source Architecture', x: 410, y: 440, width: 310, height: 54 },
  { id: 'wwv_b3', label: 'PluginManager & parseWwvManifest.ts', sublabel: 'Dynamic CDN Bundle Loader & Manifest Parser', category: 'adapter', section: 'WWV Source Architecture', x: 780, y: 440, width: 310, height: 54 },

  // Layer 3: Zustand Store Slices
  { id: 'wwv_s1', label: 'entitySlice.ts (Live Entities)', sublabel: 'Aircraft, Webcams, Satellites, Military Bases', category: 'wwv', section: 'WWV Source Architecture', x: 40, y: 530, width: 310, height: 54 },
  { id: 'wwv_s2', label: 'filterSlice.ts & pluginSlice.ts', sublabel: 'Spatial Bounds & Dynamic Layer Config', category: 'wwv', section: 'WWV Source Architecture', x: 410, y: 530, width: 310, height: 54 },
  { id: 'wwv_s3', label: 'Prisma 7 PostgreSQL Schema', sublabel: 'InstalledPlugin, Setting, Workspace, Favorite', category: 'prisma', section: 'WWV Source Architecture', x: 780, y: 530, width: 310, height: 54 },

  // Layer 4: UI & Globe Renderer
  { id: 'wwv_u1', label: 'AppShell.tsx & Header.tsx', sublabel: 'Top Navigation Workspace Bar & SearchBar', category: 'wwv', section: 'WWV Source Architecture', x: 40, y: 620, width: 310, height: 54 },
  { id: 'wwv_u2', label: 'ResiumGlobe.tsx / CesiumViewer', sublabel: 'Main 3D Globe View Container', category: 'wwv', section: 'WWV Source Architecture', x: 410, y: 620, width: 310, height: 54 },
  { id: 'wwv_u3', label: 'EntityRenderer.ts (60 FPS)', sublabel: 'Billboard, Polyline & glTF Batch Renderer', category: 'wwv', section: 'WWV Source Architecture', x: 780, y: 620, width: 310, height: 54 },

  // =========================================================================
  // SECTION 3: SILVER WOLF VI INTEGRATION PIPELINE (LEFT-TO-RIGHT FLOW)
  // =========================================================================
  // WWV Transformation Row (Left -> Center -> Right)
  { id: 'int_wwv_src', label: 'WWV Source Package / Assets', sublabel: 'borders.geojson, military_bases, manifest.json', category: 'wwv', section: 'Silver Wolf VI Integration Pipeline', x: 40, y: 750, width: 310, height: 54 },
  { id: 'int_wwv_adp', label: 'Asset Sync & Manifest Parser', sublabel: 'scripts/sync_wwv_assets.cjs & parseWwvManifest.ts', category: 'adapter', section: 'Silver Wolf VI Integration Pipeline', x: 410, y: 750, width: 310, height: 54 },
  { id: 'int_wwv_dst', label: 'Silver Wolf VI Assets & Stores', sublabel: 'public/wwv-assets/, repositoryData.ts, store.ts', category: 'swvi', section: 'Silver Wolf VI Integration Pipeline', x: 780, y: 750, width: 310, height: 54 },

  // WWT Transformation Row (Left -> Center -> Right)
  { id: 'int_wwt_src', label: 'WWT WebGL Iframe & Telemetry', sublabel: 'web.wwtassets.org & wwt_view_state Broadcast', category: 'wwt', section: 'Silver Wolf VI Integration Pipeline', x: 40, y: 840, width: 310, height: 54 },
  { id: 'int_wwt_adp', label: 'Anti-Loop Mutex & Exact FOV', sublabel: 'useWWTListener.ts & Exact Spherical FOV Engine', category: 'adapter', section: 'Silver Wolf VI Integration Pipeline', x: 410, y: 840, width: 310, height: 54 },
  { id: 'int_wwt_dst', label: 'WorldWideTelescopeView.tsx', sublabel: 'View Host, SpaceHudPillControls & TimelineLanes', category: 'swvi', section: 'Silver Wolf VI Integration Pipeline', x: 780, y: 840, width: 310, height: 54 },
];

export const silverWolfViEdges: ArchitectureEdge[] = [
  // WWT Top-Down Edges
  { from: 'wwt_w1', to: 'wwt_b1', label: 'Commands', implemented: true, type: 'top-down' },
  { from: 'wwt_w2', to: 'wwt_b2', label: 'Telemetry', implemented: true, type: 'top-down' },
  { from: 'wwt_w3', to: 'wwt_b3', label: 'J2000 Sync', implemented: true, type: 'top-down' },
  { from: 'wwt_b1', to: 'wwt_m1', label: 'Precession', implemented: true, type: 'top-down' },
  { from: 'wwt_b2', to: 'wwt_m2', label: 'Exact FOV', implemented: true, type: 'top-down' },
  { from: 'wwt_b3', to: 'wwt_m3', label: 'SGP4 Scrub', implemented: true, type: 'top-down' },

  // WWV Top-Down Edges
  { from: 'wwv_e1', to: 'wwv_b1', label: 'Stream Feed', implemented: true, type: 'top-down' },
  { from: 'wwv_e2', to: 'wwv_b2', label: 'Agent Control', implemented: true, type: 'top-down' },
  { from: 'wwv_e3', to: 'wwv_b3', label: 'Manifest Load', implemented: true, type: 'top-down' },
  { from: 'wwv_b1', to: 'wwv_s1', label: 'State Hydrate', implemented: true, type: 'top-down' },
  { from: 'wwv_b2', to: 'wwv_s2', label: 'Layer Config', implemented: true, type: 'top-down' },
  { from: 'wwv_b3', to: 'wwv_s3', label: 'Prisma Models', implemented: true, type: 'top-down' },
  { from: 'wwv_s1', to: 'wwv_u1', label: 'Header Search', implemented: true, type: 'top-down' },
  { from: 'wwv_s2', to: 'wwv_u2', label: '3D Globe Host', implemented: true, type: 'top-down' },
  { from: 'wwv_s3', to: 'wwv_u3', label: '60FPS Renderer', implemented: true, type: 'top-down' },

  // Silver Wolf VI Left-To-Right Integration Edges
  { from: 'int_wwv_src', to: 'int_wwv_adp', label: 'Asset Mirror', implemented: true, type: 'left-to-right' },
  { from: 'int_wwv_adp', to: 'int_wwv_dst', label: 'Local Target', implemented: true, type: 'left-to-right' },
  { from: 'int_wwt_src', to: 'int_wwt_adp', label: 'Telemetry Sync', implemented: true, type: 'left-to-right' },
  { from: 'int_wwt_adp', to: 'int_wwt_dst', label: 'View Host', implemented: true, type: 'left-to-right' },
];
