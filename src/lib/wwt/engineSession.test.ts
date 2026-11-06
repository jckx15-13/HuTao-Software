import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ create: vi.fn(), callbacks: [] as (() => void)[] }));
vi.mock('@wwtelescope/engine', () => ({
  WWTControlBuilder: class {
    constructor(private id: string) {}
    initialView() {}
    startRenderLoop() {}
    create() {
      mock.create(); document.getElementById(this.id)!.appendChild(document.createElement('canvas'));
      return { add_ready: (callback: () => void) => mock.callbacks.push(callback) };
    }
  },
  WWTControl: { singleton: {} },
}));

describe('WWT singleton lifecycle', () => {
  beforeEach(() => { vi.resetModules(); mock.create.mockClear(); mock.callbacks = []; document.body.replaceChildren(); });
  it('reattaches the existing ready canvas after mode switches and retries', async () => {
    const { attachWwtEngine } = await import('./engineSession');
    const first = document.createElement('div'); first.id = 'first'; document.body.append(first);
    const session = await attachWwtEngine(first);
    mock.callbacks[0]!(); expect(session.ready).toBe(true);
    first.remove();
    const second = document.createElement('div'); second.id = 'second'; document.body.append(second);
    const reattached = await attachWwtEngine(second);
    expect(reattached).toBe(session); expect(second.firstChild).toBe(session.canvas);
    expect(reattached.ready).toBe(true); expect(mock.create).toHaveBeenCalledOnce();
    await attachWwtEngine(second); expect(second.children).toHaveLength(1);
  });

  it('does not initialize an engine after its host unmounts', async () => {
    const { attachWwtEngine } = await import('./engineSession');
    const removed = document.createElement('div'); removed.id = 'removed';
    await expect(attachWwtEngine(removed)).rejects.toThrow('closed');
    expect(mock.create).not.toHaveBeenCalled();
  });
});
