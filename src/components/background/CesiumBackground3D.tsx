import { useRef, useEffect } from 'react';
import { useCesiumViewer } from '../../hooks/cesium/useCesiumViewer';
import { useLandmarks } from '../../hooks/cesium/useLandmarks';
import { useIssTracker } from '../../hooks/cesium/useIssTracker';
import { useAutoRotation } from '../../hooks/cesium/useAutoRotation';
import { useWWVGlobe } from '../../hooks/cesium/useWWVGlobe';
import { useConstellations } from '../../hooks/cesium/useConstellations';
import { useImageryManager } from '../../core/globe/useImageryManager';
import { useBorders } from '../../core/globe/useBorders';
import { useCameraActions } from '../../core/globe/hooks/useCameraActions';
import { useUIStore } from '@/store/uiStore';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface CesiumBackground3DProps {
  interactive: boolean;
  onError: (err: string) => void;
}

export default function CesiumBackground3D({ interactive, onError }: CesiumBackground3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const showBorders = useUIStore((s) => s.showBorders);
  
  // Initialize Cesium Viewer
  const { viewer, isLoaded, error } = useCesiumViewer(containerRef);

  // Propagate error back to parent if initialization fails
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Activate Cesium features
  useLandmarks(viewer);
  useIssTracker(viewer);
  useAutoRotation(viewer, interactive);
  useWWVGlobe(viewer);
  useConstellations(viewer);
  
  // Imagery and map data layers integration
  useImageryManager(viewer, isLoaded);
  useBorders(viewer, showBorders);
  useCameraActions(viewer, isLoaded);

  return (
    <div className="absolute inset-0 h-full w-full bg-black animate-fade-in pointer-events-auto" style={{ zIndex: 0 }}>
      <div ref={containerRef} className="h-full w-full pointer-events-auto" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30">
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
