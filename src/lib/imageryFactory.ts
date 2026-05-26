/**
 * Imagery Provider Factory — Inspired by WorldWideView's ImageryProviderFactory.
 * Provides a clean, cascading fallback chain for map tile sources.
 * Supports Google Photorealistic 3D Tiles → OSM fallback.
 */
import * as Cesium from 'cesium';
import { loadConfig } from './config';

/** Attempt to load Google Photorealistic 3D Tiles (requires API key). */
async function setupGooglePhotorealistic3D(viewer: Cesium.Viewer, apiKey: string): Promise<boolean> {
  try {
    const tileset = await Cesium.createGooglePhotorealistic3DTileset({ key: apiKey });
    viewer.scene.primitives.add(tileset);
    return true;
  } catch (err) {
    console.warn('[imageryFactory] Google 3D Tiles failed:', err);
    return false;
  }
}

/** Load high-resolution ArcGIS satellite imagery as a reliable fallback (like Google Earth). */
async function setupArcGisSatellite(viewer: Cesium.Viewer): Promise<void> {
  try {
    const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    );
    viewer.imageryLayers.addImageryProvider(esriProvider);
  } catch (err) {
    console.warn('[imageryFactory] ArcGIS fallback failed:', err);
  }
}

/**
 * Main entry point: Attempts Google 3D Tiles first, falls back to OSM.
 * Resolves when imagery is ready. Never throws — always falls back gracefully.
 */
export async function setupImagery(viewer: Cesium.Viewer): Promise<void> {
  const config = await loadConfig();
  const apiKey = config.GOOGLE_MAPS_API_KEY || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined);

  if (apiKey) {
    const ok = await setupGooglePhotorealistic3D(viewer, apiKey);
    if (ok) return;
  }

  // Fallback: High-res satellite imagery
  await setupArcGisSatellite(viewer);
}
