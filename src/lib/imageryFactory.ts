/**
 * Imagery Provider Factory — Inspired by WorldWideView's ImageryProviderFactory.
 * Provides a clean, cascading fallback chain for map tile sources.
 * Supports Google Photorealistic 3D Tiles → OSM fallback.
 */
import * as Cesium from 'cesium';
import { loadConfig } from './config';
import { useDiagnosticsStore } from '@/store/diagnosticsStore';

/** Attempt to load Google Photorealistic 3D Tiles (requires API key). */
async function setupGooglePhotorealistic3D(viewer: Cesium.Viewer, apiKey: string): Promise<boolean> {
  try {
    // Guard: viewer may be destroyed by the time async tileset loads
    if (!viewer || (typeof (viewer as any).isDestroyed === 'function' && (viewer as any).isDestroyed())) {
      useDiagnosticsStore.getState().add({
        level: 'warning',
        message: 'Viewer destroyed before Google Photorealistic 3D Tiles could be added',
        stack: null,
        metadata: { apiKeyProvided: !!apiKey },
        suggestion: 'Skip adding tileset when viewer is destroyed; ensure imagery setup aborts on unmount',
      });
      return false;
    }
    const tileset = await Cesium.createGooglePhotorealistic3DTileset({ key: apiKey });
    if (viewer.scene && viewer.scene.primitives) {
      viewer.scene.primitives.add(tileset);
    } else {
      useDiagnosticsStore.getState().add({
        level: 'warning',
        message: 'Viewer scene not available when adding Google 3D tileset',
        stack: null,
        metadata: {},
        suggestion: 'Verify viewer.scene exists before adding scene primitives',
      });
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[imageryFactory] Google 3D Tiles failed:', err);
    useDiagnosticsStore.getState().add({
      level: 'warning',
      message: 'Google Photorealistic 3D Tiles failed to load',
      stack: err instanceof Error ? err.stack || String(err) : String(err),
      metadata: {},
      suggestion: 'Check API key and network access, falling back to ArcGIS or OSM imagery',
    });
    return false;
  }
}

/** Load high-resolution ArcGIS satellite imagery as a reliable fallback (like Google Earth). */
async function setupArcGisSatellite(viewer: Cesium.Viewer): Promise<void> {
  try {
    if (!viewer || (typeof (viewer as any).isDestroyed === 'function' && (viewer as any).isDestroyed())) {
      useDiagnosticsStore.getState().add({
        level: 'warning',
        message: 'Viewer destroyed before ArcGIS imagery provider could be added',
        stack: null,
        metadata: {},
        suggestion: 'Abort imagery setup when viewer is destroyed',
      });
      return;
    }

    const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    );
    if (viewer.imageryLayers && typeof viewer.imageryLayers.addImageryProvider === 'function') {
      viewer.imageryLayers.addImageryProvider(esriProvider);
    } else {
      useDiagnosticsStore.getState().add({
        level: 'warning',
        message: 'Viewer.imageryLayers unavailable; cannot add ArcGIS imagery',
        stack: null,
        metadata: {},
        suggestion: 'Ensure viewer is not destroyed and imageryLayers API is present',
      });
    }
  } catch (err) {
    console.warn('[imageryFactory] ArcGIS fallback failed:', err);
    useDiagnosticsStore.getState().add({
      level: 'warning',
      message: 'ArcGIS imagery provider failed',
      stack: err instanceof Error ? err.stack || String(err) : String(err),
      metadata: {},
      suggestion: 'Network issue or ArcGIS service rate limit; falling back to OSM',
    });
  }
}

/**
 * Main entry point: Attempts Google 3D Tiles first, falls back to OSM.
 * Resolves when imagery is ready. Never throws — always falls back gracefully.
 */
export async function setupImagery(viewer: Cesium.Viewer): Promise<void> {
  const config = await loadConfig();
  const apiKey = config.GOOGLE_MAPS_API_KEY || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined);

  if (!viewer || (typeof (viewer as any).isDestroyed === 'function' && (viewer as any).isDestroyed())) {
    useDiagnosticsStore.getState().add({
      level: 'debug',
      message: 'Aborting imagery setup because viewer is not available or already destroyed',
      stack: null,
      metadata: {},
      suggestion: 'Imagery setup was invoked after cleanup; guard calls in hooks',
    });
    return;
  }

  if (apiKey) {
    const ok = await setupGooglePhotorealistic3D(viewer, apiKey);
    if (ok) return;
  }

  // Fallback: High-res satellite imagery
  await setupArcGisSatellite(viewer);
}
