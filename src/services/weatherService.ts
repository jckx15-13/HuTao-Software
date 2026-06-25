import { useUIStore } from "../store/uiStore";
import { useDiagnosticsStore } from "../store/diagnosticsStore";
import { fetchWwtJson, WWT_ASSET_PATHS } from "../lib/wwt/repositoryData";

type FailureState = { count: number; nextAttempt: number };
type CameraFeature = {
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type CameraGeoJson = {
  type?: string;
  features?: CameraFeature[];
};

type WeatherSeed = {
  city: string;
  latitude: number;
  longitude: number;
};

type OpenWeatherResponse = {
  main?: {
    temp?: number;
    humidity?: number;
  };
  weather?: Array<{ main?: unknown }>;
  wind?: { speed?: number };
  name?: string;
};

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  timestamp: number;
  source?: string;
}

const failureState: Record<string, FailureState> = {};
const BACKOFF_BASE = 2000; // 2s
const BACKOFF_MAX = 5 * 60 * 1000; // 5 minutes
const DATASET_PATH = WWT_ASSET_PATHS.publicCamerasList;
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY ?? "b6907d289e10d714a6e88b30761fae22";

const MAX_COORDINATE_SEEDS = 1200;
const CLEAN_TEXT_MAX = 48;
let weatherSeedLoad: Promise<WeatherSeed[]> | null = null;
let weatherSeedCache: WeatherSeed[] | null = null;

function sanitizeLabel(value: unknown): string {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return "Unknown location";
  return raw.length > CLEAN_TEXT_MAX ? `${raw.slice(0, CLEAN_TEXT_MAX)}…` : raw;
}

function readCoordinates(feature: CameraFeature): WeatherSeed | null {
  const geometryCoordinates = feature.geometry?.coordinates;
  if (feature.geometry?.type !== "Point" || !Array.isArray(geometryCoordinates)) return null;
  if (geometryCoordinates.length < 2) return null;

  const [longitude, latitude] = geometryCoordinates;
  if (typeof longitude !== "number" || typeof latitude !== "number") return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const cityValue = sanitizeLabel(feature.properties?.city);
  const city = cityValue !== "Unknown location"
    ? cityValue
    : `Camera-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;

  return {
    city,
    latitude,
    longitude,
  };
}

function normalizeWeatherData(
  payload: OpenWeatherResponse,
  seed: WeatherSeed,
): WeatherData {
  const temp = Number(payload?.main?.temp);
  const humidity = Number(payload?.main?.humidity);
  const windSpeed = Number(payload?.wind?.speed);
  const condition = sanitizeLabel(payload?.weather?.[0]?.main || "Weather");

  if (!Number.isFinite(temp) || !Number.isFinite(humidity) || !Number.isFinite(windSpeed)) {
    throw new Error("Weather API response is missing required numeric values.");
  }

  return {
    city: sanitizeLabel(payload.name || seed.city),
    latitude: seed.latitude,
    longitude: seed.longitude,
    temp,
    condition,
    humidity,
    windSpeed,
    timestamp: Date.now(),
    source: "openweathermap-current",
  };
}

async function loadWeatherSeedsFromWwt(): Promise<WeatherSeed[]> {
  const data = await fetchWwtJson<CameraGeoJson>(DATASET_PATH, {
    init: { cache: "force-cache" },
  });
  const features = Array.isArray(data?.features) ? data.features : [];
  const seeds = features.flatMap((feature) => {
    const seed = readCoordinates(feature);
    return seed ? [seed] : [];
  });

  if (!seeds.length) {
    throw new Error("WWT public-cameras dataset has no valid point coordinates.");
  }

  return seeds.slice(0, MAX_COORDINATE_SEEDS);
}

async function getWeatherSeeds(): Promise<WeatherSeed[]> {
  if (weatherSeedCache) return weatherSeedCache;

  if (!weatherSeedLoad) {
    weatherSeedLoad = loadWeatherSeedsFromWwt();
  }

  try {
    const seeds = await weatherSeedLoad;
    weatherSeedCache = seeds;
    return seeds;
  } catch (error) {
    weatherSeedLoad = null;
    throw error instanceof Error ? error : new Error(String(error));
  } finally {
    weatherSeedLoad = weatherSeedCache ? null : weatherSeedLoad;
  }
}

function getRandomSeed(seeds: WeatherSeed[]): WeatherSeed {
  return seeds[Math.floor(Math.random() * seeds.length)]!;
}

function logFailure(message: string, suggestion: string) {
  try {
    useDiagnosticsStore.getState().add({
      level: "warning",
      message: `[WeatherService] ${message}`,
      suggestion,
      metadata: {
        service: "WeatherService",
        url: typeof location !== "undefined" ? location.href : null,
      },
    });
  } catch {
    // ignore diagnostics write failures
  }
}

class WeatherService {
  private updateInterval: any = null;

  start() {
    if (this.updateInterval) return;

    const isHeadless = typeof window !== "undefined" &&
      (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver || window.location.search.includes("fallback"));

    if (isHeadless) {
      console.log("[WeatherService] Headless environment detected. Skipping live weather fetches.");
      return;
    }

    this.fetchWeather();
    this.updateInterval = setInterval(() => {
      this.fetchWeather();
    }, 30 * 60 * 1000);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async fetchWeather() {
    try {
      const now = Date.now();
      const state = failureState["weather"] || { count: 0, nextAttempt: 0 };
      if (now < state.nextAttempt) {
        return;
      }

      const seeds = await getWeatherSeeds();
      const seed = getRandomSeed(seeds);

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${seed.latitude}&lon=${seed.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json() as OpenWeatherResponse;
      const weather = normalizeWeatherData(payload, seed);

      useUIStore.getState().setWeatherData?.(weather);
      useUIStore.getState().addChangeLog("METEO", `Weather sync: ${weather.city} at ${weather.temp}°C`, "info");
      failureState["weather"] = { count: 0, nextAttempt: 0 };
    } catch (err) {
      const prev = failureState["weather"] || { count: 0, nextAttempt: 0 };
      const nextCount = (prev.count || 0) + 1;
      const delay = Math.min(BACKOFF_MAX, BACKOFF_BASE * Math.pow(2, nextCount - 1));
      const nextAttempt = Date.now() + delay;
      failureState["weather"] = { count: nextCount, nextAttempt };

      const message = `Weather sync failed: ${err instanceof Error ? err.message : String(err)}.`;
      const suggestion = `Next attempt after ${new Date(nextAttempt).toISOString()}`;

      logFailure(message, suggestion);
      console.warn("[WeatherService] Failed to sync weather:", err);
    }
  }
}

export const weatherService = new WeatherService();
