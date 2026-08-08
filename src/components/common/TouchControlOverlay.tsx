import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Compass, Move, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export function TouchControlOverlay() {
  const [expanded, setExpanded] = useState(false);
  const interactionMode = useUIStore((s) => s.interactionMode);

  if (interactionMode === 'chat') return null;

  const triggerCameraPan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const viewer = (window as { cesiumViewer?: any }).cesiumViewer;
    if (!viewer || !viewer.camera) return;

    const moveAmount = viewer.camera.positionCartographic
      ? Math.max(10000, viewer.camera.positionCartographic.height * 0.08)
      : 50000;

    switch (direction) {
      case 'up':
        viewer.camera.moveUp(moveAmount);
        break;
      case 'down':
        viewer.camera.moveDown(moveAmount);
        break;
      case 'left':
        viewer.camera.moveLeft(moveAmount);
        break;
      case 'right':
        viewer.camera.moveRight(moveAmount);
        break;
    }
  };

  const triggerCameraZoom = (zoomIn: boolean) => {
    const viewer = (window as { cesiumViewer?: any }).cesiumViewer;
    if (!viewer || !viewer.camera) return;

    const zoomAmount = viewer.camera.positionCartographic
      ? Math.max(50000, viewer.camera.positionCartographic.height * 0.25)
      : 250000;

    if (zoomIn) {
      viewer.camera.zoomIn(zoomAmount);
    } else {
      viewer.camera.zoomOut(zoomAmount);
    }
  };

  const resetCamera = () => {
    const viewer = (window as { cesiumViewer?: any }).cesiumViewer;
    if (!viewer || !viewer.camera) return;
    viewer.camera.flyHome(1.5);
  };

  return (
    <div className="fixed bottom-6 right-6 z-floating flex flex-col items-end gap-2 pointer-events-auto select-none sm:hidden touch-device-only">
      {/* Expanded Virtual D-Pad / Controller */}
      {expanded && (
        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl glass-panel border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <span className="text-[9px] font-mono uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-1">
            <Compass className="h-3 w-3" /> Touch Controls
          </span>

          {/* D-Pad Layout */}
          <div className="grid grid-cols-3 gap-1 w-32 h-32 items-center justify-items-center">
            <div />
            <button
              type="button"
              onClick={() => triggerCameraPan('up')}
              className="w-10 h-10 rounded-xl bg-white/10 active:bg-primary/40 flex items-center justify-center text-white/80 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Pan Up"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => triggerCameraPan('left')}
              className="w-10 h-10 rounded-xl bg-white/10 active:bg-primary/40 flex items-center justify-center text-white/80 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Pan Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="w-10 h-10 rounded-xl bg-primary/20 active:bg-primary flex items-center justify-center text-primary active:text-white active:scale-95 transition-all min-h-[44px] min-w-[44px]"
              title="Reset View"
              aria-label="Reset View"
            >
              <Compass className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => triggerCameraPan('right')}
              className="w-10 h-10 rounded-xl bg-white/10 active:bg-primary/40 flex items-center justify-center text-white/80 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Pan Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div />
            <button
              type="button"
              onClick={() => triggerCameraPan('down')}
              className="w-10 h-10 rounded-xl bg-white/10 active:bg-primary/40 flex items-center justify-center text-white/80 active:scale-95 transition-all min-h-[44px] min-w-[44px]"
              aria-label="Pan Down"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <div />
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10 w-full justify-center">
            <button
              type="button"
              onClick={() => triggerCameraZoom(true)}
              className="flex-1 flex items-center justify-center gap-1 min-h-[44px] px-3 py-2 rounded-xl bg-white/10 active:bg-primary/40 text-xs font-mono font-bold text-white/90 active:scale-95 transition-all"
            >
              <ZoomIn className="h-4 w-4 text-primary" />
              <span>Zoom In</span>
            </button>
            <button
              type="button"
              onClick={() => triggerCameraZoom(false)}
              className="flex-1 flex items-center justify-center gap-1 min-h-[44px] px-3 py-2 rounded-xl bg-white/10 active:bg-primary/40 text-xs font-mono font-bold text-white/90 active:scale-95 transition-all"
            >
              <ZoomOut className="h-4 w-4 text-primary" />
              <span>Zoom Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Touch Toggle Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center min-h-[48px] min-w-[48px] h-12 w-12 rounded-full glass-panel border border-primary/40 bg-black/60 text-primary shadow-lg active:scale-95 transition-all hover:bg-black/80"
        title="Toggle Touch Navigation Controls"
        aria-label="Toggle Touch Navigation Controls"
      >
        <Move className="h-5 w-5" />
      </button>
    </div>
  );
}
