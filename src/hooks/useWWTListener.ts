import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';

/**
 * useWWTListener Hook
 * Listens for messages from the WorldWide Telescope iframe.
 * Captures RA/Dec/Roll updates to sync back to the application state.
 */
export function useWWTListener() {
  const syncSource = useUIStore((s) => s.syncSource);
  const setSyncSource = useUIStore((s) => s.setSyncSource);
  const setTelescopeTelemetry = useUIStore((s) => s.setTelescopeTelemetry);
  
  const resetTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      
      // Filter for WWT specific messages
      // Standard WWT web client sends events with 'event' or 'type' properties
      if (data && (data.type === 'wwt_view_state' || data.event === 'view_changed' || data.type === 'view_changed')) {
        
        // If Cesium is currently master, ignore these updates to prevent loops
        if (syncSource === 'cesium') return;

        // Take ownership of the sync Mutex
        if (syncSource !== 'wwt') {
          setSyncSource('wwt');
        }

        // Extract coordinates
        // Note: property names may vary depending on WWT version/wrapper
        const ra = data.ra ?? data.RA;
        const dec = data.dec ?? data.Dec;
        const roll = data.roll ?? data.Roll ?? 0;

        if (ra !== undefined && dec !== undefined) {
          setTelescopeTelemetry({
            ra: typeof ra === 'string' ? parseFloat(ra) : ra,
            dec: typeof dec === 'string' ? parseFloat(dec) : dec,
            roll: typeof roll === 'string' ? parseFloat(roll) : roll,
          });
        }

        // Debounced reset of syncSource to allow Cesium to take over if user stops dragging WWT
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          setSyncSource('none');
        }, 500);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, [syncSource, setSyncSource, setTelescopeTelemetry]);
}
