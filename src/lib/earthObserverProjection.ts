export interface EarthObserverProjection {
  latitudeDegrees: number;
  longitudeDegrees: number;
  latitudeLabel: string;
  longitudeLabel: string;
  relation: string;
  gmstDegrees: number;
  gmstHours: number;
  localSiderealHours: number;
}

export interface EarthObserverViewProjection {
  x: number;
  y: number;
  latitudeLabel: string;
  longitudeLabel: string;
  angularSeparationDegrees: number;
  altitudeAngleDegrees: number;
  visibleHemisphere: boolean;
  relation: 'zenith subpoint' | 'near-side Earth disc' | 'far-side Earth limb';
  horizonClass: 'zenith' | 'above horizon' | 'at limb' | 'below horizon';
}

const DAY_MS = 86_400_000;
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

function normalizeDegrees(degrees: number): number {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

function normalizeHours(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function formatSignedDegrees(value: number, positive: string, negative: string): string {
  const direction = value >= 0 ? positive : negative;
  return `${direction} ${Math.abs(value).toFixed(1)} deg`;
}

export function getGreenwichMeanSiderealDegrees(date: Date): number {
  const daysSinceJ2000 = (date.getTime() - J2000_UNIX_MS) / DAY_MS;
  const gmst = 280.46061837 + 360.98564736629 * daysSinceJ2000;
  return ((gmst % 360) + 360) % 360;
}

export function projectTelescopeTargetToEarth(
  raHours: number,
  decDegrees: number,
  date: Date = new Date()
): EarthObserverProjection {
  const gmstDegrees = getGreenwichMeanSiderealDegrees(date);
  const raDegrees = normalizeHours(raHours) * 15;
  const longitudeDegrees = normalizeDegrees(raDegrees - gmstDegrees);
  const latitudeDegrees = Math.max(-90, Math.min(90, decDegrees));
  const localSiderealHours = normalizeHours((gmstDegrees + longitudeDegrees) / 15);
  const relation = Math.abs(latitudeDegrees) >= 45
    ? (latitudeDegrees > 0 ? 'northern Earth limb' : 'southern Earth limb')
    : 'equatorial Earth limb';

  return {
    latitudeDegrees,
    longitudeDegrees,
    latitudeLabel: formatSignedDegrees(latitudeDegrees, 'N', 'S'),
    longitudeLabel: formatSignedDegrees(longitudeDegrees, 'E', 'W'),
    relation,
    gmstDegrees,
    gmstHours: gmstDegrees / 15,
    localSiderealHours,
  };
}

export function projectTelescopeTargetToObserverView(
  observerRaHours: number,
  observerDecDegrees: number,
  targetRaHours: number,
  targetDecDegrees: number,
  date: Date = new Date()
): EarthObserverViewProjection {
  const observer = projectTelescopeTargetToEarth(observerRaHours, observerDecDegrees, date);
  const target = projectTelescopeTargetToEarth(targetRaHours, targetDecDegrees, date);

  const observerLat = toRadians(observer.latitudeDegrees);
  const targetLat = toRadians(target.latitudeDegrees);
  const deltaLon = toRadians(normalizeDegrees(target.longitudeDegrees - observer.longitudeDegrees));

  const sinObserverLat = Math.sin(observerLat);
  const cosObserverLat = Math.cos(observerLat);
  const sinTargetLat = Math.sin(targetLat);
  const cosTargetLat = Math.cos(targetLat);
  const cosDeltaLon = Math.cos(deltaLon);

  const projectedX = cosTargetLat * Math.sin(deltaLon);
  const projectedY = (cosObserverLat * sinTargetLat) - (sinObserverLat * cosTargetLat * cosDeltaLon);
  const cosAngularSeparation = clampUnit(
    (sinObserverLat * sinTargetLat) + (cosObserverLat * cosTargetLat * cosDeltaLon)
  );
  const angularSeparationDegrees = Math.acos(cosAngularSeparation) * 180 / Math.PI;
  const altitudeAngleDegrees = 90 - angularSeparationDegrees;
  const visibleHemisphere = cosAngularSeparation >= 0;
  const isObserverCenter = angularSeparationDegrees < 0.1;
  const horizonClass = isObserverCenter
    ? 'zenith'
    : Math.abs(altitudeAngleDegrees) < 1
      ? 'at limb'
      : altitudeAngleDegrees > 0
        ? 'above horizon'
        : 'below horizon';

  let viewX = projectedX;
  let viewY = projectedY;

  if (!visibleHemisphere) {
    const magnitude = Math.hypot(projectedX, projectedY);
    viewX = magnitude > 0.0001 ? projectedX / magnitude : 0;
    viewY = magnitude > 0.0001 ? projectedY / magnitude : -1;
  }

  const radius = visibleHemisphere ? 24 : 31.5;

  return {
    x: Math.max(9, Math.min(91, 50 + viewX * radius)),
    y: Math.max(9, Math.min(91, 50 - viewY * radius)),
    latitudeLabel: target.latitudeLabel,
    longitudeLabel: target.longitudeLabel,
    angularSeparationDegrees,
    altitudeAngleDegrees,
    visibleHemisphere,
    relation: isObserverCenter
      ? 'zenith subpoint'
      : visibleHemisphere
        ? 'near-side Earth disc'
        : 'far-side Earth limb',
    horizonClass,
  };
}
