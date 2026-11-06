import { afterEach, expect, it, vi } from 'vitest';
import type { Viewer } from 'cesium';
import { registerCesiumViewer, unregisterCesiumViewer } from './cesiumViewerRegistry';
import { watchCesiumViewer } from './watchCesiumViewer';

afterEach(() => vi.useRealTimers());

it('detaches old resources and reattaches once after viewer recovery', () => {
  vi.useFakeTimers();
  const oldViewer = { isDestroyed: () => false } as Viewer;
  const newViewer = { isDestroyed: () => false } as Viewer;
  const disposeOld = vi.fn();
  const disposeNew = vi.fn();
  const attach = vi.fn((viewer: Viewer) => viewer === oldViewer ? disposeOld : disposeNew);
  registerCesiumViewer(oldViewer);
  const stop = watchCesiumViewer(attach);
  vi.advanceTimersByTime(900);
  expect(attach).toHaveBeenCalledTimes(1);
  registerCesiumViewer(newViewer);
  vi.advanceTimersByTime(300);
  expect(disposeOld).toHaveBeenCalledTimes(1);
  expect(attach).toHaveBeenCalledTimes(2);
  expect(attach).toHaveBeenLastCalledWith(newViewer);
  stop();
  vi.advanceTimersByTime(900);
  expect(disposeNew).toHaveBeenCalledTimes(1);
  expect(attach).toHaveBeenCalledTimes(2);
  unregisterCesiumViewer(newViewer);
});
