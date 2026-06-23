export type PlanetId = 'mars' | 'jupiter' | 'saturn' | 'neptune';

export interface EquatorialCoordinates {
  raHours: number;
  decDegrees: number;
  distanceAu: number;
}

type OrbitalElements = {
  nodeDeg: number;
  nodeRateDegPerDay: number;
  inclinationDeg: number;
  inclinationRateDegPerDay: number;
  perihelionDeg: number;
  perihelionRateDegPerDay: number;
  semiMajorAxisAu: number;
  semiMajorAxisRateAuPerDay: number;
  eccentricity: number;
  eccentricityRatePerDay: number;
  meanAnomalyDeg: number;
  meanAnomalyRateDegPerDay: number;
};

const DAY_MS = 86_400_000;
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

const EARTH_ELEMENTS: OrbitalElements = {
  nodeDeg: 0,
  nodeRateDegPerDay: 0,
  inclinationDeg: 0,
  inclinationRateDegPerDay: 0,
  perihelionDeg: 282.9404,
  perihelionRateDegPerDay: 4.70935e-5,
  semiMajorAxisAu: 1,
  semiMajorAxisRateAuPerDay: 0,
  eccentricity: 0.016709,
  eccentricityRatePerDay: -1.151e-9,
  meanAnomalyDeg: 356.0470,
  meanAnomalyRateDegPerDay: 0.9856002585,
};

const PLANET_ELEMENTS: Record<PlanetId, OrbitalElements> = {
  mars: {
    nodeDeg: 49.5574,
    nodeRateDegPerDay: 2.11081e-5,
    inclinationDeg: 1.8497,
    inclinationRateDegPerDay: -1.78e-8,
    perihelionDeg: 286.5016,
    perihelionRateDegPerDay: 2.92961e-5,
    semiMajorAxisAu: 1.523688,
    semiMajorAxisRateAuPerDay: 0,
    eccentricity: 0.093405,
    eccentricityRatePerDay: 2.516e-9,
    meanAnomalyDeg: 18.6021,
    meanAnomalyRateDegPerDay: 0.5240207766,
  },
  jupiter: {
    nodeDeg: 100.4542,
    nodeRateDegPerDay: 2.76854e-5,
    inclinationDeg: 1.3030,
    inclinationRateDegPerDay: -1.557e-7,
    perihelionDeg: 273.8777,
    perihelionRateDegPerDay: 1.64505e-5,
    semiMajorAxisAu: 5.20256,
    semiMajorAxisRateAuPerDay: 0,
    eccentricity: 0.048498,
    eccentricityRatePerDay: 4.469e-9,
    meanAnomalyDeg: 19.8950,
    meanAnomalyRateDegPerDay: 0.0830853001,
  },
  saturn: {
    nodeDeg: 113.6634,
    nodeRateDegPerDay: 2.38980e-5,
    inclinationDeg: 2.4886,
    inclinationRateDegPerDay: -1.081e-7,
    perihelionDeg: 339.3939,
    perihelionRateDegPerDay: 2.97661e-5,
    semiMajorAxisAu: 9.55475,
    semiMajorAxisRateAuPerDay: 0,
    eccentricity: 0.055546,
    eccentricityRatePerDay: -9.499e-9,
    meanAnomalyDeg: 316.9670,
    meanAnomalyRateDegPerDay: 0.0334442282,
  },
  neptune: {
    nodeDeg: 131.7806,
    nodeRateDegPerDay: 3.0173e-5,
    inclinationDeg: 1.7700,
    inclinationRateDegPerDay: -2.55e-7,
    perihelionDeg: 272.8461,
    perihelionRateDegPerDay: -6.027e-6,
    semiMajorAxisAu: 30.05826,
    semiMajorAxisRateAuPerDay: 3.313e-8,
    eccentricity: 0.008606,
    eccentricityRatePerDay: 2.15e-9,
    meanAnomalyDeg: 260.2471,
    meanAnomalyRateDegPerDay: 0.005995147,
  },
};

function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000_UNIX_MS) / DAY_MS;
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function solveEccentricAnomaly(meanAnomalyRad: number, eccentricity: number): number {
  let eccentricAnomaly = meanAnomalyRad + eccentricity * Math.sin(meanAnomalyRad) * (1 + eccentricity * Math.cos(meanAnomalyRad));
  for (let i = 0; i < 6; i += 1) {
    eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomalyRad) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
  }
  return eccentricAnomaly;
}

function heliocentricEcliptic(elements: OrbitalElements, days: number) {
  const node = toRadians(normalizeDegrees(elements.nodeDeg + elements.nodeRateDegPerDay * days));
  const inclination = toRadians(elements.inclinationDeg + elements.inclinationRateDegPerDay * days);
  const perihelion = toRadians(normalizeDegrees(elements.perihelionDeg + elements.perihelionRateDegPerDay * days));
  const semiMajorAxis = elements.semiMajorAxisAu + elements.semiMajorAxisRateAuPerDay * days;
  const eccentricity = elements.eccentricity + elements.eccentricityRatePerDay * days;
  const meanAnomaly = toRadians(normalizeDegrees(elements.meanAnomalyDeg + elements.meanAnomalyRateDegPerDay * days));
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity);

  const xv = semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity);
  const yv = semiMajorAxis * (Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(eccentricAnomaly));
  const trueAnomaly = Math.atan2(yv, xv);
  const radius = Math.hypot(xv, yv);
  const argument = trueAnomaly + perihelion;

  return {
    x: radius * (Math.cos(node) * Math.cos(argument) - Math.sin(node) * Math.sin(argument) * Math.cos(inclination)),
    y: radius * (Math.sin(node) * Math.cos(argument) + Math.cos(node) * Math.sin(argument) * Math.cos(inclination)),
    z: radius * (Math.sin(argument) * Math.sin(inclination)),
  };
}

export function apparentPlanetEquatorialCoordinates(planet: PlanetId, date: Date = new Date()): EquatorialCoordinates {
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const days = daysSinceJ2000(safeDate);
  const planetPos = heliocentricEcliptic(PLANET_ELEMENTS[planet], days);
  const earthPos = heliocentricEcliptic(EARTH_ELEMENTS, days);
  const xg = planetPos.x - earthPos.x;
  const yg = planetPos.y - earthPos.y;
  const zg = planetPos.z - earthPos.z;
  const obliquity = toRadians(23.4393 - 3.563e-7 * days);
  const xe = xg;
  const ye = yg * Math.cos(obliquity) - zg * Math.sin(obliquity);
  const ze = yg * Math.sin(obliquity) + zg * Math.cos(obliquity);
  const raDegrees = normalizeDegrees(toDegrees(Math.atan2(ye, xe)));
  const decDegrees = toDegrees(Math.atan2(ze, Math.hypot(xe, ye)));

  return {
    raHours: raDegrees / 15,
    decDegrees,
    distanceAu: Math.hypot(xg, yg, zg),
  };
}

export function formatRaHours(raHours: number): string {
  const normalized = ((raHours % 24) + 24) % 24;
  const hours = Math.floor(normalized);
  const minutesFloat = (normalized - hours) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatDecDegrees(decDegrees: number): string {
  const sign = decDegrees >= 0 ? '+' : '-';
  const absolute = Math.abs(decDegrees);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);
  return `${sign}${String(degrees).padStart(2, '0')}° ${String(minutes).padStart(2, '0')}' ${String(seconds).padStart(2, '0')}"`;
}
