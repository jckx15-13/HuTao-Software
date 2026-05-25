import { Flame } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";

export class EarthquakesPlugin implements WorldPlugin {
    readonly id = "earthquakes";
    readonly name = "Global Earthquakes";
    readonly description = "Real-time global seismic activity monitoring from USGS";
    readonly icon = Flame;
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
        try {
            const res = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const features = Array.isArray(data?.features) ? data.features : [];
            return features.map((feat: any) => {
                const coords = feat.geometry.coordinates;
                const props = feat.properties;

                return {
                    id: feat.id || String(props.time),
                    pluginId: this.id,
                    latitude: coords[1],
                    longitude: coords[0],
                    altitude: coords[2] ? coords[2] * 1000 : undefined, // depth in meters
                    timestamp: new Date(props.time),
                    label: `Mag ${props.mag} - ${props.place}`,
                    properties: {
                        mag: props.mag,
                        place: props.place,
                        time: props.time,
                        url: props.url,
                        tsunami: props.tsunami,
                        sig: props.sig,
                        rawEntity: feat
                    },
                };
            });
        } catch (err) {
            console.error("[EarthquakesPlugin] fetch error:", err);
            if (this.context) {
                this.context.onError(err instanceof Error ? err : new Error(String(err)));
            }
            return [];
        }
    }

    getPollingInterval(): number {
        return 120000; // Poll every 2 minutes
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#ff8800",
            clusterEnabled: true,
            clusterDistance: 40,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        const mag = (entity.properties.mag as number) || 1.0;
        const size = Math.max(6, Math.min(24, mag * 3));
        
        let color = "#34a853"; // minor (<2.5) Green
        if (mag >= 4.5) color = "#ea4335"; // strong (>=4.5) Red
        else if (mag >= 2.5) color = "#fbbc05"; // moderate (>=2.5) Yellow

        return {
            type: "hexagon",
            color,
            size,
            outlineColor: "#ffffff",
            outlineWidth: 1.5,
            labelText: mag >= 4.0 ? `M${mag}` : undefined,
            labelFont: "9px monospace",
        };
    }
}
