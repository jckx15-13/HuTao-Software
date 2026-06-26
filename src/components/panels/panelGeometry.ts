import type { ViewportSize } from '@/hooks/useViewportSize';

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
};

const clampPx = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
};

const buildEdgeInsetPx = (viewportWidth: number): number => {
  return clampPx(viewportWidth * 0.025, 14, 24);
};

const buildPanelWidthPx = (viewportWidth: number, leftOpen: boolean, rightOpen: boolean): number => {
  const hasDualPanels = leftOpen && rightOpen;
  const edgeInsetPx = buildEdgeInsetPx(viewportWidth);
  const preferredWidthPx = clampPx(viewportWidth * 0.29, 280, 420);

  const availablePx = hasDualPanels
    ? Math.max(1, Math.floor((viewportWidth - edgeInsetPx * 2 - 40) / 2))
    : Math.max(1, viewportWidth - edgeInsetPx * 2 - 24);

  return Math.min(preferredWidthPx, Math.max(1, availablePx));
};

const buildVerticalInsetPx = (viewportHeight: number, kind: 'top' | 'bottom'): number => {
  const preferredRatios: Record<'top' | 'bottom', number> = {
    top: 0.08,
    bottom: 0.075,
  };
  const insetLimits: Record<'top' | 'bottom', { min: number; max: number }> = {
    top: { min: 28, max: 96 },
    bottom: { min: 24, max: 88 },
  };

  const { min, max } = insetLimits[kind];
  return clampPx(viewportHeight * preferredRatios[kind], min, max);
};

export function buildSpatialPanelGeometry(input: SpatialPanelGeometryInput): SpatialPanelStyle {
  const { placement, viewport, leftPanelOpen, rightPanelOpen } = input;
  const edgeInsetPx = buildEdgeInsetPx(viewport.width);
  const topInsetPx = buildVerticalInsetPx(viewport.height, 'top');
  const bottomInsetPx = buildVerticalInsetPx(viewport.height, 'bottom');

  if (viewport.width < 760) {
    const hasDualPanels = leftPanelOpen && rightPanelOpen;
    const width = `calc(100vw - ${edgeInsetPx * 2}px)`;
    const shared = {
      left: `${edgeInsetPx}px`,
      right: `${edgeInsetPx}px`,
      width,
    };

    if (hasDualPanels && placement === 'left') {
      return {
        ...shared,
        top: `calc(${Math.max(12, topInsetPx - 10)}px + env(safe-area-inset-top))`,
        bottom: 'calc(52vh + 8px)',
        maxHeight: '42vh',
      };
    }

    if (hasDualPanels && placement === 'right') {
      return {
        ...shared,
        top: 'calc(48vh + 8px)',
        bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
        maxHeight: '42vh',
      };
    }

    return {
      ...shared,
      top: `calc(${topInsetPx}px + env(safe-area-inset-top))`,
      bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
      maxHeight: `${Math.max(240, viewport.height - topInsetPx - bottomInsetPx)}px`,
    };
  }

  const widthPx = buildPanelWidthPx(viewport.width, leftPanelOpen, rightPanelOpen);
  const reservedChromePx = 32;
  const maxHeightPx = clampPx(Math.max(0, viewport.height - topInsetPx - bottomInsetPx - reservedChromePx), 0, viewport.height);

  const base: SpatialPanelStyle = {
    top: `calc(${topInsetPx}px + env(safe-area-inset-top))`,
    bottom: `calc(${bottomInsetPx}px + env(safe-area-inset-bottom))`,
    width: `${widthPx}px`,
    maxHeight: `${maxHeightPx}px`,
  };

  if (placement === 'left') {
    return {
      ...base,
      left: `${edgeInsetPx}px`,
    };
  }

  return {
    ...base,
    right: `${edgeInsetPx}px`,
  };
}
