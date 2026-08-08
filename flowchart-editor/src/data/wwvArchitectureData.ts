export interface WwvGraphNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'wwv' | 'adapter' | 'swvi' | 'prisma';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WwvGraphEdge {
  from: string;
  to: string;
  label?: string;
  implemented?: boolean;
}

export const wwvArchitectureNodes: WwvGraphNode[] = [
  // Row 1: WWV GeoJSON Data & Sync Script
  { id: 'v1', label: 'WWV GeoJSON Layers', sublabel: 'borders (4MB), cameras (1.9MB), bases (6.6MB)', category: 'wwv', x: 40, y: 40, width: 280, height: 60 },
  { id: 'p1', label: 'Local Asset Sync Script', sublabel: 'scripts/sync_wwv_assets.cjs', category: 'adapter', x: 400, y: 40, width: 260, height: 60 },
  { id: 's1', label: 'public/wwv-assets/', sublabel: 'Local Static Asset Directory', category: 'swvi', x: 760, y: 40, width: 260, height: 60 },

  // Row 2: 3D Models, Map Icons & URL Resolver
  { id: 'v2', label: 'WWV 3D Models & Icons', sublabel: 'airplane.zip, plane-icon, military-icon', category: 'wwv', x: 40, y: 130, width: 280, height: 60 },
  { id: 'p2', label: 'Local-First Asset Fallback', sublabel: 'getWwtAssetLocalCandidateUrls', category: 'adapter', x: 400, y: 130, width: 260, height: 60 },
  { id: 's2', label: 'repositoryData.ts', sublabel: 'Asset URL Resolver Utility', category: 'swvi', x: 760, y: 130, width: 260, height: 60 },

  // Row 3: Prisma ORM Schema & Plugin Parser
  { id: 'v3', label: 'WWV Prisma ORM Models', sublabel: 'InstalledPlugin, Setting, Workspace, Favorite', category: 'prisma', x: 40, y: 220, width: 280, height: 60 },
  { id: 'p3', label: 'Manifest & Plugin Parser', sublabel: 'loadFromManifest() Loader', category: 'adapter', x: 400, y: 220, width: 260, height: 60 },
  { id: 's3', label: 'parseWwvManifest.ts', sublabel: 'Layer Plugin System', category: 'swvi', x: 760, y: 220, width: 260, height: 60 },

  // Row 4: Satellite TLE Catalog & Orbit Engine
  { id: 'v4', label: 'WWV TLE Satellite Catalog', sublabel: 'data/satellites.json (TLE Orbits)', category: 'wwv', x: 40, y: 310, width: 280, height: 60 },
  { id: 'p4', label: 'SGP4 Physics Orbit Engine', sublabel: 'Real-Time Trajectory Propagation', category: 'adapter', x: 400, y: 310, width: 260, height: 60 },
  { id: 's4', label: 'OrbitEngine.ts', sublabel: 'Orbital Physics Module', category: 'swvi', x: 760, y: 310, width: 260, height: 60 },

  // Row 5: Timeline Scrubbing & SGP4 Dynamics
  { id: 'v5', label: 'Timeline Control State', sublabel: 'currentTime, speed, playbackMode', category: 'wwv', x: 40, y: 400, width: 280, height: 60 },
  { id: 'p5', label: 'Timeline Lane Controller', sublabel: 'Real-Time Orbital Time-Scrubbing', category: 'adapter', x: 400, y: 400, width: 260, height: 60 },
  { id: 's5', label: 'TimelineLanes.tsx', sublabel: 'Multi-Lane Timeline UI', category: 'swvi', x: 760, y: 400, width: 260, height: 60 },

  // Row 6: Top Workspace Navigation Bar
  { id: 'v6', label: 'Top Navigation Bar', sublabel: 'CHAT vs SPACE, AI Model, UTC Clock', category: 'wwv', x: 40, y: 490, width: 280, height: 60 },
  { id: 'p6', label: 'Workspace Mode Switcher', sublabel: 'Header Sync & AI Model Selector', category: 'adapter', x: 400, y: 490, width: 260, height: 60 },
  { id: 's6', label: 'CenterPanel.tsx', sublabel: 'Workspace Top Chrome Bar', category: 'swvi', x: 760, y: 490, width: 260, height: 60 },

  // Row 7: Medium Top Bar (Pill Controls) & Entity Render
  { id: 'v7', label: 'Medium Top Bar Pill', sublabel: 'NAV, LAYERS, Compass, Terrain, Ruler', category: 'wwv', x: 40, y: 580, width: 280, height: 60 },
  { id: 'p7', label: 'Pill Action Dispatcher', sublabel: 'Map Feature Toggle Handlers', category: 'adapter', x: 400, y: 580, width: 260, height: 60 },
  { id: 's7', label: 'SpaceHudPillControls.tsx', sublabel: 'Docked Pill Control Bar', category: 'swvi', x: 760, y: 580, width: 260, height: 60 },
];

export const wwvArchitectureEdges: WwvGraphEdge[] = [
  // Parallel Row Connections (Strictly Non-Overlapping)
  { from: 'v1', to: 'p1', label: 'Sync Source', implemented: true },
  { from: 'p1', to: 's1', label: 'Local Assets', implemented: true },

  { from: 'v2', to: 'p2', label: '3D/Icons' },
  { from: 'p2', to: 's2', label: 'URL Candidate' },

  { from: 'v3', to: 'p3', label: 'Prisma Models' },
  { from: 'p3', to: 's3', label: 'Manifest Plugin' },

  { from: 'v4', to: 'p4', label: 'TLE Catalog' },
  { from: 'p4', to: 's4', label: 'SGP4 State' },

  { from: 'v5', to: 'p5', label: 'Time Control' },
  { from: 'p5', to: 's5', label: 'Scrub Sync' },

  { from: 'v6', to: 'p6', label: 'Top Chrome' },
  { from: 'p6', to: 's6', label: 'Mode State' },

  { from: 'v7', to: 'p7', label: 'Pill Actions', implemented: true },
  { from: 'p7', to: 's7', label: 'Docked HUD', implemented: true },
];
