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
  const viewport = useViewportSize();

  return useMemo(
    () => resolveDeviceProfile(viewport, { dualPanels }),
    [viewport.width, viewport.height, dualPanels]
  );
}
