import { useMemo } from 'react';
import { constellations } from '@/data/constellations';
import { TELESCOPE_PRESETS as presets, resolveTelescopePresetCoordinates, type ResolvedTelescopeCoordinates, type TelescopePreset } from '@/data/telescopePresets';
import { precessEquatorialJ2000ToDate } from '@/lib/coordinateTransforms';
import { projectTelescopeTargetToObserverView, type EarthObserverProjection } from '@/lib/earthObserverProjection';
import { WWT_CONSTELLATION_COLORS, type WwtOverlay } from '@/lib/wwt/researchApp';

const FALLBACK_STAR_FIELD = Array.from({ length: 96 }, (_, index) => ({
  id: `star-${index}`,
  x: ((index * 37) % 1000) / 10,
  y: ((index * 83) % 1000) / 10,
  radius: index % 11 === 0 ? 0.24 : index % 5 === 0 ? 0.16 : 0.1,
  opacity: 0.18 + ((index * 19) % 50) / 100,
}));

type ProjectedConstellationStar = {
  name: string;
  x: number;
  y: number;
  magnitude: number;
  visibleHemisphere: boolean;
};

type ProjectedConstellationOverlay = {
  id: string;
  name: string;
  stars: ProjectedConstellationStar[];
  connections: [number, number][];
  labelX: number;
  labelY: number;
  visibleStarCount: number;
  isActiveRegion: boolean;
};

interface WwtFallbackViewProps {
  activePreset: TelescopePreset;
  activePresetCoordinates: ResolvedTelescopeCoordinates;
  coordinateDate: Date;
  earthReferenceFrame: EarthObserverProjection;
  floating: boolean;
  overlays: Record<WwtOverlay, boolean>;
  wwtRuntimeState: string;
}

