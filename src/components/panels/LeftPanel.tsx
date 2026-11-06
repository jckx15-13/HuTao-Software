import { useState, useMemo, useRef } from 'react';
import {
  Hexagon,
  Search,
  FolderOpen,
  Image,
  FileText,
  Bookmark,
  User,
  Settings,
  Flame,
  ChevronDown,
  FolderKanban,
  Star,
  Plus,
  Trash2,
  FolderGit,
  MessageSquare,
  ChevronRight,
  CircuitBoard,
  Globe2,
  Puzzle,
  DownloadCloud
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import { useLayout } from '@/core/layout/engine/useLayout';
import { locations } from '@/data/locations';
import { pluginManager } from '@/core/plugins/PluginManager';
import { IMAGERY_LAYERS } from '@/core/globe/ImageryProviderFactory';
import { useViewportSize } from '@/hooks/useViewportSize';
import { buildSpatialPanelGeometry } from './panelGeometry';
import { PanelToggleButton } from '../common/PanelToggleButton';

// ============================================================================
// CONSOLIDATED SUB-COMPONENTS
// ============================================================================

interface FileTreeSectionProps {
  title: string;
  icon: React.ComponentType<any>;
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
        className="flex min-h-11 w-full items-center justify-between px-2 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors text-xs font-mono uppercase tracking-widest font-bold"
      >
        <div className="flex items-center gap-1.5">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span>{title}</span>
        </div>
        {itemCount !== undefined && itemCount > 0 && (
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-xs text-white/50">{itemCount}</span>
        )}
      </button>

      {isOpen && <div className="flex flex-col border-l border-white/5 ml-3.5 pl-1.5 mt-0.5 mb-1.5">{children}</div>}
    </div>
  );
}

