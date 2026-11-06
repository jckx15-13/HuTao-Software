import type { Viewer } from 'cesium';
import { getCesiumViewer } from './cesiumViewerRegistry';

/** Reattach external scene resources after WebGL recovery replaces the viewer. */
export function watchCesiumViewer(attach: (viewer: Viewer) => () => void): () => void {
  let connected: Viewer | null = null;
  let detach: (() => void) | undefined;
  const sync = () => {
    const viewer = getCesiumViewer();
    if (viewer === connected) return;
    detach?.();
    detach = undefined;
    connected = viewer;
    if (viewer) detach = attach(viewer);
  };
  sync();
  const timer = window.setInterval(sync, 300);
  return () => { clearInterval(timer); detach?.(); };
}