export default function WwtFallbackView({
  activePreset, activePresetCoordinates, coordinateDate, earthReferenceFrame, floating, overlays, wwtRuntimeState,
}: WwtFallbackViewProps) {
  const earthViewportTarget = {
    x: 50,
    y: 50,
    orbitTilt: earthReferenceFrame.latitudeDegrees >= 0 ? -14 : 14,
    color: activePreset.color || '#00fff7',
  };

  const projectedPresetTargets = useMemo(() => {
    return presets.map((preset) => {
      const coordinates = resolveTelescopePresetCoordinates(preset, coordinateDate);
      const observerProjection = projectTelescopeTargetToObserverView(
        activePresetCoordinates.raHours,
        activePresetCoordinates.decDegrees,
        coordinates.raHours,
        coordinates.decDegrees,
        coordinateDate
      );
      return {
        id: preset.id,
        name: preset.name,
        color: preset.color || '#00fff7',
        x: observerProjection.x,
        y: observerProjection.y,
        angularSeparationDegrees: observerProjection.angularSeparationDegrees,
        altitudeAngleDegrees: observerProjection.altitudeAngleDegrees,
        visibleHemisphere: observerProjection.visibleHemisphere,
        horizonClass: observerProjection.horizonClass,
        isActive: preset.name === activePreset.name,
      };
    });
  }, [activePreset.name, activePresetCoordinates, coordinateDate]);

  const projectedPresetSummary = useMemo(() => {
    const nearSide = projectedPresetTargets.filter((target) => target.visibleHemisphere).length;
    const activeTarget = projectedPresetTargets.find((target) => target.isActive);
    return {
      nearSide,
      farSide: projectedPresetTargets.length - nearSide,
      activeAltitude: activeTarget?.altitudeAngleDegrees ?? 90,
      activeHorizonClass: activeTarget?.horizonClass ?? 'zenith',
    };
  }, [projectedPresetTargets]);

  const projectedConstellationOverlays = useMemo<ProjectedConstellationOverlay[]>(() => {
    const activePresetId = String(activePreset.id || '').toLowerCase();
    const activePresetName = String(activePreset.name || '').toLowerCase();

    return constellations.map((constellation) => {
      const stars = constellation.stars.map((star) => {
        const precessed = precessEquatorialJ2000ToDate({ ra: star.ra, dec: star.dec }, coordinateDate);
        const projection = projectTelescopeTargetToObserverView(
          activePresetCoordinates.raHours,
          activePresetCoordinates.decDegrees,
          precessed.ra,
          precessed.dec,
          coordinateDate
        );

        return {
          name: star.name,
          x: projection.x,
          y: projection.y,
          magnitude: star.magnitude ?? 3,
          visibleHemisphere: projection.visibleHemisphere,
        };
      });

      const visibleStars = stars.filter((star) => star.visibleHemisphere);
      const labelStars = visibleStars.length ? visibleStars : stars;
      const labelX = labelStars.reduce((sum, star) => sum + star.x, 0) / Math.max(1, labelStars.length);
      const labelY = labelStars.reduce((sum, star) => sum + star.y, 0) / Math.max(1, labelStars.length);
      const normalizedConstellationId = constellation.id.replace(/_/g, '-').toLowerCase();
      const normalizedConstellationName = constellation.name.toLowerCase();

      return {
        id: constellation.id,
        name: constellation.name,
        stars,
        connections: constellation.connections,
        labelX: Math.max(12, Math.min(88, labelX)),
        labelY: Math.max(12, Math.min(88, labelY)),
        visibleStarCount: visibleStars.length,
        isActiveRegion:
          activePresetId.includes(normalizedConstellationId) ||
          activePresetName.includes(normalizedConstellationName.split(' ')[0]),
      };
    });
  }, [activePreset, activePresetCoordinates, coordinateDate]);

  const projectedConstellationSummary = useMemo(() => ({
    visibleConstellations: projectedConstellationOverlays.filter((constellation) => constellation.visibleStarCount > 0).length,
    activeRegion: projectedConstellationOverlays.find((constellation) => constellation.isActiveRegion)?.name || 'none',
  }), [projectedConstellationOverlays]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Earth observer fallback view for ${activePreset.name}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="wwtFallbackEarth" cx="42%" cy="36%" r="62%">
            <stop offset="0%" stopColor="#55e6ff" stopOpacity="0.92" />
            <stop offset="48%" stopColor="#0b63d8" stopOpacity="0.78" />
            <stop offset="82%" stopColor="#06214f" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020713" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="wwtFallbackTerminator" x1="20%" x2="84%" y1="18%" y2="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
            <stop offset="54%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.46" />
          </linearGradient>
          <filter id="wwtFallbackGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="wwtFallbackLineOfSight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
            <stop offset="42%" stopColor={earthViewportTarget.color} stopOpacity="0.1" />
            <stop offset="100%" stopColor={earthViewportTarget.color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {FALLBACK_STAR_FIELD.map((star) => (
          <circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.radius}
            fill="#dff7ff"
            opacity={star.opacity}
          />
        ))}

        {overlays.showGrid && (
          <g aria-label="Fallback celestial grid">
            <circle cx="50" cy="50" r="30" fill="none" stroke="#0ea5e9" strokeOpacity="0.09" strokeWidth="0.6" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#0ea5e9" strokeOpacity="0.07" strokeWidth="0.45" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff" strokeOpacity="0.045" strokeWidth="0.35" strokeDasharray="0.9 2.2" />
            <ellipse
              cx="50"
              cy="50"
              rx="41"
              ry="12"
              fill="none"
              stroke={earthViewportTarget.color}
              strokeOpacity="0.22"
              strokeWidth="0.55"
              transform={`rotate(${earthViewportTarget.orbitTilt} 50 50)`}
            />
            <line x1="50" y1="50" x2={earthViewportTarget.x} y2={earthViewportTarget.y} stroke={earthViewportTarget.color} strokeOpacity="0.55" strokeWidth="0.35" />
            <g opacity="0.3">
              <ellipse cx="50" cy="50" rx="24" ry="8.2" fill="none" stroke="#b6f3ff" strokeWidth="0.25" />
              <ellipse cx="50" cy="50" rx="24" ry="15.8" fill="none" stroke="#b6f3ff" strokeWidth="0.18" />
              <line x1="26" y1="50" x2="74" y2="50" stroke="#b6f3ff" strokeWidth="0.22" />
              <path d="M 50 26 C 44 34 44 66 50 74" fill="none" stroke="#b6f3ff" strokeWidth="0.18" />
              <path d="M 50 26 C 56 34 56 66 50 74" fill="none" stroke="#b6f3ff" strokeWidth="0.18" />
            </g>
          </g>
        )}
        <circle cx="50" cy="50" r="24" fill="url(#wwtFallbackEarth)" stroke="#6ee7ff" strokeOpacity="0.34" strokeWidth="0.7" />
        <path d="M 35 41 C 39 36 47 36 50 42 C 45 44 42 48 36 47 C 33 45 32 43 35 41 Z" fill="#39a66b" fillOpacity="0.48" />
        <path d="M 56 35 C 64 37 69 43 68 49 C 63 47 60 45 56 47 C 53 44 52 39 56 35 Z" fill="#39a66b" fillOpacity="0.42" />
        <path d="M 49 55 C 54 53 61 56 62 62 C 57 66 49 65 47 60 C 46 58 47 56 49 55 Z" fill="#39a66b" fillOpacity="0.38" />
        <circle cx="50" cy="50" r="24" fill="url(#wwtFallbackTerminator)" />
        <circle cx="50" cy="50" r="25.2" fill="none" stroke="#67e8f9" strokeOpacity="0.18" strokeWidth="2.2" filter="url(#wwtFallbackGlow)" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#dff7ff" strokeOpacity="0.18" strokeWidth="0.35" />
        <circle cx="50" cy="50" r="31.5" fill="none" stroke="#fbbf24" strokeOpacity="0.22" strokeWidth="0.34" strokeDasharray="1 1.8" />
        <text x="25" y="22.5" fill="#dff7ff" opacity="0.42" fontSize="1.85" fontFamily="monospace" letterSpacing="0">
          near-side sky objects
        </text>
        <text x="58.5" y="82.5" fill="#fbbf24" opacity="0.48" fontSize="1.85" fontFamily="monospace" letterSpacing="0">
          far-side limb
        </text>

        {overlays.showConstellationSelection && (
          <g aria-label="Active constellation region">
            {projectedConstellationOverlays.filter((constellation) => constellation.isActiveRegion).map((constellation) => (
              <circle
                key={`${constellation.id}-active-region`}
                cx={constellation.labelX}
                cy={constellation.labelY}
                r="9.2"
                fill="none"
                stroke={earthViewportTarget.color}
                strokeOpacity="0.28"
                strokeWidth="0.42"
                strokeDasharray="1.4 1.2"
              />
            ))}
          </g>
        )}

        {(overlays.showConstellationFigures || overlays.showConstellationLabels) && (
          <g aria-label="Projected constellation context">
            {overlays.showConstellationFigures && projectedConstellationOverlays.map((constellation) => (
              <g key={`${constellation.id}-lines`} opacity={constellation.isActiveRegion ? 0.86 : 0.5}>
                {constellation.connections.map(([startIndex, endIndex]) => {
                  const start = constellation.stars[startIndex];
                  const end = constellation.stars[endIndex];
                  if (!start || !end) return null;
                  const nearSegment = start.visibleHemisphere && end.visibleHemisphere;
                  return (
                    <line
                      key={`${constellation.id}-${startIndex}-${endIndex}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={constellation.isActiveRegion ? WWT_CONSTELLATION_COLORS.constellationSelectionColor : WWT_CONSTELLATION_COLORS.constellationFigureColor}
                      strokeOpacity={nearSegment ? 0.42 : 0.18}
                      strokeWidth={constellation.isActiveRegion ? 0.42 : 0.24}
                      strokeDasharray={nearSegment ? undefined : '0.8 1.1'}
                    />
                  );
                })}
                {constellation.stars.map((star) => (
                  <circle
                    key={`${constellation.id}-${star.name}`}
                    cx={star.x}
                    cy={star.y}
                    r={Math.max(0.38, 1.35 - star.magnitude * 0.22)}
                    fill={constellation.isActiveRegion ? '#e2edff' : '#b7c8de'}
                    opacity={star.visibleHemisphere ? 0.82 : 0.36}
                  />
                ))}
              </g>
            ))}
            {overlays.showConstellationLabels && projectedConstellationOverlays.map((constellation) => (
              <text
                key={`${constellation.id}-label`}
                x={constellation.labelX + 1.8}
                y={constellation.labelY - 1.8}
                fill={constellation.isActiveRegion ? '#e2edff' : '#a5b8d0'}
                opacity={constellation.visibleStarCount > 0 ? 0.64 : 0.24}
                fontSize={constellation.isActiveRegion ? 2.1 : 1.75}
                fontFamily="monospace"
                letterSpacing="0"
              >
                {constellation.name}
              </text>
            ))}
          </g>
        )}

        <g aria-label="Projected WWT telescope objects">
          {projectedPresetTargets.map((target) => (
            <g
              key={target.id}
              opacity={target.isActive ? 1 : target.visibleHemisphere ? 0.62 : 0.36}
            >
              {target.isActive && (
                <>
                  <circle cx="50" cy="50" r="12" fill="url(#wwtFallbackLineOfSight)" />
                  <circle cx="50" cy="50" r="6.6" fill="none" stroke={target.color} strokeOpacity="0.36" strokeWidth="0.35" strokeDasharray="1.2 1.2" />
                  <circle cx="50" cy="50" r="10.8" fill="none" stroke={target.color} strokeOpacity="0.22" strokeWidth="0.3" strokeDasharray="0.8 1.6" />
                  <text
                    x="53.2"
                    y="45.4"
                    fill="#eefbff"
                    fontSize="2.1"
                    fontFamily="monospace"
                    letterSpacing="0"
                  >
                    zenith subpoint
                  </text>
                </>
              )}
              {!target.isActive && (
                <circle
                  cx={target.x}
                  cy={target.y}
                  r={target.visibleHemisphere ? 0.9 : 0.72}
                  fill={target.color}
                />
              )}
              <circle
                cx={target.x}
                cy={target.y}
                r={target.isActive ? 4.6 : target.visibleHemisphere ? 2.6 : 2.3}
                fill="none"
                stroke={target.color}
                strokeOpacity={target.isActive ? 0.62 : target.visibleHemisphere ? 0.26 : 0.18}
                strokeWidth={target.isActive ? 0.5 : 0.28}
                strokeDasharray={target.visibleHemisphere ? undefined : '0.9 1.3'}
              />
              {target.isActive && (
                <text
                  x={target.x + 2.6}
                  y={Math.max(8, target.y - 3)}
                  fill="#eefbff"
                  fontSize="2.4"
                  fontFamily="monospace"
                  letterSpacing="0"
                >
                  {target.name}
                </text>
              )}
              {!target.isActive && target.visibleHemisphere && target.angularSeparationDegrees <= 28 && (
                <text
                  x={target.x + 2.1}
                  y={target.y + 0.8}
                  fill={target.color}
                  opacity="0.62"
                  fontSize="1.75"
                  fontFamily="monospace"
                  letterSpacing="0"
                >
                  {target.altitudeAngleDegrees.toFixed(0)}deg alt
                </text>
              )}
              {!target.isActive && !target.visibleHemisphere && (
                <path
                  d={`M ${target.x - 1.7} ${target.y - 1.7} L ${target.x + 1.7} ${target.y + 1.7} M ${target.x + 1.7} ${target.y - 1.7} L ${target.x - 1.7} ${target.y + 1.7}`}
                  stroke={target.color}
                  strokeOpacity="0.28"
                  strokeWidth="0.22"
                />
              )}
            </g>
          ))}
        </g>

        <g filter="url(#wwtFallbackGlow)">
          <circle cx={earthViewportTarget.x} cy={earthViewportTarget.y} r="2.2" fill={earthViewportTarget.color} />
          <circle cx={earthViewportTarget.x} cy={earthViewportTarget.y} r="5" fill="none" stroke={earthViewportTarget.color} strokeOpacity="0.55" strokeWidth="0.55" strokeDasharray="1.2 1.1" />
          <path
            d={`M ${earthViewportTarget.x - 5} ${earthViewportTarget.y} L ${earthViewportTarget.x + 5} ${earthViewportTarget.y} M ${earthViewportTarget.x} ${earthViewportTarget.y - 5} L ${earthViewportTarget.x} ${earthViewportTarget.y + 5}`}
            stroke={earthViewportTarget.color}
            strokeOpacity="0.68"
            strokeWidth="0.45"
          />
        </g>
      </svg>

        <div className={`absolute inset-x-4 ${floating ? 'bottom-4' : 'bottom-[5.75rem]'} z-content rounded border border-primary/20 bg-black/65 p-3 font-mono text-[8px] uppercase tracking-wider text-white/55 backdrop-blur-md`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-bold text-primary">Earth Observer Frame</span>
            <span className="text-right text-white/70">{activePreset.name}</span>
          </div>
        <div className="grid grid-cols-4 gap-2 text-[7.5px]">
          <div>
            <span className="block text-white/30">Subpoint lon</span>
            <span className="text-primary">{earthReferenceFrame.longitudeLabel}</span>
          </div>
          <div>
            <span className="block text-white/30">Declination</span>
            <span className="text-primary">{earthReferenceFrame.latitudeLabel}</span>
          </div>
          <div>
            <span className="block text-white/30">Target alt</span>
            <span className="text-primary">{projectedPresetSummary.activeAltitude.toFixed(1)} deg</span>
          </div>
          <div>
            <span className="block text-white/30">Runtime state</span>
            <span className="text-amber-300">{wwtRuntimeState}</span>
          </div>
        </div>
        <div className="mt-2 border-t border-white/10 pt-2 text-[7px] leading-relaxed text-white/45">
          Coordinate source: fixed catalog coordinates.
        </div>
        <div className="mt-2 border-t border-white/10 pt-2 text-[7px] leading-relaxed text-white/40">
          This schematic projects catalog targets onto the Earth observer frame. Solid markers are on the visible side and dashed markers lie beyond the Earth limb.
        </div>
        </div>
        <div className="absolute left-4 top-4 z-content hidden rounded border border-white/10 bg-black/50 px-3 py-2 font-mono text-[7px] uppercase tracking-wider text-white/45 backdrop-blur-md sm:block">
          <div className="font-bold text-white/70">Projected WWT Objects</div>
          <div>{projectedPresetTargets.length} presets in observer frame</div>
          <div>{projectedPresetSummary.nearSide} near side / {projectedPresetSummary.farSide} far limb</div>
          <div>active target: {projectedPresetSummary.activeHorizonClass}</div>
          <div>{projectedConstellationSummary.visibleConstellations} constellation groups visible</div>
          <div>active region: {projectedConstellationSummary.activeRegion}</div>
          <div className="mt-1 text-amber-200/70">schematic fallback</div>
        </div>
      </div>
  );
}
