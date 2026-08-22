import React, { Suspense, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Globe2, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { ChatPanel } from '../ChatPanel';
import { TouchControlOverlay } from '../common/TouchControlOverlay';
import { useChromeTopAnchor } from '../../hooks/useChromeTopAnchor';
import { SpaceHudPillControls } from './SpaceHudPillControls';
const GoogleEarthRemix = React.lazy(() => import('../learning/GoogleEarthRemix'));
const WorldWideTelescopeView = React.lazy(() => import('../learning/WorldWideTelescopeView'));
import { ErrorBoundary } from '../ErrorBoundary';

function SidebarTrigger() {
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useUIStore((s) => s.setLeftPanelOpen);

  if (leftPanelOpen) return null;

  return (
    <button
      type="button"
      onClick={() => setLeftPanelOpen(true)}
      className="absolute top-1/2 left-0 z-chrome flex h-14 w-11 -translate-y-1/2 translate-x-0 items-center justify-center rounded-r-lg border-y border-r border-white/10 bg-black/40 text-white/40 shadow-lg transition-all duration-300 ease-out hover:border-white/20 hover:bg-black/60 hover:text-white/80 cursor-pointer group pointer-events-auto opacity-100"
      title="Expand Sidebar"
      aria-label="Expand left sidebar"
    >
      <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export function CenterPanel() {
  const interactionMode = useUIStore((s) => s.interactionMode);
  const setInteractionMode = useUIStore((s) => s.setInteractionMode);
  const spaceInteractionTarget = useUIStore((s) => s.spaceInteractionTarget);
  const setSpaceInteractionTarget = useUIStore((s) => s.setSpaceInteractionTarget);
  const modeSwitcherOpen = useUIStore((s) => s.modeSwitcherOpen);
  const setModeSwitcherOpen = useUIStore((s) => s.setModeSwitcherOpen);

  /** Gap between the bottom of the mode pill and the top of the HUD row. */
  const SPACE_HUD_GAP_PX = 6;
  /**
   * First-paint fallback only. The pill's real position comes from the clamp on
   * .mode-switcher-anchor, which cannot be read until layout has run once, so
   * this covers the single frame before the observer below reports a real value.
   */
  const SPACE_HUD_FALLBACK_TOP_PX = 150;

  const [spaceHudTopPx, setSpaceHudTopPx] = React.useState(SPACE_HUD_FALLBACK_TOP_PX);

  const modeSwitcherRef = useRef<HTMLDivElement>(null);
  useChromeTopAnchor(modeSwitcherRef);

  /**
   * Measure the pill and place the HUD row directly beneath it.
   *
   * Offsets are taken relative to the shared positioned ancestor rather than the
   * viewport, so this stays correct when the centre column is inset by the
   * workspace rails (DockedLayout pads <main> by --workspace-*-rail).
   */
  useEffect(() => {
    const pill = modeSwitcherRef.current;
    if (!pill) return;

    const measure = () => {
      const parent = pill.offsetParent as HTMLElement | null;
      const pillRect = pill.getBoundingClientRect();
      const parentTop = parent ? parent.getBoundingClientRect().top : 0;
      setSpaceHudTopPx(Math.max(0, Math.round(pillRect.bottom - parentTop + SPACE_HUD_GAP_PX)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pill);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [modeSwitcherOpen, interactionMode, spaceInteractionTarget]);

  // Track WWT error state for change log reporting
  const handleTelescopeError = useCallback((error: Error) => {
    console.warn('[CenterPanel] Telescope view error caught by boundary:', error.message);
    useUIStore.getState().addChangeLog('TELESCOPE', `View error caught: ${error.message}`, 'warning');
  }, []);

  // Keyboard shortcut: Escape exits telescope mode back to orbital
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modeSwitcherOpen) {
          setModeSwitcherOpen(false);
          return;
        }
        if (interactionMode === 'telescope' || spaceInteractionTarget === 'telescope') {
          setInteractionMode('orbital');
          setSpaceInteractionTarget('earth');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactionMode, modeSwitcherOpen, spaceInteractionTarget, setInteractionMode, setSpaceInteractionTarget]);

  useEffect(() => {
    const handleModeCommand = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '.') {
        event.preventDefault();
        setModeSwitcherOpen(true);
      }
    };
    window.addEventListener('keydown', handleModeCommand);
    return () => window.removeEventListener('keydown', handleModeCommand);
  }, []);

  const isSpaceMode = interactionMode === 'orbital' || interactionMode === 'telescope';

  return (
    // Root container: ALWAYS pointer-events-none to let Cesium globe receive drags underneath.
    // Each interactive child explicitly opts-in with pointer-events-auto.
    <div className="flex h-full flex-1 flex-col overflow-hidden relative pointer-events-none">
      {/* Sidebar trigger — always interactive */}
      <SidebarTrigger />

      {/* Touch device virtual navigation overlay */}
      <TouchControlOverlay />

      {/* Dynamic Segmented Mode Switcher (Pill Style) — always interactive.
          `top` still uses the clamp() as its first-paint position (before
          useChromeTopAnchor's ResizeObserver has measured anything); once it
          publishes --chrome-top-y, every OTHER chrome element that needs to
          clear this pill reads that single measured value instead of
          re-guessing the same clamp() independently (see useChromeTopAnchor). */}
      <div
        ref={modeSwitcherRef}
        className={`mode-switcher-anchor absolute top-[clamp(3.5rem,7vh,5.75rem)] sm:top-[clamp(5.75rem,12vh,8rem)] left-1/2 z-floating -translate-x-1/2 pointer-events-auto ${modeSwitcherOpen ? 'is-open' : ''}`}
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {modeSwitcherOpen && (
          <div className="mode-switcher-panel">
            <div
              className="mode-switcher-shell glass-panel grid grid-cols-2 rounded-full border border-white/10 p-1 shadow-lg"
              data-active-mode={interactionMode === 'chat' ? 'chat' : 'space'}
            >
              <span className="mode-switcher-indicator" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setInteractionMode('chat')}
                aria-pressed={interactionMode === 'chat'}
                className={`mode-tab flex min-h-11 items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${interactionMode === 'chat' ? 'mode-tab-active text-white' : 'text-white/40 hover:text-white/80'}`}
              >
                <MessageSquare className="h-3 w-3" />
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInteractionMode('orbital');
                  setSpaceInteractionTarget('earth');
                }}
                aria-pressed={interactionMode === 'orbital'}
                className={`mode-tab flex min-h-11 items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${interactionMode === 'orbital' ? 'mode-tab-active text-white' : 'text-white/40 hover:text-white/80'}`}
              >
                <Globe2 className="h-3 w-3" />
                <span>Space</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Space HUD row — a SIBLING of the mode pill, not a child.
          As a child it inherited the pill's `-translate-x-1/2` and could never be
          positioned independently, and its only anchor was the pill's hardcoded
          clamp() — a second source of layout truth. It now reads the measured
          bottom of the pill (same technique useChromeTopAnchor uses to publish
          --chrome-top-y), so exactly one measured value decides where it sits,
          which is what lets a slot engine own this rect later. */}
      {modeSwitcherOpen && interactionMode === 'orbital' && spaceInteractionTarget !== 'telescope' && (
        <div
          className="absolute left-1/2 z-floating -translate-x-1/2 pointer-events-auto"
          style={{ top: `${spaceHudTopPx}px` }}
        >
          <SpaceHudPillControls />
        </div>
      )}

      {/* Center Panel Content with Slide Transitions */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Chat View Container */}
        {interactionMode === 'chat' && (
          <div
            className="absolute inset-x-0 bottom-0 z-content flex flex-col px-[clamp(0.75rem,3vw,1.5rem)] pb-4 opacity-100 pointer-events-auto"
            style={{ top: 'calc(var(--chrome-top-y, 8rem) - var(--chrome-parent-top-y, 0px) + 1rem)' }}
          >
            <div className="mx-auto flex min-h-0 w-full max-w-[78rem] flex-1 flex-col justify-between overflow-hidden rounded-lg border border-white/10 bg-[#07090f]/94 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              {/* Scrollable messages */}
              <div className="flex-1 overflow-hidden">
                <ChatPanel />
              </div>
            </div>
          </div>
        )}

        {/* Combined Space & Telescope Viewport Container.
            position:fixed escapes <main>'s rail padding, so `inset-0` made this
            layer cover the whole viewport — and every absolutely-positioned
            child inside it (.earth-status, .earth-controls, .earth-tour-guide)
            then measured against the viewport rather than the stage, landing
            underneath the side panels. Insetting by the same rail variables
            DockedLayout publishes constrains the entire HUD layer in one place
            instead of patching each child. Custom properties inherit, so this
            reads the values set on the DockedLayout row above it. */}
        <div
          className={`fixed top-0 bottom-0 ${isSpaceMode ? 'z-content' : 'hidden pointer-events-none z-base'}`}
          style={{
            left: 'var(--workspace-left-rail, 0px)',
            right: 'var(--workspace-right-rail, 0px)'
          }}
          aria-hidden={!isSpaceMode}
        >
          {/* WorldWide Telescope controls overlay — wrapped in inline ErrorBoundary for graceful degradation */}
          {isSpaceMode && (
            <div className="absolute inset-0 pointer-events-none z-chrome">
              <ErrorBoundary variant="inline" fallbackMessage="Telescope Controls Error" onError={handleTelescopeError}>
                <Suspense fallback={null}>
                  <WorldWideTelescopeView controlsOnly />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

          {/* GoogleEarthRemix overlay — pointer-events-none so globe underneath gets drags */}
          {isSpaceMode && (
            <div className="absolute inset-0 pointer-events-none z-content">
              <Suspense fallback={null}>
                <GoogleEarthRemix />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
