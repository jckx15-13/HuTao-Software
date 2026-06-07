import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useIssTelemetry } from '../../hooks/useIssTelemetry';
import {
  LANDMASS_POINTS_3D,
  projectUnitVectorInto,
  projectLatLng,
} from '../../lib/globeProjection';
import { SATELLITES } from '../../data/satellites';
import { propagateCircularOrbit, propagateCircularOrbitInto, propagateSatelliteTleInto } from '../../lib/simulation';

const CesiumBackground3D = React.lazy(() => import('./CesiumBackground3D'));

/**
 * A sub-component to render the real-time ISS telemetry coordinates.
 * Localizing this state subscription stops the main CesiumBackground component
 * from running React rendering loops on telemetry updates.
 */
function TelemetryCoords() {
  const issTelemetry = useUIStore((s) => s.issTelemetry);
  if (!issTelemetry) return null;
  return (
    <div className="flex gap-4 mt-2 text-[8px] text-cyan-400 bg-cyan-950/20 px-3 py-1 rounded border border-cyan-500/10">
      <span>LAT: {issTelemetry.latitude.toFixed(4)}°</span>
      <span>LNG: {issTelemetry.longitude.toFixed(4)}°</span>
      <span>ALT: {issTelemetry.altitude.toFixed(1)} KM</span>
    </div>
  );
}

export function CesiumBackground({ interactive }: { interactive: boolean }) {
  // Unconditional hook call for background telemetry synchronization
  useIssTelemetry();

  // Check if we are running in a headless environment to prevent WebGL/Canvas and CSS blur rendering crashes
  const isHeadless = typeof window !== 'undefined' && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    navigator.webdriver ||
    window.location.search.includes('fallback')
  );

  if (isHeadless) {
    return <div className="absolute inset-0 h-full w-full bg-[#05060b]" />;
  }

  return <CesiumBackgroundReal interactive={interactive} />;
}

interface CesiumBackgroundRealProps {
  interactive: boolean;
}

