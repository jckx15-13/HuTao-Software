import { Camera } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
    SelectionBehavior,
} from "@/core/plugins/PluginTypes";
import { createSvgIconUrl } from "@/wwv-sdk";
import { fetchWwtJson, getWwtAssetLocalUrl, getWwtAssetSourcePath, WWT_ASSET_PATHS } from "@/lib/wwt/repositoryData";

const DATASET_PATH = WWT_ASSET_PATHS.publicCamerasList;
const STATIC_DATASET_TIMESTAMP = new Date("2026-06-22T00:00:00.000Z");
const INITIAL_RENDER_LIMIT = 1800;
const MAX_LABEL_LENGTH = 80;

type CameraFeature = {
    id?: string | number;
    geometry?: {
        type?: string;
        coordinates?: unknown;
    };
    properties?: Record<string, unknown>;
};

type CameraGeoJson = {
    type?: string;
    features?: CameraFeature[];
};

const cameraIconUrl = createSvgIconUrl(Camera, {
    color: "#67e8f9",
    size: 18,
    backgroundColor: "rgba(8, 47, 73, 0.92)",
});

function cleanText(value: unknown, fallback = "Unknown"): string {
    // Matching control characters is the point: this strips C0 controls and DEL out
    // of untrusted upstream feed text before it is rendered as a map label. The
    // no-control-regex rule guards against them appearing by accident, which is the
    // opposite of what is intended here.
    // eslint-disable-next-line no-control-regex
    const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (!text) return fallback;
    return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}...` : text;
}

function cleanId(value: unknown, fallback: string): string {
    return cleanText(value, fallback)
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallback;
}

function readCoordinates(feature: CameraFeature): { lon: number; lat: number } | null {
    if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return null;
    const [lon, lat] = feature.geometry.coordinates;
    if (typeof lon !== "number" || typeof lat !== "number") return null;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lon, lat };
}

function readCategories(value: unknown): string {
    if (!Array.isArray(value)) return "Uncategorized";
    const categories = value
        .map((category) => cleanText(category, ""))
        .filter(Boolean)
        .slice(0, 4);
    return categories.length > 0 ? categories.join(", ") : "Uncategorized";
}

function formatCameraLabel(props: Record<string, unknown>, index: number): string {
    const city = cleanText(props.city, "");
    const region = cleanText(props.region, "");
    const country = cleanText(props.country, "");
    const location = [city, region, country].filter(Boolean).join(", ");
    return location || `WWV camera ${index + 1}`;
}

export class WwvPublicCamerasPlugin implements WorldPlugin {
    readonly id = "wwv-public-cameras";
    readonly name = "WWV Public Cameras";
    readonly description = "Static WorldWideView public-camera locations sourced from the WWT public mirror; no live stream is opened";
    readonly icon = Camera;
    readonly category = "infrastructure" as const;
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
            const data = await fetchWwtJson<CameraGeoJson>(DATASET_PATH, {
                init: { cache: "force-cache" },
            });
            const features = Array.isArray(data.features) ? data.features : [];

            return features.flatMap((feature, index): GeoEntity[] => {
                const coordinates = readCoordinates(feature);
                if (!coordinates) return [];

                const props = feature.properties ?? {};
                const label = formatCameraLabel(props, index);
                const city = cleanText(props.city, "Unknown city");
                const region = cleanText(props.region, "Unknown region");
                const country = cleanText(props.country, "Unknown country");
                const categories = readCategories(props.categories);
                const entityId = `wwv-public-camera-${cleanId(`${country}-${region}-${city}-${index}`, String(index))}`;

                return [{
                    id: entityId,
                    pluginId: this.id,
                    latitude: coordinates.lat,
                    longitude: coordinates.lon,
                    altitude: 12,
                    timestamp: STATIC_DATASET_TIMESTAMP,
                    label,
                    properties: {
                        city,
                        region,
                        country,
                        timezone: cleanText(props.timezone, "Not provided"),
                        categories,
                        source: "wwv-public-cameras",
                        sourcePath: getWwtAssetSourcePath(DATASET_PATH),
                        copiedDatasetPath: getWwtAssetLocalUrl(DATASET_PATH),
                        visualAssetSource: "lucide-camera-rendered-through-wwv-sdk",
                        iconUrl: cameraIconUrl,
                        staticDataset: true,
                        datasetFeatureCount: features.length,
                        renderedFeatureLimit: INITIAL_RENDER_LIMIT,
                        renderedFeatureNote:
                            "Desktop startup renders a capped subset from the WWT camera dataset to keep navigation responsive.",
                        sourceUrlFieldsRemoved: true,
                        externalStreamPresent: Boolean(props.stream_present_in_source),
                        externalPreviewPresent: Boolean(props.preview_present_in_source),
                        externalStreamPolicy:
                            "Camera stream and thumbnail URLs are scrubbed from the served dataset; Silver Wolf renders static locations only.",
                        liveTelemetry: false,
                        stateHonesty:
                            "Static WWT public-camera locations. Markers do not prove cameras are online and do not open video streams.",
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
            color: "#22d3ee",
            iconUrl: cameraIconUrl,
            clusterEnabled: true,
            clusterDistance: 32,
            maxEntities: INITIAL_RENDER_LIMIT,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        return {
            type: "billboard",
            color: "#67e8f9",
            iconUrl: String(entity.properties.iconUrl || cameraIconUrl),
            size: 18,
            iconScale: 0.7,
            outlineColor: "#082f49",
            outlineWidth: 1.25,
            labelText: undefined,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: { near: 0, far: 12000000 },
        };
    }

    getSelectionBehavior(_entity: GeoEntity): SelectionBehavior | null {
        return {
            showTrail: false,
            flyToOffsetMultiplier: 3,
            flyToBaseDistance: 22000,
        };
    }
}
