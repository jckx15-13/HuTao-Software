export type PlanetId = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

export const PLANET_IDS: PlanetId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

export interface EquatorialCoordinates {
  raHours: number;
  decDegrees: number;
  distanceAu: number;
  lightTimeMinutes: number;
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
const LIGHT_DAYS_PER_AU = 0.00577551833109;
const LIGHT_MINUTES_PER_AU = LIGHT_DAYS_PER_AU * 24 * 60;

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
  mercury: {
    nodeDeg: 48.3313,
    nodeRateDegPerDay: 3.24587e-5,
    inclinationDeg: 7.0047,
    inclinationRateDegPerDay: 5e-8,
    perihelionDeg: 29.1241,
    perihelionRateDegPerDay: 1.01444e-5,
    semiMajorAxisAu: 0.387098,
    semiMajorAxisRateAuPerDay: 0,
    eccentricity: 0.205635,
    eccentricityRatePerDay: 5.59e-10,
    meanAnomalyDeg: 168.6562,
    meanAnomalyRateDegPerDay: 4.0923344368,
  },
  venus: {
    nodeDeg: 76.6799,
    nodeRateDegPerDay: 2.46590e-5,
    inclinationDeg: 3.3946,
    inclinationRateDegPerDay: 2.75e-8,
    perihelionDeg: 54.8910,
    perihelionRateDegPerDay: 1.38374e-5,
    semiMajorAxisAu: 0.723330,
    semiMajorAxisRateAuPerDay: 0,
    eccentricity: 0.006773,
    eccentricityRatePerDay: -1.302e-9,
    meanAnomalyDeg: 48.0052,
    meanAnomalyRateDegPerDay: 1.6021302244,
  },
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
  uranus: {
    nodeDeg: 74.0005,
    nodeRateDegPerDay: 1.3978e-5,
    inclinationDeg: 0.7733,
    inclinationRateDegPerDay: 1.9e-8,
    perihelionDeg: 96.6612,
    perihelionRateDegPerDay: 3.0565e-5,
    semiMajorAxisAu: 19.18171,
    semiMajorAxisRateAuPerDay: -1.55e-8,
    eccentricity: 0.047318,
    eccentricityRatePerDay: 7.45e-9,
    meanAnomalyDeg: 142.5905,
    meanAnomalyRateDegPerDay: 0.011725806,
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

function geocentricEquatorialCoordinates(planet: PlanetId, earthDays: number, planetEmissionDays: number): EquatorialCoordinates {
  const planetPos = heliocentricEcliptic(PLANET_ELEMENTS[planet], planetEmissionDays);
  const earthPos = heliocentricEcliptic(EARTH_ELEMENTS, earthDays);
  const xg = planetPos.x - earthPos.x;
  const yg = planetPos.y - earthPos.y;
  const zg = planetPos.z - earthPos.z;
  const distanceAu = Math.hypot(xg, yg, zg);
  const obliquity = toRadians(23.4393 - 3.563e-7 * earthDays);
  const xe = xg;
  const ye = yg * Math.cos(obliquity) - zg * Math.sin(obliquity);
  const ze = yg * Math.sin(obliquity) + zg * Math.cos(obliquity);
  const raDegrees = normalizeDegrees(toDegrees(Math.atan2(ye, xe)));
  const decDegrees = toDegrees(Math.atan2(ze, Math.hypot(xe, ye)));

  return {
    raHours: raDegrees / 15,
    decDegrees,
    distanceAu,
    lightTimeMinutes: distanceAu * LIGHT_MINUTES_PER_AU,
  };
}

export function geometricPlanetEquatorialCoordinates(planet: PlanetId, date: Date = new Date()): EquatorialCoordinates {
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const days = daysSinceJ2000(safeDate);
  return geocentricEquatorialCoordinates(planet, days, days);
}

export function apparentPlanetEquatorialCoordinates(planet: PlanetId, date: Date = new Date()): EquatorialCoordinates {
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const earthDays = daysSinceJ2000(safeDate);
  let planetEmissionDays = earthDays;
  let coordinates = geocentricEquatorialCoordinates(planet, earthDays, planetEmissionDays);

  for (let i = 0; i < 2; i += 1) {
    planetEmissionDays = earthDays - coordinates.distanceAu * LIGHT_DAYS_PER_AU;
    coordinates = geocentricEquatorialCoordinates(planet, earthDays, planetEmissionDays);
  }

  return coordinates;
}

export function formatRaHours(raHours: number): string {
  const normalized = ((raHours % 24) + 24) % 24;
  const totalSeconds = Math.round(normalized * 3600) % 86_400;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatDecDegrees(decDegrees: number): string {
  const sign = decDegrees >= 0 ? '+' : '-';
  const absolute = Math.abs(decDegrees);
  const totalSeconds = Math.min(Math.round(absolute * 3600), 90 * 3600);
  const degrees = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${sign}${String(degrees).padStart(2, '0')}° ${String(minutes).padStart(2, '0')}' ${String(seconds).padStart(2, '0')}"`;
}
