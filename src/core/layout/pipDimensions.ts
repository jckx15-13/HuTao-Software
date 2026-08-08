export type PipWindowDimensions = {
  normal: { width: number; height: number };
  large: { width: number; height: number };
  minimized: { width: number; height: number };
};

const clampPx = (value: number, min: number, max: number): number => {
  const normalized = Math.round(value);
  if (!Number.isFinite(normalized)) return min;
  return Math.min(Math.max(normalized, min), max);
};

export function resolvePipWindowDimensions(availableWidth: number, availableHeight: number): PipWindowDimensions {
  const safeWidth = Math.max(0, availableWidth);
  const safeHeight = Math.max(0, availableHeight);
  const normalWidth = clampPx(safeWidth * 0.32, 360, 900);
  const normalHeight = clampPx(safeHeight * 0.34, 260, 620);
  const largeWidth = Math.max(normalWidth + 120, clampPx(safeWidth * 0.55, 480, 1400));
  const largeHeight = Math.max(normalHeight + 60, clampPx(safeHeight * 0.6, 340, 1000));

  return {
    normal: { width: normalWidth, height: normalHeight },
    large: { width: largeWidth, height: largeHeight },
    minimized: { width: clampPx(safeWidth * 0.22, 280, 420), height: 48 }
  };
}