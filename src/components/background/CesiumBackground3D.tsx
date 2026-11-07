import { useRef, useEffect } from 'react';
import { Color, type Scene } from 'cesium';
import { useCesiumViewer, type CesiumViewerStatus } from '../../hooks/cesium/useCesiumViewer';
import { useLandmarks } from '../../hooks/cesium/useLandmarks';
import { useAutoRotation } from '../../hooks/cesium/useAutoRotation';
import { useWWVGlobe } from '../../hooks/cesium/useWWVGlobe';
import { useConstellations } from '../../hooks/cesium/useConstellations';
import { useTelescopePresets } from '../../hooks/cesium/useTelescopePresets';
import { useImageryManager } from '../../core/globe/useImageryManager';
import { useBorders } from '../../core/globe/useBorders';
import { useCameraActions } from '../../core/globe/hooks/useCameraActions';
import { useUIStore } from '@/store/uiStore';
import { useStore } from '@/core/state/store';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface CesiumBackground3DProps {
  interactive: boolean;
  transparentSky: boolean;
  onError: (err: string) => void;
  onStatusChange?: (status: CesiumViewerStatus) => void;
}

function configureSky(scene: Scene, transparentSky: boolean) {
  scene.backgroundColor = transparentSky ? Color.TRANSPARENT : Color.fromCssColorString('#020205');
  if (scene.skyBox) scene.skyBox.show = !transparentSky;
  if (scene.sun) scene.sun.show = !transparentSky;
  if (scene.moon) scene.moon.show = !transparentSky;
  scene.requestRender();
}

export default function CesiumBackground3D({ interactive, transparentSky, onError, onStatusChange }: CesiumBackground3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const showBorders = useUIStore((s) => s.showBorders);
  const wwtSkySelected = useUIStore((s) => s.cosmosBackgroundMode === 'wwt-milkyway');
  const imageryProvider = useUIStore((s) => s.imageryProvider);
  const updateMapConfig = useStore((s) => s.updateMapConfig);
  
  // Sync uiStore.imageryProvider → configSlice.mapConfig.baseLayerId
  useEffect(() => {
    if (imageryProvider) {
      updateMapConfig({ baseLayerId: imageryProvider });
    }
  }, [imageryProvider, updateMapConfig]);
  // Initialize Cesium Viewer
  const { viewer, isLoaded, status, error } = useCesiumViewer(containerRef);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Propagate error back to parent if initialization fails
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    configureSky(viewer.scene, transparentSky);
  }, [viewer, transparentSky]);

  // Activate Cesium features
  const showEarthMarkers = !transparentSky || interactive;
  useLandmarks(viewer, showEarthMarkers);
  useAutoRotation(viewer, interactive, !transparentSky);
  useWWVGlobe(viewer, showEarthMarkers);
  useConstellations(interactive && !wwtSkySelected ? viewer : null);
  useTelescopePresets(viewer);
  
  // Imagery and map data layers integration
  useImageryManager(viewer, isLoaded);
  useBorders(viewer, showBorders);
  useCameraActions(viewer, isLoaded);

  return (
    <div className={`absolute inset-0 h-full w-full animate-fade-in ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div ref={containerRef} className="h-full w-full" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-floating">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary animate-pulse">
              Syncing Orbital Array...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
