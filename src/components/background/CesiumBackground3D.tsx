import { useRef, useEffect } from 'react';
import { useCesiumViewer } from '../../hooks/cesium/useCesiumViewer';
import { useLandmarks } from '../../hooks/cesium/useLandmarks';
import { useIssTracker } from '../../hooks/cesium/useIssTracker';
import { useAutoRotation } from '../../hooks/cesium/useAutoRotation';
import { useWWVGlobe } from '../../hooks/cesium/useWWVGlobe';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface CesiumBackground3DProps {
  interactive: boolean;
  onError: (err: string) => void;
}

export default function CesiumBackground3D({ interactive, onError }: CesiumBackground3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div className="absolute inset-0 h-full w-full bg-black animate-fade-in" style={{ zIndex: 0 }}>
      <div ref={containerRef} className="h-full w-full" />
      
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
