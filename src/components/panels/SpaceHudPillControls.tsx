import { Layers, Orbit, Ruler, Navigation, Map, Pin, Settings, RotateCcw, UserCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

/**
 * Compact controls for the SPACE view, attached to the CHAT/SPACE
 * mode-switcher pill instead of a full-width floating bar. Replaces the former
 * orbital HUD bar header — same actions, same useUIStore selectors it used,
 * just rendered as a small pill-styled cluster that can't span/overlap the
 * whole workspace width the way the old bar did.
 */
export function SpaceHudPillControls() {
  const spaceHudTab = useUIStore((s) => s.spaceHudTab);
  const setSpaceHudTab = useUIStore((s) => s.setSpaceHudTab);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);
  const showBorders = useUIStore((s) => s.showBorders);
  const setShowBorders = useUIStore((s) => s.setShowBorders);
  const showTerrain = useUIStore((s) => s.showTerrain);
  const setShowTerrain = useUIStore((s) => s.setShowTerrain);
  const showRoads = useUIStore((s) => s.showRoads);
  const setShowRoads = useUIStore((s) => s.setShowRoads);
  const showAllTrails = useUIStore((s) => s.satelliteSettings.showAllTrails);
  const updateSatelliteSettings = useUIStore((s) => s.updateSatelliteSettings);
  const setMeasureStart = useUIStore((s) => s.setMeasureStart);
  const setMeasureEnd = useUIStore((s) => s.setMeasureEnd);
  const setRightPanelTab = useUIStore((s) => s.setRightPanelTab);
  const setRightPanelOpen = useUIStore((s) => s.setRightPanelOpen);
  const setBrowserUrl = useUIStore((s) => s.setBrowserUrl);
  const addChangeLog = useUIStore((s) => s.addChangeLog);

  const handleCompass = () => {
    try {
      const viewer = (window as any).cesiumViewer;
      if (viewer && !viewer.isDestroyed?.()) {
        viewer.camera.flyTo({
          destination: viewer.camera.position,
          orientation: { heading: 0.0, pitch: -Math.PI / 2, roll: 0.0 },
          duration: 1.5,
          complete: () => viewer.scene.requestRender()
        });
      }
    } catch {
      // Viewer may not be ready yet; ignore.
    }
  };

  const handleReload = () => {
    const refreshWwtIframe = (window as any).refreshWwtIframe;
    if (typeof refreshWwtIframe === 'function') {
      refreshWwtIframe();
    } else {
      const viewer = (window as any).cesiumViewer;
      if (viewer && !viewer.isDestroyed?.()) viewer.scene.requestRender();
    }
    addChangeLog('SYSTEM', 'Render engine refresh requested.', 'info');
  };

  const tabs: Array<{ key: typeof spaceHudTab; label: string }> = [
    { key: 'navigation', label: 'NAV' },
    { key: 'layers', label: 'LAYERS' },
    { key: 'target', label: 'TARGET' },
    { key: 'system', label: 'SYSTEM' }
  ];

  return (
    <div className="space-hud-pill-controls flex flex-col items-center gap-1.5 pointer-events-auto">
      <div className="flex items-center gap-0.5 rounded-full border border-white/5 bg-black/40 p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={spaceHudTab === tab.key}
            onClick={() => setSpaceHudTab(tab.key)}
            className={`rounded-full px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              spaceHudTab === tab.key ? 'bg-primary text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          aria-label={leftPanelOpen ? 'Hide spatial control sidebar' : 'Show spatial control sidebar'}
          title={leftPanelOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 cursor-pointer"
        >
          <Layers className="h-3 w-3" />
        </button>
      </div>

      {spaceHudTab === 'navigation' && (
        <div className="flex items-center gap-1 rounded-full border border-white/5 bg-black/30 px-1.5 py-1">
          <button
            type="button"
            title="Reset Measurement Ruler"
            onClick={() => {
              setMeasureStart(null);
              setMeasureEnd(null);
              addChangeLog('MEASUREMENT', 'Geodetic markers cleared.', 'info');
            }}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer"
          >
            <Ruler className="h-3 w-3" /> RULER
          </button>
          <button
            type="button"
            title="Reset Camera Orientation North"
            onClick={() => {
              handleCompass();
              addChangeLog('CAMERA', 'Heading reset to North.', 'info');
            }}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer"
          >
            <Navigation className="h-3 w-3" /> NORTH
          </button>
        </div>
      )}

      {spaceHudTab === 'layers' && (
        <div className="flex items-center gap-1 rounded-full border border-white/5 bg-black/30 px-1.5 py-1">
          <button
            type="button"
            aria-pressed={showBorders}
            onClick={() => setShowBorders(!showBorders)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono cursor-pointer ${showBorders ? 'text-white bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
          >
            <Layers className="h-3 w-3" /> BORDERS
          </button>
          <button
            type="button"
            aria-pressed={showTerrain}
            onClick={() => setShowTerrain(!showTerrain)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono cursor-pointer ${showTerrain ? 'text-white bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
          >
            <Map className="h-3 w-3" /> TERRAIN
          </button>
          <button
            type="button"
            aria-pressed={showRoads}
            onClick={() => setShowRoads(!showRoads)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono cursor-pointer ${showRoads ? 'text-white bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
          >
            <Pin className="h-3 w-3" /> ROADS
          </button>
          <button
            type="button"
            aria-pressed={showAllTrails}
            onClick={() => updateSatelliteSettings({ showAllTrails: !showAllTrails })}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono cursor-pointer ${showAllTrails ? 'text-white bg-white/10' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
          >
            <Orbit className="h-3 w-3" /> ORBITS
          </button>
        </div>
      )}

      {spaceHudTab === 'target' && (
        <div className="flex items-center gap-1 rounded-full border border-white/5 bg-black/30 px-1.5 py-1">
          <button
            type="button"
            title="Open Diagnostic System Panel"
            onClick={() => {
              setRightPanelTab('diagnostics');
              setRightPanelOpen(true);
              addChangeLog('UI', 'Diagnostics Panel opened.', 'info');
            }}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer"
          >
            <Settings className="h-3 w-3" /> DIAGNOSTICS
          </button>
          <button
            type="button"
            title="Open Active Target Details"
            onClick={() => {
              setRightPanelTab('context');
              setRightPanelOpen(true);
            }}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer"
          >
            <Pin className="h-3 w-3" /> TARGET
          </button>
        </div>
      )}

      {spaceHudTab === 'system' && (
        <div className="flex items-center gap-1 rounded-full border border-white/5 bg-black/30 px-1.5 py-1">
          <button
            type="button"
            title="Reload Telescope Engine"
            onClick={handleReload}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> RELOAD
          </button>
          <button
            type="button"
            title="Access Help & User Documentation"
            onClick={() => {
              setRightPanelTab('browser');
              setRightPanelOpen(true);
              setBrowserUrl('https://html.duckduckgo.com/html/?q=Silver+Wolf+VI+Operator+Manual');
              addChangeLog('HELP', 'Opened manual in system browser.', 'info');
            }}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer"
          >
            <UserCircle className="h-3 w-3" /> MANUAL
          </button>
        </div>
      )}
    </div>
  );
}
