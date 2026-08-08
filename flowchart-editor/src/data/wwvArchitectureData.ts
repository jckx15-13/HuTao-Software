export interface WwvGraphNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'wwv' | 'adapter' | 'swvi' | 'prisma' | 'agent';
  layer: string;
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
  // Layer 1: External Feeds & Control Surfaces (Y: 40)
  { id: 'v1_ext_api', label: 'External REST APIs & Seeders', sublabel: 'OpenSky Aviation, USGS Earthquakes, OpenWeather', category: 'wwv', layer: 'External Feeds', x: 40, y: 40, width: 310, height: 56 },
  { id: 'v1_agent_bus', label: 'Opt-in Agent Bus (HTTP+SSE)', sublabel: 'szski/wwv-mcp Control Surface for LLM Agents', category: 'agent', layer: 'External Feeds', x: 410, y: 40, width: 310, height: 56 },
  { id: 'v1_assets', label: 'Static GeoJSON & 3D Assets', sublabel: 'borders (4.0MB), bases (6.6MB), airplane.zip (82KB)', category: 'wwv', layer: 'External Feeds', x: 780, y: 40, width: 310, height: 56 },

  // Layer 2: Data Pipeline & Logic Core (Y: 140)
  { id: 'v2_databus', label: 'DataBus WebSocket (/stream)', sublabel: 'High-Frequency Real-Time Event Bus', category: 'wwv', layer: 'Data Core', x: 40, y: 140, width: 310, height: 56 },
  { id: 'v2_agent_ctrl', label: 'AgentBusController.ts', sublabel: 'FlyTo, Selection & Layer Command Dispatcher', category: 'agent', layer: 'Data Core', x: 410, y: 140, width: 310, height: 56 },
  { id: 'v2_plugin_mgr', label: 'PluginManager & Manifest Parser', sublabel: 'Dynamic CDN Bundle Loader & parseWwvManifest.ts', category: 'adapter', layer: 'Data Core', x: 780, y: 140, width: 310, height: 56 },

  // Layer 3: Global Zustand Store Slices (Y: 240)
  { id: 'v3_entity_slice', label: 'entitySlice.ts', sublabel: 'Live Entities (aircraft, webcams, satellites)', category: 'wwv', layer: 'Store Slices', x: 40, y: 240, width: 310, height: 56 },
  { id: 'v3_filter_slice', label: 'filterSlice.ts', sublabel: 'Spatial Bounds & Temporal Filters', category: 'wwv', layer: 'Store Slices', x: 410, y: 240, width: 310, height: 56 },
  { id: 'v3_plugin_slice', label: 'pluginSlice.ts', sublabel: 'Active Dynamic Layer Toggles & Config', category: 'wwv', layer: 'Store Slices', x: 780, y: 240, width: 310, height: 56 },

  // Layer 4: Database Schema & Monorepo SDK (Y: 340)
  { id: 'v4_prisma', label: 'Prisma 7 PostgreSQL Schema', sublabel: 'InstalledPlugin, Setting, Workspace, Favorite', category: 'prisma', layer: 'Database & SDK', x: 40, y: 340, width: 310, height: 56 },
  { id: 'v4_sdk', label: '@worldwideview/wwv-plugin-sdk', sublabel: 'Monorepo Dynamic Plugin SDK', category: 'wwv', layer: 'Database & SDK', x: 410, y: 340, width: 310, height: 56 },
  { id: 'v4_local_sync', label: 'scripts/sync_wwv_assets.cjs', sublabel: 'Build Pipeline Local Mirror Script', category: 'adapter', layer: 'Database & SDK', x: 780, y: 340, width: 310, height: 56 },

  // Layer 5: UI Components & Layout Overlays (Y: 440)
  { id: 'v5_app_shell', label: 'AppShell.tsx & Header.tsx', sublabel: 'Workspace Navigation & SearchBar', category: 'wwv', layer: 'UI & Overlays', x: 40, y: 440, width: 310, height: 56 },
  { id: 'v5_layer_panel', label: 'LayerPanel.tsx & LayerItem.tsx', sublabel: 'Interactive Layer Tree Controller', category: 'wwv', layer: 'UI & Overlays', x: 410, y: 440, width: 310, height: 56 },
  { id: 'v5_timeline', label: 'Timeline.tsx & Media Player', sublabel: 'Temporal Scrubber, CameraStream & HlsPlayer', category: 'wwv', layer: 'UI & Overlays', x: 780, y: 440, width: 310, height: 56 },

  // Layer 6: 3D Globe & Batch Rendering Engine (Y: 540)
  { id: 'v6_globe', label: 'ResiumGlobe.tsx / CesiumViewer', sublabel: 'Main 3D Globe View Container', category: 'wwv', layer: 'Rendering Engine', x: 40, y: 540, width: 310, height: 56 },
  { id: 'v6_entity_renderer', label: 'EntityRenderer.ts (60 FPS)', sublabel: 'Billboard, Polyline & glTF Batch Renderer', category: 'wwv', layer: 'Rendering Engine', x: 410, y: 540, width: 310, height: 56 },
  { id: 'v6_tiles', label: 'Google Photorealistic 3D Tiles', sublabel: 'High-Resolution 3D City & Terrain Tiles', category: 'wwv', layer: 'Rendering Engine', x: 780, y: 540, width: 310, height: 56 },
];

export const wwvArchitectureEdges: WwvGraphEdge[] = [
  // Interconnected Data & Rendering Flow
  { from: 'v1_ext_api', to: 'v2_databus', label: 'WebSocket Stream', implemented: true },
  { from: 'v1_agent_bus', to: 'v2_agent_ctrl', label: 'SSE Agent Stream', implemented: true },
  { from: 'v1_assets', to: 'v2_plugin_mgr', label: 'Manifest Load', implemented: true },
  { from: 'v1_assets', to: 'v4_local_sync', label: 'Mirror Script', implemented: true },

  { from: 'v2_databus', to: 'v3_entity_slice', label: 'State Hydrate', implemented: true },
  { from: 'v2_agent_ctrl', to: 'v3_filter_slice', label: 'Filter Command' },
  { from: 'v2_plugin_mgr', to: 'v3_plugin_slice', label: 'Layer Register' },

  { from: 'v3_plugin_slice', to: 'v4_prisma', label: 'Prisma Models' },
  { from: 'v4_sdk', to: 'v2_plugin_mgr', label: 'SDK Interfaces' },

  { from: 'v3_entity_slice', to: 'v5_app_shell', label: 'Entity Search' },
  { from: 'v3_plugin_slice', to: 'v5_layer_panel', label: 'Tree Toggle' },
  { from: 'v3_entity_slice', to: 'v5_timeline', label: 'Time Scrubber' },

  { from: 'v5_app_shell', to: 'v6_globe', label: 'Globe Host' },
  { from: 'v3_entity_slice', to: 'v6_entity_renderer', label: '60FPS Batch' },
  { from: 'v6_entity_renderer', to: 'v6_globe', label: 'Cesium Primitives', implemented: true },
  { from: 'v6_globe', to: 'v6_tiles', label: '3D Tileset', implemented: true },
];
