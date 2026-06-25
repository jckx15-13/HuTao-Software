type CesiumImageryApi = Pick<
    typeof import("cesium"),
    | "ArcGisMapServerImageryProvider"
    | "BingMapsImageryProvider"
    | "BingMapsStyle"
    | "createGooglePhotorealistic3DTileset"
    | "IonImageryProvider"
    | "UrlTemplateImageryProvider"
>;

let cesiumImageryApiPromise: Promise<CesiumImageryApi> | null = null;

async function loadCesiumImageryApi(): Promise<CesiumImageryApi> {
    const hostCesium = (globalThis as { __WWV_HOST__?: { Cesium?: CesiumImageryApi } }).__WWV_HOST__?.Cesium;
    if (hostCesium?.UrlTemplateImageryProvider && hostCesium.ArcGisMapServerImageryProvider) {
        return hostCesium;
    }

    cesiumImageryApiPromise ??= import("cesium");
    return cesiumImageryApiPromise;
}

export interface ImageryLayerEntry {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    type: "google-3d" | "imagery";
}

export const IMAGERY_LAYERS: ImageryLayerEntry[] = [
    {
        id: "arcgis-world",
        name: "ArcGIS World Imagery",
        description: "Esri public satellite imagery",
        thumbnail: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/0/0/0",
        type: "imagery",
    },
    {
        id: "google-3d",
        name: "Google Maps 3D",
        description: "High-fidelity photorealistic 3D",
        thumbnail: "https://mts1.google.com/vt/lyrs=y@186112443&hl=x-local&src=app&x=0&y=0&z=0&s=Galileo",
        type: "google-3d",
    },
    {
        id: "cesium",
        name: "Cesium Compatible Default",
        description: "ArcGIS imagery through the Cesium imagery stack",
        thumbnail: "https://cesium.com/downloads/ion-imagery-preview.png",
        type: "imagery",
    },
    {
        id: "bing-sat",
        name: "Bing Maps Satellite",
        description: "High-resolution satellite view",
        thumbnail: "https://ecn.t3.tiles.virtualearth.net/tiles/a0.jpeg?g=1",
        type: "imagery",
    },
    {
        id: "bing-road",
        name: "Bing Maps Roads",
        description: "Standard road map",
        thumbnail: "https://ecn.t3.tiles.virtualearth.net/tiles/r0.jpeg?g=1",
        type: "imagery",
    },
    {
        id: "google-satellite",
        name: "Google Satellite",
        description: "Google Maps high-res tiles",
        thumbnail: "https://khms0.google.com/kh/v=908?x=0&y=0&z=0",
        type: "imagery",
    },
    {
        id: "google-street",
        name: "Google Street",
        description: "Google Maps standard road map",
        thumbnail: "https://mts1.google.com/vt/lyrs=m@186112443&hl=x-local&src=app&x=0&y=0&z=0&s=Galileo",
        type: "imagery",
    },
    {
        id: "osm",
        name: "OpenStreetMap",
        description: "Community-driven map data",
        thumbnail: "https://a.tile.openstreetmap.org/0/0/0.png",
        type: "imagery",
    },
    {
        id: "blue-marble",
        name: "NASA Blue Marble",
        description: "Cloud-free true color Earth",
        thumbnail: "https://neo.gsfc.nasa.gov/servlet/RenderData?datasetConfigId=MOD_LSTD_M&year=2021&month=01&format=JPEG&width=256&height=128",
        type: "imagery",
    },
];


export async function createOsmProvider() {
    const { UrlTemplateImageryProvider } = await loadCesiumImageryApi();
    return new UrlTemplateImageryProvider({
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: ["a", "b", "c"]
    });
}

export async function createGooglePhotorealistic3DTileset(options: { key?: string } = {}) {
    const { createGooglePhotorealistic3DTileset: create } = await loadCesiumImageryApi();
    if (typeof create !== "function") {
        throw new Error("Google photorealistic tiles API is not available in this Cesium runtime.");
    }

    if (!options.key) {
        throw new Error("Google photorealistic tiles require a valid API key configured as GOOGLE_MAPS_API_KEY.");
    }

    return create(options);
}

async function createGoogleProvider(lyrs: string) {
    const { UrlTemplateImageryProvider } = await loadCesiumImageryApi();
    return new UrlTemplateImageryProvider({
        url: `https://mt{s}.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}`,
        subdomains: ["0", "1", "2", "3"]
    });
}

async function tieredFallback(ionAssetId: number, googleLyrs: string) {
    // 1. Try Google XYZ tiles
    try {
        return await createGoogleProvider(googleLyrs);
    } catch (googleErr) {
        console.warn("[ImageryProvider] Google tiles failed, trying Bing via Ion:", googleErr);
    }

    // 2. Try Bing via Cesium Ion (free shared token)
    try {
        const { IonImageryProvider } = await loadCesiumImageryApi();
        return await IonImageryProvider.fromAssetId(ionAssetId);
    } catch (ionErr) {
        console.warn("[ImageryProvider] Ion/Bing failed, falling back to OSM:", ionErr);
    }

    // 3. OSM as last resort
    return await createOsmProvider();
}

export async function createImageryProvider(layerId: string) {
    const bingKey = import.meta.env.VITE_BING_MAPS_KEY;
    const {
        ArcGisMapServerImageryProvider,
        BingMapsImageryProvider,
        BingMapsStyle,
    } = await loadCesiumImageryApi();

    switch (layerId) {
        case "cesium":
        case "arcgis-world":
            return await ArcGisMapServerImageryProvider.fromUrl(
                "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
            );

        case "bing-sat":
        case "bing-aerial":
            if (bingKey) {
                return await BingMapsImageryProvider.fromUrl("https://dev.virtualearth.net", {
                    key: bingKey,
                    mapStyle: BingMapsStyle.AERIAL,
                });
            }
            return await tieredFallback(2, "s");

        case "bing-labels":
            if (bingKey) {
                return await BingMapsImageryProvider.fromUrl("https://dev.virtualearth.net", {
                    key: bingKey,
                    mapStyle: BingMapsStyle.AERIAL_WITH_LABELS,
                });
            }
            return await tieredFallback(3, "y");

        case "bing-road":
            if (bingKey) {
                return await BingMapsImageryProvider.fromUrl("https://dev.virtualearth.net", {
                    key: bingKey,
                    mapStyle: BingMapsStyle.ROAD,
                });
            }
            return await tieredFallback(4, "m");

        case "google-satellite":
            return await createGoogleProvider("s");
        case "google-street":
            return await createGoogleProvider("m");

        case "osm":
            return await createOsmProvider();

        case "blue-marble":
            return await tieredFallback(3845, "s");

        default:
            return await createOsmProvider();
    }
}
