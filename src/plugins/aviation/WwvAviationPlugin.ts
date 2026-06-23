import { Plane } from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
    SelectionBehavior,
} from "@/core/plugins/PluginTypes";

const PLANE_ICON_URL = "/wwv-assets/plane-icon.svg";
const MILITARY_PLANE_ICON_URL = "/wwv-assets/military-plane-icon.svg";
const AIRCRAFT_MODEL_URL = "/wwv-assets/airplane/scene.gltf";
const STATIC_DATASET_TIMESTAMP = new Date("2026-06-22T00:00:00.000Z");

type AviationSample = {
    id: string;
    callsign: string;
    operator: string;
    kind: "civil" | "military";
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
    speed: number;
};

const AVIATION_SAMPLES: AviationSample[] = [
    {
        id: "singapore-arrival",
        callsign: "SQ-WWV-318",
        operator: "Singapore approach sample",
        kind: "civil",
        latitude: 1.36,
        longitude: 103.98,
        altitude: 5200,
        heading: 78,
        speed: 205,
    },
    {
        id: "pacific-transit",
        callsign: "PA-WWV-041",
        operator: "Pacific transit sample",
        kind: "civil",
        latitude: 21.33,
        longitude: -157.92,
        altitude: 11200,
        heading: 252,
        speed: 246,
    },
    {
        id: "atlantic-crossing",
        callsign: "AT-WWV-902",
        operator: "Atlantic crossing sample",
        kind: "civil",
        latitude: 51.47,
        longitude: -0.45,
        altitude: 9800,
        heading: 288,
        speed: 238,
    },
    {
        id: "mediterranean-patrol",
        callsign: "MP-WWV-12",
        operator: "Maritime patrol sample",
        kind: "military",
        latitude: 35.88,
        longitude: 14.48,
        altitude: 7200,
        heading: 112,
        speed: 174,
    },
    {
        id: "arctic-logistics",
        callsign: "AL-WWV-77",
        operator: "Arctic logistics sample",
        kind: "civil",
        latitude: 64.2,
        longitude: -149.5,
        altitude: 8600,
        heading: 34,
        speed: 221,
    },
    {
        id: "indo-pacific-survey",
        callsign: "IP-WWV-09",
        operator: "Reconnaissance sample",
        kind: "military",
        latitude: -12.46,
        longitude: 130.84,
        altitude: 6400,
        heading: 316,
        speed: 190,
    },
];

function getAltitudeColor(altitudeMeters: number): string {
    if (altitudeMeters >= 10000) return "#60a5fa";
    if (altitudeMeters >= 7000) return "#22d3ee";
    if (altitudeMeters >= 4000) return "#34d399";
    return "#fbbf24";
}

export class WwvAviationPlugin implements WorldPlugin {
    readonly id = "wwv-aviation";
    readonly name = "WWV Aviation Samples";
    readonly description = "Static aircraft layer using copied WorldWideView plane icons and glTF model; not live ADS-B telemetry";
    readonly icon = Plane;
    readonly category = "aviation" as const;
    readonly version = "1.0.0";

    private context: PluginContext | null = null;

    async initialize(ctx: PluginContext): Promise<void> {
        this.context = ctx;
    }

    destroy(): void {
        this.context = null;
    }

    async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
        return AVIATION_SAMPLES.map((sample) => ({
            id: `wwv-aircraft-${sample.id}`,
            pluginId: this.id,
            latitude: sample.latitude,
            longitude: sample.longitude,
            altitude: sample.altitude,
            heading: sample.heading,
            speed: sample.speed,
            timestamp: STATIC_DATASET_TIMESTAMP,
            label: sample.callsign,
            properties: {
                callsign: sample.callsign,
                operator: sample.operator,
                kind: sample.kind,
                altitude_m: sample.altitude,
                on_ground: false,
                speed_mps: sample.speed,
                visualAssetSource: "copied-worldwideview-aircraft-assets",
                visualAssetStatus: "Rendered with copied WorldWideView aircraft SVG icons and promoted to the copied glTF aircraft model when inspected close to the globe.",
                visualAssetUrl: sample.kind === "military" ? MILITARY_PLANE_ICON_URL : PLANE_ICON_URL,
                iconUrl: sample.kind === "military" ? MILITARY_PLANE_ICON_URL : PLANE_ICON_URL,
                modelUrl: AIRCRAFT_MODEL_URL,
                copiedWwvAssetRoot: "/wwv-assets",
                sourcePath: "worldwideview/public/airplane/scene.gltf",
                stateHonesty: "Static sample aircraft layer. Positions are curated desktop fixtures, not live ADS-B or military tracking.",
                liveTelemetry: false,
                staticDataset: true,
            },
        }));
    }

    getPollingInterval(): number {
        return 300000;
    }

    getLayerConfig(): LayerConfig {
        return {
            color: "#38bdf8",
            iconUrl: PLANE_ICON_URL,
            clusterEnabled: false,
            clusterDistance: 0,
            maxEntities: AVIATION_SAMPLES.length,
        };
    }

    renderEntity(entity: GeoEntity): CesiumEntityOptions {
        const altitude = Number(entity.altitude ?? 0);
        const kind = String(entity.properties.kind || "civil");
        return {
            type: "model",
            iconUrl: kind === "military" ? MILITARY_PLANE_ICON_URL : PLANE_ICON_URL,
            modelUrl: AIRCRAFT_MODEL_URL,
            modelScale: 2.56,
            modelMinPixelSize: 16,
            modelHeadingOffset: 180,
            modelPromotionDistance: 140000,
            color: getAltitudeColor(altitude),
            rotation: entity.heading,
            labelText: entity.label,
            labelFont: "bold 10px JetBrains Mono, monospace",
            distanceDisplayCondition: { near: 0, far: 18000000 },
        };
    }

    getSelectionBehavior(entity: GeoEntity): SelectionBehavior | null {
        return {
            showTrail: true,
            trailDurationSec: 120,
            trailStepSec: 10,
            trailColor: getAltitudeColor(Number(entity.altitude ?? 0)),
            flyToOffsetMultiplier: 3,
            flyToBaseDistance: 45000,
        };
    }
}
