import { useEffect, useRef, useMemo } from 'react';
import type { Viewer } from 'cesium';
import { useStore } from '@/core/state/store';
import { pluginManager } from '@/core/plugins/PluginManager';
import { initPrimitiveCollections, AnimatableItem } from '@/core/globe/EntityRenderer';
import { setupInteractionHandlers } from '@/core/globe/InteractionHandler';
import { useEntityRendering } from '@/core/globe/hooks/useEntityRendering';
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

  // Hook up the rendering loop
  useEntityRendering(
    viewer,
    isReady,
    visibleEntities,
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
}
