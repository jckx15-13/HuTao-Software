import type { Viewer } from 'cesium';

let activeViewer: Viewer | null = null;

/** Publish the currently mounted Cesium viewer for cross-panel camera actions. */
export function registerCesiumViewer(viewer: Viewer): void {
  if (!viewer.isDestroyed()) activeViewer = viewer;
}

/** Return only a live viewer; stale instances are never handed to UI actions. */
export function getCesiumViewer(): Viewer | null {
  if (activeViewer?.isDestroyed()) activeViewer = null;
  return activeViewer;
}

/** Clear only the viewer being disposed, so stale cleanup cannot erase a replacement. */
export function unregisterCesiumViewer(viewer: Viewer): void {
  if (activeViewer === viewer) activeViewer = null;
}
