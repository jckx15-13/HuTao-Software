import { Plane, Shield } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";
import { createSvgIconUrl } from "@/wwv-sdk";

const DATASET_URL = "/wwv-assets/data/military_bases.geojson";
const STATIC_DATASET_TIMESTAMP = new Date("2026-06-22T00:00:00.000Z");
const MAX_LABEL_LENGTH = 90;
const INITIAL_RENDER_LIMIT = 3000;

type MilitaryBaseFeature = {
    id?: string | number;
    geometry?: {
        type?: string;
        coordinates?: unknown;
    };
    properties?: Record<string, unknown>;
};

type MilitaryBasesGeoJson = {
    type?: string;
    features?: MilitaryBaseFeature[];
};

const shieldIconUrl = createSvgIconUrl(Shield, {
    color: "#bfdbfe",
    size: 18,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
});

function cleanText(value: unknown, fallback = "Unknown"): string {
    const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (!text) return fallback;
    return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}...` : text;
}

function cleanId(value: unknown, fallback: string): string {
    return cleanText(value, fallback).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || fallback;
}

function readCoordinates(feature: MilitaryBaseFeature): { lon: number; lat: number } | null {
    if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return null;
    const [lon, lat] = feature.geometry.coordinates;
    if (typeof lon !== "number" || typeof lat !== "number") return null;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lon, lat };
}

function isAirfieldType(type: string): boolean {
    const normalized = type.toLowerCase();
    return normalized.includes("airfield") || normalized.includes("airport") || normalized.includes("airbase");
}

export class MilitaryBasesPlugin implements WorldPlugin {
    readonly id = "wwv-military-bases";
    readonly name = "WWV Military Bases";
    readonly description = "Static WorldWideView military-site dataset copied locally; not live telemetry";
    readonly icon = Shield;
    readonly category = "military" as const;
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
            const response = await fetch(DATASET_URL, { cache: "force-cache" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = (await response.json()) as MilitaryBasesGeoJson;
            const features = Array.isArray(data.features) ? data.features : [];

            return features.flatMap((feature, index): GeoEntity[] => {
                const coordinates = readCoordinates(feature);
                if (!coordinates) return [];

                const props = feature.properties ?? {};
                const osmId = props.osm_id ?? feature.id ?? index;
                const name = cleanText(props.name, "Unnamed military site");
                const type = cleanText(props.type, "military");
                const operator = cleanText(props.operator, "Unknown");
                const entityId = `wwv-military-base-${cleanId(osmId, String(index))}`;
                const isAirfield = isAirfieldType(type);
                const visualAssetUrl = isAirfield ? "/wwv-assets/military-plane-icon.svg" : shieldIconUrl;

                return [{
                    id: entityId,
                    pluginId: this.id,
                    latitude: coordinates.lat,
                    longitude: coordinates.lon,
                    altitude: 0,
                    timestamp: STATIC_DATASET_TIMESTAMP,
                    label: name,
                    properties: {
                        type,
                        operator,
                        osmId: cleanText(osmId, String(index)),
                        wikipedia: cleanText(props.wikipedia, "Not provided"),
                        wikidata: cleanText(props.wikidata, "Not provided"),
                        source: "wwv-public-military-bases",
                        sourcePath: "worldwideview/public/military_bases.geojson",
                        copiedDatasetPath: DATASET_URL,
                        copiedWwvAssetRoot: "/wwv-assets",
                        visualAssetSource: isAirfield ? "copied-worldwideview-military-plane-icon" : "generated-lucide-shield-icon",
                        visualAssetUrl,
                        iconUrl: visualAssetUrl,
                        visualAssetStatus: isAirfield
                            ? "Airfield marker uses the copied WWV military aircraft SVG asset."
                            : "Military site marker uses a generated shield icon because the copied WWV dataset has no dedicated base icon.",
                        staticDataset: true,
                        datasetFeatureCount: features.length,
                        renderedFeatureLimit: INITIAL_RENDER_LIMIT,
                        renderedFeatureNote:
                            "Desktop startup renders a capped subset from the full copied WWV dataset to keep controls responsive.",
                        liveTelemetry: false,
                        stateHonesty: "Static copied WWV dataset. Position records are not a live military feed.",
                    },
                }];
            }).slice(0, INITIAL_RENDER_LIMIT);
        } catch (err) {
            if (this.context) {
                this.context.onError(err instanceof Error ? err : new Error(String(err)));
            }
            return [];
        }
    }

    getPollingInterval(): number {
        return 300000;
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#60a5fa",
            iconUrl: shieldIconUrl,
            clusterEnabled: true,
            clusterDistance: 36,
            maxEntities: INITIAL_RENDER_LIMIT,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        const type = String(entity.properties.type || "");
        const isAirfield = isAirfieldType(type);

        return {
            type: "billboard",
            color: isAirfield ? "#93c5fd" : "#60a5fa",
            iconUrl: String(entity.properties.iconUrl || (isAirfield ? "/wwv-assets/military-plane-icon.svg" : shieldIconUrl)),
            size: isAirfield ? 22 : 18,
            iconScale: isAirfield ? 0.55 : 0.72,
            outlineColor: "#0f172a",
            outlineWidth: 1.5,
            labelText: undefined,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: { near: 0, far: 14000000 },
        };
    }
}
