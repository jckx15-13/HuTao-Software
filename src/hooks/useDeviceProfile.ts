import { useMemo } from 'react';
import { useViewportSize } from './useViewportSize';
import { resolveDeviceProfile, type DeviceProfile } from '@/core/layout/deviceProfile';

/**
 * The live device profile for the current viewport.
 *
 * `useViewportSize` already coalesces resize/orientation events into a single
 * rAF-batched update, so this recomputes exactly as often as the viewport
 * genuinely changes.
 *
 * Pass `dualPanels` when both side panels are open — docked panel width depends
 * on whether one or two of them have to share the row.
 */
export function useDeviceProfile(dualPanels = false): DeviceProfile {
  // Destructured deliberately: `useViewportSize` returns a fresh object on every
  // rAF tick, so depending on the object itself would rebuild the profile (and
  // re-render every consumer) even when the dimensions have not moved.
  const { width, height } = useViewportSize();

  return useMemo(() => resolveDeviceProfile({ width, height }, { dualPanels }), [width, height, dualPanels]);
}
