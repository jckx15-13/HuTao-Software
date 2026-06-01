import { Rocket } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";
import { SATELLITES } from "@/core/satellites/satelliteData";
import { OrbitEngine, Coordinates } from "@/core/satellites/OrbitEngine";
import { useUIStore } from "@/store/uiStore";

/**
 * SatellitesPlugin
 * 
 * Manages the visualization and real-time tracking of satellite constellations.
 * Leverages the OrbitEngine for high-performance physics propagation.
 */
export class SatellitesPlugin implements WorldPlugin {
    readonly id = "satellites";
    readonly name = "Satellite Constellations";
    readonly description = "Tracks multiple satellite constellations in real-time";
    readonly icon = Rocket;
    readonly category = "space" as const;
    readonly version = "1.1.0";

    private context: PluginContext | null = null;
    private epoch = Date.now();
    private engine = OrbitEngine.getInstance();

    async initialize(ctx: PluginContext): Promise<void> {
        this.context = ctx;
    }

    destroy(): void {
        this.context = null;
    }

    /**
     * Fetches and propagates satellite positions for the current time.
     * Uses synchronous propagation for the immediate frame update.
     */
    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        const now = Date.now();
        const elapsedSeconds = (now - this.epoch) / 1000;
        const satelliteData = useUIStore.getState().satelliteData;

        return SATELLITES.map(sat => {
            let coords: Coordinates | null = null;
            const tleData = satelliteData[sat.id]?.tle;

            if (tleData) {
                coords = this.engine.propagateSatelliteTle(tleData, new Date(now));
            }

            // Fallback to circular orbit if TLE is missing or propagation failed
            if (!coords) {
                coords = {
                    ...this.engine.propagateCircularOrbit(elapsedSeconds, {
                        altitudeMeters: sat.altitudeM,
                        inclinationRad: sat.inclinationRad,
                        omega0: sat.omega0,
                        argLat0: sat.argLat0
                    }),
                    altitude: sat.altitudeM
                };
            }

            return {
                id: `sat-${sat.id}`,
                pluginId: this.id,
                latitude: coords.lat,
                longitude: coords.lng,
                altitude: coords.altitude ?? sat.altitudeM,
                timestamp: new Date(),
                label: sat.name,
                properties: {
                    velocity: this.engine.calculateOrbitalSpeed(sat.altitudeM),
                    category: sat.category,
                    color: sat.color,
                    rawEntity: sat
                }
            };
        });
    }

    getPollingInterval(): number {
        return 1000;
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

