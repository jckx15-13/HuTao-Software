import { useUIStore } from '@/store/uiStore';
import { useStore } from '../../core/state/store';
import { pluginManager } from '../../core/plugins/PluginManager';
import type { GeoEntity } from '@/core/plugins/PluginTypes';
import { DiagnosticPanel } from '../DiagnosticPanel';
import { TelemetryPanel } from '../TelemetryPanel';
import { OdysseusConsole } from '../dev/OdysseusConsole';
import {
  ChevronRight,
  ChevronLeft,
  Globe,
  Terminal,
  Info,
  MapPin,
  Radio,
  Compass,
  X,
  ArrowLeft,
  RotateCw,
  ExternalLink as ExtLink,
  Bug,
  Activity,
  Plane,
  Camera,
  Shield
} from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import type { RightPanelTab } from '@/store/uiStore';
import { useHorizontalOverflow } from './useHorizontalOverflow';
import { WWV_ASSET_AUDIT, WWV_ORBITAL_ASSET_BY_CATEGORY } from '@/assets/wwvVisualAssets';
import { useSatelliteCatalog } from '@/hooks/useSatelliteCatalog';
import { propagateCircularOrbit, calculateOrbitalSpeed, calculateOrbitalPeriod } from '../../lib/simulation';
import { useViewportSize } from '@/hooks/useViewportSize';
import { buildSpatialPanelGeometry } from './panelGeometry';

/**
 * Tab strip contents. Data-driven so the row has exactly one markup path — the
 * six hand-copied buttons this replaced made the overflow fix impossible to
 * apply consistently.
 */
const RIGHT_PANEL_TABS: ReadonlyArray<{ id: RightPanelTab; label: string }> = [
  { id: 'context', label: 'Context' },
  { id: 'browser', label: 'Browser' },
  { id: 'changes', label: 'Changes' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'telemetry', label: 'Telemetry' },
  { id: 'odysseus', label: 'Odysseus' }
];

