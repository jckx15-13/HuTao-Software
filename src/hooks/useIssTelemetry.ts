import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import {
  propagateCircularOrbit,
  calculateOrbitalSpeed,
  ISS_INCLINATION_RAD,
  ISS_ALTITUDE_M,
} from '../lib/simulation';

/** Base poll interval in ms. */
const BASE_INTERVAL = 5000;
/** Maximum backoff multiplier on consecutive failures. */
const MAX_BACKOFF = 4;
/** API timeout in ms — relaxed from 1.5s to 3s to reduce spurious fallbacks. */
const FETCH_TIMEOUT = 3000;

/**
 * ISS telemetry hook with:
 * - AbortController for clean cancellation
 * - Exponential backoff on consecutive failures
 * - Pure physics fallback propagation
 */
export function useIssTelemetry() {
  const setIssTelemetry = useUIStore((s) => s.setIssTelemetry);
  const startTimeRef = useRef(Date.now());
  const lastFetchedRef = useRef<{ lat: number; lng: number; alt: number; time: number } | null>(null);
  const failCountRef = useRef(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      if (!active) return;

      let lat = 0, lng = 0, alt = 0, vel = 0, simulated = false;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!active) return;

        lat = parseFloat(data.latitude);
        lng = parseFloat(data.longitude);
        alt = parseFloat(data.altitude) * 1000;
        vel = parseFloat(data.velocity);
        lastFetchedRef.current = { lat, lng, alt, time: Date.now() };
        failCountRef.current = 0; // Reset backoff on success
      } catch {
        clearTimeout(timeout);
        if (!active) return;
        simulated = true;

        // Exponential backoff: 1x, 2x, 4x (capped)
        failCountRef.current = Math.min(failCountRef.current + 1, MAX_BACKOFF);

        const baseline = lastFetchedRef.current;
        if (baseline) {
          const dt = (Date.now() - baseline.time) / 1000;
          const omega = (baseline.lng * Math.PI) / 180;
          const argLat = (baseline.lat * Math.PI) / 180;
          const coords = propagateCircularOrbit(dt, baseline.alt, ISS_INCLINATION_RAD, omega, argLat);
          lat = coords.lat;
          lng = coords.lng;
          alt = baseline.alt;
        } else {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const coords = propagateCircularOrbit(elapsed, ISS_ALTITUDE_M, ISS_INCLINATION_RAD, 0, 0);
          lat = coords.lat;
          lng = coords.lng;
          alt = ISS_ALTITUDE_M;
        }
        vel = calculateOrbitalSpeed(alt) * 3.6;
      }

      if (!active) return;

      setIssTelemetry({
        latitude: lat,
        longitude: lng,
        altitude: alt / 1000,
        velocity: vel,
        timestamp: Date.now() / 1000,
        simulated,
      });

      // Schedule next poll with backoff
      const delay = BASE_INTERVAL * Math.pow(2, failCountRef.current - 1);
      timer = setTimeout(poll, Math.max(BASE_INTERVAL, delay));
    }

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [setIssTelemetry]);
}
