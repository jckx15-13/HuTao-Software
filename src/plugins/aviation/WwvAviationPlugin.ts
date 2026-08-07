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
import {
  fetchWwtJson,
  getWwtAssetLocalUrl,
  getWwtAssetSourcePath,
  WWT_ASSET_PATHS,
} from "@/lib/wwt/repositoryData";

const DATASET_PATH = WWT_ASSET_PATHS.aircraftSamplesDataset;
const MAX_LABEL_LENGTH = 90;
const MAX_RENDERED_FEATURES = 3000;
const STATIC_DATASET_TIMESTAMP = new Date("2026-06-22T00:00:00.000Z");

type AircraftKind = "civil" | "military";

type AircraftFeature = {
  id?: string | number;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type AircraftGeoJson = {
  type?: string;
  features?: AircraftFeature[];
};

const PLANE_ICON_URL = getWwtAssetLocalUrl(WWT_ASSET_PATHS.planeIcon);
const MILITARY_PLANE_ICON_URL = getWwtAssetLocalUrl(WWT_ASSET_PATHS.militaryPlaneIcon);
const AIRCRAFT_DATASET_SOURCE_PATH = getWwtAssetSourcePath(DATASET_PATH);
const AIRCRAFT_ASSET_ROOT = getWwtAssetSourcePath("");
const AIRCRAFT_MODEL_URL = getWwtAssetLocalUrl(WWT_ASSET_PATHS.airplaneModel);

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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value;
}

function toClampedRange(value: unknown, min: number, max: number, fallback: number): number {
  const number = toNumber(value, fallback);
  if (number < min) return min;
  if (number > max) return max;
  return number;
}

function parseTimestamp(value: unknown): Date {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return STATIC_DATASET_TIMESTAMP;
}

function readCoordinates(feature: AircraftFeature): { lon: number; lat: number } | null {
  if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return null;
  const [lon, lat] = feature.geometry.coordinates;
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lon, lat };
}

function readKind(value: unknown): AircraftKind {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "military" ? "military" : "civil";
}

function getAltitudeColor(altitudeMeters: number): string {
  if (altitudeMeters >= 10000) return "#60a5fa";
  if (altitudeMeters >= 7000) return "#22d3ee";
  if (altitudeMeters >= 4000) return "#34d399";
  return "#fbbf24";
}

export class WwvAviationPlugin implements WorldPlugin {
  readonly id = "wwv-aviation";
  readonly name = "WWV Aviation Samples";
  readonly description =
    "Static aircraft layer loaded from the WorldWide Telescope public dataset mirror.";
  readonly icon = Plane;
  readonly category = "aviation" as const;
  readonly version = "1.1.0";

  private context: PluginContext | null = null;
  private latestEntityCount = 0;

  async initialize(ctx: PluginContext): Promise<void> {
    this.context = ctx;
  }

  destroy(): void {
    this.context = null;
  }

  async fetch(_timeRange: TimeRange): Promise<GeoEntity[]> {
    try {
      const data = await fetchWwtJson<AircraftGeoJson>(DATASET_PATH, {
        init: { cache: "force-cache" },
      });
      const features = Array.isArray(data.features) ? data.features : [];

      const entities = features.flatMap((feature, index): GeoEntity[] => {
        const coordinates = readCoordinates(feature);
        if (!coordinates) return [];

        const props = feature.properties ?? {};
        const callsign = cleanText(props.callsign, `WWV-${index + 1}`);
        const operator = cleanText(props.operator, "Unknown operator");
        const kind = readKind(props.kind);
        const heading = toClampedRange(toNumber(props.heading, 0), 0, 359.999, 0);
        const altitude = toNumber(props.altitude, 0);
        const speed = toNumber(props.speed, 0);
        const onGround = typeof props.on_ground === "boolean" ? props.on_ground : false;
        const iconUrl = kind === "military" ? MILITARY_PLANE_ICON_URL : PLANE_ICON_URL;

        const featureId =
          typeof feature.id === "string" || typeof feature.id === "number"
            ? feature.id
            : `${callsign}-${index}`;

        return [{
          id: `wwv-aircraft-${cleanId(featureId, `wwv-aircraft-${index}`)}`,
          pluginId: this.id,
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          altitude,
          heading,
          speed,
          timestamp: parseTimestamp(props.timestamp),
          label: callsign,
          properties: {
            callsign,
            operator,
            kind,
            altitude_m: altitude,
            on_ground: onGround,
            speed_mps: speed,
            visualAssetSource: "worldwide-telescope-aircraft-assets",
            visualAssetStatus:
              "Rendered with WorldWide Telescope aircraft SVG icons and promoted to the WWT aircraft model when in close range.",
            visualAssetUrl: iconUrl,
            iconUrl,
            modelUrl: AIRCRAFT_MODEL_URL,
            copiedDatasetPath: getWwtAssetLocalUrl(DATASET_PATH),
            sourcePath: AIRCRAFT_DATASET_SOURCE_PATH,
            copiedWwvAssetRoot: AIRCRAFT_ASSET_ROOT.replace(/\/$/, ""),
            datasetFeatureCount: features.length,
            renderedFeatureLimit: MAX_RENDERED_FEATURES,
            renderedFeatureNote:
              "Startup renders a capped subset from the WWT aircraft fixture to keep map navigation responsive.",
            sourceUrlFieldsRemoved: true,
            sourceUrlFieldsRemovedReason:
              "No live ADS-B stream URL fields are provided in the WWT sample fixture.",
            liveTelemetry: false,
            staticDataset: true,
            source: "wwv-aviation-samples",
            stateHonesty:
              "Static WorldWide Telescope aircraft fixture; positions are curated points, not live ADS-B or military tracking.",
          },
        }];
      }).slice(0, MAX_RENDERED_FEATURES);

      this.latestEntityCount = entities.length;
      return entities;
    } catch (err) {
      this.latestEntityCount = 0;
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
      color: "#38bdf8",
      iconUrl: PLANE_ICON_URL,
      clusterEnabled: false,
      clusterDistance: 0,
      maxEntities: Math.max(this.latestEntityCount, 1),
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
      rotation: Number(entity.heading ?? 0),
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
