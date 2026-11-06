import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ScriptInterface } from '@wwtelescope/engine';
import { loadWwtCollection, validateCollectionUrl } from './collectionLoader';
import { connectWwtResearchApp, loadEmbeddedCollection, readWwtView } from './researchProtocol';
import catalog from '@/data/astronomy/wwtConstellations.json';
import { initialObservatoryView } from '@/core/state/observatoryStore';

afterEach(() => { vi.useRealTimers(); });

function embeddedFrame() {
  const source = { postMessage: vi.fn() };
  const frame = { src: 'https://web.wwtassets.org/research/latest/', contentWindow: source } as unknown as HTMLIFrameElement;
  const reply = (data: unknown, origin = 'https://web.wwtassets.org', sender = source) =>
    window.dispatchEvent(new MessageEvent('message', { data, origin, source: sender as unknown as Window }));
  return { frame, source, reply };
}

describe('WWT research protocol', () => {
  it('waits for a matching pong from the trusted frame and releases polling', () => {
    vi.useFakeTimers();
    const { frame, source, reply } = embeddedFrame();
    const ready = vi.fn();
    const stop = connectWwtResearchApp(frame, ready);
    const ping = source.postMessage.mock.calls[0]![0];
    expect(ready).not.toHaveBeenCalled();
    reply(ping, 'https://untrusted.test');
    reply(ping, 'https://web.wwtassets.org', { postMessage: vi.fn() });
    reply({ ...ping, threadId: 'wrong-session' });
    expect(ready).not.toHaveBeenCalled();
    reply(ping);
    expect(ready).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(2000);
    expect(source.postMessage).toHaveBeenCalledOnce();
    stop();
  });

  it('stops receiving and polling on unmount', () => {
    vi.useFakeTimers();
    const { frame, source, reply } = embeddedFrame();
    const ready = vi.fn();
    const stop = connectWwtResearchApp(frame, ready);
    const ping = source.postMessage.mock.calls[0]![0];
    stop(); reply(ping); vi.advanceTimersByTime(1000);
    expect(ready).not.toHaveBeenCalled();
    expect(source.postMessage).toHaveBeenCalledOnce();
  });

  it('decodes documented radians and field-of-view values, rejecting malformed updates', () => {
    expect(readWwtView({ type: 'wwt_view_state', raRad: Math.PI, decRad: Math.PI / 6, fovDeg: 12 }))
      .toEqual({ type: 'wwt_view_state', ra: 180, dec: expect.closeTo(30), fov: 12 });
    expect(readWwtView({ type: 'wwt_view_state', ra: 12, dec: 30, fov: 12 })).toBeNull();
    expect(readWwtView({ type: 'wwt_view_state', raRad: NaN, decRad: 0, fovDeg: 12 })).toBeNull();
    expect(readWwtView({ type: 'wwt_view_state', raRad: 0, decRad: Math.PI, fovDeg: 12 })).toBeNull();
  });

  it('confirms embedded collection requests by URL and request ID', () => {
    vi.useFakeTimers();
    const { frame, source, reply } = embeddedFrame();
    const loaded = vi.fn(), error = vi.fn();
    const stop = loadEmbeddedCollection(frame, 'https://data.test/sky.wtml', loaded, error);
    const request = source.postMessage.mock.calls[0]![0];
    reply({ ...request, event: 'load_image_collection_completed', threadId: 'unrelated' });
    expect(loaded).not.toHaveBeenCalled();
    reply({ ...request, event: 'load_image_collection_completed' });
    expect(loaded).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(50000);
    expect(error).not.toHaveBeenCalled(); stop();
  });
});

describe('WTML imports and bundled catalogue', () => {
  it('preserves target and observation time when opening WWT from the world view', () => {
    const result = initialObservatoryView('?target=SER2&utc=2026-11-06T12:00:00Z');
    expect(result.target.id).toBe('SER2'); expect(result.utc).toBe('2026-11-06T12:00:00.000Z');
    const invalid = initialObservatoryView('?target=unknown&utc=invalid');
    expect(invalid.target.id).toBe('ORI'); expect(Number.isFinite(Date.parse(invalid.utc))).toBe(true);
  });
  it('rejects unsafe collection URLs and accepts HTTPS or local development files', () => {
    expect(validateCollectionUrl('https://data.test/sky.wtml')).toBe('https://data.test/sky.wtml');
    expect(validateCollectionUrl('http://localhost:3005/sky.wtml')).toBe('http://localhost:3005/sky.wtml');
    for (const value of ['javascript:alert(1)', 'http://data.test/sky.wtml', 'https://user:secret@data.test/sky.wtml', 'https://data.test/sky.html']) {
      expect(() => validateCollectionUrl(value)).toThrow();
    }
  });

  it('waits for the native engine to acknowledge the requested collection', () => {
    vi.useFakeTimers();
    const listeners = new Set<Parameters<ScriptInterface['add_collectionLoaded']>[0]>();
    const api = { add_collectionLoaded: (fn: Parameters<ScriptInterface['add_collectionLoaded']>[0]) => listeners.add(fn),
      remove_collectionLoaded: (fn: Parameters<ScriptInterface['add_collectionLoaded']>[0]) => listeners.delete(fn),
      loadImageCollection: vi.fn() } as unknown as ScriptInterface;
    const loaded = vi.fn(), error = vi.fn();
    loadWwtCollection(api, 'https://data.test/sky.wtml', loaded, error);
    const listener = [...listeners][0]!;
    listener(api, { get_url: () => 'https://data.test/other.wtml' });
    expect(loaded).not.toHaveBeenCalled();
    listener(api, { get_url: () => 'https://data.test/sky.wtml' });
    expect(loaded).toHaveBeenCalledOnce(); expect(listeners.size).toBe(0);
    vi.advanceTimersByTime(50000); expect(error).not.toHaveBeenCalled();
  });

  it('reports an unconfirmed native collection and ignores late callbacks', () => {
    vi.useFakeTimers();
    let listener: Parameters<ScriptInterface['add_collectionLoaded']>[0];
    const api = { add_collectionLoaded: (fn: typeof listener) => { listener = fn; }, remove_collectionLoaded: vi.fn(), loadImageCollection: vi.fn() } as unknown as ScriptInterface;
    const loaded = vi.fn(), error = vi.fn();
    loadWwtCollection(api, 'https://data.test/sky.wtml', loaded, error);
    vi.advanceTimersByTime(45000);
    expect(error).toHaveBeenCalledOnce();
    listener!(api, { get_url: () => 'https://data.test/sky.wtml' });
    expect(loaded).not.toHaveBeenCalled();
  });

  it('ships all 88 constellations and 89 valid regions, including both Serpens regions', () => {
    const regions = catalog.constellations.flatMap((c) => c.regions);
    expect(catalog.constellations).toHaveLength(88); expect(regions).toHaveLength(89);
    expect(catalog.constellations.find((c) => c.id === 'SER')?.regions).toHaveLength(2);
    expect(new Set(regions.map((region) => region.id)).size).toBe(89);
    expect(regions.every((region) => region.ra_deg >= 0 && region.ra_deg < 360 && region.dec_deg >= -90 && region.dec_deg <= 90)).toBe(true);
    expect(regions.find((r) => r.id === 'ORI')?.ra_deg).toBeCloseTo(83.6475);
  });
});