export function RightPanel() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);

  const rightPanelTab = useUIStore((s) => s.rightPanelTab);
  const setRightPanelTab = useUIStore((s) => s.setRightPanelTab);

  const interactionMode = useUIStore((s) => s.interactionMode);
  const activeLocation = useUIStore((s) => s.activeLocation);
  const setActiveLocation = useUIStore((s) => s.setActiveLocation);

  const issFeedOpen = useUIStore((s) => s.issFeedOpen);
  const setIssFeedOpen = useUIStore((s) => s.setIssFeedOpen);
  const issTelemetry = useUIStore((s) => s.issTelemetry);

  const browserUrl = useUIStore((s) => s.browserUrl);
  const setBrowserUrl = useUIStore((s) => s.setBrowserUrl);
  const changeLogs = useUIStore((s) => s.changeLogs);

  const activeSatelliteId = useUIStore((s) => s.activeSatelliteId);
  const setActiveSatelliteId = useUIStore((s) => s.setActiveSatelliteId);

  // Core Zustand state
  const selectedEntity = useStore((s) => s.selectedEntity);

  // Browser navigation and control states
  const [addressInput, setAddressInput] = useState(browserUrl);
  const [refreshKey, setRefreshKey] = useState(0);
  const [history, setHistory] = useState<string[]>([browserUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isFallbackMode = typeof window !== 'undefined' && window.location.search.includes('fallback');
  const viewportSize = useViewportSize();
  const spatialPanelStyle = useMemo(
    () =>
      buildSpatialPanelGeometry({
        placement: 'right',
        viewport: viewportSize,
        leftPanelOpen,
        rightPanelOpen
      }),
    [leftPanelOpen, rightPanelOpen, viewportSize]
  );

  useEffect(() => {
    setAddressInput(browserUrl);
    setHistory((previousHistory) => {
      const existingIndex = previousHistory.lastIndexOf(browserUrl);
      if (existingIndex >= 0) {
        setHistoryIndex(existingIndex);
        return previousHistory;
      }

      const nextHistory =
        previousHistory[previousHistory.length - 1] === browserUrl ? previousHistory : [...previousHistory, browserUrl];
      setHistoryIndex(nextHistory.length - 1);
      return nextHistory;
    });
  }, [browserUrl]);

  // Search/Wikipedia link auto-sync when a landmark or plugin entity is selected
  useEffect(() => {
    if (activeLocation) {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(activeLocation.name + ' Wikipedia')}`;
      setBrowserUrl(searchUrl);
    } else if (selectedEntity) {
      const query = selectedEntity.label || selectedEntity.id;
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      setBrowserUrl(searchUrl);
    }
  }, [activeLocation, selectedEntity, setBrowserUrl]);

  const handleNavigate = (url: string) => {
    let target = url.trim();
    if (!target) return;

    const isUrl = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i.test(target);
    if (!isUrl) {
      target = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    setBrowserUrl(target);
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(target);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setBrowserUrl(history[prevIndex]);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleHome = () => {
    const defaultUrl = 'https://html.duckduckgo.com/html/';
    setBrowserUrl(defaultUrl);
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(defaultUrl);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  // Tab strip overflow. The six tabs measure ~424px of content against a ~293px
  // header at 1280px wide, so "Odysseus" sits off-screen with nothing to signal
  // that the row scrolls. Everything below is driven by that live measurement.
  const tabButtonRefs = useRef<Partial<Record<RightPanelTab, HTMLButtonElement | null>>>({});
  const { hasOverflow, canScrollStart, canScrollEnd, attachScroller, scrollByPage, revealChild } =
    useHorizontalOverflow<HTMLDivElement>();

  // Whatever the active tab is — including one selected from elsewhere in the
  // app (globe click, left panel, keyboard) — must be visible, not parked in the
  // clipped region.
  useEffect(() => {
    if (!rightPanelOpen) return;
    revealChild(tabButtonRefs.current[rightPanelTab]);
    // canScrollStart/canScrollEnd are deliberately NOT deps: they change as a
    // RESULT of this scroll, and re-running on them would be a feedback loop.
  }, [rightPanelTab, rightPanelOpen, hasOverflow, revealChild]);

  if (!rightPanelOpen) return null;

  const isSpatialMode = interactionMode === 'orbital' || interactionMode === 'telescope';

  return (
    <aside
      className="glass-panel-strong flex flex-col select-none pointer-events-auto transition-all duration-300 fixed rounded-xl border border-white/10 shadow-2xl z-40 h-auto bg-black/75"
      style={spatialPanelStyle}
    >
      {/* Header and Tab Switcher */}
      <div className="flex min-h-14 items-center justify-between gap-2 border-b border-white/10 bg-black/45 px-3 py-1.5">
        {/* Tab strip: horizontally scrollable, with edge fades and paging arrows
            that appear ONLY while the row actually overflows. The arrows sit
            outside the measured scroller on purpose — an overlay affordance is
            what buried "Telemetry" and "Odysseus" under un-clickable pixels, and
            an in-flow control can only ever shrink the box, so it cannot flip the
            overflow measurement back and forth. */}
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canScrollStart}
              className="inline-flex min-h-11 w-7 shrink-0 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 disabled:pointer-events-none disabled:opacity-20"
              aria-label="Scroll section tabs left"
              title="Scroll tabs left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="relative min-w-0 flex-1">
            <div
              ref={attachScroller}
              role="group"
              aria-label="Right panel sections"
              className="flex min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain pr-1 font-mono text-[10px] scroller"
            >
              {RIGHT_PANEL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabButtonRefs.current[tab.id] = node;
                  }}
                  type="button"
                  onClick={() => setRightPanelTab(tab.id)}
                  aria-pressed={rightPanelTab === tab.id}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded px-2 transition-colors ${
                    rightPanelTab === tab.id
                      ? 'text-primary bg-primary/10 font-bold'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Edge fades. Absolutely positioned AFTER the scroller in DOM order,
                so they paint over it without needing a z-index of their own, and
                pointer-events-none so they never intercept a tab click. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/85 via-black/40 to-transparent transition-opacity duration-200 ${
                canScrollStart ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/85 via-black/40 to-transparent transition-opacity duration-200 ${
                canScrollEnd ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {hasOverflow && (
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canScrollEnd}
              className="inline-flex min-h-11 w-7 shrink-0 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 disabled:pointer-events-none disabled:opacity-20"
              aria-label="Scroll section tabs right"
              title="Scroll tabs right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Separates the tab-paging chevrons from the panel-collapse chevron, which
            would otherwise read as a third scroll arrow. */}
        <span aria-hidden="true" className="h-6 w-px shrink-0 bg-white/10" />

        <button
          type="button"
          onClick={() => setRightPanelOpen(false)}
          /* shrink-0: without it flex compresses this button while the adjacent
             tab scroller keeps its width, and the last tab (Telemetry) renders
             over it — measured 50% overlap at 1366px. */
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
          title="Collapse Panel"
          aria-label="Collapse right panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroller">
        {/* Tab 1: Context */}
        {rightPanelTab === 'context' && (
          <div className="space-y-4">
            {/* If ISS Live Feed is open */}
            {issFeedOpen && (
              <div className="glass-panel p-3 border border-cyan-500/25 bg-cyan-950/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    <span>{isFallbackMode ? 'ISS CAMERA UNAVAILABLE' : 'ISS CAMERA FEED'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIssFeedOpen(false)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-white/5 text-white/30 hover:text-white/70"
                    aria-label="Close ISS camera panel"
                    title="Close ISS camera panel"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Live stream video frame */}
                <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                  {isFallbackMode ? (
                    <div className="text-cyan-300 font-mono text-[9px] text-center p-4 leading-relaxed">
                      Camera stream disabled in fallback mode. Satellite telemetry may still update below.
                    </div>
                  ) : (
                    <iframe
                      src="https://www.ustream.tv/embed/17074538?html5=1&autoplay=1&mute=1"
                      title="ISS Live Camera Feed"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full border-none"
                    />
                  )}
                </div>

                {/* Telemetry info */}
                {issTelemetry ? (
                  <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-white/70 bg-black/25 p-2 rounded border border-white/5">
                    <div>
                      <span className="text-white/30 block uppercase">Latitude</span>
                      <span className="text-cyan-400">{issTelemetry.latitude.toFixed(4)}°</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase">Longitude</span>
                      <span className="text-cyan-400">{issTelemetry.longitude.toFixed(4)}°</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase">Altitude</span>
                      <span>{Math.round(issTelemetry.altitude)} km</span>
                    </div>
                    <div>
                      <span className="text-white/30 block uppercase">Velocity</span>
                      <span>{Math.round(issTelemetry.velocity)} km/h</span>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-[8px] text-white/30 italic text-center">
                    Connecting telemetry link...
                  </div>
                )}
              </div>
            )}

            {/* Landmark Details */}
            {activeSatelliteId ? (
              <SatelliteTelemetryCard satId={activeSatelliteId} />
            ) : activeLocation ? (
              <div className="space-y-3">
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 shadow-md">
                  <img src={activeLocation.image} alt={activeLocation.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <span className="text-[8px] bg-primary/80 text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider font-mono">
                      {activeLocation.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm tracking-wide text-white">{activeLocation.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>{activeLocation.country}</span>
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">{activeLocation.description}</p>

                <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
                  <div className="flex items-center justify-between text-white/50">
                    <span className="uppercase">Coordinates</span>
                    <span>
                      {activeLocation.lat.toFixed(4)}°N, {activeLocation.lng.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/50">
                    <span className="uppercase">Elevation</span>
                    <span>{activeLocation.elevation}</span>
                  </div>
                </div>

                {/* Facts card list */}
                {activeLocation.facts && activeLocation.facts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary block">
                      Landmark Codex
                    </span>
                    {activeLocation.facts.map((fact, i) => (
                      <div key={i} className="glass-panel p-2.5 text-[10px] text-white/70 leading-relaxed">
                        {fact}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedEntity?.pluginId === 'wwv-aviation' ? (
              <AviationTelemetryCard entity={selectedEntity} />
            ) : selectedEntity?.pluginId === 'wwv-public-cameras' ? (
              <PublicCameraTelemetryCard entity={selectedEntity} />
            ) : selectedEntity?.pluginId === 'wwv-military-bases' ? (
              <MilitaryBaseTelemetryCard entity={selectedEntity} />
            ) : selectedEntity ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm tracking-wide text-white">
                    {selectedEntity.label || selectedEntity.id}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-primary font-bold uppercase tracking-wider">
                    <span>
                      {pluginManager.getPlugin(selectedEntity.pluginId)?.plugin.name || selectedEntity.pluginId}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
                  <div className="flex items-center justify-between text-white/50">
                    <span className="uppercase">Latitude</span>
                    <span className="text-cyan-400">{selectedEntity.latitude.toFixed(5)}°</span>
                  </div>
                  <div className="flex items-center justify-between text-white/50">
                    <span className="uppercase">Longitude</span>
                    <span className="text-cyan-400">{selectedEntity.longitude.toFixed(5)}°</span>
                  </div>
                  {selectedEntity.altitude !== undefined && (
                    <div className="flex items-center justify-between text-white/50">
                      <span className="uppercase">Altitude</span>
                      <span>{(selectedEntity.altitude / 1000).toFixed(1)} km</span>
                    </div>
                  )}
                  {selectedEntity.timestamp && (
                    <div className="flex items-center justify-between text-white/50">
                      <span className="uppercase">
                        {selectedEntity.properties?.staticDataset ? 'Dataset Time' : 'Telemetry Time'}
                      </span>
                      <span>{new Date(selectedEntity.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                {selectedEntity.properties && Object.keys(selectedEntity.properties).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary block">
                      Telemetry Details
                    </span>
                    <div className="space-y-1.5 font-mono text-[9px] scroller max-h-[300px] overflow-y-auto pr-1">
                      {Object.entries(selectedEntity.properties)
                        .filter(
                          ([k]) =>
                            k !== 'rawEntity' &&
                            selectedEntity.properties[k] !== null &&
                            selectedEntity.properties[k] !== undefined
                        )
                        .map(([key, value]) => {
                          const displayLabel = key.replace(/_/g, ' ').toUpperCase();
                          let displayValue = '';
                          if (typeof value === 'boolean') {
                            displayValue = value ? 'TRUE' : 'FALSE';
                          } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value);
                          } else {
                            displayValue = String(value);
                          }

                          return (
                            <div
                              key={key}
                              className="glass-panel p-2 flex flex-col gap-0.5 border border-white/5 bg-black/15 rounded"
                            >
                              <span className="text-white/30 text-[8px]">{displayLabel}</span>
                              <span className="text-white/80 font-bold break-all">{displayValue}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !issFeedOpen && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-white/20 font-mono space-y-2">
                  <Info className="h-8 w-8 text-white/10" />
                  <span className="text-[10px] uppercase tracking-wider">No Subject Targetted</span>
                  <span className="text-[8px] max-w-[200px] leading-relaxed">
                    Select a marker on the globe or search locations to pull coordinates telemetry.
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {/* Tab 2: Sandboxed Agent Browser */}
        {rightPanelTab === 'browser' && (
          <div className="space-y-3 flex flex-col h-full select-text">
            {/* Browser Control Bar */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-lg border border-white/5 font-mono text-[9px] pointer-events-auto">
              <button
                type="button"
                onClick={handleBack}
                disabled={historyIndex <= 0}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white/70 transition-colors"
                aria-label="Go back in embedded browser"
                title="Back"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                aria-label="Refresh embedded browser frame"
                title="Refresh Frame"
              >
                <RotateCw size={12} />
              </button>
              <button
                type="button"
                onClick={handleHome}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                aria-label="Open embedded browser home page"
                title="Home Page"
              >
                <Globe size={12} />
              </button>
              <div className="flex min-h-11 flex-1 items-center gap-1 rounded border border-white/5 bg-black/40 px-2 py-1">
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNavigate(addressInput);
                    }
                  }}
                  className="min-h-11 w-full bg-transparent text-[8px] text-white/80 focus:outline-none placeholder:text-white/20 select-text"
                  placeholder="URL or search query..."
                  aria-label="Embedded browser URL or search query"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const opened = window.open(browserUrl, '_blank', 'noopener,noreferrer');
                  if (opened) opened.opener = null;
                }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                aria-label="Open embedded browser URL in new window"
                title="Open in new window"
              >
                <ExtLink size={12} />
              </button>
            </div>

            {/* Sandboxed iframe viewport */}
            <div className="relative flex-1 flex h-[min(400px,45vh)] min-h-[220px] w-full flex-col overflow-hidden rounded-xl border border-white/5 bg-black shadow-lg pointer-events-auto flex items-center justify-center">
              {window.location.search.includes('fallback') ? (
                <div className="text-cyan-400 font-mono text-[9px] text-center p-4">
                  [BROWSER VIEWPORT MOCKED FOR: {browserUrl}]
                </div>
              ) : (
                <iframe
                  key={refreshKey}
                  src={browserUrl}
                  sandbox="allow-scripts allow-popups allow-forms"
                  className="flex-1 h-full w-full border-none bg-black"
                  title="Agent Browser Frame"
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Changes timeline */}
        {rightPanelTab === 'changes' && (
          <div className="space-y-3 font-mono">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-2">
              SYSTEM TELEMETRY LOG
            </span>
            {changeLogs.length > 0 ? (
              <div className="relative border-l border-white/10 pl-3.5 ml-1.5 space-y-4 text-[9px] py-1 max-h-[min(500px,45vh)] overflow-y-auto scroller">
                {changeLogs.map((log) => {
                  let badgeBg = 'bg-primary ring-primary-hover/20';
                  if (log.level === 'success') badgeBg = 'bg-green-500 ring-green-950';
                  else if (log.level === 'warning') badgeBg = 'bg-yellow-500 ring-yellow-950';
                  else if (log.level === 'error') badgeBg = 'bg-red-500 ring-red-950';
                  else if (log.level === 'info') badgeBg = 'bg-cyan-400 ring-cyan-950';

                  return (
                    <div key={log.id} className="relative">
                      <div className={`absolute -left-[19.5px] top-1 h-2 w-2 rounded-full ${badgeBg}`} />
                      <div className="text-white/30">
                        {log.timestamp} // {log.category}
                      </div>
                      <div className="text-white/80 mt-0.5">{log.message}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[9px] text-white/30 italic py-4">No events logged yet.</div>
            )}
          </div>
        )}

        {/* Tab 4: Diagnostic Engine */}
        {rightPanelTab === 'diagnostics' && (
          <div className="h-full">
            <DiagnosticPanel />
          </div>
        )}

        {/* Tab 5: DataBus Telemetry */}
        {rightPanelTab === 'telemetry' && (
          <div className="h-full">
            <TelemetryPanel />
          </div>
        )}

        {/* Tab 6: Odysseus Console */}
        {rightPanelTab === 'odysseus' && (
          <div className="h-full">
            <OdysseusConsole />
          </div>
        )}
      </div>
    </aside>
  );
}

function AviationTelemetryCard({ entity }: { entity: GeoEntity }) {
  const properties = entity.properties || {};
  const callsign = String(properties.callsign || entity.label || entity.id);
  const operator = String(properties.operator || 'WorldWide Telescope sample aircraft');
  const kind = String(properties.kind || 'civil');
  const altitudeKm = Number(entity.altitude || 0) / 1000;
  const speed = Number(entity.speed || properties.speed_mps || 0);
  const speedKmh = speed * 3.6;
  const heading = Number(entity.heading || 0);
  const iconUrl = String(properties.iconUrl || properties.visualAssetUrl || '');
  const modelUrl = String(properties.modelUrl || '');
  const sourcePath = String(properties.sourcePath || `${WWV_ASSET_AUDIT.sourceRoot}/airplane/scene.gltf`);
  const stateHonesty = String(properties.stateHonesty || 'Static sample aircraft layer, not live ADS-B telemetry.');
  const visualAssetStatus = String(
    properties.visualAssetStatus || 'Rendered from repository aircraft models maintained in the WWT asset set.'
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-sky-300" />
          <h3 className="font-bold text-sm tracking-wide text-white uppercase">{callsign}</h3>
        </div>
        <span className="text-[7.5px] font-mono uppercase tracking-widest text-sky-300">{kind} aircraft sample</span>
        <div className="text-[9px] text-white/45 font-mono uppercase">{operator}</div>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Latitude</span>
          <span className="text-cyan-400 font-bold">{entity.latitude.toFixed(5)}°</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Longitude</span>
          <span className="text-cyan-400 font-bold">{entity.longitude.toFixed(5)}°</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Altitude</span>
          <span className="text-white font-bold">{altitudeKm.toFixed(1)} km</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Ground Speed</span>
          <span className="text-white font-bold">{speedKmh.toFixed(0)} km/h</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Heading</span>
          <span className="text-white font-bold">{heading.toFixed(0)}°</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Telemetry State</span>
          <span className="text-amber-300 text-right font-bold">Static sample</span>
        </div>
      </div>

      <div className="rounded border border-amber-400/15 bg-amber-400/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-amber-100/65">
        {stateHonesty}
      </div>

      <div className="space-y-1.5 rounded border border-sky-300/10 bg-sky-300/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-white/45">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sky-300">WWT Aircraft Asset Source</span>
          <span className="text-emerald-300">Repository-backed assets active</span>
        </div>
        <div>{visualAssetStatus}</div>
        <div className="break-all">
          <span className="text-white/30">Icon path: </span>
          <span className="text-white/65">{iconUrl || 'Unavailable'}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Model path: </span>
          <span className="text-white/65">{modelUrl || 'Unavailable'}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Source path: </span>
          <span className="text-white/65">{sourcePath}</span>
        </div>
      </div>
    </div>
  );
}

function PublicCameraTelemetryCard({ entity }: { entity: GeoEntity }) {
  const properties = entity.properties || {};
  const label = String(entity.label || entity.id);
  const city = String(properties.city || 'Unknown city');
  const region = String(properties.region || 'Unknown region');
  const country = String(properties.country || 'Unknown country');
  const categories = String(properties.categories || 'Uncategorized');
  const timezone = String(properties.timezone || 'Not provided');
  const sourcePath = String(properties.sourcePath || `${WWV_ASSET_AUDIT.sourceRoot}/cameras_geojson.json`);
  const mirrorDatasetPath = String(
    properties.copiedDatasetPath || `${WWV_ASSET_AUDIT.sourceRoot}/source-public/public-cameras.json`
  );
  const stateHonesty = String(
    properties.stateHonesty ||
      'Static camera locations sourced from WorldWide Telescope public mirror data. Markers indicate location only and do not prove camera availability.'
  );
  const streamPolicy = String(
    properties.externalStreamPolicy ||
      'Camera stream and thumbnail URLs are scrubbed from the served dataset; Silver Wolf renders static locations only.'
  );
  const datasetFeatureCount = Number(properties.datasetFeatureCount || 0);
  const renderedFeatureLimit = Number(properties.renderedFeatureLimit || 0);
  const streamPresent = Boolean(properties.externalStreamPresent);
  const previewPresent = Boolean(properties.externalPreviewPresent);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <Camera className="h-4 w-4 shrink-0 text-cyan-300 mt-0.5" />
          <h3 className="font-bold text-sm tracking-wide text-white uppercase leading-snug break-words">{label}</h3>
        </div>
        <span className="text-[7.5px] font-mono uppercase tracking-widest text-cyan-300">
          Static public-camera location
        </span>
        <div className="text-[9px] text-white/45 font-mono uppercase leading-relaxed">
          {[city, region, country].filter(Boolean).join(' / ')}
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Latitude</span>
          <span className="text-cyan-400 font-bold">{entity.latitude.toFixed(5)}°</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Longitude</span>
          <span className="text-cyan-400 font-bold">{entity.longitude.toFixed(5)}°</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-white/50">
          <span className="uppercase">Categories</span>
          <span className="text-right text-white font-bold break-words">{categories}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Timezone</span>
          <span className="text-white font-bold">{timezone}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Stream URLs</span>
          <span className="text-amber-300 text-right font-bold">
            {streamPresent || previewPresent ? 'Scrubbed from served copy' : 'Not provided'}
          </span>
        </div>
      </div>

      <div className="rounded border border-amber-400/15 bg-amber-400/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-amber-100/65">
        {stateHonesty}
      </div>

      <div className="space-y-1.5 rounded border border-cyan-300/10 bg-cyan-300/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-white/45">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-cyan-300">External Feed Policy</span>
          <span className="text-amber-300">Blocked by design</span>
        </div>
        <div>{streamPolicy}</div>
        <div>
          <span className="text-white/30">Rendered records: </span>
          <span className="text-white/65">
            {renderedFeatureLimit > 0 ? renderedFeatureLimit.toLocaleString() : 'Capped'} of{' '}
            {datasetFeatureCount > 0 ? datasetFeatureCount.toLocaleString() : 'repository dataset'}
          </span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Source public path: </span>
          <span className="text-white/65">{mirrorDatasetPath}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Source path: </span>
          <span className="text-white/65">{sourcePath}</span>
        </div>
      </div>
    </div>
  );
}

function MilitaryBaseTelemetryCard({ entity }: { entity: GeoEntity }) {
  const properties = entity.properties || {};
  const label = String(entity.label || entity.id);
  const type = String(properties.type || 'military site');
  const operator = String(properties.operator || 'Unknown');
  const sourcePath = String(properties.sourcePath || `${WWV_ASSET_AUDIT.sourceRoot}/military_bases.geojson`);
  const mirrorDatasetPath = String(
    properties.copiedDatasetPath || `${WWV_ASSET_AUDIT.sourceRoot}/military_bases.geojson`
  );
  const stateHonesty = String(
    properties.stateHonesty || 'Static repository dataset. Position records are not a live military feed.'
  );
  const visualAssetStatus = String(
    properties.visualAssetStatus ||
      'Military markers use repository aircraft imagery where available and generated shield markers otherwise.'
  );
  const visualAssetUrl = String(properties.visualAssetUrl || properties.iconUrl || '');
  const datasetFeatureCount = Number(properties.datasetFeatureCount || 0);
  const renderedFeatureLimit = Number(properties.renderedFeatureLimit || 0);
  const renderedFeatureNote = String(
    properties.renderedFeatureNote ||
      'Startup renders a capped subset from the full repository dataset to keep controls responsive.'
  );
  const osmId = String(properties.osmId || 'Not provided');
  const wikidata = String(properties.wikidata || 'Not provided');
  const wikipedia = String(properties.wikipedia || 'Not provided');

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 shrink-0 text-blue-300 mt-0.5" />
          <h3 className="font-bold text-sm tracking-wide text-white uppercase leading-snug break-words">{label}</h3>
        </div>
        <span className="text-[7.5px] font-mono uppercase tracking-widest text-blue-300">
          Static WWT military-site record
        </span>
        <div className="text-[9px] text-white/45 font-mono uppercase leading-relaxed">
          {type} / {operator}
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Latitude</span>
          <span className="text-cyan-400 font-bold">{entity.latitude.toFixed(5)}°</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Longitude</span>
          <span className="text-cyan-400 font-bold">{entity.longitude.toFixed(5)}°</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-white/50">
          <span className="uppercase">Site Type</span>
          <span className="text-right text-white font-bold break-words">{type}</span>
        </div>
        <div className="flex items-start justify-between gap-3 text-white/50">
          <span className="uppercase">Operator</span>
          <span className="text-right text-white font-bold break-words">{operator}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Telemetry State</span>
          <span className="text-amber-300 text-right font-bold">Static dataset</span>
        </div>
      </div>

      <div className="rounded border border-amber-400/15 bg-amber-400/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-amber-100/65">
        {stateHonesty}
      </div>

      <div className="space-y-1.5 rounded border border-blue-300/10 bg-blue-300/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-white/45">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-blue-300">WWT Military Dataset Source</span>
          <span className="text-amber-300">Static repository data</span>
        </div>
        <div>{renderedFeatureNote}</div>
        <div>
          <span className="text-white/30">Rendered records: </span>
          <span className="text-white/65">
            {renderedFeatureLimit > 0 ? renderedFeatureLimit.toLocaleString() : 'Capped'} of{' '}
            {datasetFeatureCount > 0 ? datasetFeatureCount.toLocaleString() : 'repository dataset'}
          </span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Source public path: </span>
          <span className="text-white/65">{mirrorDatasetPath}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Source path: </span>
          <span className="text-white/65">{sourcePath}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">OSM id: </span>
          <span className="text-white/65">{osmId}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Wikidata: </span>
          <span className="text-white/65">{wikidata}</span>
        </div>
        <div className="break-all">
          <span className="text-white/30">Wikipedia: </span>
          <span className="text-white/65">{wikipedia}</span>
        </div>
      </div>

      <div className="space-y-1.5 rounded border border-sky-300/10 bg-sky-300/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-white/45">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sky-300">Marker Asset</span>
          <span className="text-emerald-300">Desktop ready</span>
        </div>
        <div>{visualAssetStatus}</div>
        <div className="break-all">
          <span className="text-white/30">Asset path: </span>
          <span className="text-white/65">{visualAssetUrl || 'Generated marker'}</span>
        </div>
      </div>
    </div>
  );
}

function SatelliteTelemetryCard({ satId }: { satId: string }) {
  const issTelemetry = useUIStore((s) => s.issTelemetry);
  const satelliteEntity = useStore((s) =>
    s.entitiesByPlugin.satellites?.find((entity) => entity.id === `sat-${satId}`)
  );
  const { satellites } = useSatelliteCatalog();
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [startTime] = useState(() => Date.now());

  const satConfig = useMemo(() => {
    return satellites.find((s) => s.id === satId);
  }, [satId, satellites]);

  useEffect(() => {
    if (satId === 'iss' || satelliteEntity) return;

    const updateLoop = () => {
      if (!satConfig) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const currentCoords = propagateCircularOrbit(
        elapsed,
        satConfig.altitudeM,
        satConfig.inclinationRad,
        satConfig.omega0,
        satConfig.argLat0
      );
      setCoords(currentCoords);
      frameId = requestAnimationFrame(updateLoop);
    };

    let frameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(frameId);
  }, [satId, satConfig, satelliteEntity]);

  if (satId === 'iss') {
    const source = String(
      satelliteEntity?.properties?.source ||
        (issTelemetry?.simulated ? 'simulated-iss-telemetry' : 'live-iss-telemetry')
    );
    const lat = satelliteEntity?.latitude ?? issTelemetry?.latitude ?? 0;
    const lng = satelliteEntity?.longitude ?? issTelemetry?.longitude ?? 0;
    const alt =
      satelliteEntity?.altitude !== undefined ? satelliteEntity.altitude / 1000 : (issTelemetry?.altitude ?? 420);
    const entityVelocity =
      typeof satelliteEntity?.properties?.velocity === 'number'
        ? (satelliteEntity.properties.velocity as number)
        : undefined;
    const vel = entityVelocity !== undefined ? entityVelocity * 3.6 : (issTelemetry?.velocity ?? 27600); // km/h
    const period = calculateOrbitalPeriod(alt * 1000) / 60; // mins
    const status = getSatelliteSourceStatus(source);
    const visualAssetStatus = String(
      satelliteEntity?.properties?.visualAssetStatus || 'Generated local category billboard.'
    );
    const visualAssetUrl = String(
      satelliteEntity?.properties?.visualAssetUrl ||
        WWV_ORBITAL_ASSET_BY_CATEGORY[satConfig?.category || 'station'] ||
        WWV_ORBITAL_ASSET_BY_CATEGORY.other ||
        ''
    );
    const altitudeAudit = getAltitudeAudit(satelliteEntity);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {visualAssetUrl && (
            <img
              src={visualAssetUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded border border-primary/20 bg-black/50 p-1.5 shadow-[0_0_16px_rgba(255,255,255,0.04)]"
              loading="lazy"
            />
          )}
          <div className="min-w-0 space-y-1">
            <h3 className="truncate font-bold text-sm tracking-wide text-primary uppercase">ISS (SPACE STATION)</h3>
            <span className={`block text-[7.5px] font-mono uppercase tracking-widest ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
          <div className="flex items-center justify-between text-white/50">
            <span className="uppercase">Latitude</span>
            <span className="text-cyan-400 font-bold">{lat.toFixed(5)}°</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span className="uppercase">Longitude</span>
            <span className="text-cyan-400 font-bold">{lng.toFixed(5)}°</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span className="uppercase">Orbit Altitude</span>
            <span className="text-white font-bold">{alt.toFixed(1)} km</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span className="uppercase">Orbital Velocity</span>
            <span className="text-white font-bold">{vel.toFixed(1)} km/h</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span className="uppercase">Orbit Period</span>
            <span className="text-white font-bold">{period.toFixed(1)} mins</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span className="uppercase">Inclination</span>
            <span className="text-white font-bold">51.64°</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-white/50">
            <span className="uppercase">Position Source</span>
            <span className={`${status.className} text-right font-bold`}>{status.shortLabel}</span>
          </div>
          {satelliteEntity?.properties?.telemetryTimestamp && (
            <div className="flex items-center justify-between gap-3 text-white/50">
              <span className="uppercase">Telemetry Age</span>
              <span className="text-white font-bold">
                {formatAge(Number(satelliteEntity.properties.telemetryTimestamp))}
              </span>
            </div>
          )}
        </div>

        <div className="p-3 rounded bg-white/5 border border-white/5 text-[8px] uppercase leading-relaxed text-white/40 font-mono">
          {visualAssetStatus}
        </div>
        <SatelliteAltitudeAudit audit={altitudeAudit} />
        <SatelliteVisualAssetAudit satelliteEntity={satelliteEntity} />
        <div className="p-3 rounded bg-white/5 border border-white/5 text-[8px] uppercase leading-relaxed text-white/40 font-mono">
          Habitable artificial satellite in Low Earth Orbit serving as a microgravity and space environment research
          laboratory.
        </div>
      </div>
    );
  }

  if (!satConfig) return null;

  const altitudeKm = satConfig.altitudeM / 1000;
  const source = String(satelliteEntity?.properties?.source || 'circular-orbit-fallback');
  const status = getSatelliteSourceStatus(source);
  const displayLat = satelliteEntity?.latitude ?? coords.lat;
  const displayLng = satelliteEntity?.longitude ?? coords.lng;
  const displayAltitudeKm = satelliteEntity?.altitude !== undefined ? satelliteEntity.altitude / 1000 : altitudeKm;
  const entityVelocity =
    typeof satelliteEntity?.properties?.velocity === 'number'
      ? (satelliteEntity.properties.velocity as number)
      : undefined;
  const speedKms = (entityVelocity ?? calculateOrbitalSpeed(satConfig.altitudeM)) / 1000; // km/s
  const speedKmh = speedKms * 3600; // km/h
  const periodMins = calculateOrbitalPeriod(satelliteEntity?.altitude ?? satConfig.altitudeM) / 60; // mins
  const inclinationDeg = (satConfig.inclinationRad * 180) / Math.PI;
  const visualAssetStatus = String(
    satelliteEntity?.properties?.visualAssetStatus || 'Generated local category billboard.'
  );
  const altitudeAudit = getAltitudeAudit(satelliteEntity);
  const visualAssetUrl = String(
    satelliteEntity?.properties?.visualAssetUrl ||
      WWV_ORBITAL_ASSET_BY_CATEGORY[satConfig.category] ||
      WWV_ORBITAL_ASSET_BY_CATEGORY.other ||
      ''
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {visualAssetUrl && (
              <img
                src={visualAssetUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded border border-primary/20 bg-black/50 p-1.5 shadow-[0_0_16px_rgba(255,255,255,0.04)]"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <h3 className="min-w-0 truncate font-bold text-sm tracking-wide text-white uppercase">
                {satConfig.name}
              </h3>
              <span className="block text-[7px] font-mono uppercase tracking-widest text-primary/70">
                WWV satellite silhouette
              </span>
            </div>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full animate-pulse" style={{ backgroundColor: satConfig.color }} />
        </div>
        <span className="text-[7.5px] text-white/30 font-mono uppercase tracking-widest block">
          Telemetry Group: {satConfig.category.toUpperCase()}
        </span>
        <span className={`text-[7.5px] font-mono uppercase tracking-widest block ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2 font-mono text-[9px]">
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Latitude</span>
          <span className="text-cyan-400 font-bold">{displayLat.toFixed(5)}°</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Longitude</span>
          <span className="text-cyan-400 font-bold">{displayLng.toFixed(5)}°</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Orbit Altitude</span>
          <span className="text-white font-bold">{displayAltitudeKm.toFixed(1)} km</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Orbital Velocity</span>
          <span className="text-white font-bold">
            {speedKmh.toFixed(1)} km/h ({speedKms.toFixed(2)} km/s)
          </span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Orbit Period</span>
          <span className="text-white font-bold">{periodMins.toFixed(1)} mins</span>
        </div>
        <div className="flex items-center justify-between text-white/50">
          <span className="uppercase">Inclination</span>
          <span className="text-white font-bold">{inclinationDeg.toFixed(2)}°</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-white/50">
          <span className="uppercase">Position Source</span>
          <span className={`${status.className} text-right font-bold`}>{status.shortLabel}</span>
        </div>
      </div>

      <div className="p-3 rounded bg-white/5 border border-white/5 text-[8px] uppercase leading-relaxed text-white/40 font-mono">
        {visualAssetStatus}
      </div>
      <SatelliteAltitudeAudit audit={altitudeAudit} />
      <SatelliteVisualAssetAudit satelliteEntity={satelliteEntity} />

      <div className="p-3 rounded bg-white/5 border border-white/5 text-[8px] uppercase leading-relaxed text-white/40 font-mono">
        {satConfig.description}
      </div>
    </div>
  );
}

function getAltitudeAudit(satelliteEntity?: any) {
  if (!satelliteEntity?.properties) return null;
  const rawAltitude = Number(satelliteEntity.properties.rawAltitudeMeters);
  const renderedAltitude = Number(satelliteEntity.properties.renderedAltitudeMeters ?? satelliteEntity.altitude);
  const adjusted = Boolean(satelliteEntity.properties.altitudeAdjusted);
  const reason = String(satelliteEntity.properties.altitudeAdjustmentReason || '');

  if (!Number.isFinite(renderedAltitude)) return null;
  return {
    rawAltitude: Number.isFinite(rawAltitude) ? rawAltitude : null,
    renderedAltitude,
    adjusted,
    reason
  };
}

function SatelliteAltitudeAudit({ audit }: { audit: ReturnType<typeof getAltitudeAudit> }) {
  if (!audit) return null;

  return (
    <div
      className={`space-y-1.5 rounded border p-3 font-mono text-[8px] uppercase leading-relaxed ${
        audit.adjusted
          ? 'border-amber-300/20 bg-amber-300/10 text-amber-100/70'
          : 'border-emerald-300/10 bg-emerald-300/5 text-white/45'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={audit.adjusted ? 'font-bold text-amber-200' : 'font-bold text-emerald-300'}>
          Orbital altitude integrity
        </span>
        <span>{audit.adjusted ? 'Corrected render shell' : 'Raw altitude accepted'}</span>
      </div>
      <div>
        <span className="text-white/35">Rendered altitude: </span>
        <span>{(audit.renderedAltitude / 1000).toFixed(1)} km</span>
      </div>
      {audit.rawAltitude !== null && (
        <div>
          <span className="text-white/35">Incoming altitude: </span>
          <span>{(audit.rawAltitude / 1000).toFixed(1)} km</span>
        </div>
      )}
      {audit.adjusted && audit.reason && <div>{audit.reason}</div>}
    </div>
  );
}

function SatelliteVisualAssetAudit({ satelliteEntity }: { satelliteEntity?: any }) {
  const cachedRoot = String(satelliteEntity?.properties?.copiedWwvAssetRoot || WWV_ASSET_AUDIT.copiedRoot);
  const sourceMirrorRoot = String(
    satelliteEntity?.properties?.copiedWwvSourceMirrorRoot || WWV_ASSET_AUDIT.sourceMirrorRoot
  );
  const sourceMirrorCount = Number(
    satelliteEntity?.properties?.copiedWwvSourceFileCount || WWV_ASSET_AUDIT.sourcePublicFileCount
  );
  const derivedRoot = String(
    satelliteEntity?.properties?.derivedSatelliteAssetRoot || WWV_ASSET_AUDIT.derivedSatelliteAssetRoot
  );
  const repositoryAssetSummary = String(
    satelliteEntity?.properties?.copiedWwvAssetSummary || 'WWT aircraft icons/model and logo artwork'
  );
  const visualAssetSource = String(satelliteEntity?.properties?.visualAssetSource || 'silver-wolf-derived-orbital-svg');
  const visualAssetUrl = String(satelliteEntity?.properties?.visualAssetUrl || '');
  const hasSatelliteAsset = Boolean(satelliteEntity?.properties?.satelliteSpecificWwvAssetPresent);

  return (
    <div className="space-y-1.5 rounded border border-primary/10 bg-primary/5 p-3 font-mono text-[8px] uppercase leading-relaxed text-white/45">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-primary">WWT Asset Source</span>
        <span className={hasSatelliteAsset ? 'text-emerald-300' : 'text-amber-300'}>
          {hasSatelliteAsset
            ? 'Satellite asset available from repository cache'
            : 'No dedicated satellite asset in WWT source'}
        </span>
      </div>
      <div>
        <span className="text-white/30">Cached root: </span>
        <span className="text-white/65">{cachedRoot}</span>
      </div>
      <div>
        <span className="text-white/30">Source mirror: </span>
        <span className="text-white/65">
          {sourceMirrorCount} files at {sourceMirrorRoot}
        </span>
      </div>
      <div>
        <span className="text-white/30">Derived root: </span>
        <span className="text-white/65">{derivedRoot}</span>
      </div>
      <div>
        <span className="text-white/30">Rendered marker: </span>
        <span className="text-white/65">{visualAssetSource}</span>
      </div>
      <div className="break-all">
        <span className="text-white/30">Asset path: </span>
        <span className="text-white/60">{visualAssetUrl || 'Unavailable'}</span>
      </div>
      {visualAssetUrl && (
        <div className="flex items-center justify-between gap-3 rounded border border-white/5 bg-black/25 p-2">
          <span className="text-white/30">Preview: </span>
          <img
            src={visualAssetUrl}
            alt="Rendered satellite visual asset preview"
            className="h-10 w-10 rounded border border-white/10 bg-black/50 p-1"
            loading="lazy"
          />
        </div>
      )}
      <div>
        <span className="text-white/30">Repository assets: </span>
        <span className="text-white/60">{repositoryAssetSummary}</span>
      </div>
    </div>
  );
}

function getSatelliteSourceStatus(source: string) {
  switch (source) {
    case 'live-iss-telemetry':
      return {
        label: 'Live ISS telemetry active',
        shortLabel: 'Live telemetry',
        className: 'text-emerald-300'
      };
    case 'simulated-iss-telemetry':
      return {
        label: 'Simulated ISS telemetry',
        shortLabel: 'Simulated telemetry',
        className: 'text-amber-300'
      };
    case 'live-tle':
      return {
        label: 'TLE-propagated orbit',
        shortLabel: 'Live TLE',
        className: 'text-cyan-300'
      };
    case 'circular-orbit-fallback':
      return {
        label: 'Catalog orbit fallback',
        shortLabel: 'Catalog orbit',
        className: 'text-amber-300'
      };
    default:
      return {
        label: 'Fallback orbit model',
        shortLabel: 'Fallback model',
        className: 'text-amber-300'
      };
  }
}

function formatAge(timestamp: number) {
  const normalizedTimestamp = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
  const ageMs = Math.max(0, Date.now() - normalizedTimestamp);
  if (ageMs < 1000) return '<1 sec';
  if (ageMs < 60000) return `${Math.round(ageMs / 1000)} sec`;
  return `${Math.round(ageMs / 60000)} min`;
}
