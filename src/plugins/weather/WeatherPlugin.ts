import { CloudSun } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";

export class WeatherPlugin implements WorldPlugin {
    readonly id = "weather";
    readonly name = "Global Weather";
    readonly description = "Real-time global weather conditions from OpenWeather";
    readonly icon = CloudSun;
    readonly category = "natural-disaster" as const;
    readonly version = "1.0.0";

    private context: PluginContext | null = null;

    async initialize(ctx: PluginContext): Promise<void> {
        this.context = ctx;
    }

    destroy(): void {
        this.context = null;
    }

    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        const weatherData = useUIStore.getState().weatherData;
        if (!weatherData) return [];

        // In a real plugin, we would fetch for the whole globe or viewport.
        // For now, we represent the active "synced" city from our WeatherService.
        
        // Let's also add some hardcoded hubs if we want more entities on the globe.
        const entity: GeoEntity = {
            id: `weather-${weatherData.city.toLowerCase().replace(/\s+/g, '-')}`,
            pluginId: this.id,
            latitude: this.getCityLat(weatherData.city),
            longitude: this.getCityLon(weatherData.city),
            altitude: 2000, // Show slightly above ground
            timestamp: new Date(weatherData.timestamp),
            label: `${weatherData.city}: ${weatherData.temp}°C`,
            properties: {
                temp: weatherData.temp,
                condition: weatherData.condition,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                city: weatherData.city
            },
        };

        return [entity];
    }

    private getCityLat(city: string): number {
        const map: Record<string, number> = { 'Tokyo': 35.6762, 'New York': 40.7128, 'London': 51.5074, 'Paris': 48.8566, 'Sydney': -33.8688 };
        return map[city] || 0;
    }

    private getCityLon(city: string): number {
        const map: Record<string, number> = { 'Tokyo': 139.6503, 'New York': -74.0060, 'London': -0.1278, 'Paris': 2.3522, 'Sydney': 151.2093 };
        return map[city] || 0;
    }

    getPollingInterval(): number {
        return 60000; // Sync with UI store every minute
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#60a5fa",
            clusterEnabled: false,
            clusterDistance: 0,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        const condition = (entity.properties.condition as string) || 'Clear';
        
        let icon = '☀️';
        if (condition.includes('Cloud')) icon = '☁️';
        else if (condition.includes('Rain')) icon = '🌧️';
        else if (condition.includes('Snow')) icon = '❄️';
        else if (condition.includes('Thunder')) icon = '⛈️';
        else if (condition.includes('Mist') || condition.includes('Fog')) icon = '🌫️';

        return {
            type: "billboard",
            color: "#ffffff",
            size: 32,
            labelText: `${icon} ${entity.properties.temp}°C`,
            labelFont: "bold 10px JetBrains Mono, monospace",
            outlineColor: "#000000",
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        };
    }
}
