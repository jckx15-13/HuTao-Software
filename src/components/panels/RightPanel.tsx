import { useUIStore } from '@/store/uiStore';
import { useStore } from '../../core/state/store';
import { pluginManager } from '../../core/plugins/PluginManager';
import { ChevronRight, Globe, Terminal, Info, MapPin, Radio, Compass, X, ArrowLeft, RotateCw, ExternalLink as ExtLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export function RightPanel() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  
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

  // Core Zustand state
  const selectedEntity = useStore((s) => s.selectedEntity);

  // Browser navigation and control states
  const [addressInput, setAddressInput] = useState(browserUrl);
  const [refreshKey, setRefreshKey] = useState(0);
  const [history, setHistory] = useState<string[]>([browserUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync input when the global URL updates
  useEffect(() => {
    setAddressInput(browserUrl);
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

  return (
    <aside className="glass-panel flex h-full w-[310px] flex-col border-l border-white/5 select-none" style={{ borderRadius: 0 }}>
      {/* Header and Tab Switcher */}
      <div className="flex h-12 items-center justify-between px-3 border-b border-white/5 bg-black/10">
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <button
            type="button"
            onClick={() => setRightPanelTab('context')}
            className={`px-2 py-1 rounded transition-colors ${
              rightPanelTab === 'context' ? 'text-primary bg-primary/10 font-bold' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Context
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab('browser')}
            className={`px-2 py-1 rounded transition-colors ${
              rightPanelTab === 'browser' ? 'text-primary bg-primary/10 font-bold' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Browser
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab('changes')}
            className={`px-2 py-1 rounded transition-colors ${
              rightPanelTab === 'changes' ? 'text-primary bg-primary/10 font-bold' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Changes
          </button>
        </div>

        <button
          type="button"
          onClick={() => setRightPanelOpen(false)}
          className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
          title="Collapse Panel"
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
                    <span>ISS LIVE TELECAST</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIssFeedOpen(false)}
                    className="rounded p-0.5 hover:bg-white/5 text-white/30 hover:text-white/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Live stream video frame */}
                <div className="relative aspect-video w-full rounded overflow-hidden bg-black border border-white/5 flex items-center justify-center">
                  {window.location.search.includes('fallback') ? (
                    <div className="text-cyan-400 font-mono text-[9px] text-center p-4">
                      [ISS LIVE TELECAST MOCKED]
                    </div>
                  ) : (
                    <iframe
                      src="https://www.ustream.tv/embed/17074538?html5=1&autoplay=1&mute=1"
                      title="ISS Live Camera Feed"
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
            {activeLocation ? (
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
                    <span>{activeLocation.lat.toFixed(4)}°N, {activeLocation.lng.toFixed(4)}°E</span>
                  </div>
                  <div className="flex items-center justify-between text-white/50">
                    <span className="uppercase">Elevation</span>
                    <span>{activeLocation.elevation}</span>
                  </div>
                </div>

                {/* Facts card list */}
                {activeLocation.facts && activeLocation.facts.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary block">Landmark Codex</span>
                    {activeLocation.facts.map((fact, i) => (
                      <div key={i} className="glass-panel p-2.5 text-[10px] text-white/70 leading-relaxed">
                        {fact}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedEntity ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm tracking-wide text-white">{selectedEntity.label || selectedEntity.id}</h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-primary font-bold uppercase tracking-wider">
                    <span>{pluginManager.getPlugin(selectedEntity.pluginId)?.plugin.name || selectedEntity.pluginId}</span>
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
                      <span className="uppercase">Telemetry Time</span>
                      <span>{new Date(selectedEntity.timestamp).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                {selectedEntity.properties && Object.keys(selectedEntity.properties).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary block">Telemetry Details</span>
                    <div className="space-y-1.5 font-mono text-[9px] scroller max-h-[300px] overflow-y-auto pr-1">
                      {Object.entries(selectedEntity.properties)
                        .filter(([k]) => k !== 'rawEntity' && selectedEntity.properties[k] !== null && selectedEntity.properties[k] !== undefined)
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
                            <div key={key} className="glass-panel p-2 flex flex-col gap-0.5 border border-white/5 bg-black/15 rounded">
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
                className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-white/70 transition-colors"
                title="Back"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                title="Refresh Frame"
              >
                <RotateCw size={12} />
              </button>
              <button
                type="button"
                onClick={handleHome}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                title="Home Page"
              >
                <Globe size={12} />
              </button>
              <div className="flex-1 flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5">
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNavigate(addressInput);
                    }
                  }}
                  className="w-full bg-transparent text-[8px] text-white/80 focus:outline-none placeholder:text-white/20 select-text"
                  placeholder="URL or search query..."
                />
              </div>
              <button
                type="button"
                onClick={() => window.open(browserUrl, '_blank')}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                title="Open in new window"
              >
                <ExtLink size={12} />
              </button>
            </div>
            
            {/* Sandboxed iframe viewport */}
            <div className="relative flex-1 flex flex-col h-[400px] w-full rounded-xl overflow-hidden border border-white/5 bg-black shadow-lg pointer-events-auto flex items-center justify-center">
              {window.location.search.includes('fallback') ? (
                <div className="text-cyan-400 font-mono text-[9px] text-center p-4">
                  [BROWSER VIEWPORT MOCKED FOR: {browserUrl}]
                </div>
              ) : (
                <iframe
                  key={refreshKey}
                  src={browserUrl}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-2">SYSTEM TELEMETRY LOG</span>
            {changeLogs.length > 0 ? (
              <div className="relative border-l border-white/10 pl-3.5 ml-1.5 space-y-4 text-[9px] py-1 max-h-[500px] overflow-y-auto scroller">
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
      </div>
    </aside>
  );
}
