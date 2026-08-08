import { useEffect, useRef } from 'react';

export type SyncSource = 'none' | 'cesium' | 'wwt';

export interface WWTViewStatePayload {
  type: 'wwt_view_state';
  ra: number;      // Right Ascension in degrees or hours
  dec: number;     // Declination in degrees
  fov: number;     // Field of View in degrees
  roll?: number;   // Camera Roll in degrees
}

export let currentSyncSource: SyncSource = 'none';

export function setSyncSource(source: SyncSource): void {
  currentSyncSource = source;
}

/**
 * Custom hook to listen for inbound WWT postMessage telemetry.
 * Enforces mutex lock (syncSource) to prevent infinite camera sync loops.
 */
export function useWWTListener(onViewStateChange?: (payload: WWTViewStatePayload) => void) {
  const lastEventTs = useRef<number>(0);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== 'object') return;
      
      const data = event.data as WWTViewStatePayload;
      if (data.type === 'wwt_view_state') {
        const now = Date.now();
        // 32ms throttle (~30-60 FPS)
        if (now - lastEventTs.current < 32) return;
        lastEventTs.current = now;

        if (currentSyncSource === 'cesium') {
          // Ignore WWT updates while Cesium holds the lock
          return;
        }

        setSyncSource('wwt');
        if (onViewStateChange) {
          onViewStateChange(data);
        }

        // Release mutex after timeout
        setTimeout(() => {
          if (currentSyncSource === 'wwt') {
            setSyncSource('none');
          }
        }, 150);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onViewStateChange]);
}
