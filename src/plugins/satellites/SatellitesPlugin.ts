import {
    Rocket,
} from "lucide-react";
import type {
    WorldPlugin,
    GeoEntity,
    TimeRange,
    PluginContext,
    LayerConfig,
    CesiumEntityOptions,
} from "@/core/plugins/PluginTypes";
import { WWV_ASSET_AUDIT, WWV_ORBITAL_ASSET_BY_CATEGORY, getWwvAssetSummary } from "@/assets/wwvVisualAssets";
import { getSatelliteCatalog } from "@/core/satellites/satelliteCatalog";
import { OrbitEngine, Coordinates } from "@/core/satellites/OrbitEngine";
import { useUIStore } from "@/store/uiStore";

const MIN_RENDERABLE_ORBIT_ALTITUDE_M = 150_000;

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
    private iconUrls = new Map<string, string>();
    private historyByEntityId = new Map<string, Array<{ lat: number; lon: number; ts: number }>>();

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
        const uiState = useUIStore.getState();
        const satelliteData = uiState.satelliteData;
        const issTelemetry = uiState.issTelemetry;
        const satellites = await getSatelliteCatalog((error) => {
            const message = `Satellite catalog fetch failed from WWT repository: ${error.message}`;
            useUIStore.getState().addChangeLog("SATELLITE", message, "warning");
        });

        return satellites.map(sat => {
            let coords: Coordinates | null = null;
            const tleData = satelliteData[sat.id]?.tle;
            let source: "live-iss-telemetry" | "simulated-iss-telemetry" | "live-tle" | "circular-orbit-fallback" = "circular-orbit-fallback";
            let telemetrySpeed: number | undefined;

            if (sat.id === "iss" && issTelemetry) {
                coords = {
                    lat: issTelemetry.latitude,
                    lng: issTelemetry.longitude,
                    altitude: issTelemetry.altitude * 1000
                };
                telemetrySpeed = Number.isFinite(issTelemetry.velocity)
                    ? issTelemetry.velocity / 3.6
                    : undefined;
                source = issTelemetry.simulated ? "simulated-iss-telemetry" : "live-iss-telemetry";
            } else if (tleData) {
                coords = this.engine.propagateSatelliteTle(tleData, new Date(now));
                if (coords) {
                    source = "live-tle";
                }
            }

            // Fallback to circular orbit if TLE is missing or propagation failed
            if (!coords) {
                source = "circular-orbit-fallback";
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

            const entityId = `sat-${sat.id}`;
            const previous = this.getLastHistoryPoint(entityId);
            const heading = previous ? this.calculateBearing(previous.lat, previous.lon, coords.lat, coords.lng) : 0;
            const history = this.appendHistory(entityId, coords.lat, coords.lng, now);
            const rawAltitude = coords.altitude ?? sat.altitudeM;
            const altitudeAudit = this.resolveRenderableAltitude(rawAltitude, sat.altitudeM);
            const speed = telemetrySpeed ?? this.engine.calculateOrbitalSpeed(altitudeAudit.renderedAltitude);

            return {
                id: entityId,
                pluginId: this.id,
                latitude: coords.lat,
                longitude: coords.lng,
                altitude: altitudeAudit.renderedAltitude,
                heading,
                speed,
                timestamp: new Date(),
                label: sat.name,
                properties: {
                    velocity: speed,
                    category: sat.category,
                    color: sat.color,
                    tle: tleData,
                    history,
                    source,
                    rawAltitudeMeters: altitudeAudit.rawAltitude,
                    renderedAltitudeMeters: altitudeAudit.renderedAltitude,
                    altitudeAdjusted: altitudeAudit.adjusted,
                    altitudeAdjustmentReason: altitudeAudit.reason,
                    visualAssetSource: "silver-wolf-derived-orbital-svg",
                    visualAssetStatus: `${WWV_ASSET_AUDIT.satelliteAssetMessage} The rendered marker is category-specific orbital hardware, not an aircraft icon or live imagery.`,
                    visualAssetUrl: this.getSatelliteIconUrl(sat.category),
                    copiedWwvAssetRoot: WWV_ASSET_AUDIT.copiedRoot,
                    copiedWwvSourceMirrorRoot: WWV_ASSET_AUDIT.sourceMirrorRoot,
                    copiedWwvSourceFileCount: WWV_ASSET_AUDIT.sourcePublicFileCount,
                    derivedSatelliteAssetRoot: WWV_ASSET_AUDIT.derivedSatelliteAssetRoot,
                    copiedWwvAssetSummary: getWwvAssetSummary(),
                    satelliteSpecificWwvAssetPresent: WWV_ASSET_AUDIT.satelliteSpecificAssetPresent,
                    telemetryTimestamp: sat.id === "iss" ? issTelemetry?.timestamp : undefined,
                    simulated: sat.id === "iss" ? issTelemetry?.simulated : undefined,
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
        const category = String(entity.properties.category || "other");
        const iconUrl = this.getSatelliteIcon(color, category);
        const settings = useUIStore.getState().satelliteSettings;
        const configuredSize = Math.max(12, Math.min(64, Number(settings?.iconSize ?? 32)));
        const visualSize = category === "starlink" ? Math.max(14, configuredSize - 4) : configuredSize;
        const occludeByGlobe = settings?.occludeByGlobe !== false;
        const label = String(entity.label || "Satellite")
            .replace(/^[^\s\w]+\s*/g, "")
            .replace(/\s+/g, " ")
            .trim();

        return {
            type: "billboard",
            color: color,
            iconUrl,
            iconScale: visualSize / 48,
            labelText: label || "Satellite",
            labelFont: "bold 9px JetBrains Mono, monospace",
            disableDepthTestDistance: occludeByGlobe ? 0 : Number.POSITIVE_INFINITY,
            disableManualHorizonCulling: !occludeByGlobe,
            disableClustering: true,
            distanceDisplayCondition: { near: 0, far: 18_000_000 },
            trailOptions: {
                width: category === "starlink" ? 1 : 1.5,
                color,
                opacityFade: true
            }
        };
    }

    getSelectionBehavior(entity: GeoEntity) {
        const color = entity.properties.color as string || "#00fff7";
        const trailLength = Math.max(5, Math.min(180, Number(useUIStore.getState().satelliteSettings?.trailLength ?? 40)));
        return {
            showTrail: true,
            trailDurationSec: Math.max(30, Math.min(900, trailLength * 5)),
            trailStepSec: 15,
            trailColor: color,
            flyToOffsetMultiplier: 1.8,
            flyToBaseDistance: Math.max(Number(entity.altitude || 420000) * 2.8, 900000),
        };
    }

    private getSatelliteIcon(color: string, category: string): string {
        const cacheKey = `${category}:${color}`;
        const cached = this.iconUrls.get(cacheKey);
        if (cached) return cached;

        const iconUrl = this.getSatelliteIconUrl(category);
        this.iconUrls.set(cacheKey, iconUrl);
        return iconUrl;
    }

    private getSatelliteIconUrl(category: string): string {
        return WWV_ORBITAL_ASSET_BY_CATEGORY[category] || WWV_ORBITAL_ASSET_BY_CATEGORY.other;
    }

    private resolveRenderableAltitude(rawAltitude: number | undefined, catalogAltitude: number) {
        const raw = Number(rawAltitude);
        if (!Number.isFinite(raw)) {
            return {
                rawAltitude: rawAltitude ?? null,
                renderedAltitude: catalogAltitude,
                adjusted: true,
                reason: "Incoming orbital altitude was missing or invalid, so the catalog orbit altitude is used for rendering."
            };
        }

        if (raw < MIN_RENDERABLE_ORBIT_ALTITUDE_M) {
            return {
                rawAltitude: raw,
                renderedAltitude: Math.max(catalogAltitude, MIN_RENDERABLE_ORBIT_ALTITUDE_M),
                adjusted: true,
                reason: "Incoming orbital altitude was below the realistic render shell, so the catalog orbit altitude is used to prevent globe-interior markers."
            };
        }

        return {
            rawAltitude: raw,
            renderedAltitude: raw,
            adjusted: false,
            reason: ""
        };
    }

    private getLastHistoryPoint(entityId: string) {
        const history = this.historyByEntityId.get(entityId);
        return history && history.length > 0 ? history[history.length - 1] : null;
    }

    private appendHistory(entityId: string, lat: number, lon: number, ts: number) {
        const history = this.historyByEntityId.get(entityId) || [];
        const last = history[history.length - 1];
        if (!last || ts - last.ts >= 1000) {
            history.push({ lat, lon, ts });
        }
        const trailLength = Number(useUIStore.getState().satelliteSettings?.trailLength ?? 40);
        const maxPoints = Math.max(5, Math.min(180, trailLength));
        const capped = history.slice(-maxPoints);
        this.historyByEntityId.set(entityId, capped);
        return capped;
    }

    private calculateBearing(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
        const lat1 = fromLat * Math.PI / 180;
        const lat2 = toLat * Math.PI / 180;
        const deltaLon = (toLon - fromLon) * Math.PI / 180;
        const y = Math.sin(deltaLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    }
}
