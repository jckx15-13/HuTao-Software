import { useEffect, useRef, useMemo } from 'react';
import type { Viewer } from 'cesium';
import { useStore } from '@/core/state/store';
import { pluginManager } from '@/core/plugins/PluginManager';
import { initPrimitiveCollections, AnimatableItem } from '@/core/globe/EntityRenderer';
import { setupInteractionHandlers } from '@/core/globe/InteractionHandler';
import { useEntityRendering } from '@/core/globe/hooks/useEntityRendering';
import { useModelRendering } from '@/core/globe/hooks/useModelRendering';
import { useTrailRendering } from '@/core/globe/hooks/useTrailRendering';
import { useSatelliteFrustum } from '@/core/globe/hooks/useSatelliteFrustum';
import { useHexagonRendering } from '@/core/globe/hooks/useHexagonRendering';
import { GeoEntity, CesiumEntityOptions } from '@/core/plugins/PluginTypes';

/**
 * Custom hook to bridge the WorldWideView plugin entity renderer to the active Cesium Viewer.
 */
export function useWWVGlobe(viewer: Viewer | null) {
  const isReady = !!viewer;
  const animatablesMapRef = useRef<Map<string, AnimatableItem>>(new Map());
  const hoveredEntityIdRef = useRef<string | null>(null);

  // Grab the entities and globe state from Zustand store
  const entitiesByPlugin = useStore((s) => s.entitiesByPlugin);
  const mapConfig = useStore((s) => s.mapConfig);
  const selectedEntity = useStore((s) => s.selectedEntity);

  // Initialize primitive collections once when viewer is ready
  useEffect(() => {
    if (viewer) {
      initPrimitiveCollections(viewer);
      
      const cleanupInteractions = setupInteractionHandlers(viewer, hoveredEntityIdRef);
      return () => {
        cleanupInteractions();
      };
    }
  }, [viewer]);

  // Derive visible entities list by looking at plugin settings and layers config
  const visibleEntities = useMemo(() => {
    const visible: Array<{ entity: GeoEntity; options: CesiumEntityOptions }> = [];
    
    // We get all plugins from the pluginManager to know their types
    const enabledPlugins = pluginManager.getEnabledPlugins();
    
    for (const managed of enabledPlugins) {
      const pId = managed.plugin.id;
      const entities = entitiesByPlugin[pId] || [];
      
      for (const e of entities) {
        const options = managed.plugin.renderEntity(e);
        visible.push({ entity: e, options });
      }
    }
    
    return visible;
  }, [entitiesByPlugin]);

  // Split standard (billboard/point) rendering from 3D Hexagon rendering
  const standardEntities = useMemo(() => {
    return visibleEntities.filter((item) => item.options.type !== 'hexagon');
  }, [visibleEntities]);

  const hexagonEntities = useMemo(() => {
    return visibleEntities.filter((item) => item.options.type === 'hexagon');
  }, [visibleEntities]);

  // Hook up standard billboard rendering loop
  useEntityRendering(
    viewer,
    isReady,
    standardEntities,
    animatablesMapRef,
    hoveredEntityIdRef,
    {
      showFps: mapConfig.showFps,
      resolutionScale: mapConfig.resolutionScale,
      antiAliasing: mapConfig.antiAliasing,
      maxScreenSpaceError: mapConfig.maxScreenSpaceError,
      shadowsEnabled: mapConfig.shadowsEnabled,
      enableLighting: mapConfig.enableLighting,
    }
  );

  // Hook up glTF 3D model rendering (promotes billboards at close range)
  useModelRendering(viewer, isReady, animatablesMapRef);

  // Hook up trail rendering (polylines for airplanes or targets)
  useTrailRendering(viewer, isReady, animatablesMapRef);

  // Hook up selected satellite sensor frustums (conical footprint projection)
  useSatelliteFrustum(viewer, isReady, selectedEntity, animatablesMapRef);

  // Hook up 3D hexagonal markers (seismic cylinders with slices: 6)
  useHexagonRendering(viewer, isReady, hexagonEntities);
}
