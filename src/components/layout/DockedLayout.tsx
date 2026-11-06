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
import { ChevronLeft } from 'lucide-react';
const LeftPanel = React.lazy(() => import('../panels/LeftPanel').then((m) => ({ default: m.LeftPanel })));
const RightPanel = React.lazy(() => import('../panels/RightPanel').then((m) => ({ default: m.RightPanel })));
import { WorkspaceHeader } from './WorkspaceHeader';
import { useUIStore } from '../../store/uiStore'; // Central state hook providing toggle flags for left/right columns.
import { useViewportSize } from '../../hooks/useViewportSize';
import { useLayout } from '../../core/layout/engine/useLayout';

export function DockedLayout() {
  // Read open status of panels directly from the Zustand global store.
  const {
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
  } = useUIStore();
  const viewportSize = useViewportSize();
  const collapsedForNarrowViewportRef = React.useRef(false);

  // Rail widths come from the layout engine, which is the single authority on
  // chrome geometry. It differs from the raw buildWorkspaceRailPx call this
  // replaced in one behaviour that matters: when granting both rails would
  // starve the centre stage below MIN_STAGE_WIDTH_PX (measured at 820x1180, a
  // 220px stage), the engine drops a rail entirely instead of shrinking on —
  // and `hidden` names which one, so the panel can present as a sheet.
  const { slots: layoutSlots } = useLayout();
  const leftRailWidth = `${layoutSlots.leftRail?.width ?? 0}px`;
  const rightRailWidth = `${layoutSlots.rightRail?.width ?? 0}px`;

  React.useEffect(() => {
    const isNarrowViewport = viewportSize.width < 760;
    const isTabletViewport = viewportSize.width >= 760 && viewportSize.width < 1024;

    if (isNarrowViewport && !collapsedForNarrowViewportRef.current) {
      if (leftPanelOpen) setLeftPanelOpen(false);
      if (rightPanelOpen) setRightPanelOpen(false);
      collapsedForNarrowViewportRef.current = true;
    } else if (isTabletViewport && leftPanelOpen && rightPanelOpen) {
      setLeftPanelOpen(false);
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
      {/* Both side panels are position:fixed, so they leave this flex row and
          <main> measures the FULL viewport width — it does not shrink around
          them. buildWorkspaceRailPx (panelGeometry.ts:52) already computes the
          width each docked panel occupies, published as the two CSS vars above,
          but nothing consumed them — so the centre column rendered underneath
          the sidebars. Padding by those same vars is what keeps the two apart;
          deriving it from one source rather than re-clamping in CSS is exactly
          what panelGeometry.ts:41-46 documents. */}
      {/* min-w-0 is load-bearing, not cosmetic: a flex item defaults to
          min-width:auto, so <main> cannot shrink below its widest child. Its
          children are full-bleed `inset-0` layers, so once the rail padding
          below is applied the box is forced to viewport+padding (measured 1484px
          at a 1366px viewport) and the right content edge lands underneath the
          right panel — the very overlap the padding exists to prevent. */}
      <main
        className="flex-1 min-w-0 flex flex-col relative z-content bg-transparent pointer-events-none"
        style={{
          paddingLeft: 'var(--workspace-left-rail, 0px)',
          paddingRight: 'var(--workspace-right-rail, 0px)'
        }}
      >
        <WorkspaceHeader />
        <div className="w-full h-full relative pointer-events-none min-h-0 flex-1">
          <CenterPanel />
        </div>
      </main>

      {/* COLUMN 3: Right details panel */}
      {rightPanelOpen && (
        <Suspense fallback={null}>
          <RightPanel />
        </Suspense>
      )}

      {!rightPanelOpen && (
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-0 top-1/2 z-floating flex h-14 w-11 -translate-y-1/2 items-center justify-center rounded-l-lg border-y border-l border-white/10 bg-black/40 text-white/40 shadow-lg transition-all duration-300 ease-out hover:border-white/20 hover:bg-black/60 hover:text-white/80 pointer-events-auto"
          title="Expand right sidebar"
          aria-label="Expand right sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
