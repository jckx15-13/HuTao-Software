import { useMemo } from 'react';
import { useViewportSize } from '@/hooks/useViewportSize';
import { useUIStore } from '@/store/uiStore';
import { resolveLayout, type LayoutResult, type SafeArea } from './layoutEngine';

/**
 * Bind the layout engine to live viewport and store state.
 *
 * This is the ONLY place components should get chrome geometry from. Anything
 * computing its own offset re-creates the class of bug the engine exists to
 * remove: before it, the rail width was derived in `panelGeometry.ts`, published
 * as two CSS variables, and then read by nothing — so the centre column rendered
 * underneath both sidebars while every individual piece looked correct.
 */
export function useLayout(safeArea?: SafeArea): LayoutResult {
  const viewport = useViewportSize();
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const topBarOpen = useUIStore((s) => s.topBarOpen);
  const interactionMode = useUIStore((s) => s.interactionMode);

  return useMemo(
    () =>
      resolveLayout({
        viewport,
        safeArea,
        leftPanelOpen,
        rightPanelOpen,
        topBarOpen,
        // No timeline slot is wired yet; the engine already models it, so this
        // becomes a store read when TimelineBar lands (plan §5, feature 4).
        timelineOpen: false,
        interactionMode
      }),
    [viewport, safeArea, leftPanelOpen, rightPanelOpen, topBarOpen, interactionMode]
  );
}