function CesiumBackgroundReal({ interactive }: CesiumBackgroundRealProps) {
  // Scanline/CRT overlay toggle
  const scanlineOverlay = useUIStore((s) => s.scanlineOverlay);

  // Synchronously detect WebGL availability
  const [webglError] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        return 'WebGL context creation failed (unsupported or blocked)';
      }
      return null;
    } catch (err: unknown) {
      return (err as any)?.message || String(err);
    }
  });

  const [cesiumError, setCesiumError] = useState<string | null>(null);
  const forceFallback = useUIStore((s) => s.forceFallback);
  const hasError = !!webglError || !!cesiumError || forceFallback;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const telemetryRef = useRef<{
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    timestamp: number;
  } | null>(null);
  const [startTime] = useState(() => Date.now());

  // Subscribe to ISS telemetry store updates in a ref to bypass React rendering cycles
  useEffect(() => {
    if (!hasError) return;
    const unsubscribe = useUIStore.subscribe((state) => {
      telemetryRef.current = state.issTelemetry;
    });
    // Grab the initial state
    telemetryRef.current = useUIStore.getState().issTelemetry;
    return unsubscribe;
  }, [hasError]);

  // High performance Canvas 2D Vector Globe rendering loop — throttled to ~30fps
  useEffect(() => {
    if (!hasError) return;

    let active = true;
    let lastFrameTime = 0;
    const isHeadless = /HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver || window.location.search.includes('fallback');
    const FRAME_INTERVAL = isHeadless ? 2000 : (1000 / 30); // Throttled in headless mode to prevent crashes

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply high-DPI (Retina) scaling factors
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // Scale globe radius to available viewport so it looks good at many sizes
    const R = Math.min(rect.width, rect.height) * 0.35; // Core globe radius
    const tilt = (20 * Math.PI) / 180; // Constant axial elevation tilt (20 degrees)

    const pointOut = new Float32Array(3); // reuse buffer to avoid allocations
    const orbitOut = new Float32Array(2); // lat, lng reuse buffer
    const trailCache: Record<string, { lastUpdate: number; points: { lat: number; lng: number }[] }> = {};
    let rafId: number | null = null;

    const renderFrame = (timestamp?: number) => {
      if (!active) return;
      // Frame throttle: skip frames to stay at ~30fps
      const now = timestamp ?? performance.now();
      if (now - lastFrameTime < FRAME_INTERVAL) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }
      lastFrameTime = now;

      // Calculate earth rotation angle (360 degrees every 90 seconds)
      const currentTime = Date.now();
      const rotation = (currentTime / 90000) * 2 * Math.PI;
      const sinRot = Math.sin(rotation);
      const cosRot = Math.cos(rotation);
      const sinTilt = Math.sin(tilt);
      const cosTilt = Math.cos(tilt);

      // Clear the viewport
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. Atmosphere edge glow
      ctx.strokeStyle = 'rgba(138, 91, 199, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.stroke();

      // 4. Cybernetic landmass point landmarks (non-allocating projection)
      ctx.fillStyle = 'rgba(138, 91, 199, 0.35)';
      const pointsLen = LANDMASS_POINTS_3D.length;
      for (let i = 0; i < pointsLen; i += 3) {
        projectUnitVectorInto(
          pointOut,
          0,
          LANDMASS_POINTS_3D[i],
          LANDMASS_POINTS_3D[i + 1],
          LANDMASS_POINTS_3D[i + 2],
          sinRot,
          cosRot,
          sinTilt,
          cosTilt,
          R,
          cx,
          cy
        );
        const px = pointOut[0];
        const py = pointOut[1];
        const pz = pointOut[2];
        if (pz >= 0) {
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // 5. Projected Satellites & Orbit Tracks
      const uiState = useUIStore.getState();
      const showTrails = uiState.satelliteSettings?.showTrails !== false;
      const showAllTrails = uiState.satelliteSettings?.showAllTrails === true;
      const satelliteCategories = uiState.satelliteCategories;
      const activeSatelliteId = uiState.activeSatelliteId;
      const satDataMap = uiState.satelliteData;

      const sidsToDraw: Array<{
        id: string;
        name: string;
        altitudeM: number;
        inclinationRad: number;
        omega0: number;
        argLat0: number;
        color: string;
        isIss: boolean;
      }> = [];

      // Add ISS if spaceStations is visible
      if (satelliteCategories['spaceStations'] !== false) {
        sidsToDraw.push({
          id: 'iss',
          name: '🛰️ ISS',
          altitudeM: 420_000,
          inclinationRad: (51.64 * Math.PI) / 180,
          omega0: 0.0,
          argLat0: 0.0,
          color: '#00FFF7',
          isIss: true
        });
      }

      // Add other SATELLITES if their category is visible
      const curatedSats = SATELLITES;
      for (let i = 0; i < curatedSats.length; i++) {
        const sat = curatedSats[i];
        if (satelliteCategories[sat.category] !== false) {
          sidsToDraw.push({
            id: sat.id,
            name: sat.name,
            altitudeM: sat.altitudeM,
            inclinationRad: sat.inclinationRad,
            omega0: sat.omega0,
            argLat0: sat.argLat0,
            color: sat.color,
            isIss: false
          });
        }
      }

      const elapsed = (currentTime - startTime) / 1000;

      for (let i = 0; i < sidsToDraw.length; i++) {
        const sat = sidsToDraw[i];
        const isSelected = activeSatelliteId === sat.id;
        const shouldHaveTrail = showAllTrails || (isSelected && showTrails);

        let lat = 0;
        let lng = 0;
        if (sat.isIss && telemetryRef.current) {
          lat = telemetryRef.current.latitude;
          lng = telemetryRef.current.longitude;
        } else {
          const tleData = satDataMap[sat.id]?.tle;
          if (tleData) {
            const success = propagateSatelliteTleInto(orbitOut, 0, tleData, new Date(currentTime));
            if (!success) {
              propagateCircularOrbitInto(orbitOut, 0, elapsed, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
            }
          } else {
            propagateCircularOrbitInto(orbitOut, 0, elapsed, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
          }
          lat = orbitOut[0];
          lng = orbitOut[1];
        }

        const p = projectLatLng(lat, lng, rotation, tilt, R, cx, cy);

        // Draw trail if needed (with caching to avoid heavy TLE propagation every frame)
        if (shouldHaveTrail) {
          const cacheKey = `${sat.id}-trail`;
          const cached = trailCache[cacheKey];
          // Refresh coordinates cache every 10 seconds or if it doesn't exist
          if (!cached || (currentTime - cached.lastUpdate > 10000)) {
            const points = [];
            const tleData = satDataMap[sat.id]?.tle;
            for (let u = 0; u <= 2 * Math.PI; u += 0.15) {
              if (tleData) {
                const pastDate = new Date(currentTime - u * 500 * 1000);
                const success = propagateSatelliteTleInto(orbitOut, 0, tleData, pastDate);
                if (!success) {
                  propagateCircularOrbitInto(orbitOut, 0, elapsed - u * 500, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
                }
              } else {
                propagateCircularOrbitInto(orbitOut, 0, elapsed - u * 500, sat.altitudeM, sat.inclinationRad, sat.omega0, sat.argLat0);
              }
              points.push({ lat: orbitOut[0], lng: orbitOut[1] });
            }
            trailCache[cacheKey] = { lastUpdate: currentTime, points };
          }

          ctx.strokeStyle = sat.color + '26'; // 15% opacity
          ctx.lineWidth = isSelected ? 1.5 : 0.8;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          let firstOrbitPoint = true;
          const trailCoords = trailCache[cacheKey].points;
          for (let j = 0; j < trailCoords.length; j++) {
            const c = trailCoords[j];
            const opt = projectLatLng(c.lat, c.lng, rotation, tilt, R, cx, cy);
            if (opt.visible) {
              if (firstOrbitPoint) {
                ctx.moveTo(opt.x, opt.y);
                firstOrbitPoint = false;
              } else {
                ctx.lineTo(opt.x, opt.y);
              }
            } else {
              firstOrbitPoint = true;
            }
          }
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
        }

        if (!p.visible) continue;

        // Draw point marker
        const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
        ctx.fillStyle = sat.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 3.5 : 2, 0, 2 * Math.PI);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = sat.color + '80'; // 50% opacity
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 + pulse * 3, 0, 2 * Math.PI);
          ctx.stroke();

          // Label
          ctx.font = '8px monospace';
          ctx.fillStyle = sat.color;
          ctx.textAlign = 'center';
          ctx.fillText(sat.name.replace(/🛰️\s*|🇨🇳\s*/, ''), p.x, p.y + 14);
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      active = false;
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [hasError]);

  if (hasError) {
    return (
      <div className={`absolute inset-0 h-full w-full bg-[#05060b] flex flex-col items-center justify-center overflow-hidden z-0 select-none ${
        interactive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Animated Cyberpunk Grid Space */}
        {scanlineOverlay && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />
        )}

        {/* Nebulous Aurora glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/5 filter blur-[120px] pointer-events-none animate-pulse" />

        {/* 2D Vector Globe Display */}
        <div className="relative flex flex-col items-center gap-8 z-10">
          <div className="relative w-64 h-64 flex items-center justify-center border border-primary/10 rounded-full bg-[#08090f]/60 backdrop-blur-md shadow-[0_0_60px_rgba(138,91,199,0.06),inset_0_0_20px_rgba(138,91,199,0.03)]">

            {/* Canvas-based spinning vector globe */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />

            {/* Inner Earth glowing aura backdrop */}
            <div className="absolute w-40 h-40 rounded-full bg-primary/3 filter blur-2xl animate-pulse pointer-events-none" />
          </div>

          {/* Telemetry Grid Info */}
          <div className="flex flex-col items-center gap-1 font-mono text-center">
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary/80 font-bold">
              ORBITAL TELEMETRY SYSTEM ACTIVE
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
              WebGL Unavailable — Running Pure Physics Simulation
            </span>
            <TelemetryCoords />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 h-full w-full ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ zIndex: 0 }}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary animate-pulse">
                Syncing Orbital Array...
              </span>
            </div>
          </div>
        }
      >
        <CesiumBackground3D interactive={interactive} onError={setCesiumError} />
      </Suspense>
    </div>
  );
}
