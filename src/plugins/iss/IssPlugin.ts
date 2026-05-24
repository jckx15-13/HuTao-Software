import { Radio } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";

export class IssPlugin implements WorldPlugin {
    readonly id = "iss";
    readonly name = "ISS Tracker";
    readonly description = "Real-time tracking of the International Space Station (ISS)";
    readonly icon = Radio;
    readonly category = "space" as const;
    readonly version = "1.0.0";

    private context: PluginContext | null = null;

    async initialize(ctx: PluginContext): Promise<void> {
        this.context = ctx;
    }

    destroy(): void {
        this.context = null;
    }

    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        try {
            const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);
            const alt = parseFloat(data.altitude) * 1000; // altitude in meters
            const vel = parseFloat(data.velocity);

            const entity: GeoEntity = {
                id: "iss-satellite",
                pluginId: this.id,
                latitude: lat,
                longitude: lng,
                altitude: alt,
                timestamp: new Date(),
                label: "🛰️ ISS",
                properties: {
                    velocity: vel,
                    altitude_km: data.altitude,
                    visibility: data.visibility,
                    footprint: data.footprint,
                    rawEntity: data
                },
            };

            return [entity];
        } catch (err) {
            console.error("[IssPlugin] fetch error:", err);
            if (this.context) {
                this.context.onError(err instanceof Error ? err : new Error(String(err)));
            }
            return [];
        }
    }

    getPollingInterval(): number {
        return 5000; // Poll every 5 seconds
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#00e5ff",
            clusterEnabled: false,
            clusterDistance: 0,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        return {
            type: "point",
            color: "#00e5ff",
            size: 12,
            outlineColor: "#ffffff",
            outlineWidth: 2,
            labelText: entity.label || "🛰️ ISS",
            labelFont: "bold 10px monospace",
            disableManualHorizonCulling: true,
        };
    }
}
