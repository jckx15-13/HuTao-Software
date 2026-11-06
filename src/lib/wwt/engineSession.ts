import type { ScriptInterface, WWTControl } from '@wwtelescope/engine';

type Engine = typeof import('@wwtelescope/engine');
export interface WwtEngineSession {
  lib: Engine;
  api: ScriptInterface;
  control: WWTControl;
  canvas: HTMLCanvasElement;
  ready: boolean;
}

let shared: WwtEngineSession | undefined;

/** WWT owns a page-wide singleton; reuse its canvas instead of rebuilding it. */
export async function attachWwtEngine(host: HTMLElement): Promise<WwtEngineSession> {
  const lib = await import('@wwtelescope/engine');
  if (!host.isConnected) throw new Error('Telescope viewport was closed');
  if (shared) {
    host.replaceChildren(shared.canvas);
    return shared;
  }
  const builder = new lib.WWTControlBuilder(host.id);
  builder.initialView(5.949, 83.6475, 330);
  builder.startRenderLoop(false);
  const api = builder.create();
  const canvas = host.querySelector('canvas');
  if (!canvas) throw new Error('WWT did not create a rendering canvas');
  shared = { lib, api, control: lib.WWTControl.singleton, canvas, ready: false };
  const session = shared;
  api.add_ready(() => { session.ready = true; });
  return session;
}
