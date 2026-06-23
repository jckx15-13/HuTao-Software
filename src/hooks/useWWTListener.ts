import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import { TELESCOPE_PRESETS } from '@/data/telescopePresets';
import { raDegreesToHours } from '@/lib/coordinateTransforms';

const WWT_RESEARCH_APP_ORIGIN = 'https://web.wwtassets.org';

const WWT_ALLOWED_MESSAGE_ORIGINS = new Set(
  [
    WWT_RESEARCH_APP_ORIGIN,
    ...TELESCOPE_PRESETS.map((preset) => {
      try {
        return new URL(preset.url).origin;
      } catch (err) {
        return null;
      }
    })
  ]
    .filter((origin): origin is string => Boolean(origin))
);

function isTrustedWwtOrigin(origin: string): boolean {
  return WWT_ALLOWED_MESSAGE_ORIGINS.has(origin);
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWwtViewState(data: any) {
  const rawRa = toFiniteNumber(data?.ra ?? data?.RA);
  const dec = toFiniteNumber(data?.dec ?? data?.Dec);
  const roll = toFiniteNumber(data?.roll ?? data?.Roll ?? 0);

  if (rawRa === null || dec === null || roll === null) return null;
  if (rawRa < 0 || rawRa > 360 || dec < -90 || dec > 90) return null;

  const ra = rawRa > 24 ? raDegreesToHours(rawRa) : rawRa;
  return { ra, dec, roll };
}

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
      if (!isTrustedWwtOrigin(event.origin)) {
        return;
      }

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

        const viewState = normalizeWwtViewState(data);
        if (viewState) {
          setTelescopeTelemetry(viewState);
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
