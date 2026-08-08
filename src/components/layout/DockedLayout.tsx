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
import { WorkspaceHeader } from './WorkspaceHeader';
import { ChevronLeft } from 'lucide-react';
const LeftPanel = React.lazy(() => import('../panels/LeftPanel').then((m) => ({ default: m.LeftPanel })));
const RightPanel = React.lazy(() => import('../panels/RightPanel').then((m) => ({ default: m.RightPanel })));
import { SystemMonitor } from '../SystemMonitor'; // Nested system metrics tracker widget.
import { useUIStore } from '../../store/uiStore'; // Central state hook providing toggle flags for left/right columns.
import { useViewportSize } from '../../hooks/useViewportSize';
import { useDeviceProfile } from '../../hooks/useDeviceProfile';
import { buildWorkspaceRailPx } from '../panels/panelGeometry';
import { useTouchInput } from '../../hooks/useTouchInput';

export function DockedLayout() {
  // Read open status of panels directly from the Zustand global store.
  const {
    settingsDocked,
    showSettings,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    interactionMode
  } = useUIStore();
  const viewportSize = useViewportSize();
  const deviceProfile = useDeviceProfile(leftPanelOpen && rightPanelOpen);

  // Enable edge-swipe gestures on touch interface devices to toggle side panels
  useTouchInput({
    onEdgeSwipe: (edge) => {
      if (edge === 'left' && !leftPanelOpen) {
        setLeftPanelOpen(true);
      } else if (edge === 'right' && !rightPanelOpen) {
        setRightPanelOpen(true);
      }
    }
  });

  // Design logic: Hide the performance meter dashboard if the settings page is docked onto the side layout.
  const hideSystemMonitor = showSettings && settingsDocked;
  // The telemetry aside only earns its column where the profile says panels
  // dock and there is width to spare — same source of truth as the panels.
  const showPassiveTelemetry =
    interactionMode !== 'chat' && !hideSystemMonitor && deviceProfile.showsPassiveTelemetry;

  // Derived from the same geometry the fixed side panels use, so the reserved
  // rail always matches their real rendered width. Computing these independently
  // is what previously let the chat surface slide underneath the sidebars.
  const leftRailWidth = `${buildWorkspaceRailPx(viewportSize, leftPanelOpen, rightPanelOpen, 'left', deviceProfile)}px`;
  const rightRailWidth = rightPanelOpen
    ? `${buildWorkspaceRailPx(viewportSize, leftPanelOpen, rightPanelOpen, 'right', deviceProfile)}px`
    : showPassiveTelemetry
      ? 'clamp(14rem, 16vw, 20rem)'
      : '0px';

  // Enforce the profile's panel budget as the viewport changes. The old rule
  // closed BOTH panels below 760px and latched, so a phone booted to a bare
  // workspace; now the right (context) panel survives and the constraint is
  // re-evaluated on every resize instead of once per crossing.
  React.useEffect(() => {
    if (deviceProfile.maxConcurrentPanels >= 2) return;
    if (leftPanelOpen && rightPanelOpen) setLeftPanelOpen(false);
  }, [deviceProfile.maxConcurrentPanels, leftPanelOpen, rightPanelOpen, setLeftPanelOpen]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
      {/* Top Workspace Header Bar */}
      <WorkspaceHeader />

      {/* Main Workspace Layout */}
      <div
        className="flex flex-1 h-full w-full overflow-hidden bg-transparent relative"
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
          className="flex-1 flex flex-col relative z-content bg-transparent pointer-events-none"
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
          // Mode B: Renders system telemetry inside a fixed-width aside bar.
          // Visibility is decided by `showPassiveTelemetry` above, not a Tailwind
          // breakpoint — `xl:flex` (1280px) and the geometry's 760px threshold
          // used to disagree for every viewport in between.
          <aside className="relative z-chrome flex w-[clamp(14rem,16vw,20rem)] shrink-0 flex-col border-l border-panel-border bg-panel panel-glass ambient-glow transition-opacity duration-300">
            <SystemMonitor />
          </aside>
        ) : hideSystemMonitor && deviceProfile.showsPassiveTelemetry ? (
          // Mode C: Passive width offset that balances the layout when the
          // monitor is hidden, at the sizes that would have shown it.
          <div className="w-[clamp(14rem,16vw,20rem)] shrink-0" />
        ) : null}

        {!rightPanelOpen && (
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            className="fixed right-0 top-1/2 z-floating flex h-14 w-11 -translate-y-1/2 items-center justify-center rounded-l-lg border-y border-l border-white/10 bg-black/40 text-white/40 shadow-lg transition-all duration-300 ease-out hover:border-white/20 hover:bg-black/60 hover:text-white/80 pointer-events-auto cursor-pointer"
            title="Expand right sidebar"
            aria-label="Expand right sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
