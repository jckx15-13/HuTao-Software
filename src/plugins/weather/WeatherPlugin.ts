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

        const entity: GeoEntity = {
            id: `weather-${weatherData.city.toLowerCase().replace(/\s+/g, '-')}`,
            pluginId: this.id,
            latitude: Number(weatherData.latitude),
            longitude: Number(weatherData.longitude),
            altitude: 2000, // Show slightly above ground
            timestamp: new Date(weatherData.timestamp),
            label: `${weatherData.city}: ${weatherData.temp}°C`,
            properties: {
                temp: weatherData.temp,
                condition: weatherData.condition,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                city: weatherData.city,
                latitude: weatherData.latitude,
                longitude: weatherData.longitude,
                source: weatherData.source ?? "unknown",
            },
        };

        return [entity];
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
