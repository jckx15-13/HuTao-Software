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
        const fetchWithRetry = async (retries = 3, backoff = 1000): Promise<any> => {
            try {
                const res = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (err) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    return fetchWithRetry(retries - 1, backoff * 2);
                }
                throw err;
            }
        };

        try {
            const data = await fetchWithRetry();
            return this.mapWebsocketPayload(data);
        } catch (err) {
            console.error("[EarthquakesPlugin] fetch error:", err);
            if (this.context) {
                this.context.onError(err instanceof Error ? err : new Error(String(err)));
            }
            return [];
        }
    }

    mapWebsocketPayload(payload: unknown): GeoEntity[] {
        const features = Array.isArray((payload as { features?: unknown })?.features)
            ? (payload as { features: any[] }).features
            : Array.isArray(payload)
                ? payload
                : [];

        return features
            .filter((feat: any) => Array.isArray(feat?.geometry?.coordinates) && feat.geometry.coordinates.length >= 2)
            .map((feat: any): GeoEntity => {
                const coords = feat.geometry.coordinates;
                const props = feat.properties || {};
                const time = props.time ?? Date.now();
                const mag = Number(props.mag ?? 0);
                const place = props.place || "Unknown location";

                return {
                    id: feat.id || String(time),
                    pluginId: this.id,
                    latitude: Number(coords[1]),
                    longitude: Number(coords[0]),
                    altitude: coords[2] != null ? Number(coords[2]) * 1000 : undefined,
                    timestamp: new Date(time),
                    label: `Mag ${Number.isFinite(mag) ? mag : 0} - ${place}`,
                    properties: {
                        mag: Number.isFinite(mag) ? mag : props.mag,
                        place,
                        time,
                        url: props.url,
                        tsunami: props.tsunami,
                        sig: props.sig,
                        rawEntity: feat
                    },
                };
            });
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