interface TreeItemProps {
  label: string;
  icon?: React.ComponentType<any>;
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
      className={`flex min-h-11 w-full items-center justify-between rounded px-2 text-sm font-mono text-white/60 hover:bg-white/5 hover:text-white/90 transition-all select-none cursor-pointer ${
        selected ? 'bg-primary/15 text-primary border-l-2 border-primary font-bold' : ''
      }`}
      style={{ paddingLeft: `${depth * 8 + 8}px` }}
    >
      <div className="flex items-center gap-2 truncate">
        {Icon && <Icon className={`h-3.5 w-3.5 shrink-0 ${selected ? 'text-primary' : 'text-white/30'}`} />}
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span
          className={`rounded px-1 text-xs ${selected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}
        >
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
              className={`group flex min-h-11 w-full items-center justify-between rounded px-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white/95 transition-all select-none cursor-pointer border-l-2 ${
                isActive ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-white/30'}`} />
                <span>{chat.name}</span>
              </div>
              <span className="rounded bg-primary/20 px-1 text-xs text-primary">GLOBAL</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-2 text-xs uppercase tracking-widest text-white/30 font-bold select-none">
        <span>Project Workspaces</span>
        <button
          type="button"
          onClick={handleCreateProjectChat}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
          title="New Project Chat"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {projectChats.length === 0 ? (
          <div className="px-2.5 py-1 text-xs text-white/20 italic">No project workspaces.</div>
        ) : (
          projectChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={`group flex min-h-11 w-full items-center justify-between rounded px-2.5 text-sm text-white/70 hover:bg-white/5 transition-all ${
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
                  className="inline-flex min-h-11 min-w-11 items-center justify-center opacity-0 group-hover:opacity-100 rounded hover:bg-white/10 text-white/30 hover:text-red-400 transition-all"
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

export function LeftPanel() {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const setCurrentPage = useUIStore((s) => s.setCurrentPage);
  const activeLocation = useUIStore((s) => s.activeLocation);
  const setActiveLocation = useUIStore((s) => s.setActiveLocation);

  const interactionMode = useUIStore((s) => s.interactionMode);

  const setSpaceBlendOpacity = useUIStore((s) => s.setSpaceBlendOpacity);
  const setSpaceInteractionTarget = useUIStore((s) => s.setSpaceInteractionTarget);

  // Zustand Store integrations
  const mapConfig = useStore((s) => s.mapConfig);
  const updateMapConfig = useStore((s) => s.updateMapConfig);
  const layers = useStore((s) => s.layers);
  const entitiesByPlugin = useStore((s) => s.entitiesByPlugin);

  const [searchQuery, setSearchQuery] = useState('');

  const [wwvBarTab, setWwvBarTab] = useState<'layers' | 'imagery' | 'favorites' | 'import' | 'plugins'>('layers');
  const [wwvBarSearch, setWwvBarSearch] = useState('');

  const viewportSize = useViewportSize();
  const spatialPanelStyle = useMemo(
    () =>
      buildSpatialPanelGeometry({
        placement: 'left',
        viewport: viewportSize,
        leftPanelOpen,
        rightPanelOpen
      }),
    [leftPanelOpen, rightPanelOpen, viewportSize]
  );

  const { hidden: hiddenSlots } = useLayout();
  const railHidden = hiddenSlots.includes('leftRail');
  const isSpatialMode = interactionMode === 'orbital' || interactionMode === 'telescope';
  const categoryLabels: Record<string, string> = {
    aviation: 'Aviation', maritime: 'Maritime', 'natural-disaster': 'Natural Disasters',
    conflict: 'Conflict', infrastructure: 'Infrastructure', cyber: 'Cyber', economic: 'Economic',
    military: 'Security & Defense', space: 'Space', custom: 'Other Sources'
  };
  const spatialPluginGroups = new Map<string, ReturnType<typeof pluginManager.getAllPlugins>>();
  const searchTerm = wwvBarSearch.trim().toLowerCase();
  pluginManager.getAllPlugins().forEach((managed) => {
    const { name, description, id, category } = managed.plugin;
    if (searchTerm && ![name, description, id].some((value) => value?.toLowerCase().includes(searchTerm))) return;
    const groupKey = category || 'custom';
    const group = spatialPluginGroups.get(groupKey) || [];
    group.push(managed);
    spatialPluginGroups.set(groupKey, group);
  });

  if (!leftPanelOpen) return null;

  const backdropClassName = railHidden
    ? 'fixed inset-0 bg-black/60 backdrop-blur-sm z-chrome pointer-events-auto'
    : 'fixed inset-0 bg-black/60 backdrop-blur-sm z-chrome pointer-events-auto min-[760px]:hidden';

  return (
    <>
      <div onClick={() => setLeftPanelOpen(false)} className={backdropClassName} aria-hidden="true" />
      <aside
        className="glass-panel-strong flex flex-col select-none pointer-events-auto transition-all duration-300 fixed rounded-md border border-white/10 shadow-2xl z-panel h-auto min-h-0"
        style={spatialPanelStyle}
      >
        {/* Header section */}
        <div className="flex h-12 items-center justify-between px-4 border-b border-white/10 shrink-0 bg-black/45">
          <div className="flex items-center gap-2">
            {/* Static: this hexagon is the panel's brand mark, not a status
              indicator, so it should not pulse. */}
            <Hexagon className="h-5 w-5 text-primary" />
            <span
              className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/90 glitch-target hover-glitch cursor-pointer"
              data-text={isSpatialMode ? 'SPATIAL HUD' : 'SILVER WOLF'}
            >
              {isSpatialMode ? 'SPATIAL HUD' : 'SILVER WOLF'}
            </span>
          </div>
          {/* Shared control: identical box, icon and hit area to the right panel
            and header toggles. */}
          <PanelToggleButton
            side="left"
            open={leftPanelOpen}
            onToggle={() => setLeftPanelOpen(false)}
            label="spatial sidebar"
          />
        </div>

        {/* Main scrolling content area */}
        <div
          ref={contentScrollRef}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain scroller ${isSpatialMode ? 'pb-40' : ''}`}
        >
          {!isSpatialMode ? (
            // STANDARD CHAT MODE VIEW
            <div className="p-3 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/30" />
                <input
                  id="search-workspaces"
                  name="search-workspaces"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search project workspaces"
                  placeholder="Search workspaces..."
                  className="min-h-11 w-full rounded-lg bg-white/5 py-2 pl-8 pr-3 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary/35 placeholder:text-white/20 transition-all font-mono border border-transparent"
                />
              </div>

              {/* Tools Section */}
              <div className="space-y-1">
                <FileTreeSection title="Local Library" icon={FolderOpen} defaultOpen={true}>
                  <TreeItem label="Media Assets" icon={Image} badge={0} />
                  <TreeItem label="Uploaded Documents" icon={FileText} badge={0} />
                  <TreeItem label="Saved Snippets" icon={Bookmark} badge={0} />
                </FileTreeSection>
              </div>

              {/* Selected Location context indicator */}
              {activeLocation && (
                <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 font-mono text-xs">
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
            // Data-source navigation follows WorldWide View's layered sidebar:
            // the same tab structure with categories, search, source status,
            // and compact layer controls, styled with Silver Wolf theme tokens.
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-2.5 pt-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
                <span>Data Sources</span>
                <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] tabular-nums text-white/45">
                  {pluginManager.getAllPlugins().length}
                </span>
              </div>

              <div
                className="wwv-panel-tabs px-2.5"
                onWheel={(e) => {
                  e.currentTarget.scrollLeft += e.deltaY;
                }}
              >
                <button
                  type="button"
                  onClick={() => setWwvBarTab('layers')}
                  className={`wwv-panel-tab ${wwvBarTab === 'layers' ? 'wwv-panel-tab--active' : ''}`}
                  title="Data Layers"
                  aria-label="Data Layers"
                >
                  <CircuitBoard size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setWwvBarTab('imagery')}
                  className={`wwv-panel-tab ${wwvBarTab === 'imagery' ? 'wwv-panel-tab--active' : ''}`}
                  title="Imagery"
                  aria-label="Imagery"
                >
                  <Globe2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setWwvBarTab('favorites')}
                  className={`wwv-panel-tab ${wwvBarTab === 'favorites' ? 'wwv-panel-tab--active' : ''}`}
                  title="Favorites"
                  aria-label="Favorites"
                >
                  <Star size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setWwvBarTab('import')}
                  className={`wwv-panel-tab ${wwvBarTab === 'import' ? 'wwv-panel-tab--active' : ''}`}
                  title="Import"
                  aria-label="Import"
                >
                  <DownloadCloud size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setWwvBarTab('plugins')}
                  className={`wwv-panel-tab ${wwvBarTab === 'plugins' ? 'wwv-panel-tab--active' : ''}`}
                  title="Plugins"
                  aria-label="Plugins"
                >
                  <Puzzle size={20} />
                </button>
              </div>

              {wwvBarTab === 'layers' && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="px-2.5 pb-2.5">
                    <div className="flex items-center rounded border border-white/5 bg-white/5 px-2">
                      <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
                      <input
                        id="wwv-bar-search"
                        name="wwv-bar-search"
                        type="text"
                        aria-label="Search landmarks and orbital entities"
                        placeholder="Search layers..."
                        value={wwvBarSearch}
                        onChange={(e) => setWwvBarSearch(e.target.value)}
                        className="min-h-11 flex-1 border-none bg-transparent px-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="scroller min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
                    {spatialPluginGroups.size > 0 ? Array.from(spatialPluginGroups.entries()).map(([category, plugins]) => (
                      <section key={category} className="mb-3 last:mb-0" aria-label={`${categoryLabels[category] || category} data sources`}>
                        <h3 className="sticky top-0 z-[1] mb-1 flex items-center justify-between bg-[#0b0d14]/95 px-1 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 backdrop-blur">
                          {categoryLabels[category] || category}
                          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[8px] tabular-nums tracking-normal text-white/35">{plugins.length}</span>
                        </h3>
                        <ul className="space-y-1.5">
                          {plugins.map((managed) => {
                        const pId = managed.plugin.id;
                        const layerState = layers[pId] || { enabled: false, entityCount: 0, loading: false };
                        const entityCount = entitiesByPlugin[pId]?.length ?? layerState.entityCount ?? 0;
                        const Icon = managed.plugin.icon || FolderKanban;
                        return (
                          <li key={pId} className="list-none">
                            <div className={`rounded-md border px-2 py-2 transition-colors ${layerState.enabled ? 'border-primary/25 bg-primary/[0.07]' : 'border-white/[0.07] bg-black/25 hover:border-white/15 hover:bg-white/[0.035]'}`}>
                              <div className="flex items-start gap-2">
                                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${layerState.enabled ? 'bg-primary/15 text-primary' : 'bg-white/[0.04] text-white/45'}`}>
                                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase leading-4 tracking-wide text-white/85" title={managed.plugin.name}>{managed.plugin.name}</span>
                                    {layerState.loading ? <span className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border border-primary/30 border-t-primary" role="status" aria-label="Loading" /> : entityCount > 0 ? <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] tabular-nums text-white/45">{entityCount.toLocaleString()}</span> : null}
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-[9px] leading-[1.35] text-white/45">{managed.plugin.description || 'No description provided.'}</p>
                                </div>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={layerState.enabled}
                                  onClick={() => pluginManager.togglePlugin(pId)}
                                  aria-label={`${layerState.enabled ? 'Disable' : 'Enable'} ${managed.plugin.name}`}
                                  className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-white/10 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${layerState.enabled ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                  <span className={`pointer-events-none h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${layerState.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                          })}
                        </ul>
                      </section>
                    )) : <p className="px-1 py-5 text-center text-[10px] text-white/40">No data sources match “{wwvBarSearch}”.</p>}
                  </div>
                </div>
              )}

              {wwvBarTab === 'imagery' && (
                <div className="scroller min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 pb-2.5 font-mono text-xs text-white/70">
                  <div className="space-y-1">
                    <label htmlFor="wwv-bar-imagery-source" className="block text-xs uppercase text-white/40">
                      Imagery Source
                    </label>
                    <select
                      id="wwv-bar-imagery-source"
                      name="wwv-bar-imagery-source"
                      value={mapConfig.baseLayerId}
                      onChange={(e) => updateMapConfig({ baseLayerId: e.target.value })}
                      className="min-h-11 w-full cursor-pointer rounded border border-white/5 bg-[#111217] px-2 py-1 text-xs text-white focus:border-primary focus:outline-none"
                    >
                      {IMAGERY_LAYERS.map((layer) => (
                        <option key={layer.id} value={layer.id}>
                          {layer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Resolution Scale</span>
                      <span className="font-bold text-primary">{mapConfig.resolutionScale.toFixed(2)}x</span>
                    </div>
                    <input
                      id="wwv-bar-resolution-scale"
                      name="wwv-bar-resolution-scale"
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={mapConfig.resolutionScale}
                      onChange={(e) => updateMapConfig({ resolutionScale: parseFloat(e.target.value) })}
                      className="range-hit-target w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-primary"
                    />
                  </div>
                </div>
              )}

              {wwvBarTab === 'favorites' && (
                <div className="scroller min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-2.5 font-mono text-xs">
                  {/* Satellite / location filter */}
                  <div className="mb-2 flex items-center rounded border border-white/5 bg-white/5 px-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
                    <input
                      id="wwv-bar-satellite-search"
                      name="wwv-bar-satellite-search"
                      type="text"
                      aria-label="Search satellites"
                      placeholder="Search satellites..."
                      className="min-h-11 flex-1 border-none bg-transparent px-2 text-xs text-white outline-none"
                    />
                  </div>
                  {locations.map((loc) => {
                    const isSelected = activeLocation && loc.id === activeLocation.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setSpaceInteractionTarget('earth');
                          setSpaceBlendOpacity(1.0);
                          setActiveLocation(loc);
                        }}
                        className={`earth-result-item flex min-h-11 w-full items-center gap-1.5 rounded p-1.5 text-left transition-all cursor-pointer ${
                          isSelected ? 'bg-primary/20 text-primary font-bold' : 'hover:bg-white/5 text-white/60'
                        }`}
                      >
                        <Star className={`h-2.5 w-2.5 shrink-0 ${isSelected ? 'text-primary' : 'text-white/20'}`} />
                        <span className="truncate">{loc.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {wwvBarTab === 'import' && (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center font-mono text-xs text-white/35">
                  <DownloadCloud className="h-6 w-6 text-white/15" />
                  <p>
                    GeoJSON import has no Silver Wolf VI equivalent yet — WWV&apos;s ImportPanel reads a local
                    data-engine seeder pipeline this app doesn&apos;t have.
                  </p>
                </div>
              )}

              {wwvBarTab === 'plugins' && (
                <div className="scroller min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-2.5">
                  {pluginManager.getAllPlugins().map((managed) => {
                    const pId = managed.plugin.id;
                    const layerState = layers[pId] || { enabled: false, entityCount: 0, loading: false };
                    return (
                      <div
                        key={pId}
                        className="flex items-center justify-between gap-2 rounded border border-white/5 bg-black/30 p-1.5 font-mono text-xs"
                      >
                        <span className="truncate font-bold uppercase text-white/80">{managed.plugin.name}</span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            layerState.enabled ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {layerState.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Profile and Settings bar */}
        {!isSpatialMode && (
          <div className="mt-auto flex h-14 items-center justify-between border-t border-white/5 px-4 bg-black/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col font-mono">
                <span className="text-xs font-bold text-white/80 leading-none">OPERATOR</span>
                <span className="text-xs text-white/30 uppercase mt-0.5">Local session</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage('settings')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white/80 transition-all cursor-pointer"
              title="Open Settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
