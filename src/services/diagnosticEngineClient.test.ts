import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it('backs off on HTTP failures and identifies ingest calls for instrumentation exclusion', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('__SILVER_WOLF_DIAGNOSTIC_ENGINE_URL__', 'https://diagnostic.invalid');
  const { reportToEngine, isDiagnosticIngestRequest } = await import('./diagnosticEngineClient');
  expect(isDiagnosticIngestRequest('https://diagnostic.invalid/api/diagnostics/ingest')).toBe(true);
  expect(isDiagnosticIngestRequest('/api/status')).toBe(false);
  const entry = { id: 'event', timestamp: Date.now(), level: 'error' as const, message: 'test' };
  reportToEngine(entry);
  await Promise.resolve();
  reportToEngine(entry);
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(60_001);
  reportToEngine(entry);
  expect(fetch).toHaveBeenCalledTimes(2);
});
