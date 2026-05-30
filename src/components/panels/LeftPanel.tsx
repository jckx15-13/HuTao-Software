import { useState, useMemo } from 'react';
import {
  Hexagon,
  ChevronLeft,
  Search,
  FolderOpen,
  Image,
  FileText,
  Bookmark,
  User,
  Settings,
  Flame,
  ChevronDown,
  ChevronUp,
  Compass,
  Pin,
  Layers,
  Ruler,
  FolderKanban,
  Sparkles,
  Star,
  Info,
  Play,
  Eye,
  Plus,
  Trash2,
  FolderGit,
  MessageSquare,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { locations } from '@/data/locations';
import { tours } from '@/data/tours';
import { pluginManager } from '@/core/plugins/PluginManager';
import { TELESCOPE_PRESETS as presets } from '@/data/telescopePresets';
import * as Cesium from 'cesium';
import { IMAGERY_LAYERS } from '@/core/globe/ImageryProviderFactory';
import { SATELLITES } from '@/data/satellites';

// ============================================================================
// CONSOLIDATED SUB-COMPONENTS
// ============================================================================

interface FileTreeSectionProps {
  title: string;
  icon: any;
  defaultOpen?: boolean;
  itemCount?: number;
  children: React.ReactNode;
}

export function FileTreeSection({ title, icon: Icon, defaultOpen = false, itemCount, children }: FileTreeSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-7 w-full items-center justify-between px-2 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors text-[9px] font-mono uppercase tracking-widest font-bold"
      >
        <div className="flex items-center gap-1.5">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span>{title}</span>
        </div>
        {itemCount !== undefined && itemCount > 0 && (
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] text-white/50">{itemCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col border-l border-white/5 ml-3.5 pl-1.5 mt-0.5 mb-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

interface TreeItemProps {
  label: string;
  icon?: any;
  depth?: number;
  selected?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export function TreeItem({ label, icon: Icon, depth = 0, selected = false, onClick, badge }: TreeItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-full items-center justify-between rounded px-2 text-[11px] font-mono text-white/60 hover:bg-white/5 hover:text-white/90 transition-all select-none cursor-pointer ${
        selected ? 'bg-primary/15 text-primary border-l-2 border-primary font-bold' : ''
      }`}
      style={{ paddingLeft: `${depth * 8 + 8}px` }}
    >
      <div className="flex items-center gap-2 truncate">
        {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${selected ? 'text-primary' : 'text-white/30'}`} />}
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`rounded px-1 text-[8px] ${selected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function ChatSessionList() {
  const chatSessions = useUIStore((s) => s.chatSessions);
  const activeChatId = useUIStore((s) => s.activeChatId);
  const addChatSession = useUIStore((s) => s.addChatSession);
  const removeChatSession = useUIStore((s) => s.removeChatSession);
  const setActiveChatId = useUIStore((s) => s.setActiveChatId);

  const globalChats = chatSessions.filter((c) => c.type === 'global');
  const projectChats = chatSessions.filter((c) => c.type === 'project');

  const handleCreateProjectChat = () => {
    const name = prompt('Enter project chat name:', 'New Project');
    if (name) {
      addChatSession(name, 'project', 'Workspace');
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono">
      <div className="flex flex-col gap-1">
        {globalChats.map((chat) => {
          const isActive = chat.id === activeChatId;
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => setActiveChatId(chat.id)}
              className={`group flex h-8 w-full items-center justify-between rounded px-2.5 text-[11px] text-white/70 hover:bg-white/5 hover:text-white/95 transition-all select-none cursor-pointer border-l-2 ${
                isActive ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-white/30'}`} />
                <span>{chat.name}</span>
              </div>
              <span className="rounded bg-primary/20 px-1 text-[8px] text-primary">GLOBAL</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-2 text-[9px] uppercase tracking-widest text-white/30 font-bold select-none">
        <span>Project Workspaces</span>
        <button
          type="button"
          onClick={handleCreateProjectChat}
          className="rounded p-0.5 hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
          title="New Project Chat"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {projectChats.length === 0 ? (
          <div className="px-2.5 py-1 text-[10px] text-white/20 italic">No project workspaces.</div>
        ) : (
          projectChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={`group flex h-8 w-full items-center justify-between rounded px-2.5 text-[11px] text-white/70 hover:bg-white/5 transition-all ${
                  isActive ? 'bg-primary/10 text-primary font-bold' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex flex-1 items-center gap-2 truncate text-left cursor-pointer"
                >
                  <FolderGit className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-white/30'}`} />
                  <span className="truncate">{chat.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this workspace chat?')) {
                      removeChatSession(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all"
                  title="Delete workspace"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Haversine distance formula to compute geodetic great circle distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface CollapsibleSectionProps {
  title: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon: Icon, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        title={title}
        className="flex w-full items-center justify-between py-2.5 px-3 hover:bg-white/5 text-white/60 hover:text-white transition-all text-[10px] font-mono select-none"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-bold uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
      </button>
      {isOpen && (
        <div className="p-3 bg-black/15 border-t border-white/5 space-y-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export function LeftPanel() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);
  const activeLocation = useUIStore((s) => s.activeLocation);
  const setActiveLocation = useUIStore((s) => s.setActiveLocation);
  
  const interactionMode = useUIStore((s) => s.interactionMode);

  // Global uiStore states
  const showBorders = useUIStore((s) => s.showBorders);
  const setShowBorders = useUIStore((s) => s.setShowBorders);
  const showTerrain = useUIStore((s) => s.showTerrain);
  const setShowTerrain = useUIStore((s) => s.setShowTerrain);
  const showRoads = useUIStore((s) => s.showRoads);
  const setShowRoads = useUIStore((s) => s.setShowRoads);

  const measureStart = useUIStore((s) => s.measureStart);
  const setMeasureStart = useUIStore((s) => s.setMeasureStart);
  const measureEnd = useUIStore((s) => s.measureEnd);
  const setMeasureEnd = useUIStore((s) => s.setMeasureEnd);

  const telescopeTarget = useUIStore((s) => s.telescopeTarget) || presets[0];
  const setTelescopeTarget = useUIStore((s) => s.setTelescopeTarget);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);

  const activeTour = useUIStore((s) => s.activeTour);
  const setActiveTour = useUIStore((s) => s.setActiveTour);
  const activeTourStepIndex = useUIStore((s) => s.activeTourStepIndex);
  const setActiveTourStepIndex = useUIStore((s) => s.setActiveTourStepIndex);

  // Zustand Store integrations
  const mapConfig = useStore((s) => s.mapConfig);
  const updateMapConfig = useStore((s) => s.updateMapConfig);
  const layers = useStore((s) => s.layers);

  const [searchQuery, setSearchQuery] = useState('');
  const [orbitalSearchQuery, setOrbitalSearchQuery] = useState('');
  const [satelliteSearchQuery, setSatelliteSearchQuery] = useState('');

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    search: true,
    places: false,
    voyager: false,
    style: false,
    measure: false,
    satellites: false,
    plugins: false,
    presets: true,
    telemetry: true,
    synopsis: true,
  });

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeSatelliteId = useUIStore((s) => s.activeSatelliteId);
  const setActiveSatelliteId = useUIStore((s) => s.setActiveSatelliteId);
  const satelliteCategories = useUIStore((s) => s.satelliteCategories);
  const toggleSatelliteCategory = useUIStore((s) => s.toggleSatelliteCategory);
  const satelliteSettings = useUIStore((s) => s.satelliteSettings);
  const updateSatelliteSettings = useUIStore((s) => s.updateSatelliteSettings);

  const SATELLITE_CATEGORIES_METADATA = {
    spaceStations: { label: 'Stations', color: '#00FFF7' },
    brightest: { label: 'Brightest', color: '#F0ABFC' },
    weather: { label: 'Weather', color: '#A78BFA' },
    gps: { label: 'GPS', color: '#22C55E' },
    earthObs: { label: 'Earth Obs', color: '#F97316' },
    starlink: { label: 'Starlink', color: '#FFFFFF' },
    military: { label: 'Military', color: '#3B82F6' },
    other: { label: 'Other', color: '#94A3B8' },
  };

  const filteredSatellites = useMemo(() => {
    return SATELLITES.filter((sat) => {
      const matchesSearch = sat.name.toLowerCase().includes(satelliteSearchQuery.toLowerCase()) || 
                            sat.category.toLowerCase().includes(satelliteSearchQuery.toLowerCase());
      const isCategoryVisible = satelliteCategories[sat.category] !== false;
      return matchesSearch && isCategoryVisible;
    });
  }, [satelliteSearchQuery, satelliteCategories]);

  const handleSelectSatellite = (id: string, altitudeM: number) => {
    setActiveSatelliteId(id);
    useUIStore.getState().addChangeLog('TRACKER', `Locked satellite: ${id.toUpperCase()}`, 'success');
    
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      const ent = viewer.entities.getById(id);
      if (ent) {
        viewer.trackedEntity = ent;
      } else {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(0, 0, altitudeM * 2.5 + 200000),
          duration: 2.0
        });
      }
    }
  };

  // Distance computation
  const measureDistance = useMemo(() => {
    if (measureStart && measureEnd) {
      return calculateDistance(measureStart.lat, measureStart.lng, measureEnd.lat, measureEnd.lng);
    }
    return null;
  }, [measureStart, measureEnd]);

  // Search filter for landmarks and active plugin entities
  const filteredOrbitalResults = useMemo(() => {
    const term = orbitalSearchQuery.trim().toLowerCase();

    // Map static locations
    const staticMatches = locations.map(l => ({
      id: l.id,
      name: l.name,
      country: l.country,
      category: l.category,
      lat: l.lat,
      lng: l.lng,
      type: 'landmark' as const,
      raw: l
    }));

    // Map plugin entities
    const pluginMatches: any[] = [];
    const entitiesByPlugin = useStore.getState().entitiesByPlugin;
    if (entitiesByPlugin) {
      Object.entries(entitiesByPlugin).forEach(([pluginId, entities]) => {
        entities.forEach((entity) => {
          const name = entity.label || entity.id;
          const category = pluginManager.getPlugin(pluginId)?.plugin.category || 'plugin';
          pluginMatches.push({
            id: entity.id,
            name,
            country: pluginId.toUpperCase(),
            category,
            lat: entity.latitude,
            lng: entity.longitude,
            type: 'entity' as const,
            raw: entity
          });
        });
      });
    }

    const allItems = [...staticMatches, ...pluginMatches];
    if (!term) return allItems.slice(0, 5);

    return allItems.filter((item) =>
      `${item.name} ${item.country} ${item.category}`.toLowerCase().includes(term)
    );
  }, [orbitalSearchQuery, layers]);

  const applyGraphicsPreset = (preset: 'low' | 'high') => {
    if (preset === 'low') {
      updateMapConfig({
        shadowsEnabled: false,
        enableLighting: false,
        resolutionScale: 0.7,
        antiAliasing: 'none',
        maxScreenSpaceError: 64,
        showOsmBuildings: false
      });
      setShowBorders(true);
      setShowTerrain(true);
      useUIStore.getState().addChangeLog('GRAPHICS', 'Performance Preset Applied: shadows off, 0.7x scale, AA off.', 'info');
    } else {
      updateMapConfig({
        shadowsEnabled: true,
        enableLighting: true,
        resolutionScale: 1.0,
        antiAliasing: 'msaa4x',
        maxScreenSpaceError: 16,
        showOsmBuildings: true
      });
      setShowBorders(true);
      setShowTerrain(true);
      useUIStore.getState().addChangeLog('GRAPHICS', 'Cinematic Preset Applied: shadows on, 1.0x scale, MSAA 4x, OSM buildings active.', 'success');
    }
  };

  const flyToTourStep = (step: any) => {
    const viewer = (window as any).cesiumViewer;
    if (viewer) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(step.lng, step.lat, 250000), // Fly close (250km)
        duration: 2.0,
        complete: () => viewer.scene.requestRender(),
      });
      const listener = viewer.scene.preUpdate.addEventListener(() => viewer.scene.requestRender());
      setTimeout(() => listener(), 2500);
    }
  };

  const handleStartTour = (tour: any) => {
    setActiveTour(tour);
    setActiveTourStepIndex(0);
    flyToTourStep(tour.steps[0]);
    useUIStore.getState().addChangeLog('VOYAGER', `Started Guided Tour: ${tour.title}`, 'success');
  };

  if (!leftPanelOpen) return null;

  const isSpatialMode = interactionMode === 'orbital' || interactionMode === 'telescope';

  return (
    <aside className="glass-panel flex h-full w-[260px] flex-col border-r border-white/5 select-none pointer-events-auto" style={{ borderRadius: 0 }}>
      {/* Header section */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-white/5 shrink-0 bg-black/20">
        <div className="flex items-center gap-2">
          <Hexagon className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/90">
            {isSpatialMode ? 'SPATIAL HUD' : 'SILVER WOLF'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setLeftPanelOpen(false)}
          className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Main scrolling content area */}
      <div className="flex-1 overflow-y-auto scroller">
        {!isSpatialMode ? (
          // STANDARD CHAT MODE VIEW
          <div className="p-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full rounded-lg bg-white/5 py-2 pl-8 pr-3 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary/35 placeholder:text-white/20 transition-all font-mono border border-transparent"
              />
            </div>

            {/* Tools Section */}
            <div className="space-y-1">
              <FileTreeSection title="Neural Library" icon={FolderOpen} defaultOpen={true}>
                <TreeItem label="Media Assets" icon={Image} badge={0} />
                <TreeItem label="Uploaded Documents" icon={FileText} badge={0} />
                <TreeItem label="Saved Snippets" icon={Bookmark} badge={0} />
              </FileTreeSection>
            </div>

            {/* Selected Location context indicator */}
            {activeLocation && (
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Target Pointed</span>
                </div>
                <div className="mt-1 text-white/80 font-bold">{activeLocation.name}</div>
                <div className="text-white/40 mt-0.5">{activeLocation.country}</div>
              </div>
            )}

            {/* Chats Section */}
            <div className="pt-2 border-t border-white/5">
              <ChatSessionList />
            </div>
          </div>
        ) : (
          // SPATIAL AND COSMIC MODE (Accordion Controls)
          <div className="flex flex-col">
            
            {/* --- ORBITAL CONTROL HUB --- */}
            <div className="p-2.5 border-b border-white/5 bg-primary/5 text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 animate-spin-slow text-primary" />
              <span>Orbital Controls</span>
            </div>

            {/* 1. Search & Explore */}
            <CollapsibleSection
              title="Search & Explore"
              icon={Search}
              isOpen={expanded.search}
              onToggle={() => toggleSection('search')}
            >
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3 w-3 text-white/30" />
                <input
                  type="text"
                  value={orbitalSearchQuery}
                  onChange={(e) => setOrbitalSearchQuery(e.target.value)}
                  placeholder="Search landmarks, entities..."
                  className="w-full rounded bg-white/5 py-1.5 pl-7 pr-2 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono border border-white/5"
                />
              </div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto scroller font-mono text-[9px]">
                {filteredOrbitalResults.map((result) => {
                  const isSelected = result.type === 'landmark'
                    ? activeLocation && result.id === activeLocation.id
                    : useStore.getState().selectedEntity && result.id === useStore.getState().selectedEntity?.id;

                  return (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        if (result.type === 'landmark') {
                          setActiveLocation(result.raw);
                          useStore.getState().setSelectedEntity(null);
                        } else {
                          useStore.getState().setSelectedEntity(result.raw);
                          setActiveLocation(null);
                          const viewer = (window as any).cesiumViewer;
                          if (viewer) {
                            viewer.camera.flyTo({
                              destination: Cesium.Cartesian3.fromDegrees(result.lng, result.lat, result.raw.altitude ? result.raw.altitude * 2.5 + 20000 : 250000),
                              duration: 2.0
                            });
                          }
                        }
                      }}
                      className={`w-full text-left p-1.5 rounded transition-all cursor-pointer block border border-transparent ${
                        isSelected ? 'bg-primary/20 text-primary font-bold border-primary/20' : 'hover:bg-white/5 text-white/60'
                      }`}
                    >
                      <div className="truncate font-bold">{result.name}</div>
                      <div className="text-[7px] text-white/30 truncate">{result.country} · {result.category}</div>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* 2. Places / Landmarks */}
            <CollapsibleSection
              title="Saved Places"
              icon={Pin}
              isOpen={expanded.places}
              onToggle={() => toggleSection('places')}
            >
              <div className="space-y-1 max-h-[160px] overflow-y-auto scroller font-mono text-[9px]">
                {locations.map((loc) => {
                  const isSelected = activeLocation && loc.id === activeLocation.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setActiveLocation(loc)}
                      className={`earth-result-item w-full text-left p-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/5 text-white/60'
                      }`}
                    >
                      <Pin className={`h-2.5 w-2.5 shrink-0 ${isSelected ? 'text-primary' : 'text-white/20'}`} />
                      <span className="truncate">{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>

            {/* 3. Voyager Guided Tours */}
            <CollapsibleSection
              title="Voyager Stories"
              icon={Compass}
              isOpen={expanded.voyager}
              onToggle={() => toggleSection('voyager')}
            >
              <div className="space-y-2 max-h-[180px] overflow-y-auto scroller">
                {tours.map((tour) => (
                  <div key={tour.id} className="p-2 rounded border border-white/5 bg-white/5 space-y-1">
                    <div className="font-mono text-[9px] font-bold text-white/80 truncate uppercase">{tour.title}</div>
                    <p className="text-[8px] text-white/40 leading-normal line-clamp-2 uppercase font-mono">{tour.description}</p>
                    <button
                      type="button"
                      onClick={() => handleStartTour(tour)}
                      className="w-full text-center py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary font-mono text-[8px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                    >
                      Start Tour
                    </button>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* 4. Style & Graphics */}
            <CollapsibleSection
              title="Style & Graphics"
              icon={Layers}
              isOpen={expanded.style}
              onToggle={() => toggleSection('style')}
            >
              <div className="space-y-3 font-mono text-[9px] text-white/70">
                <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded border border-white/5 bg-black/30 text-[8px] text-center">
                  <button
                    type="button"
                    onClick={() => applyGraphicsPreset('low')}
                    className={`py-1 rounded transition-all cursor-pointer ${
                      mapConfig.resolutionScale < 0.85 ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    LOW (PERF)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGraphicsPreset('high')}
                    className={`py-1 rounded transition-all cursor-pointer ${
                      mapConfig.resolutionScale >= 0.85 ? 'bg-primary text-white font-bold' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    HIGH (CINEMA)
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-white/40 block text-[8px] uppercase">Imagery Source</label>
                  <select
                    value={mapConfig.baseLayerId}
                    onChange={(e) => updateMapConfig({ baseLayerId: e.target.value })}
                    className="w-full bg-[#111217] border border-white/5 rounded px-2 py-1 text-white text-[9px] focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {IMAGERY_LAYERS.map((layer) => (
                      <option key={layer.id} value={layer.id}>
                        {layer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={showBorders}
                      onChange={(e) => setShowBorders(e.target.checked)}
                      className="accent-primary"
                    />
                    <span>Labels and Borders</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={showTerrain}
                      onChange={(e) => setShowTerrain(e.target.checked)}
                      className="accent-primary"
                    />
                    <span>3D Terrain Tiles</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={showRoads}
                      onChange={(e) => setShowRoads(e.target.checked)}
                      className="accent-primary"
                    />
                    <span>Atmospheric Shadows</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px]">
                    <span>Resolution Scale</span>
                    <span className="text-primary font-bold">{mapConfig.resolutionScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={mapConfig.resolutionScale}
                    onChange={(e) => updateMapConfig({ resolutionScale: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* 5. Distance Ruler */}
            <CollapsibleSection
              title="Distance Ruler"
              icon={Ruler}
              isOpen={expanded.measure}
              onToggle={() => toggleSection('measure')}
            >
              <div className="space-y-2 font-mono text-[9px]">
                <div className="space-y-1">
                  <label className="text-white/40 block text-[8px] uppercase">Point A (Start):</label>
                  <select
                    value={measureStart?.id || ''}
                    onChange={(e) => {
                      const loc = locations.find((l) => l.id === e.target.value);
                      setMeasureStart(loc || null);
                    }}
                    className="earth-measure-select w-full bg-[#111217] border border-white/5 rounded px-2 py-1 text-white text-[9px] focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select Point A --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-white/40 block text-[8px] uppercase">Point B (End):</label>
                  <select
                    value={measureEnd?.id || ''}
                    onChange={(e) => {
                      const loc = locations.find((l) => l.id === e.target.value);
                      setMeasureEnd(loc || null);
                    }}
                    className="earth-measure-select w-full bg-[#111217] border border-white/5 rounded px-2 py-1 text-white text-[9px] focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select Point B --</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {measureDistance !== null && (
                  <div className="p-2 rounded bg-primary/10 border border-primary/20 text-center space-y-0.5 animate-pulse">
                    <span className="text-[7px] text-white/30 block uppercase font-bold tracking-widest">Calculated Distance</span>
                    <span className="text-xs text-primary font-bold">{measureDistance.toFixed(2)} km</span>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* 5.5. Satellite Tracker */}
            <CollapsibleSection
              title="Satellite Tracker"
              icon={Radio}
              isOpen={expanded.satellites}
              onToggle={() => toggleSection('satellites')}
            >
              <div className="space-y-3 font-mono text-[9px] text-white/70">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-white/30" />
                  <input
                    type="text"
                    value={satelliteSearchQuery}
                    onChange={(e) => setSatelliteSearchQuery(e.target.value)}
                    placeholder="Search satellites..."
                    className="w-full rounded bg-[#0a0b10] border border-white/5 py-1.5 pl-7 pr-2 text-[9px] text-white focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>

                {/* Category Toggles (Grid) */}
                <div className="space-y-1">
                  <label className="text-white/40 block text-[7px] uppercase tracking-wider">Categories</label>
                  <div className="grid grid-cols-2 gap-1 text-[8px]">
                    {Object.entries(SATELLITE_CATEGORIES_METADATA).map(([key, meta]) => {
                      const isToggled = satelliteCategories[key] !== false;
                      const count = key === 'spaceStations' 
                        ? SATELLITES.filter(s => s.category === key).length + (satelliteCategories['spaceStations'] !== false ? 1 : 0)
                        : SATELLITES.filter(s => s.category === key).length;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSatelliteCategory(key)}
                          className={`flex items-center justify-between px-1.5 py-1 rounded border transition-colors cursor-pointer text-left ${
                            isToggled 
                              ? 'bg-white/5 text-white border-white/10' 
                              : 'bg-transparent text-white/30 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span 
                              className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse" 
                              style={{ backgroundColor: isToggled ? meta.color : 'rgba(255,255,255,0.1)' }} 
                            />
                            <span className="truncate max-w-[65px] uppercase font-bold text-[7px]">{meta.label}</span>
                          </div>
                          <span className="text-[7px] text-white/30 font-bold shrink-0">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Controls (Trails) */}
                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/5 text-[8px] font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={satelliteSettings?.showTrails !== false}
                      onChange={(e) => updateSatelliteSettings({ showTrails: e.target.checked })}
                      className="accent-primary cursor-pointer"
                    />
                    <span>Selected Trail</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={satelliteSettings?.showAllTrails === true}
                      onChange={(e) => updateSatelliteSettings({ showAllTrails: e.target.checked })}
                      className="accent-primary cursor-pointer"
                    />
                    <span>All Trails</span>
                  </label>
                </div>

                {/* Satellite List */}
                <div className="space-y-0.5 max-h-[145px] overflow-y-auto scroller border-t border-white/5 pt-1.5">
                  {/* ISS Item */}
                  {satelliteCategories['spaceStations'] !== false && 'iss'.includes(satelliteSearchQuery.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => handleSelectSatellite('iss', 420000)}
                      className={`w-full text-left p-1 rounded transition-all cursor-pointer flex items-center justify-between border border-transparent ${
                        activeSatelliteId === 'iss' ? 'bg-primary/20 text-primary font-bold border-primary/20' : 'hover:bg-white/5 text-white/60'
                      }`}
                    >
                      <span className="truncate uppercase font-bold text-[8px]">🛰️ ISS (LIVE FEED)</span>
                      <span className="text-[7px] text-white/30 shrink-0">420KM</span>
                    </button>
                  )}

                  {/* Curated list */}
                  {filteredSatellites.map((sat) => {
                    const isSelected = activeSatelliteId === sat.id;
                    return (
                      <button
                        key={sat.id}
                        type="button"
                        onClick={() => handleSelectSatellite(sat.id, sat.altitudeM)}
                        className={`w-full text-left p-1 rounded transition-all cursor-pointer flex items-center justify-between border border-transparent ${
                          isSelected ? 'bg-primary/20 text-primary font-bold border-primary/20' : 'hover:bg-white/5 text-white/60'
                        }`}
                      >
                        <span className="truncate uppercase font-bold text-[8px]">{sat.name}</span>
                        <span className="text-[7px] text-white/30 shrink-0">{Math.round(sat.altitudeM / 1000)}KM</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CollapsibleSection>

            {/* 6. Ingestion Plugins */}
            <CollapsibleSection
              title="Ingestion Plugins"
              icon={FolderKanban}
              isOpen={expanded.plugins}
              onToggle={() => toggleSection('plugins')}
            >
              <div className="space-y-2">
                {pluginManager.getAllPlugins().map((managed) => {
                  const pId = managed.plugin.id;
                  const layerState = layers[pId] || { enabled: false, entityCount: 0, loading: false };
                  const Icon = managed.plugin.icon || FolderKanban;
                  return (
                    <div key={pId} className="p-2 rounded border border-white/5 bg-black/30 font-mono text-[9px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate uppercase font-bold text-white/80">{managed.plugin.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => pluginManager.togglePlugin(pId)}
                          className={`relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            layerState.enabled ? 'bg-primary' : 'bg-white/10'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                              layerState.enabled ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[7.5px] text-white/40 leading-relaxed uppercase">{managed.plugin.description}</p>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>


            {/* --- COSMIC TELESCOPE HUB --- */}
            {interactionMode === 'telescope' && (
              <div className="mt-4 flex flex-col">
                <div className="p-2.5 border-t border-b border-white/5 bg-primary/5 text-[9px] font-mono uppercase tracking-[0.2em] font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
                  <span>Telescope Array</span>
                </div>

                {/* 1. Star Array Presets */}
                <CollapsibleSection
                  title="Star Array Presets"
                  icon={Star}
                  isOpen={expanded.presets}
                  onToggle={() => toggleSection('presets')}
                >
                  <div className="space-y-1 max-h-[140px] overflow-y-auto scroller font-mono text-[9px]">
                    {presets.map((preset) => {
                      const isActive = telescopeTarget.name === preset.name;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setTelescopeTarget(preset);
                            setInteractionMode('telescope');
                            useUIStore.getState().addChangeLog('TELESCOPE', `Telescope target pointed: ${preset.name}`, 'success');
                          }}
                          className={`w-full text-left p-1.5 rounded transition-all cursor-pointer flex items-center justify-between gap-1.5 border border-transparent ${
                            isActive ? 'bg-primary/20 text-primary font-bold border-primary/20' : 'hover:bg-white/5 text-white/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Star className={`h-2.5 w-2.5 shrink-0 ${isActive ? 'fill-primary text-primary' : 'text-white/20'}`} />
                            <span className="truncate uppercase text-[8px]">{preset.name}</span>
                          </div>
                          <span className="text-[7px] text-white/30 shrink-0 font-normal">{preset.fov}</span>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* 2. Target Telemetry coordinates */}
                <CollapsibleSection
                  title="Target Telemetry"
                  icon={Compass}
                  isOpen={expanded.telemetry}
                  onToggle={() => toggleSection('telemetry')}
                >
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-black/25 p-2 rounded border border-white/5 text-white/50">
                    <div>
                      <span className="text-white/20 block text-[7px] uppercase">Right Ascension</span>
                      <span className="text-primary font-bold">{telescopeTarget.ra}</span>
                    </div>
                    <div>
                      <span className="text-white/20 block text-[7px] uppercase">Declination</span>
                      <span className="text-primary font-bold">{telescopeTarget.dec}</span>
                    </div>
                    <div className="col-span-2 border-t border-white/5 pt-1.5 mt-1.5">
                      <span className="text-white/20 block text-[7px] uppercase">Field of View</span>
                      <span className="text-white/80 font-bold">{telescopeTarget.fov}</span>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* 3. Astronomical Synopsis */}
                <CollapsibleSection
                  title="Astronomical Synopsis"
                  icon={Info}
                  isOpen={expanded.synopsis}
                  onToggle={() => toggleSection('synopsis')}
                >
                  <div className="p-2.5 rounded bg-black/25 border border-white/5 font-mono text-[8px] text-white/40 leading-relaxed uppercase">
                    {telescopeTarget.description}
                  </div>
                </CollapsibleSection>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Bottom Profile and Settings bar */}
      <div className="mt-auto flex h-14 items-center justify-between border-t border-white/5 px-4 bg-black/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="text-[10px] font-bold text-white/80 leading-none">OPERATOR</span>
            <span className="text-[8px] text-white/30 uppercase mt-0.5">Level 6 Sec</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all cursor-pointer"
          title="Open Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>
    </aside>
  );
}
