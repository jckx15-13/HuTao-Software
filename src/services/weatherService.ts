import { useUIStore } from '../store/uiStore';

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
      
    } catch (err) {
      console.warn('[WeatherService] Failed to sync weather:', err);
    }
  }
}

export const weatherService = new WeatherService();
