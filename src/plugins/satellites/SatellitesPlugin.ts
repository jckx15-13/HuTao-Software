import { Rocket } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";
import { SATELLITES } from "@/data/satellites";
import { propagateCircularOrbit, calculateOrbitalSpeed } from "@/core/satellites/satellitePhysics";

export class SatellitesPlugin implements WorldPlugin {
    readonly id = "satellites";
    readonly name = "Satellite Constellations";
    readonly description = "Tracks multiple satellite constellations in real-time";
    readonly icon = Rocket;
    readonly category = "space" as const;
    readonly version = "1.0.0";

    private context: PluginContext | null = null;
    private epoch = Date.now();

    async initialize(ctx: PluginContext): Promise<void> {
        this.context = ctx;
    }

    destroy(): void {
        this.context = null;
    }

    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        const now = Date.now();
        const elapsedSeconds = (now - this.epoch) / 1000;

        return SATELLITES.map(sat => {
            const { lat, lng } = propagateCircularOrbit(
                elapsedSeconds,
                sat.altitudeM,
                sat.inclinationRad,
                sat.omega0,
                sat.argLat0
            );

            return {
                id: `sat-${sat.id}`,
                pluginId: this.id,
                latitude: lat,
                longitude: lng,
                altitude: sat.altitudeM,
                timestamp: new Date(),
                label: sat.name,
                properties: {
                    velocity: calculateOrbitalSpeed(sat.altitudeM),
                    category: sat.category,
                    color: sat.color,
                    rawEntity: sat
                }
            };
        });
    }

    getPollingInterval(): number {
        return 1000; // Poll every second for relatively smooth updates in WebGL
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#FFFFFF",
            clusterEnabled: false,
            clusterDistance: 0,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        const color = entity.properties.color as string || "#FFFFFF";
        return {
            type: "point",
            color: color,
            size: 8,
            outlineColor: "#000000",
            outlineWidth: 1,
            labelText: entity.label || "Satellite",
            labelFont: "bold 9px monospace",
            disableManualHorizonCulling: true,
            trailOptions: {
                width: 1.5,
                color: color
            }
        };
    }
}
