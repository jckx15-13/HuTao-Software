import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useIssTelemetry } from '../../hooks/useIssTelemetry';
// ... other imports ...
import {
  LANDMASS_POINTS_3D,
  projectUnitVectorInto,
  projectLatLng,
} from '../../lib/globeProjection';
import { SATELLITES } from '../../data/satellites';
import { propagateCircularOrbit, propagateCircularOrbitInto, propagateSatelliteTleInto } from '../../lib/simulation';
import { TELESCOPE_PRESETS } from '@/data/telescopePresets';
import {
  projectTelescopeTargetToEarth,
  projectTelescopeTargetToObserverView,
} from '@/lib/earthObserverProjection';
import { WWV_ORBITAL_ASSET_BY_CATEGORY } from '@/assets/wwvVisualAssets';

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

  return <CesiumBackgroundReal interactive={interactive} />;
}

interface CesiumBackgroundRealProps {
  interactive: boolean;
}

function CesiumBackgroundReal({ interactive }: CesiumBackgroundRealProps) {
  // Scanline/CRT overlay toggle
  const scanlineOverlay = useUIStore((s) => s.scanlineOverlay);
  const telescopeTarget = useUIStore((s) => s.telescopeTarget);
  const isFallbackRuntime = typeof window !== 'undefined' && (
    /HeadlessChrome/i.test(navigator.userAgent) ||
    window.location.search.includes('fallback')
  );
  const activeTelescopePreset = useMemo(() => {
    if (typeof telescopeTarget === 'object' && telescopeTarget?.name) {
      return TELESCOPE_PRESETS.find((preset) => preset.name === telescopeTarget.name) || TELESCOPE_PRESETS[0];
    }
    return TELESCOPE_PRESETS[0];
  }, [telescopeTarget]);
  const activeTelescopeProjection = useMemo(() => {
    return projectTelescopeTargetToEarth(
      activeTelescopePreset.raHours,
      activeTelescopePreset.decDegrees,
      new Date()
    );
  }, [activeTelescopePreset]);
  const activeObserverFrameSummary = useMemo(() => {
    const projectionDate = new Date();
    const nearSide = TELESCOPE_PRESETS.filter((preset) => (
      projectTelescopeTargetToObserverView(
        activeTelescopePreset.raHours,
        activeTelescopePreset.decDegrees,
        preset.raHours,
        preset.decDegrees,
        projectionDate
      ).visibleHemisphere
    )).length;

    return {
      nearSide,
      farSide: TELESCOPE_PRESETS.length - nearSide,
    };
  }, [activeTelescopePreset]);

  const wwvWorker = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return new Worker(new URL('../../workers/wwv.worker.ts', import.meta.url), { type: 'module' });
    } catch (e) {
      console.error('Failed to initialize WWV Worker:', e);
      return null;
    }
  }, []);

  // Synchronously detect WebGL availability
  const [webglError] = useState<string | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      if (isFallbackRuntime) {
        return 'Static fallback runtime';
      }
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
    const isHeadless = /HeadlessChrome/i.test(navigator.userAgent) || window.location.search.includes('fallback');
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
    const orbitalIconImages = new Map<string, HTMLImageElement>();
    const uniqueOrbitalIcons = Array.from(new Set(Object.values(WWV_ORBITAL_ASSET_BY_CATEGORY)));
    uniqueOrbitalIcons.forEach((iconUrl) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = iconUrl;
      orbitalIconImages.set(iconUrl, image);
    });
    let rafId: number | null = null;

    const getOrbitRadius = (altitudeM: number) => {
      const altitudeScale = Math.min(0.26, Math.max(0.025, altitudeM / 150_000_000));
      return R * (1 + altitudeScale);
    };

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
        category: string;
        isIss: boolean;
      }> = [];

      // Add ISS if spaceStations is visible
      if (satelliteCategories['spaceStations'] !== false) {
        sidsToDraw.push({
          id: 'iss',
          name: 'ISS',
          altitudeM: 420_000,
          inclinationRad: (51.64 * Math.PI) / 180,
          omega0: 0.0,
          argLat0: 0.0,
          color: '#00FFF7',
          category: 'spaceStations',
          isIss: true
        });
      }

      // Add other SATELLITES if their category is visible
      const curatedSats = SATELLITES;
      for (let i = 0; i < curatedSats.length; i++) {
        const sat = curatedSats[i];
        if (sat.id === 'iss') continue;
        if (satelliteCategories[sat.category] !== false) {
          sidsToDraw.push({
            id: sat.id,
            name: sat.name,
            altitudeM: sat.altitudeM,
            inclinationRad: sat.inclinationRad,
            omega0: sat.omega0,
            argLat0: sat.argLat0,
            color: sat.color,
            category: sat.category,
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

        const orbitRadius = getOrbitRadius(sat.altitudeM);
        const p = projectLatLng(lat, lng, rotation, tilt, orbitRadius, cx, cy);

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
            const opt = projectLatLng(c.lat, c.lng, rotation, tilt, orbitRadius, cx, cy);
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

        // Draw copied/derived WWV orbital silhouette marker.
        const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
        const iconUrl = WWV_ORBITAL_ASSET_BY_CATEGORY[sat.category] || WWV_ORBITAL_ASSET_BY_CATEGORY.other;
        const iconImage = orbitalIconImages.get(iconUrl);
        const iconSize = isSelected ? 18 : sat.category === 'starlink' ? 10 : 13;

        ctx.save();
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = isSelected ? 11 : 5;
        ctx.globalAlpha = isSelected ? 1 : 0.86;
        if (iconImage?.complete && iconImage.naturalWidth > 0) {
          ctx.drawImage(iconImage, p.x - iconSize / 2, p.y - iconSize / 2, iconSize, iconSize);
        } else {
          ctx.fillStyle = sat.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, isSelected ? 4 : 2.5, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();

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
          ctx.fillText(sat.name, p.x, p.y + 14);
        }
      }

      // 6. Earth-observer telescope target projections.
      const telescopeTarget = uiState.telescopeTarget;
      const activeTelescopeName = typeof telescopeTarget === 'object' && telescopeTarget
        ? telescopeTarget.name
        : '';
      const activeObserverPreset = TELESCOPE_PRESETS.find((preset) => preset.name === activeTelescopeName) || TELESCOPE_PRESETS[0];
      const projectionDate = new Date(currentTime);
      for (let i = 0; i < TELESCOPE_PRESETS.length; i++) {
        const preset = TELESCOPE_PRESETS[i];
        const observerProjection = projectTelescopeTargetToObserverView(
          activeObserverPreset.raHours,
          activeObserverPreset.decDegrees,
          preset.raHours,
          preset.decDegrees,
          projectionDate
        );
        const isActiveTelescope = activeTelescopeName === preset.name || (!activeTelescopeName && i === 0);
        const observerRadius = observerProjection.visibleHemisphere ? R : R * 1.18;
        const observerScale = observerProjection.visibleHemisphere ? observerRadius / 24 : observerRadius / 31.5;
        const p = {
          x: cx + (observerProjection.x - 50) * observerScale,
          y: cy + (observerProjection.y - 50) * observerScale,
        };

        ctx.save();
        ctx.globalAlpha = isActiveTelescope ? 1 : observerProjection.visibleHemisphere ? 0.68 : 0.34;
        ctx.strokeStyle = preset.color + (isActiveTelescope ? 'cc' : observerProjection.visibleHemisphere ? '55' : '44');
        ctx.fillStyle = preset.color;
        ctx.lineWidth = isActiveTelescope ? 1.3 : 0.8;
        ctx.setLineDash(isActiveTelescope ? [3, 3] : observerProjection.visibleHemisphere ? [1.5, 3] : [1, 4]);
        if (isActiveTelescope) {
          ctx.beginPath();
          ctx.moveTo(cx, cy - R * 0.95);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(p.x, p.y, isActiveTelescope ? 4 : observerProjection.visibleHemisphere ? 2.2 : 1.8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActiveTelescope ? 9 : observerProjection.visibleHemisphere ? 5 : 4.5, 0, 2 * Math.PI);
        ctx.stroke();

        if (isActiveTelescope) {
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(preset.name, p.x + 8, p.y - 8);
          ctx.font = '7px monospace';
          ctx.fillStyle = 'rgba(230, 245, 255, 0.72)';
          ctx.fillText(`${observerProjection.latitudeLabel}, ${observerProjection.longitudeLabel}`, p.x + 8, p.y + 2);
          ctx.fillText(observerProjection.relation, p.x + 8, p.y + 11);
        }
        ctx.restore();
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
          <div
            className="relative flex min-h-64 min-w-64 items-center justify-center rounded-full border border-primary/10 bg-[#08090f]/60 shadow-[0_0_60px_rgba(138,91,199,0.06),inset_0_0_20px_rgba(138,91,199,0.03)] backdrop-blur-md"
            style={{ width: 'min(68vmin, 520px)', height: 'min(68vmin, 520px)' }}
          >

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
            <div className="mt-2 rounded border border-primary/10 bg-black/25 px-3 py-2 text-[8px] uppercase tracking-[0.14em] text-white/50">
              <div className="font-bold text-primary/80">Earth Observer Telescope Projection</div>
              <div className="mt-1 text-white/70">{activeTelescopePreset.name}</div>
              <div className="text-white/45">
                {activeTelescopeProjection.latitudeLabel}, {activeTelescopeProjection.longitudeLabel}
              </div>
              <div className="text-white/35">{TELESCOPE_PRESETS.length} WWT presets in observer frame</div>
              <div className="text-white/30">{activeObserverFrameSummary.nearSide} near side / {activeObserverFrameSummary.farSide} far limb</div>
              <div className="text-white/30">WWV-derived orbital silhouettes; live imagery not claimed</div>
            </div>
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
