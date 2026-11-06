import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const network = vi.hoisted(() => ({ bodies: [] as string[], status: 200 }));
vi.mock('@sentry/browser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sentry/browser')>();
  return {
    ...actual,
    // Exercise the real SDK event processing and envelope serialization, while
    // replacing the final HTTP request so tests never send production telemetry.
    makeFetchTransport: (options: Parameters<typeof actual.makeFetchTransport>[0]) =>
      actual.createTransport(options, async (request) => {
        network.bodies.push(String(request.body));
        return { statusCode: network.status };
      }),
  };
});

import { SentryIntegrationService } from './sentryService';

describe('Sentry delivery', () => {
  let service: SentryIntegrationService;
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    network.bodies = [];
    network.status = 200;
    service = new SentryIntegrationService();
  });
  afterEach(() => { service?.setDSN(''); vi.unstubAllGlobals(); });

  it('stays local without a valid DSN and does not count captures as deliveries', async () => {
    service.setDSN('not-a-dsn');
    service.captureMessage('local only');
    await service.flush();
    expect(service.isEnabled()).toBe(false);
    expect(service.getStats().eventsCapturedCount).toBe(1);
    expect(service.getStats().eventsSentCount).toBe(0);
    expect(network.bodies).toEqual([]);
  });

  it('sends a real SDK exception envelope while keeping metadata and credentials local', async () => {
    service.setDSN('https://public@example.invalid/123');
    const event = service.captureException(new Error('Failed token=private-value at https://service.test/api?key=private'), {
      prompt: 'private conversation', apiKey: 'secret-value',
    });
    expect(await service.flush()).toBe(true);
    expect(network.bodies).toHaveLength(1);
    const body = network.bodies[0]!;
    expect(body).toContain(event.eventId);
    expect(body).toContain('exception');
    expect(body).toContain('[REDACTED]');
    expect(body).not.toContain('private-value');
    expect(body).not.toContain('private conversation');
    expect(body).not.toContain('secret-value');
    expect(body).not.toContain('?key=');
    expect(service.getStats().eventsSentCount).toBe(1);
    expect(service.isTelemetryRequest('https://example.invalid/api/123/envelope/')).toBe(true);
    expect(service.isTelemetryRequest('https://example.invalid/api/status')).toBe(false);
  });

  it('does not report rejected events as delivered and stops sending when disabled', async () => {
    service.setDSN('https://public@example.invalid/123');
    network.status = 503;
    service.captureMessage('server unavailable');
    await service.flush();
    expect(network.bodies).toHaveLength(1);
    expect(service.getStats().eventsSentCount).toBe(0);
    service.setDSN('');
    service.captureMessage('local again');
    await service.flush();
    expect(network.bodies).toHaveLength(1);
    expect(service.isEnabled()).toBe(false);
  });
});
