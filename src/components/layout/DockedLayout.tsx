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
const LeftPanel = React.lazy(() => import('../panels/LeftPanel').then(m => ({ default: m.LeftPanel })));
const RightPanel = React.lazy(() => import('../panels/RightPanel').then(m => ({ default: m.RightPanel })));
import { SystemMonitor } from '../SystemMonitor'; // Nested system metrics tracker widget.
import { useUIStore } from '../../store/uiStore'; // Central state hook providing toggle flags for left/right columns.

export function DockedLayout() {
  // Read open status of panels directly from the Zustand global store.
  const { setShowSettings, settingsDocked, showSettings, rightPanelOpen } = useUIStore();
  
  // Design logic: Hide the performance meter dashboard if the settings page is docked onto the side layout.
  const hideSystemMonitor = showSettings && settingsDocked;

  return (
    // Flexbox row layout spanning full viewport width. Inherits transparency so Cesium canvas is visible behind panels.
    <div className="flex h-full w-full overflow-hidden bg-transparent">
      {/* COLUMN 1: Collapsible navigation bar. Self-manages responsive hide/show states internally. */}
      <Suspense fallback={null}>
        <LeftPanel />
      </Suspense>

      {/* COLUMN 2: Main center area. Sets flex-1 to occupy all remaining width.
          Uses pointer-events-none so mouse interaction drops down to Cesium 3D canvas layer. */}
      <main className="flex-1 flex flex-col relative z-10 bg-transparent pointer-events-none">
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
      ) : !hideSystemMonitor ? (
        // Mode B: Renders system telemetry inside a fixed-width aside bar (320px width).
        // Uses `xl:flex` to hide on smaller screens, appearing automatically once viewport exceeds 1280px wide.
        <aside className="relative z-20 hidden w-80 shrink-0 flex-col border-l border-panel-border bg-panel panel-glass ambient-glow transition-opacity duration-300 xl:flex">
          <SystemMonitor />
        </aside>
      ) : (
        // Mode C: Renders a passive width offset (400px) on extra-large screens to balance the layout.
        <div className="hidden w-[400px] shrink-0 xl:block" />
      )}
    </div>
  );
}
