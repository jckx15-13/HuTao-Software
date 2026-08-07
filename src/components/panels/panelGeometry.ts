import type { ViewportSize } from '@/hooks/useViewportSize';
import { resolveDeviceProfile, type DeviceProfile } from '@/core/layout/deviceProfile';

export type SpatialPanelPlacement = 'left' | 'right';

export type SpatialPanelStyle = {
  top: string;
  bottom: string;
  left?: string;
  right?: string;
  width: string;
  maxHeight: string;
};

export type SpatialPanelGeometryInput = {
  placement: SpatialPanelPlacement;
  viewport: ViewportSize;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  /** Precomputed profile. Supply it to avoid resolving twice in one render. */
  profile?: DeviceProfile;
};

const clampPx = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
};

function profileFor(
  viewport: ViewportSize,
  leftPanelOpen: boolean,
  rightPanelOpen: boolean,
  provided?: DeviceProfile
): DeviceProfile {
  return provided ?? resolveDeviceProfile(viewport, { dualPanels: leftPanelOpen && rightPanelOpen });
}

/**
 * Horizontal space a docked side panel actually consumes, in px.
 *
 * The side panels render as `position: fixed` overlays, so the workspace has to
 * reserve this much padding itself or the centre column slides underneath them.
 * Both the panels and that reservation must derive from THIS function — when the
 * reservation was computed independently (a `clamp(16rem,18vw,22rem)` CSS var)
 * it disagreed with the real panel width by ~152px at 1366px wide, and the chat
 * surface rendered beneath the sidebars.
 *
 * Returns 0 wherever panels present as sheets rather than docking (phones,
 * watches, short landscape tablets), since a sheet floats over the workspace by
 * design and reserving a rail for it would strand the centre column off-screen.
 */
export function buildWorkspaceRailPx(
  viewport: ViewportSize,
  leftPanelOpen: boolean,
  rightPanelOpen: boolean,
  placement: SpatialPanelPlacement,
  profile?: DeviceProfile
): number {
  const isOpen = placement === 'left' ? leftPanelOpen : rightPanelOpen;
  if (!isOpen) return 0;

  const resolved = profileFor(viewport, leftPanelOpen, rightPanelOpen, profile);
  if (!resolved.reservesRail) return 0;

  return resolved.edgeInsetPx + resolved.panelWidthPx;
}

export function buildSpatialPanelGeometry(input: SpatialPanelGeometryInput): SpatialPanelStyle {
  const { placement, viewport, leftPanelOpen, rightPanelOpen } = input;
  const profile = profileFor(viewport, leftPanelOpen, rightPanelOpen, input.profile);
  const { edgeInsetPx, topInsetPx, bottomInsetPx, panelWidthPx, panelPresentation } = profile;

  // Fullbleed: the panel IS the screen. No maxHeight cap short of the viewport —
  // a watch face has no room to give away to decorative inset.
  if (panelPresentation === 'fullbleed-sheet') {
    return {
      left: `${edgeInsetPx}px`,
      right: `${edgeInsetPx}px`,
      width: `${panelWidthPx}px`,
      top: `calc(${topInsetPx}px + env(safe-area-inset-top))`,
      bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
      maxHeight: `${Math.max(1, viewport.height - topInsetPx - bottomInsetPx)}px`
    };
  }

  if (panelPresentation === 'stacked-sheet') {
    // Only split the height when the profile actually permits two panels; below
    // 560px tall `maxConcurrentPanels` drops to 1 and the survivor takes it all.
    const hasDualPanels = leftPanelOpen && rightPanelOpen && profile.maxConcurrentPanels === 2;
    const shared = {
      left: `${edgeInsetPx}px`,
      right: `${edgeInsetPx}px`,
      width: `${panelWidthPx}px`
    };

    if (hasDualPanels && placement === 'left') {
      return {
        ...shared,
        top: `calc(${Math.max(12, topInsetPx - 10)}px + env(safe-area-inset-top))`,
        bottom: 'calc(52vh + 8px)',
        maxHeight: '42vh'
      };
    }

    if (hasDualPanels && placement === 'right') {
      return {
        ...shared,
        top: 'calc(48vh + 8px)',
        bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
        maxHeight: '42vh'
      };
    }

    return {
      ...shared,
      top: `calc(${topInsetPx}px + env(safe-area-inset-top))`,
      bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
      maxHeight: `${Math.max(240, viewport.height - topInsetPx - bottomInsetPx)}px`
    };
  }

  const reservedChromePx = 32;
  const maxHeightPx = clampPx(
    Math.max(0, viewport.height - topInsetPx - bottomInsetPx - reservedChromePx),
    0,
    viewport.height
  );

  const base: SpatialPanelStyle = {
    top: `calc(${topInsetPx}px + env(safe-area-inset-top))`,
    bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
    width: `${panelWidthPx}px`,
    maxHeight: `${maxHeightPx}px`
  };

  if (placement === 'left') {
    return {
      ...base,
      left: `${edgeInsetPx}px`
    };
  }

  return {
    ...base,
    right: `${edgeInsetPx}px`
  };
}
