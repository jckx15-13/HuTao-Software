import { BrowserClient, Scope, defaultStackParser, makeFetchTransport } from '@sentry/browser';

/**
 * Sentry Integration Service
 * Provides telemetry dispatch, DSN configuration, mock fallback logging,
 * and context enrichment (hardware specs, WebGL, CodeRabbit status).
 */

export interface SentryEvent {
  eventId: string;
  timestamp: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  userHardware?: Record<string, unknown>;
}

function getEnvVar(key: string): string {
  if (key === 'VITE_SENTRY_DSN') return import.meta.env.VITE_SENTRY_DSN || '';
  return import.meta.env.MODE || '';
}

export class SentryIntegrationService {
  private dsn: string = '';
  private enabled: boolean = false;
  private eventsSentCount: number = 0;
  private lastEvent: SentryEvent | null = null;
  private client?: BrowserClient;
  private scope = new Scope();
  private eventsCapturedCount = 0;

  constructor() {
    // Check environment or localStorage for Sentry DSN
    const envDsn = getEnvVar('VITE_SENTRY_DSN');
    let storedDsn = '';
    try {
      storedDsn = typeof localStorage !== 'undefined' ? localStorage.getItem('sw_sentry_dsn') || '' : '';
    } catch { /* Browser storage may be denied; telemetry must not block startup. */ }
    this.configure(envDsn || storedDsn);
  }

  private configure(dsn: string): void {
    const previousClient = this.client;
    this.client = undefined;
    this.scope = new Scope();
    this.enabled = false;
    this.dsn = '';
    if (previousClient) void previousClient.close(0);
    if (!dsn.trim()) return;
    try {
      const parsed = new URL(dsn.trim());
      if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.username ||
          !/\/\d+$/.test(parsed.pathname) || parsed.password || parsed.search || parsed.hash) return;
    } catch { return; }
    this.dsn = dsn.trim();
    // Existing diagnostics listeners own global capture. A dedicated client avoids
    // duplicate listeners and automatic collection of console text or form input.
    if (typeof window === 'undefined') return;
    try {
      this.client = new BrowserClient({
        dsn: this.dsn,
        environment: import.meta.env.MODE || 'development',
        release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
        stackParser: defaultStackParser,
        integrations: [],
        sendClientReports: false,
        dataCollection: {
          userInfo: false, cookies: false, httpHeaders: false,
          httpBodies: [], urlQueryParams: false,
          genAI: { inputs: false, outputs: false },
        },
        transport: (options): ReturnType<typeof makeFetchTransport> => {
          const transport = makeFetchTransport(options);
          return {
            flush: (timeout) => transport.flush(timeout),
            send: async (envelope) => {
              const result = await transport.send(envelope);
              if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
                this.eventsSentCount++;
              }
              return result;
            },
          };
        },
        beforeSend: (event) => {
          // Keep arbitrary diagnostic metadata, user information and URLs local.
          delete event.extra;
          delete event.user;
          delete event.request;
          delete event.contexts;
          if (event.message) event.message = redactTelemetryText(event.message);
          for (const exception of event.exception?.values || []) {
            if (exception.value) exception.value = redactTelemetryText(exception.value);
            for (const frame of exception.stacktrace?.frames || []) {
              if (frame.filename) frame.filename = frame.filename.split(/[?#]/)[0];
              delete frame.vars;
            }
          }
          return event;
        },
      });
      this.scope.setClient(this.client);
      this.client.init();
      this.enabled = true;
    } catch {
      // Telemetry initialization must never prevent application startup.
      this.client = undefined;
    }
  }

  public isTelemetryRequest(url: string): boolean {
    if (!this.dsn) return false;
    try {
      const dsn = new URL(this.dsn);
      const request = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
      const lastSlash = dsn.pathname.lastIndexOf('/');
      const endpoint = `${dsn.pathname.slice(0, lastSlash)}/api/${dsn.pathname.slice(lastSlash + 1)}/envelope/`;
      return request.origin === dsn.origin && request.pathname === endpoint;
    } catch { return false; }
  }

  public flush(timeout = 2000): Promise<boolean> {
    return Promise.resolve(this.client?.flush(timeout) ?? true);
  }

  public getDSN(): string {
    return this.dsn;
  }

  public setDSN(newDsn: string): void {
    this.configure(newDsn);
    if (typeof localStorage !== 'undefined') {
      try {
        if (this.dsn) localStorage.setItem('sw_sentry_dsn', this.dsn);
        else localStorage.removeItem('sw_sentry_dsn');
      } catch { /* Storage can be unavailable in private or restricted contexts. */ }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public getStats() {
    return {
      dsn: this.dsn ? `${this.dsn.slice(0, 12)}...` : 'Unconfigured',
      enabled: this.enabled,
      eventsSentCount: this.eventsSentCount,
      eventsCapturedCount: this.eventsCapturedCount,
      lastEventTimestamp: this.lastEvent?.timestamp || null,
      mode: this.enabled ? 'Sentry SDK configured' : 'Local Telemetry Buffer'
    };
  }

  public captureException(error: Error | string, extraContext: Record<string, unknown> = {}): SentryEvent {
    const message = typeof error === 'string' ? error : error.message || String(error);
    const stack = typeof error === 'object' && error.stack ? error.stack : undefined;

    const event: SentryEvent = {
      eventId: crypto.randomUUID().replaceAll('-', ''),
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack,
      tags: {
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        environment: getEnvVar('MODE') || 'development'
      },
      extra: extraContext
    };

    this.dispatchSentryEvent(event);
    if (this.enabled) this.scope.captureException(typeof error === 'string' ? new Error(error) : error, { event_id: event.eventId });
    return event;
  }

  public captureMessage(message: string, level: SentryEvent['level'] = 'info', extraContext: Record<string, unknown> = {}): SentryEvent {
    const event: SentryEvent = {
      eventId: crypto.randomUUID().replaceAll('-', ''),
      timestamp: new Date().toISOString(),
      level,
      message,
      tags: {
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        environment: getEnvVar('MODE') || 'development'
      },
      extra: extraContext
    };

    this.dispatchSentryEvent(event);
    if (this.enabled) this.scope.captureMessage(message, level, { event_id: event.eventId });
    return event;
  }

  private dispatchSentryEvent(event: SentryEvent) {
    this.eventsCapturedCount++;
    this.lastEvent = event;

  }
}

function redactTelemetryText(value: string): string {
  return value
    .replace(/\b(Bearer\s+)[^\s"']+/gi, '$1[REDACTED]')
    .replace(/((?:api[_-]?key|token|password|secret|authorization)[=:\s]+)[^\s&"']+/gi, '$1[REDACTED]')
    .replace(/\b(?:sk-[\w-]+|gh[pousr]_[\w]+)\b/g, '[REDACTED]')
    .replace(/https?:\/\/[^\s"']+/gi, (url) => url.split(/[?#]/)[0] || '');
}

export const sentryService = new SentryIntegrationService();
