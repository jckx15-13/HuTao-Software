// ============================================================================
// 🧱 Docked Layout Organizer (DockedLayout.tsx)
// ============================================================================
// Low-level mechanics:
// 1. Implements standard CSS Flex row layout matching workspace specifications.
// 2. Coordinates viewport dimensions using tailwind responsive utility prefixes (e.g. xl:flex).
// 3. Implements conditional width placeholders (aside panel width alignment).
// ============================================================================

import React, { Suspense } from 'react';
import { CenterPanel } from '../panels/CenterPanel'; // Middle container coordinating workspace and telescope targets.
import { ChevronLeft, MessageSquare, PanelLeft, PanelRight } from 'lucide-react';
const LeftPanel = React.lazy(() => import('../panels/LeftPanel').then((m) => ({ default: m.LeftPanel })));
const RightPanel = React.lazy(() => import('../panels/RightPanel').then((m) => ({ default: m.RightPanel })));
import { SystemMonitor } from '../SystemMonitor'; // Nested system metrics tracker widget.
import { useUIStore } from '../../store/uiStore'; // Central state hook providing toggle flags for left/right columns.
import { useViewportSize } from '../../hooks/useViewportSize';
import { buildWorkspaceRailPx } from '../panels/panelGeometry';

export function DockedLayout() {
  // Read open status of panels directly from the Zustand global store.
  const {
    settingsDocked,
    showSettings,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    interactionMode,
    setInteractionMode
  } = useUIStore();
  const viewportSize = useViewportSize();
  const collapsedForNarrowViewportRef = React.useRef(false);

  // Design logic: Hide the performance meter dashboard if the settings page is docked onto the side layout.
  const hideSystemMonitor = showSettings && settingsDocked;
  const showPassiveTelemetry = interactionMode !== 'chat' && !hideSystemMonitor;
  // Derived from the same geometry the fixed side panels use, so the reserved
  // rail always matches their real rendered width. Computing these independently
  // is what previously let the chat surface slide underneath the sidebars.
  const leftRailWidth = `${buildWorkspaceRailPx(viewportSize, leftPanelOpen, rightPanelOpen, 'left')}px`;
  const rightRailWidth = rightPanelOpen
    ? `${buildWorkspaceRailPx(viewportSize, leftPanelOpen, rightPanelOpen, 'right')}px`
    : showPassiveTelemetry && viewportSize.width >= 1280
      ? 'clamp(14rem, 16vw, 20rem)'
      : '0px';

  React.useEffect(() => {
    const isNarrowViewport = viewportSize.width < 760;

    if (isNarrowViewport && !collapsedForNarrowViewportRef.current) {
      if (leftPanelOpen) setLeftPanelOpen(false);
      if (rightPanelOpen) setRightPanelOpen(false);
      collapsedForNarrowViewportRef.current = true;
    }

    if (!isNarrowViewport) {
      collapsedForNarrowViewportRef.current = false;
    }
  }, [leftPanelOpen, rightPanelOpen, setLeftPanelOpen, setRightPanelOpen, viewportSize.width]);

  return (
    // Flexbox row layout spanning full viewport width. Inherits transparency so Cesium canvas is visible behind panels.
    <div
      className="flex h-full w-full overflow-hidden bg-transparent"
      style={{
        ['--workspace-left-rail' as any]: leftRailWidth,
        ['--workspace-right-rail' as any]: rightRailWidth
      }}
    >
      {/* COLUMN 1: Collapsible navigation bar. Self-manages responsive hide/show states internally. */}
      <Suspense fallback={null}>
        <LeftPanel />
      </Suspense>

      {/* COLUMN 2: Main center area. Sets flex-1 to occupy all remaining width.
          Uses pointer-events-none so mouse interaction drops down to Cesium 3D canvas layer. */}
      <main
        className="mobile-workspace-main flex-1 flex flex-col relative z-content bg-transparent pointer-events-none"
        // Consumes the CSS vars set on the row above. Without this, the
        // vars are computed but nothing reads them, and the centre column
        // renders flush against the container edge behind the fixed side
        // panels -- confirmed live via occlusion testing: -395px rail
        // clearance (should be positive) and 5 real interactive elements
        // (Toggle fullscreen, Clear chat, Send message, Diagnostics tab)
        // hit-testing as blocked.
        style={{
          paddingLeft: 'max(0px, calc(var(--workspace-left-rail, 0px) + 0.75rem))',
          paddingRight: 'max(0px, calc(var(--workspace-right-rail, 0px) + 0.75rem))'
        }}
      >
        <div className="w-full h-full relative pointer-events-none">
          <CenterPanel />
        </div>
      </main>

      {/* COLUMN 3: Right details panel or background telemetry panel. */}
      {rightPanelOpen ? (
        // Mode A: Shows standard Markdown context search & browser pages.
        <Suspense fallback={null}>
          <RightPanel />
        </Suspense>
      ) : showPassiveTelemetry ? (
        // Mode B: Renders system telemetry inside a fixed-width aside bar (320px width).
        // Uses `xl:flex` to hide on smaller screens, appearing automatically once viewport exceeds 1280px wide.
        <aside className="relative z-chrome hidden w-[clamp(14rem,16vw,20rem)] shrink-0 flex-col border-l border-panel-border bg-panel panel-glass ambient-glow transition-opacity duration-300 xl:flex">
          <SystemMonitor />
        </aside>
      ) : hideSystemMonitor ? (
        // Mode C: Renders a passive width offset (400px) on extra-large screens to balance the layout.
        <div className="hidden w-[clamp(14rem,16vw,20rem)] shrink-0 xl:block" />
      ) : null}

      {!rightPanelOpen && (
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-0 top-1/2 z-floating flex h-14 w-11 -translate-y-1/2 items-center justify-center rounded-l-lg border-y border-l border-white/10 bg-black/40 text-white/40 shadow-lg transition-all duration-300 ease-out hover:border-white/20 hover:bg-black/60 hover:text-white/80 pointer-events-auto"
          title="Expand right sidebar"
          aria-label="Expand right sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <nav className="mobile-workspace-nav" aria-label="Mobile workspace navigation">
        <button
          type="button"
          className="mobile-workspace-nav-button"
          onClick={() => {
            setRightPanelOpen(false);
            setLeftPanelOpen(!leftPanelOpen);
          }}
          aria-label={leftPanelOpen ? 'Close navigation panel' : 'Open navigation panel'}
          aria-pressed={leftPanelOpen}
        >
          <PanelLeft className="h-4 w-4" />
          <span>Layers</span>
        </button>
        <button
          type="button"
          className={`mobile-workspace-nav-button ${interactionMode === 'chat' ? 'active' : ''}`}
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
            setInteractionMode('chat');
          }}
          aria-label="Open chat"
          aria-pressed={interactionMode === 'chat'}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat</span>
        </button>
        <button
          type="button"
          className="mobile-workspace-nav-button"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(!rightPanelOpen);
          }}
          aria-label={rightPanelOpen ? 'Close details panel' : 'Open details panel'}
          aria-pressed={rightPanelOpen}
        >
          <PanelRight className="h-4 w-4" />
          <span>Details</span>
        </button>
      </nav>
    </div>
  );
}
