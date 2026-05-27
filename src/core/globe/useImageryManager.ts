/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useState } from "react";
import {
    Viewer as CesiumViewer,
    ImageryLayer,
    SceneMode,
    Cesium3DTileset,
    Cesium3DTileStyle,
    createOsmBuildingsAsync,
    createGooglePhotorealistic3DTileset
} from "cesium";
import { useStore } from "@/core/state/store";
import { createImageryProvider, createOsmProvider } from "./ImageryProviderFactory";
import { loadConfig } from "../../lib/config";

export function useImageryManager(viewerInstance: CesiumViewer | null, viewerReady: boolean) {
    const viewer = viewerInstance;
    const baseLayerId = useStore((s) => s.mapConfig.baseLayerId);
    const fallbackLayerId = useStore((s) => s.mapConfig.fallbackLayerId);
    const sceneMode = useStore((s) => s.mapConfig.sceneMode);
    const showOsmBuildings = useStore((s) => s.mapConfig.showOsmBuildings);

    const selectedLayerId = baseLayerId || 'osm';
    const currentImageryLayerRef = useRef<ImageryLayer | null>(null);
    const osmBuildingsRef = useRef<Cesium3DTileset | null>(null);
    const [google3DActive, setGoogle3DActive] = useState(false);

    // 1. Manage Scene Mode (2D / 3D / Columbus)
    useEffect(() => {
        if (!viewer || !viewerReady || viewer.isDestroyed()) return;

        let targetMode = SceneMode.SCENE3D;
        if (sceneMode === 1) targetMode = SceneMode.COLUMBUS_VIEW;
        if (sceneMode === 2) targetMode = SceneMode.SCENE2D;

        if (viewer.scene.mode !== targetMode) {
            if (targetMode === SceneMode.SCENE2D) viewer.scene.morphTo2D(1.0);
            else if (targetMode === SceneMode.SCENE3D) viewer.scene.morphTo3D(1.0);
            else if (targetMode === SceneMode.COLUMBUS_VIEW) viewer.scene.morphToColumbusView(1.0);
        }
    }, [viewer, viewerReady, sceneMode]);

    // 2. Manage Imagery Layer and Google 3D Tiles
    useEffect(() => {
        if (!viewer || !viewerReady || viewer.isDestroyed()) return;

        let active = true;

        async function updateImagery() {
            if (!viewer || !viewerReady || viewer.isDestroyed() || !active) return;

            // Handle Google 3D Tiles specifically
            const isGoogle3D = selectedLayerId === "google-3d";

            // Toggle Google 3D Tileset visibility if it exists
            // Or find it in primitives
            const {primitives} = viewer.scene;
            let foundTileset: Cesium3DTileset | null = null;

            for (let i = 0; i < primitives.length; i++) {
                const p = primitives.get(i);
                // Find the Google tileset — skip any tagged as OSM buildings
                if (p instanceof Cesium3DTileset && !(p as any)._wwvOsmBuildings) {
                    foundTileset = p;
                    break;
                }
            }

            // Self-healing: if Google 3D Tiles is selected but no tileset exists yet,
            // try to dynamically create it if we have an API key.
            if (isGoogle3D && !foundTileset) {
                const config = await loadConfig();
                const apiKey = config.GOOGLE_MAPS_API_KEY || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined);
                if (apiKey && active && !viewer.isDestroyed()) {
                    try {
                        console.log("[useImageryManager] Dynamically initializing Google 3D Tileset...");
                        const tileset = await createGooglePhotorealistic3DTileset({ key: apiKey });
                        if (active && !viewer.isDestroyed()) {
                            viewer.scene.primitives.add(tileset);
                            foundTileset = tileset;
                        }
                    } catch (err) {
                        console.warn("[useImageryManager] Failed to create Google 3D Tileset dynamically:", err);
                    }
                }
            }

            const hasGoogle3D = isGoogle3D && !!foundTileset;
            if (foundTileset) {
                foundTileset.show = hasGoogle3D;
            }

            // Update state so buildings and components know whether 3D mode is active
            if (active) {
                setGoogle3DActive(hasGoogle3D);
            }

            // Hide/Show standard globe surface to prevent z-fighting with Google 3D
            viewer.scene.globe.show = !hasGoogle3D;

            // Manage standard imagery layer
            if (hasGoogle3D) {
                // Remove standard imagery if showing Google 3D tiles
                if (currentImageryLayerRef.current) {
                    viewer.imageryLayers.remove(currentImageryLayerRef.current);
                    currentImageryLayerRef.current = null;
                }
            } else {
                // Load the selected imagery layer, then optionally fall back.
                const initialLayerId = isGoogle3D ? "arcgis-world" : selectedLayerId;
                let provider;

                try {
                    provider = await createImageryProvider(initialLayerId);
                } catch (primaryErr) {
                    console.warn(`[useImageryManager] Failed to load imagery layer ${initialLayerId}, trying fallback if available`, primaryErr);

                    if (fallbackLayerId && fallbackLayerId !== initialLayerId) {
                        try {
                            provider = await createImageryProvider(fallbackLayerId);
                            console.warn(`[useImageryManager] Falling back to imagery layer ${fallbackLayerId}`);
                        } catch (fallbackErr) {
                            console.warn(`[useImageryManager] Fallback imagery ${fallbackLayerId} also failed`, fallbackErr);
                        }
                    }

                    if (!provider) {
                        provider = createOsmProvider();
                        console.warn('[useImageryManager] Using OSM fallback imagery');
                    }
                }

                if (!provider) {
                    return;
                }

                const newLayer = new ImageryLayer(provider);

                if (currentImageryLayerRef.current) {
                    viewer.imageryLayers.remove(currentImageryLayerRef.current);
                }

                if (viewer.isDestroyed() || !active) return;
                viewer.imageryLayers.add(newLayer, 0);
                currentImageryLayerRef.current = newLayer;
            }
        }

        updateImagery();

        return () => {
            active = false;
        };
    }, [viewer, viewerReady, baseLayerId, fallbackLayerId]);

    // 3. Manage OSM 3D Buildings (only in 3D mode, not with Google Photorealistic tiles)
    const is3DMode = sceneMode === 3;
    useEffect(() => {
        if (!viewer || !viewerReady || viewer.isDestroyed()) return;

        const shouldShow = showOsmBuildings && !google3DActive && is3DMode;

        if (shouldShow && !osmBuildingsRef.current) {
            let cancelled = false;
            createOsmBuildingsAsync().then((tileset) => {
                if (cancelled || !viewer || viewer.isDestroyed()) {
                    tileset.destroy();
                    return;
                }
                (tileset as any)._wwvOsmBuildings = true;
                tileset.maximumScreenSpaceError = 16;
                tileset.style = new Cesium3DTileStyle({
                    color: "color('#E0DDD5')",
                });
                viewer.scene.primitives.add(tileset);
                osmBuildingsRef.current = tileset;
            }).catch((err) => {
                console.warn("[useImageryManager] Failed to load OSM 3D Buildings:", err);
            });
            return () => { cancelled = true; };
        }

        if (!shouldShow && osmBuildingsRef.current) {
            if (!viewer.isDestroyed()) {
                viewer.scene.primitives.remove(osmBuildingsRef.current);
            }
            osmBuildingsRef.current = null;
        }
    }, [viewer, viewerReady, google3DActive, is3DMode, showOsmBuildings]);

    return {
        isGoogle3D: google3DActive
    };
}
