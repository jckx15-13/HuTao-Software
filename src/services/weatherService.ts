import { useUIStore } from '../store/uiStore';

type FailureState = { count: number; nextAttempt: number };
const failureState: Record<string, FailureState> = {};
const BACKOFF_BASE = 2000; // 2s
const BACKOFF_MAX = 5 * 60 * 1000; // 5 minutes

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  city: string;
  timestamp: number;
}

class WeatherService {
  private updateInterval: any = null;
  private readonly CITIES = [
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 }
  ];

  start() {
    if (this.updateInterval) return;
    
    // Detect if running in headless test/fallback mode
    const isHeadless = typeof window !== 'undefined' && (
      /HeadlessChrome/i.test(navigator.userAgent) ||
      navigator.webdriver ||
      window.location.search.includes('fallback')
    );

    if (isHeadless) {
      console.log('[WeatherService] Headless environment detected. Skipping live weather fetches.');
      return;
    }

    this.fetchWeather();
    
    // Refresh weather every 30 minutes
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
    // OpenWeather free tier allows current weather for a city
    // In a real app, we'd use process.env.WEATHER_API_KEY
    const apiKey = 'b6907d289e10d714a6e88b30761fae22'; // OpenWeather Demo Key
    
    try {
      const now = Date.now();
      const st = failureState['weather'] || { count: 0, nextAttempt: 0 };
      if (now < st.nextAttempt) {
        // Skip frequent attempts while in backoff
        return;
      }
      const city = this.CITIES[Math.floor(Math.random() * this.CITIES.length)];
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const weather: WeatherData = {
        temp: data.main.temp,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        city: data.name,
        timestamp: Date.now()
      };
      
      // We will add this to the UI store in the next step
      (useUIStore.getState() as any).setWeatherData?.(weather);
      useUIStore.getState().addChangeLog('METEO', `Weather sync: ${weather.city} at ${weather.temp}°C`, 'info');
      // Reset backoff on success
      failureState['weather'] = { count: 0, nextAttempt: 0 };
      
    } catch (err) {
      const prev = failureState['weather'] || { count: 0, nextAttempt: 0 };
      const nextCount = (prev.count || 0) + 1;
      const delay = Math.min(BACKOFF_MAX, BACKOFF_BASE * Math.pow(2, nextCount - 1));
      const nextAttempt = Date.now() + delay;
      failureState['weather'] = { count: nextCount, nextAttempt };

      const suggestion = `Weather API returned ${err?.message || err}. Next attempt after ${new Date(nextAttempt).toISOString()}`;
      try {
        (globalThis as any).useDiagnosticsStore?.getState?.().add?.({
          level: 'warning',
          message: `[WeatherService] Failed to sync weather: ${err?.message || err}`,
          suggestion,
          metadata: { service: 'WeatherService', url: typeof location !== 'undefined' ? location.href : null }
        });
      } catch (e) {
        // ignore diagnostics write errors
      }
      console.warn('[WeatherService] Failed to sync weather:', err);
    }
  }
}

export const weatherService = new WeatherService();
